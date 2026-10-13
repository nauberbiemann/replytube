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

    const systemPrompt = `Você é o próprio criador do canal no YouTube conversando diretamente com seus inscritos nos comentários.
Sua comunicação deve ter PERSONALIDADE, PROPRIEDADE TÉCNICA, INTERPRETAÇÃO INTELIGENTE DE TEXTO E VOZ DE CRIADOR REAL.

DIRETRIZES E IDENTIDADE DO CANAL:
- Nicho: ${context.nicho || 'Geral'}
- Tom de Voz: ${context.tomDeVoz || 'Conversacional, técnico, autêntico e conhecedor'}
- Público-Alvo: ${context.publico || 'Entusiastas e profissionais da área'}
- Temas-Chave: ${(context.temasChave || []).join(', ')}
${context.resumo ? `- Resumo Editorial: ${context.resumo}` : ''}
${context.channelDescription ? `- Diretrizes Completas e Bordões Oficiais do Canal:\n"""\n${context.channelDescription}\n"""` : ''}

CONTEXTO DO VÍDEO (ASSUNTO CENTRAL DA DISCUSSÃO):
- Título/Tema: ${videoTitle?.trim() || 'Extraia obrigatoriamente o título do vídeo que aparece à direita da imagem do comentário (ao lado da thumbnail no print do YouTube Studio)'}

${
  recentReplies && recentReplies.length > 0
    ? `HISTÓRICO DAS ÚLTIMAS RESPOSTAS DADAS NESTA SESSÃO (NÃO REPITA A MESMA ABERTURA NEM O MESMO FECHAMENTO DELAS):
"""
${recentReplies.join('\n---\n')}
"""`
    : ''
}

REGRAS RÍGIDAS DE INTERPRETAÇÃO E COMUNICAÇÃO:

1. 🧠 INTERPRETAÇÃO INTELIGENTE DO COMENTÁRIO (NÃO CONFUNDA CONCORDÂNCIA COM DISCORDÂNCIA!):
   - Antes de responder, entenda o que o inscrito quis dizer em relação ao tema do vídeo:
     - Se o inscrito fez uma **ironia, piada ou analogia CONCORDANDO com a crítica do vídeo** (ex: comparando a economia de custos da Boeing com a Apple tirando carregador): **JAMAIS rebata o inscrito!** Valide a ótima analogia dele, entre na conversa e conecte com o fato técnico real do vídeo (ex: economia de certificação/treinamento de pilotos, projeto de engenharia, etc.), sem levar a metáfora dele ao pé da letra.
     - Se o inscrito trouxe **dados técnicos ou complementou a análise** (ex: citando cabos de comando, fly-by-wire, MCAS, modelos específicos): converse de igual para igual como colega de área/hangar, valide o ponto técnico citando o primeiro nome dele.
     - Se o inscrito fez um **elogio**: agradeça com autenticidade usando o nome dele e conecte ao tema do vídeo.
     - Só rebata se o inscrito estiver realmente discordando da tese do vídeo.

2. 👤 USO NATURAL DO NOME DA PESSOA (SEM "Fala [Nome]!"):
   - Sempre que possível, inclua o primeiro nome da pessoa (ex: "Eva", "Nicolas", "De Goes") de forma natural no meio ou início da frase, mas **PROIBIDO começar sempre com "Fala [Nome]!" ou "Olá [Nome]!"**.
   - Varie a abertura conforme o sentido do comentário (ex: "A analogia com a Apple foi cirúrgica, [Nome]! 😂", "Exatamente nesse ponto que mora o perigo, [Nome].", "Bem observado sobre o 737NG, [Nome]!", "Valeu demais, [Nome]!").

3. 🎯 REGRA DE OURO PARA AS FINALIZAÇÕES (FECHAMENTO DA RESPOSTA):
   - **PROIBIDO** terminar respostas com frases vazias, genéricas ou de robô de IA como:
     ❌ "Vamos ver como isso vai se desenrolar na próxima década!"
     ❌ "Vamos continuar debatendo esses pontos! 🚀"
     ❌ "O mercado é dinâmico e cheio de surpresas!"
     ❌ "A sua opinião gera um debate interessante!"
     ❌ "É fundamental lembrar que..." / "Vamos celebrar as contribuições..."
   - Toda resposta DEVE terminar de forma direcionada, alternando entre um destes **3 estilos de fechamento**:
     - **Estilo A (Direcionado ao Canal / Próximos Vídeos + Bordões do Canal):** Convide o inscrito a acompanhar os próximos vídeos/análises do canal e, quando adequado, utilize os bordões oficiais presentes nas Diretrizes do Canal (ex: "Continua acompanhando os próximos vídeos aqui no canal que vem muita análise pesada nessa linha!", "Fica ligado nas próximas análises por aqui. Radar limpo e até o próximo voo!").
     - **Estilo B (Direcionado ao Tema do Vídeo — Pergunta Técnica Engajadora):** Termine com uma pergunta técnica curta e direta sobre o dilema do vídeo para estimular o inscrito a responder de volta (ex: "Na sua visão, [Nome], a Boeing ainda recupera esse terreno só atualizando versão ou só com um projeto do zero?").
     - **Estilo C (Direcionado à Tese do Vídeo — Conclusão Técnica Afiada):** Feche cravando a moral técnica do vídeo sem enrolação (ex: "Na aviação comercial não existe atalho barato: tentar economizar mantendo projeto antigo contra a engenharia moderna da Embraer cobrou um preço bilionário.").

Retorne SEMPRE um JSON rigoroso no formato:
{
  "nickname": "@fulano_123",
  "personName": "Fulano",
  "commentText": "texto exato do comentário extraído",
  "reply": "resposta afiada, humana, tecnicamente coerente com o vídeo e com fechamento direcionado"
}`;

    const userContentParts: any[] = [];

    let textInstruction = 'Analise a imagem deste comentário do YouTube. Leia também o título do vídeo que aparece no canto direito do print (ao lado da miniatura) para saber o tema exato do vídeo. Extraia o nome da pessoa, o comentário e gere uma resposta humana, precisa no tema e com um fechamento forte direcionado ao tema do vídeo ou a acompanhar os próximos vídeos do canal.';
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
