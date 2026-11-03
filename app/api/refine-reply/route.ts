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
      videoDescription,
      context,
      model: requestedModel,
    } = body as {
      commentText: string;
      nickname: string;
      personName?: string;
      previousReply: string;
      instruction: string;
      videoTitle?: string;
      videoDescription?: string;
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
      ? context.channelDescription.slice(0, 6000)
      : '';

    // Ordem para prompt caching: regras fixas -> perfil do canal -> dados variáveis no fim
    const systemPrompt = `Você é o criador do canal no YouTube ajustando sua resposta a um inscrito.

REGRAS INVIOLÁVEIS:
1. FIDELIDADE TOTAL À INSTRUÇÃO: a instrução do criador é LEI. Incorpore 100% do que foi pedido, sem inventar assuntos, fatos ou números.
2. CONCISÃO: 2 a 3 frases (salvo pedido contrário).
3. Responda de forma CORRETA para o caso exato do comentário (não dê dica que não se aplica).
4. PROIBIDO aberturas/fechamentos genéricos: "Fico muito feliz", "Fico feliz em saber", "Que notícia fantástica", "ponto crucial", "ótima observação", "Fala [Nome]!", "Olá [Nome]!", "Continue assim!", "Continue acompanhando a gente!", "Vamos continuar debatendo".
5. FECHAMENTO (salvo instrução contrária): A) gancho para próximos vídeos ligado ao assunto + bordão oficial do canal (somente se existir nas diretrizes ABAIXO); B) pergunta curta e específica sobre o tema; ou C) conclusão técnica.
6. TRADUÇÃO: se pedirem o idioma do comentário, detecte o idioma do comentário original e traduza INTEGRALMENTE com fluência nativa, adaptando o bordão do PRÓPRIO canal para esse idioma. Nenhuma frase pode ficar em português.

Retorne APENAS JSON: { "reply": "..." }
${
  context
    ? `
PERFIL DO CANAL:
- Nicho: ${context.nicho || 'Geral'} | Tom: ${context.tomDeVoz || 'Técnico e direto'}
- Público: ${context.publico || 'Entusiastas'}
${context.resumo ? `- Resumo: ${context.resumo}` : ''}
${compactDescription ? `DIRETRIZES E BORDÕES OFICIAIS DO CANAL:\n"""\n${compactDescription}\n"""` : ''}`
    : ''
}`;

    const userPrompt = `${videoTitle ? `TEMA DO VÍDEO: "${videoTitle}"\n` : ''}${videoDescription?.trim() ? `SOBRE O VÍDEO (descrição oficial, só para contexto): """${videoDescription.trim().slice(0, 1200)}"""\n` : ''}Comentário de ${personName || nickname}: "${commentText}"
Resposta anterior: "${previousReply}"
DIRECIONAMENTO OBRIGATÓRIO: """${instruction.trim()}"""`;

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
    const usage = completion.usage as any;
    return NextResponse.json({
      reply: parsed.reply || '',
      usage: {
        model,
        inputTokens: usage?.prompt_tokens ?? 0,
        cachedTokens: usage?.prompt_tokens_details?.cached_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
      },
    });
  } catch (error: any) {
    console.error('Erro em /api/refine-reply:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao refinar a resposta.' },
      { status: 500 }
    );
  }
}
