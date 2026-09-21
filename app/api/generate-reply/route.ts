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
      context,
      commentImageDataUrl,
      commentTextFallback,
      videoTitle,
      videoImageDataUrl,
    } = body as {
      context: ChannelContext;
      commentImageDataUrl?: string;
      commentTextFallback?: string;
      videoTitle?: string;
      videoImageDataUrl?: string;
    };

    if (!context) {
      return NextResponse.json(
        { error: 'Contexto do canal não informado.' },
        { status: 400 }
      );
    }

    if (!commentImageDataUrl && !commentTextFallback?.trim()) {
      return NextResponse.json(
        { error: 'Envie um print do comentário ou preencha o texto de fallback.' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const model = getOpenAIModel();

    const systemPrompt = `Você é o próprio criador do canal no YouTube e gerencia pessoalmente as respostas da comunidade.
Diretrizes do Canal:
- Nicho: ${context.nicho || 'Geral'}
- Tom de Voz: ${context.tomDeVoz || 'Educado, natural e engajador'}
- Público-Alvo: ${context.publico || 'Seguidores do canal'}
- Temas-Chave: ${(context.temasChave || []).join(', ')}
${context.channelDescription ? `- Diretrizes extras: ${context.channelDescription}` : ''}

Contexto do Vídeo que recebeu o comentário:
- Título/Tema do vídeo: ${videoTitle?.trim() || 'Vídeo do canal'}

Sua tarefa:
1. Extrair do print do YouTube:
   - "nickname": O @ ou nome do usuário que comentou (sem o símbolo @ no campo, apenas o nome). Se ilegível, use "Espectador".
   - "commentText": O texto exato da mensagem deixada pelo usuário.
2. Escrever a "reply":
   - Uma resposta autêntica, acolhedora e inteligente como o dono do canal responderia.
   - Conecte com o assunto do vídeo e com a essência do canal.
   - Seja natural e direto. Evite introduções clichês e artificiais como "Olá amigo", "Obrigado por comentar", "Muito interessante sua colocação". Vá direto ao ponto, comemore o ponto ou debata respeitosamente caso haja discordância.
   - Use pontuação e parágrafos curtos se necessário para facilitar a leitura no YouTube.

Retorne SEMPRE um JSON válido no seguinte formato:
{
  "nickname": "nome_ou_arroba",
  "commentText": "texto do comentário extraído",
  "reply": "resposta sugerida personalizada"
}`;

    const userContentParts: any[] = [];

    let textInstruction = 'Analise este comentário e gere a melhor resposta no tom do canal.';
    if (commentTextFallback?.trim()) {
      textInstruction += `\nTexto digitado como apoio/fallback: """${commentTextFallback.trim()}"""`;
    }
    userContentParts.push({ type: 'text', text: textInstruction });

    // Print do comentário
    if (commentImageDataUrl && commentImageDataUrl.startsWith('data:image')) {
      userContentParts.push({
        type: 'image_url',
        image_url: {
          url: commentImageDataUrl,
          detail: 'high',
        },
      });
    }

    // Print do vídeo se enviado
    if (videoImageDataUrl && videoImageDataUrl.startsWith('data:image')) {
      userContentParts.push({
        type: 'image_url',
        image_url: {
          url: videoImageDataUrl,
          detail: 'low',
        },
      });
    }

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
          content: userContentParts,
        },
      ],
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Nenhuma resposta retornada pela OpenAI.');
    }

    const parsed = JSON.parse(responseContent);

    // Validação mínima se conseguiu ler o texto
    if (!parsed.commentText && !commentTextFallback?.trim()) {
      return NextResponse.json(
        {
          error:
            'Não foi possível identificar o texto do print. Cole o texto abaixo e clique em Gerar.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      nickname: parsed.nickname || 'Espectador',
      commentText: parsed.commentText || commentTextFallback || '',
      reply: parsed.reply || '',
    });
  } catch (error: any) {
    console.error('Erro em /api/generate-reply:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao gerar resposta para o comentário.' },
      { status: 500 }
    );
  }
}
