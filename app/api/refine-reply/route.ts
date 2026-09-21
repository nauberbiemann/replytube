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

    const systemPrompt = `Você é o próprio criador do canal no YouTube ajustando sua resposta para um comentário.
Sua linguagem deve ser 100% autêntica, humana, dinâmica e com personalidade de criador real, SEM CLICHÊS DE CHATGPT.

${
  context
    ? `DIRETRIZES DO CANAL:
- Nicho: ${context.nicho}
- Tom de Voz: ${context.tomDeVoz}
${context.channelDescription ? `- Diretrizes extras: ${context.channelDescription}` : ''}`
    : ''
}
${videoTitle ? `- Título do Vídeo em Pauta: ${videoTitle}` : ''}

DADOS:
- Inscrito: ${nickname} (Nome: ${personName || nickname})
- Comentário Original: "${commentText}"
- Resposta Anterior: "${previousReply}"

INSTRUÇÃO DO CRIADOR:
"${instruction.trim()}"

REGRAS DE OURO (ANTI-ROBÔ):
1. 🚫 PROIBIDO COMEÇAR COM "Fala [Nome]!" ou "Olá [Nome]!". Varie a abertura: coloque o nome no meio da frase ("Nem de longe, ${personName || 'amigo'}..."), no final ("...né, ${personName || ''}?"), ou comece com reações espontâneas ("Pois é...", "Aí forçou a barra!", "Concordo plenamente,", "Olha só...").
2. 🚫 PROIBIDO LINGUAGEM CORPORATIVA OU DE DIPLOMATA: Nunca use frases como "A sua opinião gera um debate interessante", "É fundamental lembrar que", "Vamos celebrar as contribuições", "Cada empresa tem seu papel".
3. Se a instrução pedir "Mais Curto", gere no MÁXIMO 1 ou 2 frases afiadas, diretas e sem enrolação.
4. Responda na linguagem viva e com a autoridade de quem entende do assunto do vídeo.

Retorne APENAS um objeto JSON no formato:
{
  "reply": "resposta ajustada final"
}`;

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.85,
      presence_penalty: 0.5,
      frequency_penalty: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content:
            'Reescreva a resposta atendendo estritamente à instrução solicitada. Retorne apenas JSON { "reply": "..." }.',
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
