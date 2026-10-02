import { NextRequest, NextResponse } from 'next/server';
import { validateAccess } from '@/lib/auth';

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // If already an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  // Matches youtu.be, youtube.com/watch, youtube.com/shorts, youtube.com/embed
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = cleanUrl.match(regex);
  return match ? match[1] : null;
}

export async function POST(req: NextRequest) {
  const access = validateAccess(req);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Acesso não autorizado. Digite a senha de acesso.' }, { status: 401 });
  }

  try {
    const { videoUrl, maxResults = 100, apiKey: clientApiKey } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'URL do vídeo é obrigatória.' }, { status: 400 });
    }

    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'URL do YouTube inválida. Verifique o link e tente novamente (aceita links normais, youtu.be e shorts).' },
        { status: 400 }
      );
    }

    const apiKey = (clientApiKey && clientApiKey.trim() !== '') 
      ? clientApiKey.trim() 
      : process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Chave da YouTube Data API v3 não encontrada.',
          requiresApiKey: true,
          message: 'Insira sua chave gratuita da YouTube API v3 no campo de configuração ou utilize a opção de colar comentários manualmente.',
        },
        { status: 400 }
      );
    }

    // 1. Obter informações do vídeo (Título, Canal, Thumbnail)
    let videoTitle = 'Vídeo do YouTube';
    let channelTitle = 'Canal do YouTube';
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    try {
      const videoInfoRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
      );
      if (videoInfoRes.ok) {
        const videoData = await videoInfoRes.json();
        if (videoData.items && videoData.items.length > 0) {
          const snippet = videoData.items[0].snippet;
          videoTitle = snippet.title || videoTitle;
          channelTitle = snippet.channelTitle || channelTitle;
          thumbnailUrl =
            snippet.thumbnails?.maxres?.url ||
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            thumbnailUrl;
        }
      }
    } catch {
      // Falha ao obter dados adicionais não impede a leitura dos comentários
    }

    // 2. Buscar Comentários (commentThreads)
    const limit = Math.min(Math.max(Number(maxResults) || 100, 20), 200);
    const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${limit}&order=relevance&key=${apiKey}`;

    const commentsRes = await fetch(commentsUrl);

    if (!commentsRes.ok) {
      const errorData = await commentsRes.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || 'Falha ao buscar comentários na API do YouTube.';
      
      if (commentsRes.status === 403) {
        return NextResponse.json(
          {
            error: `Erro de permissão da YouTube API: ${errorMsg}. Verifique se a YouTube Data API v3 está ativada no seu console Google Cloud.`,
            requiresApiKey: true,
          },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: errorMsg }, { status: commentsRes.status });
    }

    const commentsData = await commentsRes.json();
    const items = commentsData.items || [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum comentário público encontrado neste vídeo. Pode ser que os comentários estejam desativados.' },
        { status: 404 }
      );
    }

    const commentsList: string[] = items.map((item: any) => {
      const top = item.snippet?.topLevelComment?.snippet;
      const author = top?.authorDisplayName ? `${top.authorDisplayName}: ` : '';
      const text = top?.textOriginal || top?.textDisplay || '';
      return `${author}${text}`.trim();
    }).filter((c: string) => c.length > 0);

    return NextResponse.json({
      success: true,
      videoId,
      videoTitle,
      channelTitle,
      thumbnailUrl,
      comments: commentsList,
      totalFetched: commentsList.length,
    });
  } catch (error: any) {
    console.error('Erro em fetch-comments:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro inesperado ao consultar a API do YouTube.' },
      { status: 500 }
    );
  }
}
