import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getOpenAIModel } from '@/lib/openai';
import { ChannelContext } from '@/lib/types';
import { validateAccess } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = validateAccess(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: 'Acesso bloqueado: senha incorreta ou não fornecida.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      commentText,
      nickname,
      personName,
      previousReply,
      instruction,
      videoTitle,
      context,
      model: requestedModel,
    } = body as {
      commentText: string;
      nickname: string;
      personName?: string;
      previousReply: string;
      instruction: string;
      videoTitle?: string;
      context?: ChannelContext;
      model?: string;
    };

    if (!instruction?.trim()) {
      return NextResponse.json(
        { error: 'A instrução de refinamento é obrigatória.' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const model = getOpenAIModel(requestedModel);

    const compactDescription = context?.channelDescription
      ? context.channelDescription.slice(0, 900)
      : '';

    const systemPrompt = `Você é o criador do canal no YouTube ajustando sua resposta a um inscrito.
${
  context
    ? `PERFIL DO CANAL:
- Nicho: ${context.nicho || 'Geral'} | Tom: ${context.tomDeVoz || 'Técnico, analítico e direto'}
- Público: ${context.publico || 'Entusiastas e profissionais'}
${context.resumo ? `- Resumo: ${context.resumo}` : ''}
${compactDescription ? `- Diretrizes e Bordões Oficiais:\n"""\n${compactDescription}\n"""` : ''}`
    : ''
}
${videoTitle ? `TEMA DO VÍDEO: "${videoTitle}"` : ''}

REGRAS INVIOLÁVEIS:
1. FIDELIDADE TOTAL À INSTRUÇÃO: A instrução do criador é LEI ESTRITA. Incorpore 100% do direcionamento pedido sem inventar assuntos aleatórios.
2. CONCISÃO: Máximo de 2 a 3 frases objetivas, sem divagações.
3. FINALIZAÇÃO DIRECIONADA (PROIBIDO clichês genéricos de IA como "Vamos ver na próxima década!", "Vamos continuar debatendo! 🚀", "O mercado é dinâmico!"):
   Feche sempre com 1 destes 3 estilos (salvo instrução específica em contrário):
   - A) Direcionado ao Canal / Próximos Vídeos + Bordão Oficial do Canal;
   - B) Pergunta Técnica Engajadora sobre o tema do vídeo;
   - C) Conclusão Técnica Afiada cravando a tese do vídeo.
4. SEM SAUDAÇÃO PRONTA: Proibido começar com "Fala [Nome]!" ou "Olá [Nome]!". Use o nome (${personName || nickname}) naturalmente na frase.
5. TRADUÇÃO / IDIOMA: Se a instrução pedir para traduzir para o idioma do comentário original, identifique o idioma exato de "${commentText.slice(0, 100)}" e traduza a resposta INTEGRALMENTE com fluência nativa, adaptando os bordões finais para esse idioma (ex: EN: "Clear radar over here!" / "Until the next flight!"; ES: "¡Radar limpio por aquí!" / "¡Hasta el próximo vuelo!").

Retorne APENAS JSON: { "reply": "..." }`;

    const userPrompt = `Comentário (${personName || nickname}): "${commentText}"
Resposta anterior: "${previousReply}"
DIRECIONAMENTO OBRIGATÓRIO: """${instruction.trim()}"""
Retorne JSON: { "reply": "..." }`;

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.2, // Baixa temperatura para precisão cirúrgica na instrução!
      presence_penalty: 0.0, // Zera penalidade para permitir usar livremente os termos do criador
      frequency_penalty: 0.0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Nenhuma resposta retornada pela OpenAI.');
    }

    const parsed = JSON.parse(responseContent);
    return NextResponse.json({
      reply: parsed.reply || '',
    });
  } catch (error: any) {
    console.error('Erro em /api/refine-reply:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao refinar a resposta.' },
      { status: 500 }
    );
  }
}
