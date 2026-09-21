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
    } = body as {
      commentText: string;
      nickname: string;
      personName?: string;
      previousReply: string;
      instruction: string;
      videoTitle?: string;
      context?: ChannelContext;
    };

    if (!instruction?.trim()) {
      return NextResponse.json(
        { error: 'A instrução de refinamento é obrigatória.' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const model = getOpenAIModel();

    const systemPrompt = `Você é o próprio criador do canal no YouTube ajustando sua resposta para um inscrito da comunidade.

${
  context
    ? `DIRETRIZES DO CANAL:
- Nicho: ${context.nicho}
- Tom de Voz: ${context.tomDeVoz}
${context.channelDescription ? `- Diretrizes extras: ${context.channelDescription}` : ''}`
    : ''
}
${videoTitle ? `- Título do Vídeo em Pauta: ${videoTitle}` : ''}

DADOS DA INTERAÇÃO:
- Inscrito: ${nickname} (Nome identificado: ${personName || nickname})
- Comentário Original: "${commentText}"
- Resposta Atual que será ajustada: "${previousReply}"

INSTRUÇÃO DE AJUSTE DO CRIADOR:
"${instruction.trim()}"

REGRAS:
1. Mantenha o tratamento humano pelo primeiro nome da pessoa se identificável (ex: "Fala Eder!").
2. Mantenha a resposta profundamente conectada ao tema e acontecimentos reais do vídeo, sem divagações corporativas ou genéricas.
3. Aplique com precisão a instrução solicitada (ex: deixar mais informal, mais curto, rebater um argumento, etc.).

Retorne APENAS um objeto JSON no formato:
{
  "reply": "resposta ajustada final"
}`;

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content:
            'Reescreva a resposta atendendo à instrução e retorne no formato JSON { "reply": "..." }.',
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
