import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getOpenAIModel } from '@/lib/openai';
import { validateAccess } from '@/lib/auth';
import { ScriptOutline } from '@/lib/types';

export async function POST(req: NextRequest) {
  const access = validateAccess(req);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Acesso não autorizado. Digite a senha de acesso.' }, { status: 401 });
  }

  try {
    const {
      title,
      hook,
      premise,
      targetPainOrExpectation,
      format = 'Vídeo Longo',
      channelContext,
    } = await req.json();

    if (!title && !premise) {
      return NextResponse.json({ error: 'Título ou premissa do vídeo é necessário.' }, { status: 400 });
    }

    const openai = getOpenAIClient();
    const model = getOpenAIModel();

    const systemPrompt = `Você é um Roteirista Profissional de Vídeos do YouTube de Alto Desempenho (especialista em retenção de audiência, storytelling e ritmo dinâmico).
Seu objetivo é transformar uma oportunidade/ideia minerada de comentários em uma estrutura completa de roteiro pronto para gravação.

Você SEMPRE responde estritamente em formato JSON compatível com o schema requisitado.`;

    const userPrompt = `Gere uma estrutura de roteiro magnética para o seguinte conceito de vídeo:

DADOS DO CONCEITO:
- Título Sugerido: ${title}
- Formato Pretendido: ${format}
- Gancho Inicial Proposto: ${hook || 'Não especificado'}
- Premissa / Ângulo: ${premise || 'Não especificado'}
- Dor ou Desejo que Resolve: ${targetPainOrExpectation || 'Não especificado'}
${channelContext ? `- Contexto do Canal: Nicho "${channelContext.nicho || ''}", Tom "${channelContext.tomDeVoz || ''}"` : ''}

ESTRUTURA DO ROTEIRO EXIGIDA:
1. "title": O título principal otimizado para CTR (com opções ou subtítulo).
2. "thumbnailIdea": Descrição visual clara da thumbnail (elementos visuais, texto curto na capa, expressão facial, cores de contraste).
3. "hook": Roteiro falado dos primeiros 15 segundos (sem enrolação, direto na dor/curiosidade).
4. "retentionPromise": Roteiro dos segundos 15 a 45 (a promessa irresistível que convence o viewer a ficar até o final).
5. "mainPoints": Lista de 3 a 5 blocos de conteúdo com desenvolvimento fluido, exemplos e orientações de tela (B-roll/gráficos).
6. "climax": O ápice do vídeo onde a grande resposta ou revelação é entregue.
7. "cta": A chamada para ação perfeita (com pergunta para gerar comentários ou gancho para o próximo vídeo).

RETORNE APENAS O JSON NO FORMATO:
{
  "title": "string",
  "thumbnailIdea": "string",
  "hook": "string",
  "retentionPromise": "string",
  "mainPoints": [
    {
      "title": "Bloco 1: ...",
      "content": "Roteiro falado e orientações visuais...",
      "keyQuoteOrExample": "Exemplo prático ou citação..."
    }
  ],
  "climax": "string",
  "cta": "string"
}`;

    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const rawResponse = completion.choices[0]?.message?.content || '{}';
    const parsed: ScriptOutline = JSON.parse(rawResponse);

    return NextResponse.json({ success: true, script: parsed });
  } catch (error: any) {
    console.error('Erro em api/insights/generate-script:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao gerar roteiro do vídeo.' },
      { status: 500 }
    );
  }
}
