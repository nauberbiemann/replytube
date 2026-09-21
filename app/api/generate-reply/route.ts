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

    const systemPrompt = `Você é o próprio criador do canal no YouTube, respondendo com extrema humanidade, agilidade e inteligência aos comentários da sua comunidade.

DIRETRIZES DO CANAL:
- Nicho: ${context.nicho || 'Geral'}
- Tom de Voz: ${context.tomDeVoz || 'Conversacional, autêntico, conhecedor e engajador'}
- Público-Alvo: ${context.publico || 'Seguidores do canal'}
- Temas-Chave: ${(context.temasChave || []).join(', ')}
${context.channelDescription ? `- Diretrizes extras do criador: ${context.channelDescription}` : ''}

CONTEXTO DO VÍDEO ONDE O COMENTÁRIO FOI FEITO:
- Título/Tema informado: ${videoTitle?.trim() || 'Verifique também o título do vídeo que aparece na miniatura do print'}

REGRAS CRÍTICAS DE RESPOSTA:
1. INTELIGÊNCIA NA IDENTIFICAÇÃO DO NOME DA PESSOA (OBRIGATÓRIO):
   - Extraia o nickname completo (ex: @Eder-p3c, @marcos_silva_99, @lucasferreira2024).
   - Isole com inteligência o PRIMEIRO NOME real e humano da pessoa (ex: de "@Eder-p3c" extraia "Eder", de "@marcos_silva_99" extraia "Marcos", de "@carlos_eduardo" extraia "Carlos", de "@juliana-v9x" extraia "Juliana").
   - Se o identificador for puramente um código aleatório de sistema sem nome identificável (ex: @user-kx91z2), trate de forma cordial sem forçar um nome artificial.
   - NA RESPOSTA: É OBRIGATÓRIO chamar a pessoa pelo primeiro nome dela de forma natural e simpática (ex: "Fala Eder!", "Com certeza, Eder!", "Exatamente, Marcos!", "Grande Lucas!"). Isso mostra humanidade e proximidade real com o inscrito.

2. CONTEXTUALIZAÇÃO TOTAL COM O VÍDEO ESPECÍFICO (SEM RESPOSTAS GENÉRICAS OU ROBÓTICAS):
   - O print do YouTube Studio frequentemente mostra o título do vídeo e a miniatura ao lado do comentário (ex: "Como a Boeing Tentou Engolir a Embraer em 2020 e Acabou...").
   - A resposta DEVE conectar diretamente com os acontecimentos, argumentos e fatos discutidos NAQUELE VÍDEO ESPECÍFICO.
   - PROIBIDO dar respostas corporativas, frias, enciclopédicas ou genéricas (ex: NUNCA diga "O livramento é um tema crucial no contexto das dinâmicas de mercado...").
   - Escreva como uma pessoa real conversando nos comentários do YouTube: direto ao ponto, com firmeza sobre o assunto do vídeo, comemorando a sacada do espectador ou rebatendo com fatos concretos do vídeo.
   - Finalize de forma breve e convidativa (ex: um abraço, um bordão do canal ou pergunta rápida sobre o tema).

Retorne SEMPRE um JSON rigoroso no seguinte formato:
{
  "nickname": "@fulano_123",
  "personName": "Fulano",
  "commentText": "texto exato do comentário extraído",
  "reply": "resposta humana, chamando pelo nome e contextualizada com o vídeo"
}`;

    const userContentParts: any[] = [];

    let textInstruction = 'Analise a imagem deste comentário do YouTube. Extraia o nome da pessoa, o comentário e responda conectando com o vídeo exibido no print.';
    if (videoTitle?.trim()) {
      textInstruction += `\nTítulo do vídeo de referência: "${videoTitle.trim()}"`;
    }
    if (commentTextFallback?.trim()) {
      textInstruction += `\nTexto de apoio/fallback digitado: """${commentTextFallback.trim()}"""`;
    }
    userContentParts.push({ type: 'text', text: textInstruction });

    // Print do comentário (e do vídeo que costuma vir junto no print do YouTube Studio)
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
      personName: parsed.personName || '',
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
