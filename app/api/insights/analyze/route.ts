import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getOpenAIModel } from '@/lib/openai';
import { validateAccess } from '@/lib/auth';
import { InsightsAnalysisResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  const access = validateAccess(req);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Acesso não autorizado. Digite a senha de acesso.' }, { status: 401 });
  }

  try {
    const {
      comments,
      videoTitle,
      channelTitle,
      thumbnailUrl,
      videoUrl,
      customTopic,
    } = await req.json();

    if (!comments || !Array.isArray(comments) || comments.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum comentário fornecido para análise.' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const model = getOpenAIModel();

    // Limitar comentários para evitar payload excessivo (máx 150 representativos)
    const sampledComments = comments.slice(0, 150);
    const commentsFormatted = sampledComments.map((c, i) => `[${i + 1}] ${c}`).join('\n');

    const systemPrompt = `Você é um Estrategista Sênior de Conteúdo do YouTube, Especialista em Pesquisa de Audiência e Engenheiro de Viralidade.
Sua missão é minerar comentários de vídeos e extrair a "MINA DE OURO": dores ocultas, dúvidas recorrentes, padrões emocionais e ideias de novos vídeos com alto potencial de cliques (CTR) e retenção.

Você SEMPRE responde em formato estritamente JSON compatível com o schema especificado.`;

    const userPrompt = `Analise os ${sampledComments.length} comentários extraídos a seguir:

CONTEXTO:
- Título do Vídeo: ${videoTitle || 'Não especificado'}
- Canal: ${channelTitle || 'Não especificado'}
${customTopic ? `- Tema / Contexto Adicional: ${customTopic}` : ''}

LISTA DE COMENTÁRIOS:
${commentsFormatted}

INSTRUÇÕES DETALHADAS:
1. Resumo Executivo & Sentimento:
   - Perfil da audiência (quem comenta: iniciantes, veteranos, críticos, defensores ferrenhos, público casual, etc.).
   - Tom geral dos comentários (entusiasmado, cético, revoltado, bem-humorado, curioso, etc.).
   - Sentimento geral: "positivo", "neutro", "negativo" ou "misto".
   - Distribuição de sentimento (% positiva, neutra, negativa somando 100).
   - "keyTakeaway": O insight ou verdade mais valiosa e reveladora revelada por essa audiência.

2. Dores, Frustrações e Objeções (pains):
   - Identifique de 3 a 5 dores reais, dúvidas ou insatisfações apontadas pela audiência.
   - Atribua intensidade: "alta", "media" ou "baixa".
   - Adicione 1 a 3 citações literais reais dos comentários como "evidence".

3. Expectativas e Pedidos (expectations):
   - Identifique de 3 a 5 pedidos, curiosidades sem resposta ou temas que o público expressou desejo de ver.
   - Atribua frequência: "alta", "media" ou "baixa".
   - Adicione 1 a 3 citações literais reais como "evidence".

4. Mina de Ouro: Ideias de Novos Vídeos (contentIdeas):
   - Crie de 4 a 6 ideias de vídeos altamente magnéticos que resolvam diretamente as dores ou expectativas mineradas.
   - Título: Estilo YouTube de alto CTR (sem clickbait falso, mas extremamente instigante).
   - Hook: Primeiros 5 a 15 segundos para prender a atenção.
   - Premise: O ângulo do vídeo e por que vai performar muito.
   - Format: "Shorts" | "Vídeo Longo" | "Live / Q&A" | "Tutorial".
   - TargetPainOrExpectation: Qual dor ou expectativa dos comentários esse vídeo soluciona.
   - Potential: "viral" | "alto" | "nicho".

RETORNE APENAS O JSON NO SEGUINTE FORMATO:
{
  "summary": {
    "profile": "string",
    "tone": "string",
    "overallSentiment": "positivo" | "neutro" | "negativo" | "misto",
    "sentimentBreakdown": {
      "positive": 60,
      "neutral": 25,
      "negative": 15
    },
    "keyTakeaway": "string"
  },
  "pains": [
    {
      "id": "pain-1",
      "topic": "string",
      "description": "string",
      "intensity": "alta" | "media" | "baixa",
      "evidence": ["citação literal 1", "citação literal 2"]
    }
  ],
  "expectations": [
    {
      "id": "exp-1",
      "topic": "string",
      "description": "string",
      "frequency": "alta" | "media" | "baixa",
      "evidence": ["citação literal 1"]
    }
  ],
  "contentIdeas": [
    {
      "id": "idea-1",
      "title": "string",
      "hook": "string",
      "premise": "string",
      "format": "Shorts" | "Vídeo Longo" | "Live / Q&A" | "Tutorial",
      "targetPainOrExpectation": "string",
      "potential": "viral" | "alto" | "nicho"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.6,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const rawResponse = completion.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(rawResponse);

    const result: InsightsAnalysisResult = {
      videoTitle: videoTitle || 'Análise de Comentários',
      channelTitle: channelTitle || 'Canal',
      thumbnailUrl,
      videoUrl,
      totalCommentsAnalyzed: sampledComments.length,
      summary: parsedData.summary || {
        profile: 'Audiência geral',
        tone: 'Neutro',
        overallSentiment: 'neutro',
        sentimentBreakdown: { positive: 33, neutral: 34, negative: 33 },
        keyTakeaway: 'Nenhum insight específico encontrado.',
      },
      pains: (parsedData.pains || []).map((p: any, i: number) => ({
        id: p.id || `pain-${i + 1}`,
        topic: p.topic || 'Ponto crítico',
        description: p.description || '',
        intensity: p.intensity || 'media',
        evidence: Array.isArray(p.evidence) ? p.evidence : [],
      })),
      expectations: (parsedData.expectations || []).map((e: any, i: number) => ({
        id: e.id || `exp-${i + 1}`,
        topic: e.topic || 'Expectativa',
        description: e.description || '',
        frequency: e.frequency || 'media',
        evidence: Array.isArray(e.evidence) ? e.evidence : [],
      })),
      contentIdeas: (parsedData.contentIdeas || []).map((idea: any, i: number) => ({
        id: idea.id || `idea-${i + 1}`,
        title: idea.title || 'Ideia de Vídeo',
        hook: idea.hook || '',
        premise: idea.premise || '',
        format: idea.format || 'Vídeo Longo',
        targetPainOrExpectation: idea.targetPainOrExpectation || '',
        potential: idea.potential || 'alto',
      })),
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Erro em api/insights/analyze:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao processar análise com IA.' },
      { status: 500 }
    );
  }
}
