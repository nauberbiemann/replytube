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
    } = body as {
      context: ChannelContext;
      commentImageDataUrl?: string;
      commentTextFallback?: string;
      videoTitle?: string;
      videoImageDataUrl?: string;
      recentReplies?: string[];
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

    const systemPrompt = `Você é o próprio criador do canal no YouTube conversando diretamente com seus inscritos nos comentários.
Sua comunicação deve ter PERSONALIDADE, FIRMEZA, ESPIRITO CRÍTICO E ENERGIA DE YOUTUBER REAL.

DIRETRIZES DO CANAL:
- Nicho: ${context.nicho || 'Geral'}
- Tom de Voz: ${context.tomDeVoz || 'Conversacional, autêntico, conhecedor e engajador'}
- Temas-Chave: ${(context.temasChave || []).join(', ')}
${context.channelDescription ? `- Diretrizes extras: ${context.channelDescription}` : ''}

CONTEXTO DO VÍDEO (ASSUNTO CENTRAL DA DISCUSSÃO):
- Título/Tema: ${videoTitle?.trim() || 'Verifique o título e thumbnail que aparecem no print'}

${
  recentReplies && recentReplies.length > 0
    ? `HISTÓRICO DAS ÚLTIMAS RESPOSTAS DADAS NESTA SESSÃO (NÃO REPITA A ESTRUTURA DELAS):
"""
${recentReplies.join('\n---\n')}
"""`
    : ''
}

REGRAS RÍGIDAS DE COMUNICAÇÃO HUMANA (PROIBIÇÃO DE VÍCIOS DE IA):

1. 🚫 PROIBIDO COMEÇAR COM "Fala [Nome]!" ou "Olá [Nome]!":
   - O público percebe na hora quando todas as respostas começam com "Fala Fulano!".
   - Varie radicalmente o início de cada resposta:
     - Reação direta e espontânea: "Aí forçou a barra, [Nome]! 😂", "Nem de longe, [Nome]!", "Concordo 100%, [Nome]!", "Pois é, [Nome]..."
     - Começar pelo argumento com o nome no meio ou no fim: "Insignificante vendendo cargueiro pra OTAN, [Nome]?", "A questão é que a Embraer domina o mercado regional, né [Nome]?"
     - Ou começar direto no assunto sem citar nome quando a resposta for curta e afiada: "Quem dera fosse tão simples! 😂 O problema é que..."

2. 🚫 BANIMENTO TOTAL DE JARGÕES CORPORATIVOS E CLICHÊS DE CHATGPT:
   - NUNCA use frases artificiais como:
     ❌ "A sua opinião gera um debate interessante..."
     ❌ "É fundamental lembrar que..."
     ❌ "Vamos celebrar as contribuições de todas as empresas..."
     ❌ "O mercado é dinâmico e cheio de surpresas..."
     ❌ "A governança é crucial para a indústria..."
     ❌ "Cada empresa tem seu papel no setor..."
     ❌ "No vídeo analisamos como..." ou "No vídeo discutimos como..."
     ❌ "O que você acredita/acha que seria essencial...?"

3. RESPOSTAS PROPORCIONAIS E AFINADAS:
   - Se o comentário for curto, irônico ou de deboche (ex: "A Embraer é insignificante 😂"):
     NÃO faça textão de assessor de imprensa! Dê uma resposta curta (2 frases), afiada e com dados reais do vídeo que desmontam a tese com elegância e bom humor.
   - Fale como o criador fala no microfone do canal: com propriedade técnica, firmeza nos dados e proximidade de quem está lendo a comunidade no celular.

Retorne SEMPRE um JSON rigoroso no formato:
{
  "nickname": "@fulano_123",
  "personName": "Fulano",
  "commentText": "texto exato do comentário extraído",
  "reply": "resposta afiada, humana e 100% livre de clichês de IA"
}`;

    const userContentParts: any[] = [];

    let textInstruction = 'Analise a imagem deste comentário do YouTube. Extraia o nome da pessoa, o comentário e responda de forma afiada, natural e conectada ao vídeo, sem clichês.';
    if (videoTitle?.trim()) {
      textInstruction += `\nTítulo do vídeo de referência: "${videoTitle.trim()}"`;
    }
    if (commentTextFallback?.trim()) {
      textInstruction += `\nTexto de apoio/fallback digitado: """${commentTextFallback.trim()}"""`;
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
      temperature: 0.9,
      presence_penalty: 0.6,
      frequency_penalty: 0.6,
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
