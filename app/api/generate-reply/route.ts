import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getOpenAIModel } from '@/lib/openai';
import { ChannelContext } from '@/lib/types';
import { validateAccess } from '@/lib/auth';

/**
 * ORDEM DO PROMPT PENSADA PARA PROMPT CACHING DA OPENAI:
 * A OpenAI aplica desconto automático (50%) nos tokens de entrada quando o INÍCIO do prompt
 * (>= 1024 tokens) é idêntico ao de requisições recentes. Por isso:
 *   1) Regras fixas (idênticas para todos os canais)  -> início
 *   2) Perfil do canal (idêntico para o mesmo canal)  -> meio
 *   3) Dados variáveis (vídeo, histórico, print)       -> mensagem do usuário (fim)
 */
const STATIC_RULES = `Você é o criador do canal no YouTube respondendo comentários com voz humana, específica e tecnicamente correta.

COMO RESPONDER CADA TIPO DE COMENTÁRIO:
- ELOGIO / AGRADECIMENTO: cite o detalhe CONCRETO que a pessoa mencionou (ex: "o gráfico das peças", "economizou 15%", "acabou de se inscrever") e acrescente 1 informação útil ou bastidor curto ligado ao tema do vídeo. Nada de agradecimento vazio.
- RESULTADO PESSOAL (ex: "economizei 15%"): valide o número, explique em 1 frase POR QUE funcionou (o mecanismo técnico) e puxe o próximo passo.
- PERGUNTA: responda de forma direta e CORRETA para o caso exato perguntado (ex: carro automático ≠ manual; não dê dica de troca de marcha para câmbio automático). Se a resposta exigir mais que 2 frases, dê a dica principal e diga que vira vídeo.
- DADO TÉCNICO / COMPLEMENTO: converse de igual para igual, valide e acrescente um ponto.
- IRONIA OU ANALOGIA CONCORDANDO com o vídeo: NÃO rebata; valide a analogia e conecte ao fato técnico.
- DISCORDÂNCIA REAL: rebata com respeito e com dado do vídeo.
- Nunca invente fatos, números ou promessas que não estejam no comentário, no vídeo ou nas diretrizes do canal.

PROIBIDO (aberturas e fechamentos genéricos de IA):
"Fico muito feliz", "Fico feliz em saber", "Que notícia fantástica", "Muito obrigado pela inscrição", "Espero que tenha gostado", "você levanta um ponto crucial", "ótima observação", "excelente ponto", "Fala [Nome]!", "Olá [Nome]!", "Continue assim!", "Continue acompanhando a gente!", "Vamos continuar debatendo", "O mercado é dinâmico".
Use o primeiro nome da pessoa de forma natural no meio ou no começo da frase, reagindo ao conteúdo.

FECHAMENTO OBRIGATÓRIO — escolha 1 e VARIE entre os comentários do mesmo print:
A) Gancho para próximos vídeos do canal LIGADO ao assunto do comentário + bordão oficial do canal (se existir nas diretrizes).
B) Pergunta curta e específica sobre o tema do vídeo que a pessoa consiga responder.
C) Frase técnica de conclusão que crava a tese do vídeo.

TAMANHO: 2 a 3 frases.

PAUTA ("suggestedTopic"): só preencha se o comentário trouxer pergunta, pedido, caso real, comparação ou crítica que renda um vídeo NOVO. O tema deve refletir fielmente o que a pessoa disse, sem exagerar. Elogio simples -> "".

VÁRIOS COMENTÁRIOS NO PRINT: extraia CADA comentário (de cima para baixo) como um item separado em "comments", com resposta independente. Se cada linha mostrar um vídeo diferente à direita, preencha "videoTitle" daquele item.

Retorne APENAS JSON:
{"detectedVideoTitle":"título do vídeo visível no print ou vazio","comments":[{"nickname":"@usuario","personName":"Primeiro nome","commentText":"texto exato","videoTitle":"vídeo deste comentário ou vazio","suggestedTopic":"pauta ou vazio","closingStyle":"A|B|C","reply":"resposta"}]}`;

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
      recentReplies,
      model: requestedModel,
    } = body as {
      context: ChannelContext;
      commentImageDataUrl?: string;
      commentTextFallback?: string;
      videoTitle?: string;
      videoImageDataUrl?: string;
      recentReplies?: string[];
      model?: string;
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
    const model = getOpenAIModel(requestedModel);

    const channelDescription = (context.channelDescription || '').slice(0, 6000);

    // Bloco 2: perfil do canal (estável para o mesmo canal -> cacheável)
    const channelProfile = `PERFIL DO CANAL:
- Nicho: ${context.nicho || 'Geral'} | Tom: ${context.tomDeVoz || 'Técnico e autêntico'}
- Público: ${context.publico || 'Entusiastas'} | Temas: ${(context.temasChave || []).join(', ')}
${context.resumo ? `- Resumo: ${context.resumo}` : ''}
${channelDescription ? `DIRETRIZES E BORDÕES OFICIAIS DO CANAL (respeite integralmente):\n"""\n${channelDescription}\n"""` : ''}`;

    const systemPrompt = `${STATIC_RULES}\n\n${channelProfile}`;

    // Bloco 3: dados variáveis (sempre no fim / mensagem do usuário)
    const hasTypedText = Boolean(commentTextFallback?.trim());
    let textInstruction = `TEMA DO VÍDEO: ${
      videoTitle?.trim() || 'leia o título do vídeo exibido à direita do print'
    }`;
    if (recentReplies && recentReplies.length > 0) {
      textInstruction += `\nÚLTIMAS RESPOSTAS (não repita abertura nem fechamento):\n${recentReplies
        .slice(0, 2)
        .map((r) => `- "${r.slice(0, 140)}"`)
        .join('\n')}`;
    }
    if (hasTypedText) {
      textInstruction += `\nTEXTO DO COMENTÁRIO (use este texto; a imagem serve só para identificar o autor):\n"""${commentTextFallback!.trim()}"""`;
    }

    const userContentParts: any[] = [{ type: 'text', text: textInstruction }];

    if (commentImageDataUrl && commentImageDataUrl.startsWith('data:image')) {
      userContentParts.push({
        type: 'image_url',
        image_url: {
          url: commentImageDataUrl,
          // Se o texto já foi digitado, basta baixa resolução para ler o nome (custo fixo mínimo)
          detail: hasTypedText ? 'low' : 'high',
        },
      });
    }

    // Print do vídeo só é útil se não houver título digitado (evita pagar imagem à toa)
    if (
      !videoTitle?.trim() &&
      videoImageDataUrl &&
      videoImageDataUrl.startsWith('data:image')
    ) {
      userContentParts.push({
        type: 'image_url',
        image_url: { url: videoImageDataUrl, detail: 'low' },
      });
    }

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.6,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      max_tokens: 1800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContentParts },
      ],
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Nenhuma resposta retornada pela OpenAI.');
    }

    const parsed = JSON.parse(responseContent);

    const rawComments: any[] = Array.isArray(parsed.comments)
      ? parsed.comments
      : parsed.commentText || parsed.reply
      ? [parsed]
      : [];

    const validComments = rawComments
      .map((c) => ({
        nickname: c.nickname || 'Espectador',
        personName: c.personName || '',
        commentText: c.commentText || commentTextFallback || '',
        videoTitle: c.videoTitle || parsed.detectedVideoTitle || '',
        suggestedTopic: c.suggestedTopic || '',
        reply: c.reply || '',
      }))
      .filter((c) => c.commentText.trim() || c.reply.trim());

    if (validComments.length === 0) {
      return NextResponse.json(
        {
          error:
            'Não foi possível identificar o texto do print. Cole o texto abaixo e clique em Gerar.',
        },
        { status: 422 }
      );
    }

    const usage = completion.usage as any;

    return NextResponse.json({
      detectedVideoTitle: parsed.detectedVideoTitle || validComments[0].videoTitle || '',
      comments: validComments,
      usage: {
        model,
        inputTokens: usage?.prompt_tokens ?? 0,
        cachedTokens: usage?.prompt_tokens_details?.cached_tokens ?? 0,
        outputTokens: usage?.completion_tokens ?? 0,
      },
    });
  } catch (error: any) {
    console.error('Erro em /api/generate-reply:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao gerar resposta para o comentário.' },
      { status: 500 }
    );
  }
}
