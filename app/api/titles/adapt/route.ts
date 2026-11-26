import { NextRequest, NextResponse } from 'next/server';
import { validateAccess } from '@/lib/auth';
import { getOpenAIClient, getOpenAIModel } from '@/lib/openai';
import { LANGS, TONES } from '@/lib/titleRadar';

/**
 * mode "adapt": troca de assunto em lote (lotes de 25 em paralelo).
 * mode "variations": +5 ângulos para um único título outlier.
 * lang: idioma de saída (PT-BR, ES, FR, PL ou EN).
 */

export const maxDuration = 60;

const buildAdaptPrompt = (langName: string) => `Você é o melhor copywriter de títulos de YouTube do mundo, nativo no idioma de saída. Reescreva cada título em inglês mantendo 100% da ESTRUTURA PSICOLÓGICA, TENSÃO, CONTRASTE e CURIOSIDADE do original, mas trocando completamente o universo para o ASSUNTO do usuário, em ${langName}.
Regras:
(1) PROIBIDO soar como tradução literal. Use a linguagem viva dos grandes canais desse idioma.
(2) Mantenha números, prazos ou contrastes equivalentes que façam sentido no novo assunto.
(3) Ideal entre 42 e 68 caracteres, com impacto logo nas primeiras palavras.
(4) Aplique o Tom escolhido pelo usuário.
(5) Nunca invente dados específicos falsos como se fossem fatos (prefira números plausíveis do próprio formato do título).
(6) TODOS os títulos devem estar 100% em ${langName}, mesmo que o assunto tenha sido digitado em outro idioma.
A "fórmula" de cada item é só apoio; a referência principal é o título original em inglês.
Retorne APENAS JSON: {"adaptations":[{"id":"","adapted_title":""}]}`;

const buildVariationsPrompt = (langName: string) => `Você é o melhor copywriter de títulos de YouTube do mundo. A partir de UM título outlier em inglês, gere 5 títulos 100% em ${langName} (nada de tradução literal), cada um num ângulo diferente, todos sobre o ASSUNTO informado:
1. "Curiosidade Máxima"
2. "Curto & Direto (Mobile)" — OBRIGATORIAMENTE com menos de 52 caracteres
3. "Quebra de Crença"
4. "Prova / Número Específico"
5. "Alerta de Erro / Aversão à Perda"
Mantenha a estrutura psicológica do original. Os nomes dos ângulos ("angle") ficam em português. Se o ASSUNTO vier vazio, mantenha o marcador literal [ASSUNTO] no lugar do tema.
Retorne APENAS JSON: {"variations":[{"angle":"","title":""}]}`;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(req: NextRequest) {
  const auth = validateAccess(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Acesso bloqueado.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      mode = 'adapt',
      topic = '',
      tone = 'natural',
      lang = 'pt-BR',
      items = [],
      model: requestedModel,
    } = body as {
      mode: 'adapt' | 'variations';
      topic: string;
      tone: string;
      lang?: string;
      items: { id: string; title: string; skeleton?: string }[];
      model?: string;
    };

    const langName = (LANGS.find((l) => l.key === lang) || LANGS[0]).name;

    const cleanTopic = String(topic || '').trim().slice(0, 120);
    const toneInfo = TONES.find((t) => t.key === tone) || TONES[0];
    const list = (Array.isArray(items) ? items : []).filter((i) => i?.id && i?.title).slice(0, 150);
    if (list.length === 0) {
      return NextResponse.json({ error: 'Nenhum título para processar.' }, { status: 400 });
    }

    const openai = getOpenAIClient();
    const model = getOpenAIModel(requestedModel);
    const usage = { model, inputTokens: 0, cachedTokens: 0, outputTokens: 0 };
    const addUsage = (u: any) => {
      usage.inputTokens += u?.prompt_tokens ?? 0;
      usage.cachedTokens += u?.prompt_tokens_details?.cached_tokens ?? 0;
      usage.outputTokens += u?.completion_tokens ?? 0;
    };

    if (mode === 'variations') {
      const item = list[0];
      const completion = await openai.chat.completions.create({
        model,
        temperature: 0.8,
        max_tokens: 600,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildVariationsPrompt(langName) },
          {
            role: 'user',
            content: `ASSUNTO: ${cleanTopic || '(vazio — mantenha [ASSUNTO])'}\nTOM: ${toneInfo.label} — ${toneInfo.instruction}\nTÍTULO ORIGINAL (EN): "${item.title}"${item.skeleton ? `\nFÓRMULA (apoio): "${item.skeleton}"` : ''}`,
          },
        ],
      });
      addUsage(completion.usage);
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      const variations = (Array.isArray(parsed.variations) ? parsed.variations : [])
        .map((v: any) => ({ angle: String(v.angle || '').trim(), title: String(v.title || '').trim() }))
        .filter((v: any) => v.title)
        .slice(0, 5);
      return NextResponse.json({ variations, usage });
    }

    if (!cleanTopic) {
      return NextResponse.json({ error: 'Digite o seu assunto.' }, { status: 400 });
    }

    const batches = chunk(list, 25);
    const results = await Promise.all(
      batches.map(async (batch) => {
        try {
          const completion = await openai.chat.completions.create({
            model,
            temperature: 0.7,
            max_tokens: 2400,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: buildAdaptPrompt(langName) },
              {
                role: 'user',
                content: `ASSUNTO DO USUÁRIO: ${cleanTopic}\nTOM: ${toneInfo.label} — ${toneInfo.instruction}\nTÍTULOS:\n${JSON.stringify(
                  batch.map((i) => ({ id: i.id, original_en: i.title, formula: i.skeleton || '' }))
                )}`,
              },
            ],
          });
          addUsage(completion.usage);
          const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
          return Array.isArray(parsed.adaptations) ? parsed.adaptations : [];
        } catch (err) {
          console.error('[titles/adapt] falha no lote:', err);
          return [];
        }
      })
    );

    const adaptations: Record<string, string> = {};
    results.flat().forEach((a: any) => {
      const title = String(a?.adapted_title || '').trim();
      if (a?.id && title) adaptations[String(a.id)] = title;
    });

    return NextResponse.json({ adaptations, usage });
  } catch (error: any) {
    console.error('Erro em /api/titles/adapt:', error);
    return NextResponse.json({ error: error?.message || 'Falha ao adaptar títulos.' }, { status: 500 });
  }
}
