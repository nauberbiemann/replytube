import { Channel, SavedTopic, LockedVideo } from './types';

const STORAGE_KEY = 'replytube.channels';
const TOPICS_STORAGE_KEY = 'replytube.saved_topics';
const RECENT_VIDEOS_KEY = 'replytube.recent_videos';
const PENDING_SHEETS_KEY = 'replytube.pending_sheets_ids';

export function getPendingSheetTopicIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PENDING_SHEETS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string' && id) : [];
  } catch {
    return [];
  }
}

export function markTopicsPendingSync(ids: string[]): void {
  if (typeof window === 'undefined' || ids.length === 0) return;
  try {
    const merged = Array.from(new Set([...getPendingSheetTopicIds(), ...ids.filter(Boolean)]));
    window.localStorage.setItem(PENDING_SHEETS_KEY, JSON.stringify(merged));
  } catch (err) {
    console.error('Erro ao marcar temas pendentes para planilha:', err);
  }
}

export function clearTopicsPendingSync(ids: string[]): void {
  if (typeof window === 'undefined' || ids.length === 0) return;
  try {
    const removeSet = new Set(ids);
    const remaining = getPendingSheetTopicIds().filter((id) => !removeSet.has(id));
    if (remaining.length === 0) {
      window.localStorage.removeItem(PENDING_SHEETS_KEY);
    } else {
      window.localStorage.setItem(PENDING_SHEETS_KEY, JSON.stringify(remaining));
    }
  } catch (err) {
    console.error('Erro ao limpar temas pendentes da planilha:', err);
  }
}

export function getRecentVideos(channelId?: string): LockedVideo[] {
  if (typeof window === 'undefined') return [];
  try {
    const all: LockedVideo[] = JSON.parse(window.localStorage.getItem(RECENT_VIDEOS_KEY) || '[]');
    return (Array.isArray(all) ? all : [])
      .filter((v) => !channelId || !v.channelId || v.channelId === channelId)
      .sort((a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime());
  } catch {
    return [];
  }
}

const MAX_RECENT_VIDEOS_PER_CHANNEL = 300;

/** Salva/atualiza um vídeo no histórico pesquisável do canal (máx. 300 por canal). */
export function saveRecentVideo(video: LockedVideo): LockedVideo[] {
  if (typeof window === 'undefined') return [];
  const all = getRecentVideos();
  const others = all.filter((v) => !(v.id === video.id && v.channelId === video.channelId));
  const sameChannel = [video, ...others.filter((v) => v.channelId === video.channelId)].slice(
    0,
    MAX_RECENT_VIDEOS_PER_CHANNEL
  );
  const rest = others.filter((v) => v.channelId !== video.channelId);
  try {
    window.localStorage.setItem(RECENT_VIDEOS_KEY, JSON.stringify([...sameChannel, ...rest]));
  } catch (err) {
    console.error('Erro ao salvar vídeo recente no localStorage:', err);
  }
  return getRecentVideos(video.channelId);
}

export function removeRecentVideo(id: string, channelId?: string): LockedVideo[] {
  if (typeof window === 'undefined') return [];
  const all = getRecentVideos().filter(
    (v) => !(v.id === id && (!v.channelId || !channelId || v.channelId === channelId))
  );
  try {
    window.localStorage.setItem(RECENT_VIDEOS_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Erro ao remover vídeo recente do localStorage:', err);
  }
  return getRecentVideos(channelId);
}

export function normalizeWebsiteUrl(url?: string): string {
  const trimmed = (url || '').trim().replace(/\/+$/, '');
  return trimmed;
}

export function describeChannelWebsite(rawUrl?: string): { url: string; pitch: string } | null {
  const url = normalizeWebsiteUrl(rawUrl);
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('garage2050')) {
    return {
      url,
      pitch:
        'Portal Oficial da Bancada Garage 2050 — tem Simulador Grátis de Sintomas/Diagnóstico, lista de Ferramentas Testadas na bancada e o Manual/Guia de Bancada com cortes 3D e tolerâncias.',
    };
  }
  if (lower.includes('radardeenergia')) {
    return {
      url,
      pitch:
        'Portal Oficial da Bancada Radar de Energia — tem Calculadoras Elétricas e Solares Grátis (12V/24V/48V, cabos DC, apagão e MPPT vs PWM), Equipamentos Testados e o Guia de Bancada com 5 Fichas ABNT.',
    };
  }
  return {
    url,
    pitch:
      'Site/Portal Oficial do Canal — reúne guias práticos, ferramentas e informações complementares sobre os temas dos vídeos.',
  };
}

export function inferDefaultWebsiteUrl(channelName: string): string {
  const norm = (channelName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (norm.includes('garage 2050') || norm.includes('garage2050')) {
    return 'https://garage2050.vercel.app';
  }
  if (norm.includes('radar de energia') || norm.includes('radardeenergia')) {
    return 'https://radardeenergia.vercel.app';
  }
  return '';
}

export function getStoredChannels(): Channel[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    let changed = false;
    const migrated: Channel[] = parsed.map((c: Channel) => {
      if (c.websiteUrl === undefined) {
        const inferred = inferDefaultWebsiteUrl(c.name);
        if (inferred) {
          changed = true;
          return {
            ...c,
            websiteUrl: inferred,
            ...(c.cachedContext
              ? { cachedContext: { ...c.cachedContext, websiteUrl: inferred } }
              : {}),
          };
        }
      }
      return c;
    });
    if (changed) {
      saveChannels(migrated);
    }
    return migrated;
  } catch {
    return [];
  }
}

export function saveChannels(channels: Channel[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
  } catch (err) {
    console.error('Erro ao salvar canais no localStorage:', err);
  }
}

export function createChannel(name: string, description: string, websiteUrl?: string): Channel {
  const normalizedUrl = normalizeWebsiteUrl(websiteUrl) || inferDefaultWebsiteUrl(name) || '';
  const newChannel: Channel = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: description.trim(),
    websiteUrl: normalizedUrl,
    createdAt: new Date().toISOString(),
  };
  const current = getStoredChannels();
  const updated = [...current, newChannel];
  saveChannels(updated);
  return newChannel;
}

export function updateChannel(
  id: string,
  name: string,
  description: string,
  cachedContext?: Channel['cachedContext'],
  websiteUrl?: string
): Channel[] {
  const current = getStoredChannels();
  const updated = current.map((c) => {
    if (c.id !== id) return c;
    const descChanged = c.description !== description.trim();
    const resolvedWebsiteUrl =
      websiteUrl !== undefined ? normalizeWebsiteUrl(websiteUrl) : c.websiteUrl;
    const baseCachedContext =
      cachedContext !== undefined ? cachedContext : descChanged ? undefined : c.cachedContext;
    return {
      ...c,
      name: name.trim(),
      description: description.trim(),
      websiteUrl: resolvedWebsiteUrl,
      cachedContext: baseCachedContext
        ? { ...baseCachedContext, websiteUrl: resolvedWebsiteUrl }
        : undefined,
    };
  });
  saveChannels(updated);
  return updated;
}

export function saveChannelContextCache(id: string, cachedContext: Channel['cachedContext']): Channel[] {
  const current = getStoredChannels();
  const updated = current.map((c) => (c.id === id ? { ...c, cachedContext } : c));
  saveChannels(updated);
  return updated;
}

export function removeChannel(id: string): Channel[] {
  const current = getStoredChannels();
  const updated = current.filter((c) => c.id !== id);
  saveChannels(updated);
  return updated;
}

export function getStoredTopics(): SavedTopic[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TOPICS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredTopics(topics: SavedTopic[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
  } catch (err) {
    console.error('Erro ao salvar temas no localStorage:', err);
  }
}

const STOPWORDS = new Set(
  'a o as os de da do das dos e em no na nos nas um uma para por com sem que se ao aos sua seu suas seus como mais ou the and of to in for on is'.split(' ')
);

function topicWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => (w.length > 2 || /\d/.test(w)) && !STOPWORDS.has(w))
      .map((w) => (w.length > 4 ? w.replace(/(s|es)$/, '') : w))
  );
}

/** Similaridade local (0 a 1) entre dois temas — zero tokens. */
export function topicSimilarity(a: string, b: string): number {
  const A = topicWords(a);
  const B = topicWords(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((w) => {
    if (B.has(w)) inter++;
  });
  // proporção sobre o menor conjunto: pega temas curtos contidos em temas longos
  return inter / Math.min(A.size, B.size);
}

const SIMILARITY_THRESHOLD = 0.7;

export function addSavedTopic(
  topic: Omit<SavedTopic, 'id' | 'createdAt'>
): { saved: SavedTopic; list: SavedTopic[]; alreadyExisted: boolean } {
  const current = getStoredTopics();
  const normalizedTitle = topic.topicTitle.trim().toLowerCase();
  const normalizedComment = topic.commentText.trim().slice(0, 120).toLowerCase();

  const sameChannel = (t: SavedTopic) =>
    topic.channelId && t.channelId
      ? t.channelId === topic.channelId
      : t.channelName === topic.channelName;

  const existing = current.find(
    (t) =>
      sameChannel(t) &&
      (t.topicTitle.trim().toLowerCase() === normalizedTitle ||
        (topic.origin !== 'mina' &&
          t.origin !== 'mina' &&
          normalizedComment.length > 20 &&
          t.commentText.trim().slice(0, 120).toLowerCase() === normalizedComment) ||
        topicSimilarity(t.topicTitle, topic.topicTitle) >= SIMILARITY_THRESHOLD)
  );

  if (existing) {
    return { saved: existing, list: current, alreadyExisted: true };
  }

  const newTopic: SavedTopic = {
    id: crypto.randomUUID(),
    channelId: topic.channelId,
    channelName: topic.channelName || 'Geral',
    topicTitle: topic.topicTitle.trim(),
    commentText: topic.commentText.trim().slice(0, 350),
    nickname: topic.nickname || 'Inscrito',
    sourceVideoTitle: topic.sourceVideoTitle?.trim() || '',
    createdAt: new Date().toISOString(),
    origin: topic.origin || 'comentario',
    ...(topic.format ? { format: topic.format } : {}),
    ...(topic.potential ? { potential: topic.potential } : {}),
    ...(topic.hook ? { hook: topic.hook.slice(0, 300) } : {}),
    ...(topic.referenceUrl ? { referenceUrl: topic.referenceUrl } : {}),
  };

  const updated = [newTopic, ...current];
  saveStoredTopics(updated);
  return { saved: newTopic, list: updated, alreadyExisted: false };
}

export function updateSavedTopicTitle(id: string, topicTitle: string): SavedTopic[] {
  const current = getStoredTopics();
  const updated = current.map((t) =>
    t.id === id ? { ...t, topicTitle: topicTitle.trim() } : t
  );
  saveStoredTopics(updated);
  return updated;
}

export function removeSavedTopic(id: string): SavedTopic[] {
  const current = getStoredTopics();
  const updated = current.filter((t) => t.id !== id);
  saveStoredTopics(updated);
  return updated;
}

/** Mescla temas vindos da planilha (por ID), sem duplicar. */
export function mergeTopics(incoming: SavedTopic[]): { list: SavedTopic[]; added: number } {
  const current = getStoredTopics();
  const ids = new Set(current.map((t) => t.id));
  const fresh = incoming.filter((t) => t.id && !ids.has(t.id));
  const updated = [...current, ...fresh].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  saveStoredTopics(updated);
  return { list: updated, added: fresh.length };
}
