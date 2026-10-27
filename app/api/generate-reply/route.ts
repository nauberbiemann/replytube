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

    const compactDescription = context.channelDescription
      ? context.channelDescription.slice(0, 900)
      : '';

    const systemPrompt = `Você é o criador do canal no YouTube respondendo comentários com personalidade, precisão técnica e voz humana.

PERFIL DO CANAL:
- Nicho: ${context.nicho || 'Geral'} | Tom: ${context.tomDeVoz || 'Técnico, analítico e autêntico'}
- Público: ${context.publico || 'Entusiastas e profissionais'} | Temas: ${(context.temasChave || []).join(', ')}
${context.resumo ? `- Resumo: ${context.resumo}` : ''}
${compactDescription ? `- Diretrizes e Bordões Oficiais:\n"""\n${compactDescription}\n"""` : ''}

TEMA DO VÍDEO: ${videoTitle?.trim() || 'Extraia o título do vídeo exibido à direita do print (ao lado da miniatura do YouTube Studio)'}
${
  recentReplies && recentReplies.length > 0
    ? `\nÚLTIMAS RESPOSTAS (não repita a mesma abertura nem fechamento):\n${recentReplies
        .slice(0, 2)
        .map((r) => `- "${r.slice(0, 180)}"`)
        .join('\n')}`
    : ''
}

REGRAS OBRIGATÓRIAS:
1. INTERPRETAÇÃO:
   - Se o inscrito fez ironia/analogia CONCORDANDO com a crítica do vídeo (ex: comparar corte de custos da Boeing com a Apple): NÃO rebata! Valide a analogia e conecte ao ponto técnico do vídeo.
   - Se trouxe dados técnicos ou elogio: converse de igual para igual citando o primeiro nome. Só rebata se discordar da tese do vídeo.
2. NOME NATURAL: Use o primeiro nome de forma natural na frase. PROIBIDO começar sempre com "Fala [Nome]!" ou "Olá [Nome]!".
3. FINALIZAÇÃO DIRECIONADA (PROIBIDO clichês genéricos como "Vamos ver na próxima década!", "Vamos continuar debatendo! 🚀", "O mercado é dinâmico!"):
   Feche SEMPRE com 1 destes 3 estilos:
   - A) Canal / Próximos Vídeos + Bordão Oficial do Canal (ex: convide para acompanhar os próximos vídeos e feche com o bordão do canal);
   - B) Pergunta Técnica Curta sobre o dilema central do vídeo;
   - C) Conclusão Técnica Afiada cravando a tese do vídeo.
4. EXTRAÇÃO AUTOMÁTICA DE PAUTA/TEMA ("suggestedTopic"):
   - Se o comentário trouxer uma dúvida técnica, comparação, caso real, pedido, crítica construtiva ou gancho interessante que renda um NOVO VÍDEO para o canal, crie em "suggestedTopic" uma sugestão concisa de tema/título em Português (ex: "Disputa KC-390 vs C-130J na Força Aérea dos EUA e o impacto da Scope Clause nos E2").
   - Se for apenas um elogio genérico ("Ótimo vídeo!", "Parabéns pelo canal!"), retorne "" (vazio) em "suggestedTopic".
5. SUPORTE A MÚLTIPLOS COMENTÁRIOS NO MESMO PRINT:
   - Se o print contiver APENAS 1 comentário, retorne 1 item dentro do array "comments".
   - Se o print contiver VÁRIOS comentários de pessoas diferentes, divida e extraia CADA comentário separadamente na ordem em que aparecem (de cima para baixo) dentro do array "comments", gerando uma resposta 100% independente, personalizada e variando as aberturas e os estilos de finalização (A, B e C) entre eles para que nenhuma resposta fique parecida com a outra!
   - Caso cada linha de comentário no print do YouTube Studio seja de um vídeo diferente (mostrado na miniatura à direita daquele comentário), use o título correspondente de cada vídeo na resposta e preencha "videoTitle" no item.

Retorne APENAS JSON no formato:
{
  "detectedVideoTitle": "título do vídeo lido no canto direito do print (ou vazio se não visível)",
  "comments": [
    {
      "nickname": "@usuario",
      "personName": "Primeiro Nome",
      "commentText": "texto exato deste comentário",
      "videoTitle": "título do vídeo específico deste comentário (se visível ao lado dele)",
      "suggestedTopic": "Ideia de tema/pauta extraída deste comentário (em PT-BR) ou vazio se for só elogio comum",
      "reply": "resposta humana, técnica e independente com fechamento A, B ou C"
    }
  ]
}`;

    const userContentParts: any[] = [];

    let textInstruction = 'Extraia todos os comentários visíveis no print (1 ou vários), separe cada pessoa e gere respostas independentes seguindo as regras.';
    if (videoTitle?.trim()) {
      textInstruction += `\nVídeo: "${videoTitle.trim()}"`;
    }
    if (commentTextFallback?.trim()) {
      textInstruction += `\nTexto apoio: """${commentTextFallback.trim()}"""`;
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

    // Print adicional do vídeo se enviado
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
      temperature: 0.6, // Reduzido de 0.9 para 0.6 para evitar respostas alucinadas
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
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

    if (validComments.length === 0 && !commentTextFallback?.trim()) {
      return NextResponse.json(
        {
          error:
            'Não foi possível identificar o texto do print. Cole o texto abaixo e clique em Gerar.',
        },
        { status: 422 }
      );
    }

    const first = validComments[0] || {
      nickname: 'Espectador',
      personName: '',
      commentText: commentTextFallback || '',
      videoTitle: '',
      suggestedTopic: '',
      reply: '',
    };

    return NextResponse.json({
      nickname: first.nickname,
      personName: first.personName,
      commentText: first.commentText,
      detectedVideoTitle: parsed.detectedVideoTitle || first.videoTitle || '',
      suggestedTopic: first.suggestedTopic,
      reply: first.reply,
      comments: validComments,
    });
  } catch (error: any) {
    console.error('Erro em /api/generate-reply:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao gerar resposta para o comentário.' },
      { status: 500 }
    );
  }
}
