import { NextRequest, NextResponse } from 'next/server';
import { validateAccess } from '@/lib/auth';
import { getOpenAIClient, getOpenAIModel } from '@/lib/openai';
import {
  ALL_NICHE_KEYS,
  MY_NICHE_KEYS,
  NICHE_QUERIES,
  RADAR_NICHE_KEYS,
  RadarNiche,
  RadarVideo,
  isMyNiche,
} from '@/lib/titleRadar';

/**
 * Atualiza o Radar de Títulos Outliers.
 * Cota YouTube: search.list = 100 un./query · videos.list e channels.list = 1 un. por lote de 50.
 * IA: só disseca (fórmula PT-BR) os vídeos ainda não conhecidos (knownIds) — zero tokens repetidos.
 */

export const maxDuration = 60;

const YT = 'https://www.googleapis.com/youtube/v3';
const BLOCKED_CATEGORIES = new Set(['10', '17', '20', '25', '43', '44']);
const BLOCKED_TERMS = [
  'official video', 'trailer', 'lyric video', 'full match', 'highlights', 'breaking news',
  'live stream', '#shorts', 'cnn', 'msnbc', 'fox news', 'bbc', 'espn', 'nba', 'nfl', 'ufc',
];
const BLOCKED_REGEX = BLOCKED_TERMS.map((t) =>
  t.startsWith('#')
    ? new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    : new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
);

class YtError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function ytGet(path: string, params: Record<string, string>, key: string): Promise<any> {
  const qs = new URLSearchParams({ ...params, key });
  const res = await fetch(`${YT}/${path}?${qs.toString()}`, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason: string = data?.error?.errors?.[0]?.reason || '';
    if (/quota|dailyLimit/i.test(reason)) {
      throw new YtError(
        'Cota diária da YouTube API esgotada (renova por volta das 5h de Brasília). O radar salvo continua disponível.',
        429
      );
    }
    throw new YtError(data?.error?.message || 'Falha ao consultar a YouTube API.', res.status === 400 || res.status === 403 ? res.status : 502);
  }
  return data;
}

function parseDuration(iso: string): number {
  const m = (iso || '').match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return Number(m[1] || 0) * 86400 + Number(m[2] || 0) * 3600 + Number(m[3] || 0) * 60 + Number(m[4] || 0);
}

function asciiRatio(text: string): number {
  const chars = Array.from(text || '');
  if (chars.length === 0) return 0;
  const ascii = chars.filter((c) => c.charCodeAt(0) < 128).length;
  return ascii / chars.length;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const SKELETON_PROMPT = `Você disseca títulos virais de YouTube em inglês para criadores brasileiros.
Para CADA item recebido gere:
- "skeleton_pt": a FÓRMULA replicável do título em português brasileiro natural (não tradução literal), mantendo a estrutura psicológica, a tensão e o contraste do original, e trocando o tema específico pelo marcador literal [ASSUNTO] (use [ASSUNTO] 1 vez, no máximo 2). Mantenha números e prazos do original quando fizerem parte da força do título.
- "trigger_tag": o gatilho psicológico em até 3 palavras em PT-BR (ex.: "Substituição Radical", "Paradoxo de Ego", "Diagnóstico Oculto", "Prova Numérica").
- "hook_mechanism": 1 frase curta em PT-BR explicando por que esse título gera clique.
Retorne APENAS JSON: {"items":[{"id":"","skeleton_pt":"","trigger_tag":"","hook_mechanism":""}]}`;

export async function POST(req: NextRequest) {
  const auth = validateAccess(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Acesso bloqueado.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      niche = 'all',
      days = 7,
      apiKey: clientKey,
      cursors = {},
      knownIds = [],
      model: requestedModel,
    } = body as {
      niche: RadarNiche | 'all' | 'mine';
      days: number;
      apiKey?: string;
      cursors?: Record<string, number>;
      knownIds?: string[];
      model?: string;
    };

    const apiKey = clientKey?.trim() || process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave da YouTube API não configurada.', requiresApiKey: true },
        { status: 400 }
      );
    }

    const windowDays = [3, 7, 14, 30].includes(Number(days)) ? Number(days) : 7;
    const publishedAfter = new Date(Date.now() - windowDays * 86400000).toISOString();

    // ---------- 1) search.list com sementes rotativas ----------
    // Nichos próprios: 1ª busca em vídeos médios (4–20 min) e 2ª em longos (> 20 min),
    // porque documentários (aviação, sobrevivência) costumam passar de 20 minutos.
    const nextCursors: Record<string, number> = { ...cursors };
    const plan: { niche: RadarNiche; q: string; duration: 'medium' | 'long' }[] = [];
    const targets: RadarNiche[] =
      niche === 'all'
        ? RADAR_NICHE_KEYS
        : niche === 'mine'
        ? MY_NICHE_KEYS
        : ALL_NICHE_KEYS.includes(niche)
        ? [niche]
        : [];
    if (targets.length === 0) {
      return NextResponse.json({ error: 'Nicho inválido.' }, { status: 400 });
    }
    const perNiche = niche === 'all' || niche === 'mine' ? 1 : 2;
    targets.forEach((n) => {
      const list = NICHE_QUERIES[n];
      const start = Number(cursors[n] || 0);
      for (let i = 0; i < perNiche; i++) {
        const duration: 'medium' | 'long' = !isMyNiche(n)
          ? 'medium'
          : perNiche === 2
          ? i === 0
            ? 'medium'
            : 'long'
          : start % 2 === 0
          ? 'medium'
          : 'long';
        plan.push({ niche: n, q: list[(start + i) % list.length], duration });
      }
      nextCursors[n] = (start + perNiche) % list.length;
    });

    let quotaUsed = 0;
    const nicheById = new Map<string, RadarNiche>();
    const searchResults = await Promise.all(
      plan.map((p) =>
        ytGet(
          'search',
          {
            part: 'id',
            type: 'video',
            q: p.q,
            relevanceLanguage: 'en',
            regionCode: 'US',
            videoDuration: p.duration,
            order: 'viewCount',
            publishedAfter,
            maxResults: '40',
          },
          apiKey
        ).then((data) => ({ niche: p.niche, data }))
      )
    );
    quotaUsed += plan.length * 100;
    searchResults.forEach(({ niche: n, data }) => {
      (data.items || []).forEach((it: any) => {
        const id = it?.id?.videoId;
        if (id && !nicheById.has(id)) nicheById.set(id, n);
      });
    });

    const candidateIds = Array.from(nicheById.keys());
    if (candidateIds.length === 0) {
      return NextResponse.json({
        items: [],
        cursors: nextCursors,
        quotaUsed,
        stats: { candidates: 0, kept: 0, newSkeletons: 0 },
        usage: null,
      });
    }

    // ---------- 2) videos.list em lotes de 50 ----------
    const videoChunks = chunk(candidateIds, 50);
    const videoResponses = await Promise.all(
      videoChunks.map((ids) =>
        ytGet('videos', { part: 'snippet,statistics,contentDetails', id: ids.join(','), maxResults: '50' }, apiKey)
      )
    );
    quotaUsed += videoChunks.length;

    const now = Date.now();
    type Pre = Omit<RadarVideo, 'subscribers' | 'outlier' | 'skeleton' | 'trigger' | 'hook'>;
    const pre: Pre[] = [];
    videoResponses.forEach((data) => {
      (data.items || []).forEach((v: any) => {
        const sn = v.snippet || {};
        const st = v.statistics || {};
        const title: string = sn.title || '';
        const durationSec = parseDuration(v.contentDetails?.duration || '');
        const views = Number(st.viewCount || 0);
        if (durationSec < 180 || durationSec > 4500) return;
        if ((sn.liveBroadcastContent || 'none') !== 'none') return;
        const category = String(sn.categoryId || '');
        const videoNiche = nicheById.get(v.id);
        // Aviação: muitos canais de documentário usam a categoria "Notícias" (25)
        if (BLOCKED_CATEGORIES.has(category) && !(category === '25' && videoNiche === 'aviation')) return;
        if (BLOCKED_REGEX.some((re) => re.test(title))) return;
        if (asciiRatio(title) < 0.88) return;
        if (views < 4000) return;
        const ageDays = Math.max((now - new Date(sn.publishedAt).getTime()) / 86400000, 0.4);
        pre.push({
          id: v.id,
          niche: nicheById.get(v.id) || 'business',
          title,
          channelTitle: sn.channelTitle || '',
          channelId: sn.channelId || '',
          views,
          viewsPerDay: Math.round(views / ageDays),
          publishedAt: sn.publishedAt || '',
          durationSec,
          thumbnailUrl:
            sn.thumbnails?.medium?.url || sn.thumbnails?.high?.url || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
          syncedAt: new Date().toISOString(),
        });
      });
    });

    // ---------- 3) channels.list em lotes de 50 ----------
    const channelIds = Array.from(new Set(pre.map((p) => p.channelId).filter(Boolean)));
    const channelChunks = chunk(channelIds, 50);
    const channelResponses = await Promise.all(
      channelChunks.map((ids) => ytGet('channels', { part: 'statistics', id: ids.join(','), maxResults: '50' }, apiKey))
    );
    quotaUsed += channelChunks.length;
    const subsById = new Map<string, number>();
    channelResponses.forEach((data) => {
      (data.items || []).forEach((c: any) => {
        if (c?.statistics?.hiddenSubscriberCount) return;
        subsById.set(c.id, Number(c?.statistics?.subscriberCount || 0));
      });
    });

    const kept: RadarVideo[] = [];
    pre.forEach((p) => {
      if (!subsById.has(p.channelId)) return;
      const subscribers = subsById.get(p.channelId) || 0;
      if (subscribers > 3_000_000) return;
      const outlier = Math.round((p.views / Math.max(subscribers, 1000)) * 10) / 10;
      if (outlier < 1.3) return;
      kept.push({ ...p, subscribers, outlier, skeleton: '', trigger: '', hook: '' });
    });

    // ---------- 4) Dissecação por IA só dos vídeos novos ----------
    const known = new Set(knownIds);
    const toExtract = kept.filter((v) => !known.has(v.id));
    let usage: { model: string; inputTokens: number; cachedTokens: number; outputTokens: number } | null = null;

    if (toExtract.length > 0) {
      const openai = getOpenAIClient();
      const model = getOpenAIModel(requestedModel);
      usage = { model, inputTokens: 0, cachedTokens: 0, outputTokens: 0 };
      const batches = chunk(toExtract, 25);
      const results = await Promise.all(
        batches.map(async (batch) => {
          try {
            const completion = await openai.chat.completions.create({
              model,
              temperature: 0.4,
              max_tokens: 3200,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: SKELETON_PROMPT },
                {
                  role: 'user',
                  content: JSON.stringify({ items: batch.map((v) => ({ id: v.id, title: v.title })) }),
                },
              ],
            });
            const u: any = completion.usage;
            usage!.inputTokens += u?.prompt_tokens ?? 0;
            usage!.cachedTokens += u?.prompt_tokens_details?.cached_tokens ?? 0;
            usage!.outputTokens += u?.completion_tokens ?? 0;
            const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
            return Array.isArray(parsed.items) ? parsed.items : [];
          } catch (err) {
            console.error('[titles/radar] falha ao dissecar lote:', err);
            return [];
          }
        })
      );
      const byId = new Map<string, any>();
      results.flat().forEach((r: any) => r?.id && byId.set(String(r.id), r));
      toExtract.forEach((v) => {
        const r = byId.get(v.id);
        if (!r) return;
        v.skeleton = String(r.skeleton_pt || '').trim();
        v.trigger = String(r.trigger_tag || '').trim();
        v.hook = String(r.hook_mechanism || '').trim();
      });
    }

    return NextResponse.json({
      items: kept,
      cursors: nextCursors,
      quotaUsed,
      stats: {
        candidates: candidateIds.length,
        kept: kept.length,
        newSkeletons: toExtract.filter((v) => v.skeleton).length,
      },
      usage,
    });
  } catch (error: any) {
    console.error('Erro em /api/titles/radar:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao atualizar o radar.' },
      { status: error instanceof YtError ? error.status : 500 }
    );
  }
}
