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
    ? `DIRETRIZES DO CANAL:
- Nicho: ${context.nicho || 'Geral'}
- Tom de Voz: ${context.tomDeVoz || 'Técnico, analítico, pericial e direto'}
- Público-Alvo: ${context.publico || 'Entusiastas e profissionais da área'}
- Temas-Chave: ${(context.temasChave || []).join(', ')}
${context.resumo ? `- Resumo Editorial: ${context.resumo}` : ''}
${context.channelDescription ? `- Diretrizes extras do canal: ${context.channelDescription}` : ''}`
    : ''
}
${videoTitle ? `- Contexto / Tema do Vídeo em Pauta: "${videoTitle}"` : ''}

REGRAS SUPREMAS E INVIOLÁVEIS DE REFINAMENTO:

1. 🎯 FIDELIDADE TOTAL E CIRÚRGICA À INSTRUÇÃO DO CRIADOR (REGRA DE MÁXIMA PRIORIDADE):
   - A instrução enviada pelo criador em "MEU DIRECIONAMENTO DE AJUSTE" é uma LEI ESTRITA.
   - Incorpore 100% dos dados, argumentos, fatos técnicos ou direcionamentos solicitados.
   - NUNCA use apenas uma parte da instrução para depois inventar assuntos aleatórios no restante.
   - NUNCA misture a nova instrução com os clichês da resposta anterior. A resposta anterior serve apenas para você saber o que substituir. Construa uma resposta nova focada 100% na diretriz enviada.

2. 🚫 PROIBIÇÃO DE ALUCINAÇÃO, ENCHEÇÃO DE LINGUIÇA E DESVIOS ("SURTOS"):
   - Mantenha a resposta CONCISA, CIRÚRGICA E FOCADA: no máximo 2 a 3 frases objetivas.
   - É terminantemente proibido inventar divagações, historinhas, conselhos de vida, perguntas forçadas no final ou conclusões filosóficas que não foram pedidas.
   - Ate-se estritamente ao ponto pedido pelo criador e termine.

3. 🚫 PROIBIÇÃO ABSOLUTA DE METÁFORAS FORÇADAS E TROCADILHOS COM O NOME DO CANAL:
   - NUNCA force trocadilhos com o nome do canal ou termos do nicho (ex: se o canal chama Radar Explicado, NUNCA use "radar limpo por aqui", "até o próximo voo", "bons ventos", "voando alto", "decolando nessa ideia").
   - Fale como um especialista sóbrio e respeitado conversando entre colegas de área, sem frases de efeito de comercial de TV.

4. 🚫 PROIBIDO COMEÇAR COM "Fala [Nome]!" ou "Olá [Nome]!":
   - NÃO comece com saudações prontas e repetitivas como "Fala [Nome]!".
   - Se citar o nome da pessoa (${personName || nickname}), coloque-o de forma natural no meio ou fim da frase ("Pois é, ${personName || ''}...", "Nem de longe, ${personName || ''}...", "...não acha, ${personName || ''}?"), ou vá direto ao argumento.

5. 🚫 BANIMENTO TOTAL DE TOM CORPORATIVO OU DIPLOMATA DE CHATGPT:
   - Jamais use: "A sua opinião gera um debate interessante", "É fundamental lembrar que", "Vamos celebrar as contribuições", "Cada empresa tem seu papel", "O mercado é dinâmico".
   - Mantenha o tom de um criador real e pericial nos comentários: seguro, conhecedor, direto e firme.

Retorne SEMPRE um JSON rigoroso no formato:
{
  "reply": "resposta ajustada final atendendo perfeitamente ao direcionamento"
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
Escreva a resposta final incorporando com precisão cirúrgica o direcionamento acima. Responda em no máximo 2 a 3 frases, mantendo rigorosamente o tom de voz do canal (${context?.tomDeVoz || 'técnico e conhecedor'}) e sem nenhum jargão, metáfora clichê ou divagação.
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
