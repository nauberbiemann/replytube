import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getOpenAIModel } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelDescription } = body;

    if (!channelDescription || typeof channelDescription !== 'string' || !channelDescription.trim()) {
      return NextResponse.json(
        { error: 'A descrição ou diretrizes do canal são obrigatórias.' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const model = getOpenAIModel();

    const prompt = `Analise a seguinte descrição e diretrizes de um canal do YouTube e extraia o perfil editorial.
Descrição/Diretrizes:
"""
${channelDescription.trim()}
"""

Retorne APENAS um objeto JSON válido no seguinte formato exato:
{
  "nicho": "Nome do nicho/área principal (ex: Aviação e Engenharia Aeroespacial)",
  "tomDeVoz": "Descrição concisa do tom de voz (ex: Técnico, informativo, amigável e instigante)",
  "publico": "Público-alvo principal (ex: Entusiastas da aviação, profissionais e curiosos)",
  "temasChave": ["Tema 1", "Tema 2", "Tema 3", "Tema 4"],
  "resumo": "Breve síntese de 1 a 2 frases destacando a proposta de valor do canal e regras de engajamento."
}`;

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Você é um especialista em estratégia editorial e branding para canais do YouTube. Retorne apenas JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Nenhuma resposta retornada pela OpenAI.');
    }

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Erro em /api/analyze-channel:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao analisar o canal.' },
      { status: 500 }
    );
  }
}
