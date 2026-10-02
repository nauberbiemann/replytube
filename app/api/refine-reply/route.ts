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

    const systemPrompt = `Você é o próprio criador do canal no YouTube ajustando sua resposta para um comentário da comunidade.
Sua comunicação deve ter a personalidade viva do canal, mantendo coerência absoluta com o tema do vídeo e com as instruções enviadas pelo criador.

${
  context
    ? `DIRETRIZES DO CANAL:
- Nicho: ${context.nicho}
- Tom de Voz: ${context.tomDeVoz}
${context.channelDescription ? `- Diretrizes extras: ${context.channelDescription}` : ''}`
    : ''
}
${videoTitle ? `- Contexto / Tema do Vídeo em Pauta: "${videoTitle}"` : ''}

REGRAS OBRIGATÓRIAS DE REFINAMENTO:
1. 🎯 FIDELIDADE TOTAL AO DIRECIONAMENTO DO CRIADOR (REGRA SUPREMA):
   - A instrução do criador tem a mais alta prioridade. Se ele pedir para rebater de leve, rebata de forma suave e elegante. Se ele fornecer fatos, dados, detalhes técnicos ou um contexto específico, esse conteúdo DEVE ser o núcleo da resposta ajustada.
   - NUNCA ignore ou dilua as orientações do criador.
   - Mantenha sempre a discussão 100% amarrada ao tema do vídeo e do canal.

2. 🚫 PROIBIDO COMEÇAR COM "Fala [Nome]!" ou "Olá [Nome]!":
   - NÃO comece com "Fala [Nome]!".
   - Se citar o nome da pessoa (${personName || nickname}), coloque-o de forma natural no meio ou fim da frase ("Pois é, ${personName || ''}...", "Nem de longe, ${personName || ''}...", "...não acha, ${personName || ''}?"), ou vá direto ao argumento.

3. 🚫 PROIBIDO TOM CORPORATIVO DE CHATGPT / DIPLOMATA:
   - Jamais use: "A sua opinião gera um debate interessante", "É fundamental lembrar que", "Vamos celebrar as contribuições", "Cada empresa tem seu papel".
   - Mantenha o tom de um criador real conversando nos comentários: firme, conhecedor, direto e simpático.

Retorne SEMPRE um JSON rigoroso no formato:
{
  "reply": "resposta ajustada final atendendo perfeitamente ao direcionamento"
}`;

    const userPrompt = `Comentário original do inscrito:
"${commentText}" (Inscrito: ${nickname} | Nome identificado: ${personName || nickname})

Resposta gerada anteriormente:
"${previousReply}"

🎯 MEU DIRECIONAMENTO DE AJUSTE (OBRIGATÓRIO SEGUIR À RISCA NO CONTEXTO DO TEMA):
"${instruction.trim()}"

${videoTitle ? `Tema de referência do vídeo: "${videoTitle}"` : ''}

Reescreva a resposta incorporando exatamente o que foi solicitado acima, sem fugir do assunto do vídeo e sem clichês de IA. Retorne apenas JSON: { "reply": "..." }.`;

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
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
