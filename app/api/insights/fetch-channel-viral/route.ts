import { NextRequest, NextResponse } from 'next/server';
import { validateAccess } from '@/lib/auth';

function parseChannelInput(input: string): { type: 'handle' | 'channelId' | 'query'; value: string } {
  const clean = input.trim();

  // If handle directly like @manualdomundo
  if (clean.startsWith('@')) {
    return { type: 'handle', value: clean.slice(1) };
  }

  // If URL with @handle: https://www.youtube.com/@handle or https://youtube.com/@handle/videos
  const handleMatch = clean.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/i);
  if (handleMatch) {
    return { type: 'handle', value: handleMatch[1] };
  }

  // If URL with channel ID: https://www.youtube.com/channel/UC...
  const channelIdMatch = clean.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
  if (channelIdMatch) {
    return { type: 'channelId', value: channelIdMatch[1] };
  }

  // If raw UC... channel ID
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(clean)) {
    return { type: 'channelId', value: clean };
  }

  // If clean is a plain username or query
  const slugMatch = clean.match(/youtube\.com\/(?:c\/|user\/)?([a-zA-Z0-9_.-]+)/i);
  if (slugMatch) {
    return { type: 'query', value: slugMatch[1] };
  }

  return { type: 'query', value: clean };
}

export async function POST(req: NextRequest) {
  const access = validateAccess(req);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Acesso não autorizado. Digite a senha de acesso.' }, { status: 401 });
  }

  try {
    const { channelUrl, viralCount = 3, commentsPerVideo = 40, apiKey: clientApiKey } = await req.json();

    if (!channelUrl || !channelUrl.trim()) {
      return NextResponse.json({ error: 'Link do canal ou @handle é obrigatório.' }, { status: 400 });
    }

    const apiKey = (clientApiKey && clientApiKey.trim() !== '')
      ? clientApiKey.trim()
      : process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Chave da YouTube Data API v3 necessária para escanear os vídeos virais do canal.',
          requiresApiKey: true,
          message: 'Configure sua chave gratuita no botão "Configurar Chave YouTube" para permitir a varredura automática do canal.',
        },
        { status: 400 }
      );
    }

    const parsed = parseChannelInput(channelUrl);
    let channelId = '';
    let channelTitle = '';
    let channelAvatar = '';
    let subscriberCount = '';
    let totalVideos = '';

    // 1. Resolver o canal via API
    if (parsed.type === 'handle') {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(parsed.value)}&key=${apiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          channelId = item.id;
          channelTitle = item.snippet?.title || '';
          channelAvatar = item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '';
          subscriberCount = item.statistics?.subscriberCount || '';
          totalVideos = item.statistics?.videoCount || '';
        }
      }
    } else if (parsed.type === 'channelId') {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${encodeURIComponent(parsed.value)}&key=${apiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          channelId = item.id;
          channelTitle = item.snippet?.title || '';
          channelAvatar = item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '';
          subscriberCount = item.statistics?.subscriberCount || '';
          totalVideos = item.statistics?.videoCount || '';
        }
      }
    }

    // Se ainda não encontrou (ou se foi query/slug/nome)
    if (!channelId) {
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(parsed.value)}&maxResults=1&key=${apiKey}`
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.items && searchData.items.length > 0) {
          const found = searchData.items[0];
          channelId = found.id?.channelId || found.snippet?.channelId;
          channelTitle = found.snippet?.title || '';
          channelAvatar = found.snippet?.thumbnails?.medium?.url || '';
        }
      }
    }

    if (!channelId) {
      return NextResponse.json(
        { error: `Canal "${channelUrl}" não encontrado. Verifique se o @handle ou link está correto.` },
        { status: 404 }
      );
    }

    // 2. Buscar os vídeos mais virais (ordenados por viewCount)
    const count = Math.min(Math.max(Number(viralCount) || 3, 1), 5);
    const searchVideosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=viewCount&type=video&maxResults=${count}&key=${apiKey}`;
    
    const viralRes = await fetch(searchVideosUrl);
    if (!viralRes.ok) {
      const err = await viralRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || 'Falha ao buscar vídeos virais do canal.' },
        { status: viralRes.status }
      );
    }

    const viralData = await viralRes.json();
    const videoItems = viralData.items || [];

    if (videoItems.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum vídeo público encontrado para este canal.' },
        { status: 404 }
      );
    }

    const videoIds = videoItems.map((v: any) => v.id.videoId).filter(Boolean);

    // 3. Obter estatísticas detalhadas desses vídeos (views, comentários)
    let viralVideosList: Array<{
      id: string;
      title: string;
      viewCount: number;
      commentCount: number;
      thumbnailUrl: string;
    }> = [];

    try {
      const detailsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(',')}&key=${apiKey}`
      );
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        viralVideosList = (detailsData.items || []).map((v: any) => ({
          id: v.id,
          title: v.snippet?.title || 'Vídeo Viral',
          viewCount: Number(v.statistics?.viewCount || 0),
          commentCount: Number(v.statistics?.commentCount || 0),
          thumbnailUrl:
            v.snippet?.thumbnails?.high?.url ||
            v.snippet?.thumbnails?.medium?.url ||
            `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
        }));
      }
    } catch {
      viralVideosList = videoItems.map((v: any) => ({
        id: v.id.videoId,
        title: v.snippet?.title || 'Vídeo Viral',
        viewCount: 0,
        commentCount: 0,
        thumbnailUrl: v.snippet?.thumbnails?.high?.url || `https://img.youtube.com/vi/${v.id.videoId}/hqdefault.jpg`,
      }));
    }

    // 4. Coletar comentários dos vídeos virais
    const perVideoLimit = Math.min(Math.max(Number(commentsPerVideo) || 40, 15), 60);
    const aggregatedComments: string[] = [];

    for (const vid of viralVideosList) {
      try {
        const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${vid.id}&maxResults=${perVideoLimit}&order=relevance&key=${apiKey}`;
        const cRes = await fetch(commentsUrl);
        if (cRes.ok) {
          const cData = await cRes.json();
          const items = cData.items || [];
          for (const item of items) {
            const top = item.snippet?.topLevelComment?.snippet;
            const author = top?.authorDisplayName || 'Espectador';
            const text = (top?.textOriginal || top?.textDisplay || '').trim();
            if (text) {
              aggregatedComments.push(`[Vídeo: "${vid.title}"] ${author}: ${text}`);
            }
          }
        }
      } catch (e) {
        console.warn(`Erro ao puxar comentários do vídeo ${vid.id}:`, e);
      }
    }

    if (aggregatedComments.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível extrair comentários dos vídeos virais deste canal. Os comentários podem estar desativados.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      channelId,
      channelTitle,
      channelAvatar,
      subscriberCount,
      totalVideos,
      viralVideos: viralVideosList,
      comments: aggregatedComments,
      totalComments: aggregatedComments.length,
    });
  } catch (error: any) {
    console.error('Erro em fetch-channel-viral:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro inesperado ao escanear o canal.' },
      { status: 500 }
    );
  }
}
