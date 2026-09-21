import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getOpenAIModel } from '@/lib/openai';
import { ChannelContext } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      commentText,
      nickname,
      previousReply,
      instruction,
      videoTitle,
      context,
    } = body as {
      commentText: string;
      nickname: string;
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

    const systemPrompt = `Você é o criador de conteúdo do canal do YouTube ajustando sua resposta para um comentário.
${
  context
    ? `Diretrizes do Canal:
- Nicho: ${context.nicho}
- Tom de Voz: ${context.tomDeVoz}
${context.channelDescription ? `- Diretrizes extras: ${context.channelDescription}` : ''}`
    : ''
}
${videoTitle ? `- Título do Vídeo: ${videoTitle}` : ''}

Comentário Original:
Autor: @${nickname || 'Espectador'}
Mensagem: "${commentText}"

Resposta Atual Anterior:
"${previousReply}"

Instrução de Ajuste Solicitada pelo usuário:
"${instruction.trim()}"

Sua tarefa:
Reescreva a resposta atendendo rigorosamente à instrução solicitada (ex: mudar o tom, rebater com novo dado, encurtar, deixar mais bem-humorado, adicionar pergunta de engajamento, etc.).
Mantenha a autenticidade e a naturalidade de um criador do YouTube.

Retorne APENAS um objeto JSON no formato:
{
  "reply": "nova resposta ajustada"
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
            'Reescreva a resposta conforme a instrução e retorne no formato JSON { "reply": "..." }.',
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
