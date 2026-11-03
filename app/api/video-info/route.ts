import { NextRequest, NextResponse } from 'next/server';
import { validateAccess } from '@/lib/auth';

/**
 * Busca título completo + descrição de um vídeo pela YouTube Data API (videos.list, 1 unidade de cota).
 * Não usa OpenAI. A descrição é limpa (sem links/hashtags) e encurtada para servir de contexto barato.
 */

function extractVideoId(url: string): string | null {
  const clean = (url || '').trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
  const m = clean.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/|studio\.youtube\.com\/video\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function cleanDescription(raw: string): string {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^#/.test(l)) // linhas só de hashtags
    .map((l) => l.replace(/https?:\/\/\S+/g, '').trim())
    .filter((l) => l.length > 2)
    .join('\n')
    .slice(0, 1200);
}

export async function POST(req: NextRequest) {
  const access = validateAccess(req);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const { videoUrl, apiKey: clientKey } = await req.json();
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Link do YouTube inválido. Aceita youtube.com/watch, youtu.be, shorts e links do Studio.' },
        { status: 400 }
      );
    }

    const apiKey = clientKey?.trim() || process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave da YouTube API não configurada (configure na aba Mina de Ouro).', requiresApiKey: true },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${encodeURIComponent(apiKey)}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || 'Falha ao consultar o YouTube.' },
        { status: 502 }
      );
    }
    const snippet = data.items?.[0]?.snippet;
    if (!snippet) {
      return NextResponse.json({ error: 'Vídeo não encontrado (pode ser privado).' }, { status: 404 });
    }

    return NextResponse.json({
      videoId,
      title: snippet.title || '',
      description: cleanDescription(snippet.description || ''),
      channelTitle: snippet.channelTitle || '',
      thumbnailUrl:
        snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao buscar o vídeo.' }, { status: 500 });
  }
}
