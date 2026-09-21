import OpenAI from 'openai';

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'sua_chave_aqui') {
    throw new Error(
      'OPENAI_API_KEY não configurada. Por favor, adicione sua chave da OpenAI no arquivo .env.local ou nas variáveis da Vercel.'
    );
  }

  return new OpenAI({
    apiKey: apiKey.trim(),
  });
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}
