import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getOpenAIModel } from '@/lib/openai';
import { validateAccess } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const access = validateAccess(req);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Acesso não autorizado. Digite a senha de acesso.' }, { status: 401 });
  }

  try {
    const { term } = await req.json();

    if (!term || typeof term !== 'string' || term.trim() === '') {
      return NextResponse.json({ error: 'Termo de busca é obrigatório.' }, { status: 400 });
    }

    const openai = getOpenAIClient();
    const model = getOpenAIModel();

    const prompt = `Você é um especialista em SEO e pesquisa de conteúdo no YouTube e Facebook.
Para o termo fornecido: "${term.trim()}", forneça a melhor versão natural de busca nas 3 línguas:
1. "pt": Versão otimizada em Português
2. "en": Versão de alto volume de buscas no YouTube/Facebook em Inglês (como as pessoas realmente pesquisam lá fora)
3. "es": Versão de alto volume de buscas em Espanhol

Retorne estritamente um JSON no formato:
{
  "pt": "termo em português",
  "en": "term in english",
  "es": "término en español"
}`;

    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return NextResponse.json({
      success: true,
      term: {
        pt: parsed.pt || term.trim(),
        en: parsed.en || term.trim(),
        es: parsed.es || term.trim(),
      },
    });
  } catch (error: any) {
    console.error('Erro em api/evergreen/translate:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao traduzir termo com IA.' },
      { status: 500 }
    );
  }
}
