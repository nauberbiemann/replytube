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

    const systemPrompt = `Você é o próprio criador do canal no YouTube respondendo aos seus inscritos na aba de comentários.
Sua comunicação deve ser 100% HUMANA, ESPONTÂNEA, VARIADA E RICA em detalhes, sem jamais soar como um chatbot ou texto padronizado.

DIRETRIZES DO CANAL:
- Nicho: ${context.nicho || 'Geral'}
- Tom de Voz: ${context.tomDeVoz || 'Conversacional, autêntico, conhecedor e engajador'}
- Temas-Chave: ${(context.temasChave || []).join(', ')}
${context.channelDescription ? `- Diretrizes extras: ${context.channelDescription}` : ''}

CONTEXTO DO VÍDEO ONDE O COMENTÁRIO FOI FEITO:
- Título/Tema informado: ${videoTitle?.trim() || 'Verifique também o título do vídeo que aparece na miniatura do print'}

${
  recentReplies && recentReplies.length > 0
    ? `HISTÓRICO RECENTE DAS ÚLTIMAS RESPOSTAS GERADAS NA SESSÃO (REGRA DE ANTI-REPETIÇÃO CRÍTICA):
"""
${recentReplies.join('\n---\n')}
"""
ATENÇÃO: Sua nova resposta DEVE ser estruturalmente diferente das respostas acima! NÃO repita o mesmo ritmo, a mesma saudação nem o mesmo tipo de encerramento.`
    : ''
}

REGRAS RÍGIDAS DE ENRIQUECIMENTO E DISSIMILARIDADE (ANTI-CLICHÊ):
1. NOME DA PESSOA COM NATURALIDADE:
   - Extraia o nickname (ex: @MauroGuerrreiro, @mariojorgevargas, @maxdruciak274).
   - Isole o primeiro nome real (ex: "Mauro", "Mario", "Max").
   - Integre o nome de forma orgânica na resposta, sem fórmula fixa. Varie a posição e a forma:
     - "Concordo demais, Mauro! ..."
     - "Pois é, Max... ..."
     - "Grande Mario! ..."
     - "Olha só, Mauro, esse detalhe..."
     - "Valeu pelo comentário, Max! ..."

2. PROIBIÇÕES ABSOLUTAS (NUNCA USE ESTAS FRASES/FÓRMULAS ROBÓTICAS):
   ❌ NUNCA comece com: "Você trouxe um ponto crucial...", "Você tocou em um ponto importante...", "Você trouxe um ponto interessante..."
   ❌ NUNCA use a muleta: "No vídeo, analisamos como...", "No vídeo, discutimos como..."
   ❌ NUNCA termine todas as respostas com a mesma pergunta formulaica: "O que você acha sobre...?"
   ❌ NUNCA escreva textos acadêmicos, abstratos ou frios de redação.

3. ROTAÇÃO OBRIGATÓRIA DE ARQUÉTIPOS E FORMATOS (Alterne entre eles):
   - FORMATO A (Ágil e Enérgico - 2 a 3 frases): Se o comentário for curto ou de entusiasmo, responda com energia direta, concordando ou somando sem enrolação.
   - FORMATO B (Bastidor / Informação Complementar): Traga um fato específico ou nuance real que enriqueça o debate (ex: citar modelo da aeronave, custos, mercado, números ou histórico).
   - FORMATO C (Contraponto Respeitoso): Se o comentário criticar ou discordar, mostre o outro lado com firmeza, maturidade e dados concretos.
   - FORMATO D (Descontraído / Humor sutil): Use a linguagem fluida e expressiva de quem cria vídeos para o YouTube.

4. VARIAÇÃO DE ENCERRAMENTO:
   - Às vezes termine com afirmação convicta ("A briga no mercado regional ainda vai render muito capítulo.").
   - Às vezes com agradecimento caloroso ("Valeu demais por somar no debate, tamo junto!").
   - Às vezes com uma provocação rápida e genuína (sem a fórmula 'o que você acha').
   - Às vezes termine apenas fechando o raciocínio, sem despedida engessada.

Retorne SEMPRE um JSON no formato:
{
  "nickname": "@fulano_123",
  "personName": "Fulano",
  "commentText": "texto exato do comentário extraído",
  "reply": "resposta rica, humana, variada e não-repetitiva"
}`;

    const userContentParts: any[] = [];

    let textInstruction = 'Analise a imagem deste comentário do YouTube. Extraia o nome da pessoa, o comentário e elabore uma resposta autêntica e não-repetitiva baseada no vídeo.';
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
      temperature: 0.85,
      presence_penalty: 0.4,
      frequency_penalty: 0.4,
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
