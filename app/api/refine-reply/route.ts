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
      model: requestedModel,
    } = body as {
      commentText: string;
      nickname: string;
      personName?: string;
      previousReply: string;
      instruction: string;
      videoTitle?: string;
      context?: ChannelContext;
      model?: string;
    };

    if (!instruction?.trim()) {
      return NextResponse.json(
        { error: 'A instrução de refinamento é obrigatória.' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const model = getOpenAIModel(requestedModel);

    const systemPrompt = `Você é o próprio criador do canal no YouTube ajustando sua resposta para um comentário da comunidade.
Sua comunicação deve ter a personalidade viva do canal, mantendo coerência absoluta com o tema do vídeo e com as instruções enviadas pelo criador.

${
  context
    ? `DIRETRIZES E IDENTIDADE DO CANAL:
- Nicho: ${context.nicho || 'Geral'}
- Tom de Voz: ${context.tomDeVoz || 'Técnico, analítico, pericial e direto'}
- Público-Alvo: ${context.publico || 'Entusiastas e profissionais da área'}
- Temas-Chave: ${(context.temasChave || []).join(', ')}
${context.resumo ? `- Resumo Editorial: ${context.resumo}` : ''}
${context.channelDescription ? `- Diretrizes Completas e Bordões Oficiais do Canal:\n"""\n${context.channelDescription}\n"""` : ''}`
    : ''
}
${videoTitle ? `- Contexto / Tema do Vídeo em Pauta: "${videoTitle}"` : ''}

REGRAS SUPREMAS E INVIOLÁVEIS DE REFINAMENTO:

1. 🎯 FIDELIDADE TOTAL E CIRÚRGICA À INSTRUÇÃO DO CRIADOR (REGRA DE MÁXIMA PRIORIDADE):
   - A instrução enviada pelo criador em "MEU DIRECIONAMENTO DE AJUSTE" é uma LEI ESTRITA.
   - Incorpore 100% dos dados, argumentos, fatos técnicos ou direcionamentos solicitados.
   - NUNCA use apenas uma parte da instrução para depois inventar assuntos aleatórios no restante.
   - NUNCA misture a nova instrução com clichês indesejados da resposta anterior. Construa uma resposta nova focada 100% na diretriz enviada.

2. 🚫 PROIBIÇÃO DE ALUCINAÇÃO, ENCHEÇÃO DE LINGUIÇA E DESVIOS ("SURTOS"):
   - Mantenha a resposta CONCISA, CIRÚRGICA E FOCADA: no máximo 2 a 3 frases objetivas.
   - É terminantemente proibido inventar divagações, historinhas, conselhos de vida ou conclusões filosóficas que não foram pedidas.
   - Ate-se estritamente ao ponto pedido pelo criador.

3. 🎬 REGRA DE OURO PARA AS FINALIZAÇÕES (FECHAMENTO DIRECIONADO):
   - **PROIBIDO** terminar com frases vazias, genéricas ou de robô de IA como:
     ❌ "Vamos ver como isso vai se desenrolar na próxima década!"
     ❌ "Vamos continuar debatendo esses pontos! 🚀"
     ❌ "O mercado é dinâmico e cheio de surpresas!"
     ❌ "A sua opinião gera um debate interessante!" / "É fundamental lembrar que..." / "Vamos celebrar as contribuições..."
   - Finalize sempre com **UM destes 3 fechamentos autênticos** (a menos que o criador peça um fechamento específico na instrução):
     - **A) Direcionado ao Canal / Próximos Vídeos + Bordões do Canal:** Convide para acompanhar as próximas análises do canal e/ou feche com um dos bordões oficiais definidos nas Diretrizes do Canal (ex: "Continua acompanhando os próximos vídeos aqui no canal que vem muita análise pesada nessa linha!", "Fica ligado nas próximas análises. Radar limpo por aqui / Até o próximo voo!").
     - **B) Direcionado ao Tema do Vídeo (Pergunta Técnica Engajadora):** Uma pergunta direta e inteligente sobre o tema técnico do vídeo para estimular resposta do inscrito.
     - **C) Direcionado à Tese do Vídeo (Conclusão Técnica Afiada):** Termine cravando o argumento central sem enrolação.

4. 🚫 PROIBIDO COMEÇAR COM "Fala [Nome]!" ou "Olá [Nome]!":
   - NÃO comece com saudações prontas e repetitivas como "Fala [Nome]!".
   - Se citar o nome da pessoa (${personName || nickname}), coloque-o de forma natural na frase ("Pois é, ${personName || ''}...", "Exatamente, ${personName || ''}...", "...não acha, ${personName || ''}?"), ou vá direto ao argumento.

Retorne SEMPRE um JSON rigoroso no formato:
{
  "reply": "resposta ajustada final atendendo perfeitamente ao direcionamento e com fechamento direcionado"
}`;

    const userPrompt = `Comentário original do inscrito:
"${commentText}" (Inscrito: ${nickname} | Nome identificado: ${personName || nickname})

Resposta gerada anteriormente (que você deve substituir/corrigir):
"${previousReply}"

🎯 MEU DIRECIONAMENTO DE AJUSTE (SIGA ESTA ORDEM À RISCA, SEM VIAJAR NEM DESVIAR):
"""
${instruction.trim()}
"""

${videoTitle ? `Tema do vídeo: "${videoTitle}"` : ''}

INSTRUÇÃO DE EXECUÇÃO:
Escreva a resposta final incorporando com precisão cirúrgica o direcionamento acima. Responda em no máximo 2 a 3 frases, mantendo rigorosamente o tom de voz do canal (${context?.tomDeVoz || 'técnico e conhecedor'}) e finalizando de forma direcionada (ao tema do vídeo, aos próximos vídeos ou com bordão oficial do canal, sem clichês genéricos de IA).
Retorne apenas JSON: { "reply": "..." }`;

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.2, // Baixa temperatura para precisão cirúrgica na instrução!
      presence_penalty: 0.0, // Zera penalidade para permitir usar livremente os termos do criador
      frequency_penalty: 0.0,
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
