'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChannelContext, ScriptOutline } from '@/lib/types';
import {
  AdaptTone,
  QueuedTitle,
  RADAR_NICHES,
  RadarNiche,
  RadarVideo,
  TONES,
} from '@/lib/titleRadar';
import { ScriptModal } from './ScriptModal';
import { YouTubeApiKeyModal } from './YouTubeApiKeyModal';
import {
  Radar,
  RefreshCw,
  X,
  Copy,
  Check,
  Bookmark,
  Sparkles,
  ExternalLink,
  Trash2,
  Loader2,
  FileText,
  Lightbulb,
  Zap,
  ListChecks,
  Wand2,
} from 'lucide-react';

interface TitleRadarViewProps {
  appPassword: string;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  selectedModel: string;
  channelContext: ChannelContext | null;
  onSaveToTopicBank: (title: string, originalTitle: string) => void;
}

type SheetState = 'checking' | 'synced' | 'local' | 'outdated' | 'error';
type SortKey = 'outlier' | 'velocity' | 'recent';

const LS_RADAR = 'replytube.title_radar';
const LS_QUEUE = 'replytube.title_queue';
const LS_QUEUE_DIRTY = 'replytube.title_queue_dirty';
const LS_QUEUE_DELETED = 'replytube.title_queue_deleted';
const LS_ADAPT = 'replytube.title_adapt_cache';
const LS_CURSORS = 'replytube.title_radar_cursors';
const MAX_SHOWN = 150;
const MAX_ADAPT_PER_CALL = 100;

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('localStorage:', err);
  }
}

const cacheKey = (id: string, topic: string, tone: string) => `${id}|${topic.trim().toLowerCase()}|${tone}`;

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace('.0', '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace('.0', '')}k`;
  return String(n);
}

function ageLabel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!isFinite(diff)) return '';
  const hours = Math.max(1, Math.round(diff / 3600000));
  return hours < 24 ? `há ${hours}h` : `há ${Math.round(hours / 24)}d`;
}

function durationLabel(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function usageText(u: any): string {
  if (!u?.inputTokens) return '';
  const p = u.model === 'gpt-4o' ? { in: 2.5, out: 10 } : { in: 0.15, out: 0.6 };
  const cost = (u.inputTokens * p.in + u.outputTokens * p.out) / 1_000_000;
  return `[${Number(u.inputTokens).toLocaleString('pt-BR')} tokens · US$ ${cost.toFixed(4)}]`;
}

function normalizeRadar(v: any): RadarVideo {
  return {
    id: String(v.id),
    niche: (v.niche || 'business') as RadarNiche,
    title: String(v.title || ''),
    skeleton: String(v.skeleton || ''),
    trigger: String(v.trigger || ''),
    hook: String(v.hook || ''),
    channelTitle: String(v.channelTitle || ''),
    channelId: String(v.channelId || ''),
    subscribers: Number(v.subscribers) || 0,
    views: Number(v.views) || 0,
    viewsPerDay: Number(v.viewsPerDay) || 0,
    outlier: Number(v.outlier) || 0,
    publishedAt: String(v.publishedAt || ''),
    durationSec: Number(v.durationSec) || 0,
    thumbnailUrl: String(v.thumbnailUrl || ''),
    syncedAt: String(v.syncedAt || ''),
  };
}

function normalizeQueue(q: any): QueuedTitle {
  return {
    id: String(q.id),
    createdAt: String(q.createdAt || new Date().toISOString()),
    title: String(q.title || ''),
    status: q.status === 'Já Gravado' ? 'Já Gravado' : 'Para Gravar',
    topic: String(q.topic || ''),
    tone: String(q.tone || ''),
    angle: String(q.angle || ''),
    originalTitle: String(q.originalTitle || ''),
    videoId: String(q.videoId || ''),
    channelTitle: String(q.channelTitle || ''),
  };
}

function mergeRadar(base: RadarVideo[], incoming: RadarVideo[]): RadarVideo[] {
  const map = new Map<string, RadarVideo>(base.map((v) => [v.id, v]));
  incoming.forEach((raw) => {
    const v = normalizeRadar(raw);
    const prev = map.get(v.id);
    map.set(v.id, {
      ...(prev || v),
      ...v,
      skeleton: v.skeleton || prev?.skeleton || '',
      trigger: v.trigger || prev?.trigger || '',
      hook: v.hook || prev?.hook || '',
    });
  });
  const cutoff = Date.now() - 45 * 86400000;
  return Array.from(map.values())
    .filter((v) => {
      const t = new Date(v.publishedAt).getTime();
      return !t || t >= cutoff;
    })
    .sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime())
    .slice(0, 800);
}

function SkeletonText({ text }: { text: string }) {
  const parts = text.split(/(\[ASSUNTO\])/g);
  return (
    <>
      {parts.map((p, i) =>
        p === '[ASSUNTO]' ? (
          <span key={i} className="rounded bg-sky-500/20 px-1 font-semibold text-sky-300">
            [ASSUNTO]
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}

function CharPill({ text }: { text: string }) {
  const n = Array.from(text).length;
  const ok = n >= 38 && n <= 68;
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums border ${
        ok
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border-border bg-muted/40 text-muted-foreground'
      }`}
      title={ok ? 'Tamanho ideal para mobile (38–68 caracteres)' : 'Fora da faixa ideal de 38–68 caracteres'}
    >
      {n} car.
    </span>
  );
}

export function TitleRadarView({
  appPassword,
  addToast,
  selectedModel,
  channelContext,
  onSaveToTopicBank,
}: TitleRadarViewProps) {
  const [radar, setRadar] = useState<RadarVideo[]>([]);
  const [queue, setQueue] = useState<QueuedTitle[]>([]);
  const [adaptCache, setAdaptCache] = useState<Record<string, string>>({});
  const [cursors, setCursors] = useState<Record<string, number>>({});
  const [sheetState, setSheetState] = useState<SheetState>('checking');

  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<AdaptTone>('natural');
  const [activeTopic, setActiveTopic] = useState('');
  const [activeTone, setActiveTone] = useState<AdaptTone>('natural');
  const [adapting, setAdapting] = useState(false);

  const [view, setView] = useState<'radar' | 'queue'>('radar');
  const [niche, setNiche] = useState<RadarNiche | 'all'>('all');
  const [davids, setDavids] = useState(false);
  const [days, setDays] = useState<3 | 7 | 14 | 30>(7);
  const [sort, setSort] = useState<SortKey>('outlier');
  const [syncing, setSyncing] = useState<'niche' | 'all' | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [varOpen, setVarOpen] = useState<string | null>(null);
  const [varLoading, setVarLoading] = useState<string | null>(null);
  const [varData, setVarData] = useState<Record<string, { angle: string; title: string }[]>>({});
  const [originalOpen, setOriginalOpen] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptData, setScriptData] = useState<ScriptOutline | null>(null);
  const [scriptSource, setScriptSource] = useState('');

  // ---------------- Planilha ----------------
  const sheetCall = useCallback(
    async (payload: Record<string, any>): Promise<any> => {
      const res = await fetch('/api/topics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-app-password': appPassword },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (data.configured === false) return { configured: false };
      if (!res.ok || !data.ok) throw new Error(data.error || 'Falha na planilha');
      return data;
    },
    [appPassword]
  );

  const handleSheetError = (err: any) => {
    setSheetState(/unknown action/i.test(err?.message || '') ? 'outdated' : 'error');
  };

  useEffect(() => {
    const localRadar = readLS<RadarVideo[]>(LS_RADAR, []).map(normalizeRadar);
    const localQueue = readLS<QueuedTitle[]>(LS_QUEUE, []).map(normalizeQueue);
    setRadar(localRadar);
    setQueue(localQueue);
    setAdaptCache(readLS<Record<string, string>>(LS_ADAPT, {}));
    setCursors(readLS<Record<string, number>>(LS_CURSORS, {}));

    let cancelled = false;
    (async () => {
      try {
        const r = await sheetCall({ action: 'radarList' });
        if (r.configured === false) {
          if (!cancelled) setSheetState('local');
          return;
        }
        const q = await sheetCall({ action: 'queueList' });
        if (cancelled) return;

        const sheetRadar = (r.items || []).map(normalizeRadar);
        const mergedRadar = mergeRadar(localRadar, sheetRadar);
        setRadar(mergedRadar);
        writeLS(LS_RADAR, mergedRadar);
        const sheetIds = new Set(sheetRadar.map((v: RadarVideo) => v.id));
        const localOnly = mergedRadar.filter((v) => !sheetIds.has(v.id));
        if (localOnly.length) await sheetCall({ action: 'radarUpsert', items: localOnly });

        const dirty = new Set(readLS<string[]>(LS_QUEUE_DIRTY, []));
        const deleted = readLS<string[]>(LS_QUEUE_DELETED, []);
        const map = new Map<string, QueuedTitle>(
          (q.items || []).map((i: any) => {
            const n = normalizeQueue(i);
            return [n.id, n] as [string, QueuedTitle];
          })
        );
        localQueue.forEach((i) => dirty.has(i.id) && map.set(i.id, i));
        deleted.forEach((id) => map.delete(id));
        const mergedQueue = Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setQueue(mergedQueue);
        writeLS(LS_QUEUE, mergedQueue);

        const dirtyItems = mergedQueue.filter((i) => dirty.has(i.id));
        if (dirtyItems.length) await sheetCall({ action: 'queueUpsert', items: dirtyItems });
        writeLS(LS_QUEUE_DIRTY, []);
        for (const id of deleted) await sheetCall({ action: 'queueDelete', id });
        writeLS(LS_QUEUE_DELETED, []);
        if (!cancelled) setSheetState('synced');
      } catch (err) {
        if (!cancelled) handleSheetError(err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appPassword]);

  const persistQueue = (next: QueuedTitle[]) => {
    setQueue(next);
    writeLS(LS_QUEUE, next);
  };

  const pushQueueItems = async (items: QueuedTitle[]) => {
    const dirty = new Set(readLS<string[]>(LS_QUEUE_DIRTY, []));
    items.forEach((i) => dirty.add(i.id));
    writeLS(LS_QUEUE_DIRTY, Array.from(dirty));
    try {
      const r = await sheetCall({ action: 'queueUpsert', items });
      if (r.configured === false) return;
      const after = new Set(readLS<string[]>(LS_QUEUE_DIRTY, []));
      items.forEach((i) => after.delete(i.id));
      writeLS(LS_QUEUE_DIRTY, Array.from(after));
      setSheetState('synced');
    } catch (err) {
      handleSheetError(err);
    }
  };

  // ---------------- Lista filtrada ----------------
  const visible = useMemo(() => {
    const now = Date.now();
    const list = radar.filter((v) => {
      if (niche !== 'all' && v.niche !== niche) return false;
      if (davids && v.subscribers >= 100_000) return false;
      const t = new Date(v.publishedAt).getTime();
      return !t || now - t <= days * 86400000;
    });
    list.sort((a, b) => {
      if (sort === 'velocity') return b.viewsPerDay - a.viewsPerDay;
      if (sort === 'recent') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      return b.outlier - a.outlier;
    });
    return list;
  }, [radar, niche, davids, days, sort]);

  const shown = visible.slice(0, MAX_SHOWN);
  const missingAdapt = activeTopic ? shown.filter((v) => !adaptCache[cacheKey(v.id, activeTopic, activeTone)]) : [];

  const nicheCount = (key: RadarNiche | 'all') =>
    key === 'all' ? radar.length : radar.filter((v) => v.niche === key).length;

  // ---------------- Ações ----------------
  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      addToast('Não foi possível copiar.', 'error');
    }
  };

  const runAdapt = async (topicValue: string, toneValue: AdaptTone, items: RadarVideo[]) => {
    const t = topicValue.trim();
    if (!t) return;
    const missing = items.filter((v) => !adaptCache[cacheKey(v.id, t, toneValue)]).slice(0, MAX_ADAPT_PER_CALL);
    if (missing.length === 0) return;
    setAdapting(true);
    try {
      const res = await fetch('/api/titles/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-app-password': appPassword },
        body: JSON.stringify({
          mode: 'adapt',
          topic: t,
          tone: toneValue,
          model: selectedModel,
          items: missing.map((v) => ({ id: v.id, title: v.title, skeleton: v.skeleton })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao adaptar títulos.');
      const entries = Object.entries((data.adaptations || {}) as Record<string, string>);
      setAdaptCache((prev) => {
        const next = { ...prev };
        entries.forEach(([id, title]) => {
          next[cacheKey(id, t, toneValue)] = String(title);
        });
        const keys = Object.keys(next);
        const trimmed =
          keys.length > 2500 ? Object.fromEntries(keys.slice(-2000).map((k) => [k, next[k]])) : next;
        writeLS(LS_ADAPT, trimmed);
        return trimmed;
      });
      addToast(`${entries.length} títulos adaptados para "${t}". ${usageText(data.usage)}`, 'success');
    } catch (err: any) {
      addToast(err?.message || 'Erro ao adaptar títulos.', 'error');
    } finally {
      setAdapting(false);
    }
  };

  const handleSwap = () => {
    const t = topic.trim();
    if (!t) return;
    setActiveTopic(t);
    setActiveTone(tone);
    runAdapt(t, tone, shown);
  };

  const handleToneChange = (next: AdaptTone) => {
    setTone(next);
    if (activeTopic) {
      setActiveTone(next);
      runAdapt(activeTopic, next, shown);
    }
  };

  const clearTopic = () => {
    setTopic('');
    setActiveTopic('');
  };

  const syncRadar = async (scope: 'niche' | 'all') => {
    if (scope === 'niche' && niche === 'all') return;
    setSyncing(scope);
    try {
      const res = await fetch('/api/titles/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-app-password': appPassword },
        body: JSON.stringify({
          niche: scope === 'all' ? 'all' : niche,
          days,
          apiKey: localStorage.getItem('replytube_youtube_api_key') || undefined,
          cursors,
          knownIds: radar.filter((v) => v.skeleton).map((v) => v.id),
          model: selectedModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresApiKey) setKeyModalOpen(true);
        throw new Error(data.error || 'Falha ao atualizar o radar.');
      }
      const incoming: RadarVideo[] = (data.items || []).map(normalizeRadar);
      const merged = mergeRadar(radar, incoming);
      setRadar(merged);
      writeLS(LS_RADAR, merged);
      if (data.cursors) {
        setCursors(data.cursors);
        writeLS(LS_CURSORS, data.cursors);
      }
      const byId = new Map(merged.map((v) => [v.id, v]));
      const toSheet = incoming.map((v) => byId.get(v.id)).filter(Boolean);
      if (toSheet.length) {
        sheetCall({ action: 'radarUpsert', items: toSheet })
          .then((r) => r.configured !== false && setSheetState('synced'))
          .catch(handleSheetError);
      }
      addToast(
        `Radar atualizado: ${data.stats?.kept ?? 0} outliers (${data.stats?.newSkeletons ?? 0} novos) · ${
          data.quotaUsed ?? 0
        } pontos de cota do YouTube. ${usageText(data.usage)}`,
        'success'
      );
    } catch (err: any) {
      addToast(err?.message || 'Erro ao atualizar o radar.', 'error');
    } finally {
      setSyncing(null);
    }
  };

  const loadVariations = async (v: RadarVideo) => {
    const key = cacheKey(v.id, activeTopic, activeTone);
    if (varOpen === key) {
      setVarOpen(null);
      return;
    }
    setVarOpen(key);
    if (varData[key]) return;
    setVarLoading(key);
    try {
      const res = await fetch('/api/titles/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-app-password': appPassword },
        body: JSON.stringify({
          mode: 'variations',
          topic: activeTopic,
          tone: activeTone,
          model: selectedModel,
          items: [{ id: v.id, title: v.title, skeleton: v.skeleton }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar variações.');
      setVarData((prev) => ({ ...prev, [key]: data.variations || [] }));
    } catch (err: any) {
      addToast(err?.message || 'Erro ao gerar variações.', 'error');
      setVarOpen(null);
    } finally {
      setVarLoading(null);
    }
  };

  const saveToQueue = (v: RadarVideo | null, title: string, angle: string, extra?: Partial<QueuedTitle>) => {
    const clean = title.trim();
    if (!clean) return;
    if (queue.some((q) => q.title.trim().toLowerCase() === clean.toLowerCase())) {
      addToast('Esse título já está na Fila de Gravação.', 'info');
      return;
    }
    const item: QueuedTitle = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      title: clean,
      status: 'Para Gravar',
      topic: activeTopic,
      tone: activeTopic ? activeTone : '',
      angle,
      originalTitle: v?.title || '',
      videoId: v?.id || '',
      channelTitle: v?.channelTitle || '',
      ...extra,
    };
    persistQueue([item, ...queue]);
    pushQueueItems([item]);
    addToast('Título salvo na Fila de Gravação.', 'success');
  };

  const updateQueueItem = (id: string, patch: Partial<QueuedTitle>) => {
    const next = queue.map((q) => (q.id === id ? { ...q, ...patch } : q));
    persistQueue(next);
    const changed = next.find((q) => q.id === id);
    if (changed) pushQueueItems([changed]);
  };

  const deleteQueueItem = async (id: string) => {
    persistQueue(queue.filter((q) => q.id !== id));
    const deleted = new Set(readLS<string[]>(LS_QUEUE_DELETED, []));
    deleted.add(id);
    writeLS(LS_QUEUE_DELETED, Array.from(deleted));
    try {
      const r = await sheetCall({ action: 'queueDelete', id });
      if (r.configured === false) return;
      const after = new Set(readLS<string[]>(LS_QUEUE_DELETED, []));
      after.delete(id);
      writeLS(LS_QUEUE_DELETED, Array.from(after));
    } catch (err) {
      handleSheetError(err);
    }
  };

  const copyQueueList = () => {
    const pending = queue.filter((q) => q.status === 'Para Gravar');
    const list = (pending.length ? pending : queue).map((q, i) => `${i + 1}. ${q.title}`).join('\n');
    if (list) copyText(list, 'queue-all');
  };

  const openScript = async (title: string, originalTitle: string, hook: string) => {
    setScriptSource(title);
    setScriptOpen(true);
    setScriptData(null);
    setScriptLoading(true);
    try {
      const res = await fetch('/api/insights/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-app-password': appPassword },
        body: JSON.stringify({
          title,
          premise: originalTitle
            ? `Título inspirado no vídeo outlier em inglês "${originalTitle}".${hook ? ` Por que o gancho funciona: ${hook}` : ''}`
            : undefined,
          channelContext: channelContext || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.script) throw new Error(data.error || 'Falha ao gerar roteiro.');
      setScriptData(data.script);
    } catch (err: any) {
      addToast(err?.message || 'Erro ao gerar roteiro.', 'error');
      setScriptOpen(false);
    } finally {
      setScriptLoading(false);
    }
  };

  const sheetBadge = {
    checking: { text: 'Conectando à planilha…', cls: 'text-muted-foreground border-border' },
    synced: { text: '☁️ Salvo na Planilha Google', cls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    local: { text: '💾 Só neste navegador (planilha não configurada)', cls: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    outdated: {
      text: '⚠️ Atualize o Apps Script da planilha (nova versão) para salvar os Títulos',
      cls: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
    },
    error: { text: '⚠️ Planilha indisponível agora — salvo no navegador e reenviado depois', cls: 'text-red-300 border-red-500/30 bg-red-500/10' },
  }[sheetState];

  const queuePending = queue.filter((q) => q.status === 'Para Gravar').length;

  // ---------------- Render ----------------
  return (
    <div className="space-y-4">
      {/* Barra mestre fixa */}
      <div className="sticky top-16 z-20 rounded-xl border border-sky-500/30 bg-card/95 backdrop-blur p-3 shadow-sm space-y-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Wand2 className="h-4 w-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSwap()}
              placeholder="Seu assunto (ex.: manutenção de carro popular, energia solar off-grid...)"
              className="w-full rounded-lg border border-input bg-background pl-9 pr-8 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            {(topic || activeTopic) && (
              <button
                type="button"
                onClick={clearTopic}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                title="Limpar assunto e voltar às fórmulas"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            value={tone}
            onChange={(e) => handleToneChange(e.target.value as AdaptTone)}
            className="rounded-lg border border-input bg-background px-2.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500"
            title="Tom da adaptação"
          >
            {TONES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSwap}
            disabled={!topic.trim() || adapting || shown.length === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {adapting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Trocar Assunto
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {activeTopic ? (
            <span className="text-sky-300">
              Adaptando para <strong>&ldquo;{activeTopic}&rdquo;</strong> · tom{' '}
              {TONES.find((t) => t.key === activeTone)?.label}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Sem assunto: mostrando as fórmulas puras com <span className="text-sky-300">[ASSUNTO]</span>.
            </span>
          )}
          {activeTopic && missingAdapt.length > 0 && !adapting && (
            <button
              type="button"
              onClick={() => runAdapt(activeTopic, activeTone, shown)}
              className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-medium text-sky-300 hover:bg-sky-500/20"
            >
              Adaptar {Math.min(missingAdapt.length, MAX_ADAPT_PER_CALL)} restantes
            </button>
          )}
          <span className={`ml-auto rounded-md border px-2 py-0.5 ${sheetBadge.cls}`}>{sheetBadge.text}</span>
        </div>
      </div>

      {/* Abas + filtros */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setView('radar')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              view === 'radar' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' : 'text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            <Radar className="h-3.5 w-3.5" /> Radar de Explosões ({visible.length})
          </button>
          <button
            type="button"
            onClick={() => setView('queue')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              view === 'queue' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' : 'text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            <ListChecks className="h-3.5 w-3.5" /> Fila de Gravação ({queuePending})
          </button>

          {view === 'radar' && (
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => syncRadar('niche')}
                disabled={niche === 'all' || syncing !== null}
                title={niche === 'all' ? 'Escolha um nicho para atualizar só ele' : 'Busca 2 sementes do nicho atual'}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                {syncing === 'niche' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Atualizar nicho <span className="text-muted-foreground">(~200 cota)</span>
              </button>
              <button
                type="button"
                onClick={() => syncRadar('all')}
                disabled={syncing !== null}
                className="inline-flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 disabled:opacity-50"
              >
                {syncing === 'all' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Atualizar os 7 nichos <span className="opacity-70">(~700 cota)</span>
              </button>
            </div>
          )}
        </div>

        {view === 'radar' && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {[{ key: 'all' as const, label: 'Todos' }, ...RADAR_NICHES].map((n) => (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => setNiche(n.key)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    niche === n.key
                      ? 'border-sky-500/50 bg-sky-500/15 text-sky-300'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {n.label} <span className="opacity-60">{nicheCount(n.key)}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDavids((d) => !d)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-medium transition ${
                  davids
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
                title="Só canais com menos de 100 mil inscritos"
              >
                <Zap className="h-3.5 w-3.5" /> Davids vs Golias (&lt; 100k insc.)
              </button>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value) as 3 | 7 | 14 | 30)}
                className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground"
                title="Janela de tempo (também usada na próxima atualização)"
              >
                <option value={3}>Últimos 3 dias</option>
                <option value={7}>Últimos 7 dias</option>
                <option value={14}>Últimos 14 dias</option>
                <option value={30}>Últimos 30 dias</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground"
              >
                <option value="outlier">Maior Explosão (Views ÷ Inscritos)</option>
                <option value="velocity">Maior Velocidade (Views / Dia)</option>
                <option value="recent">Mais Recentes</option>
              </select>
              {visible.length > MAX_SHOWN && (
                <span className="text-muted-foreground">
                  Mostrando {MAX_SHOWN} de {visible.length}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Conteúdo */}
      {view === 'radar' ? (
        radar.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center space-y-3">
            <Radar className="mx-auto h-8 w-8 text-sky-400" />
            <p className="text-sm font-semibold text-foreground">Radar vazio</p>
            <p className="mx-auto max-w-md text-xs text-muted-foreground">
              Só dados reais: clique em <strong>Atualizar os 7 nichos</strong> (~700 pontos de cota do YouTube) ou escolha
              um nicho e atualize só ele (~200). Tudo fica salvo na planilha e você navega o dia todo sem gastar cota.
            </p>
            <button
              type="button"
              onClick={() => syncRadar('all')}
              disabled={syncing !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Primeira sincronização
            </button>
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            Nenhum título com esses filtros. Aumente a janela de tempo, desligue o Davids vs Golias ou atualize o nicho.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {shown.map((v) => {
              const key = cacheKey(v.id, activeTopic, activeTone);
              const adapted = activeTopic ? adaptCache[key] : '';
              const mainText = adapted || v.skeleton || v.title;
              const isOriginalOpen = originalOpen === v.id;
              return (
                <div key={v.id} className="p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start">
                    {/* Nota de explosão */}
                    <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-0.5 md:w-28 shrink-0 tabular-nums">
                      <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-xs font-bold text-sky-300">
                        {v.outlier.toLocaleString('pt-BR')}x outlier
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {compact(v.views)} views · {ageLabel(v.publishedAt)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{compact(v.subscribers)} insc.</span>
                    </div>

                    {/* O ouro */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => copyText(mainText, `main-${v.id}`)}
                          className="text-left text-sm font-semibold leading-snug text-foreground hover:text-sky-300 transition"
                          title="Clique para copiar"
                        >
                          {adapted ? adapted : v.skeleton ? <SkeletonText text={v.skeleton} /> : v.title}
                        </button>
                        {adapted && <CharPill text={adapted} />}
                        {activeTopic && !adapted && adapting && (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        <span className="mr-1 rounded bg-muted px-1 font-semibold">EN</span>
                        {v.title}
                        {v.trigger && (
                          <span className="ml-1.5 rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-medium text-purple-300">
                            {v.trigger}
                          </span>
                        )}
                        <span className="ml-1.5">
                          · {v.channelTitle} · {compact(v.viewsPerDay)} views/dia
                        </span>
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap items-center gap-1 shrink-0 md:justify-end">
                      <button
                        type="button"
                        onClick={() => copyText(mainText, `main-${v.id}`)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted"
                      >
                        {copiedKey === `main-${v.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        Copiar
                      </button>
                      <button
                        type="button"
                        onClick={() => loadVariations(v)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted"
                      >
                        {varLoading === key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-sky-400" />}
                        +5 Variações
                      </button>
                      <button
                        type="button"
                        onClick={() => saveToQueue(v, mainText, 'Principal')}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted"
                      >
                        <Bookmark className="h-3 w-3 text-amber-400" /> Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => openScript(mainText, v.title, v.hook)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted"
                        title="Gerar roteiro com este título"
                      >
                        <FileText className="h-3 w-3 text-emerald-400" /> Roteiro
                      </button>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOriginalOpen(isOriginalOpen ? null : v.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted"
                        >
                          Original <ExternalLink className="h-3 w-3" />
                        </button>
                        {isOriginalOpen && (
                          <div className="absolute right-0 top-8 z-30 w-72 rounded-xl border border-border bg-card p-3 shadow-xl space-y-2">
                            {v.thumbnailUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={v.thumbnailUrl} alt="" className="w-full rounded-md border border-border" />
                            )}
                            {v.hook && (
                              <p className="text-[11px] text-foreground/90 leading-snug">
                                <Lightbulb className="mr-1 inline h-3 w-3 text-amber-400" />
                                {v.hook}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              {durationLabel(v.durationSec)} · {v.channelTitle} · {compact(v.views)} views
                            </p>
                            <a
                              href={`https://www.youtube.com/watch?v=${v.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-300 hover:underline"
                            >
                              Abrir no YouTube <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gaveta de variações */}
                  {varOpen === key && (
                    <div className="mt-2 ml-0 md:ml-[7.75rem] rounded-lg border border-sky-500/20 bg-sky-500/5 p-2 space-y-1.5">
                      {varLoading === key ? (
                        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" /> Gerando 5 ângulos…
                        </p>
                      ) : (
                        (varData[key] || []).map((vr, i) => (
                          <div key={i} className="flex flex-wrap items-center gap-2">
                            <span className="w-40 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                              {vr.angle}
                            </span>
                            <span className="min-w-0 flex-1 text-xs text-foreground">
                              {vr.title.includes('[ASSUNTO]') ? <SkeletonText text={vr.title} /> : vr.title}
                            </span>
                            <CharPill text={vr.title} />
                            <button
                              type="button"
                              onClick={() => copyText(vr.title, `var-${key}-${i}`)}
                              className="rounded p-1 text-muted-foreground hover:text-foreground"
                              title="Copiar"
                            >
                              {copiedKey === `var-${key}-${i}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => saveToQueue(v, vr.title, vr.angle)}
                              className="rounded p-1 text-muted-foreground hover:text-amber-400"
                              title="Salvar na Fila"
                            >
                              <Bookmark className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Fila de gravação */
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-3">
            <p className="text-xs text-muted-foreground">
              Clique no título para editar. {queuePending} para gravar · {queue.length - queuePending} já gravado(s).
            </p>
            <button
              type="button"
              onClick={copyQueueList}
              disabled={queue.length === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 disabled:opacity-50"
            >
              {copiedKey === 'queue-all' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copiar Lista Pronta
            </button>
          </div>
          {queue.length === 0 ? (
            <p className="p-8 text-center text-xs text-muted-foreground">
              Nenhum título salvo ainda. Use <strong>Salvar</strong> no Radar.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {queue.map((q) => (
                <div key={q.id} className="flex flex-col gap-2 p-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {editingId === q.id ? (
                      <input
                        autoFocus
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => {
                          if (editingText.trim() && editingText.trim() !== q.title) {
                            updateQueueItem(q.id, { title: editingText.trim() });
                          }
                          setEditingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full rounded border border-sky-500 bg-background px-2 py-1 text-sm text-foreground"
                      />
                    ) : (
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(q.id);
                            setEditingText(q.title);
                          }}
                          className={`text-left text-sm font-semibold leading-snug hover:text-sky-300 ${
                            q.status === 'Já Gravado' ? 'text-muted-foreground line-through' : 'text-foreground'
                          }`}
                          title="Clique para editar"
                        >
                          {q.title.includes('[ASSUNTO]') ? <SkeletonText text={q.title} /> : q.title}
                        </button>
                        <CharPill text={q.title} />
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {[q.angle, q.topic && `assunto: ${q.topic}`, q.originalTitle && `EN: ${q.originalTitle}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateQueueItem(q.id, { status: q.status === 'Para Gravar' ? 'Já Gravado' : 'Para Gravar' })
                      }
                      className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                        q.status === 'Para Gravar'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      }`}
                      title="Alternar status"
                    >
                      {q.status}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(q.title, `q-${q.id}`)}
                      className="rounded-md border border-border bg-background p-1.5 hover:bg-muted"
                      title="Copiar"
                    >
                      {copiedKey === `q-${q.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openScript(q.title, q.originalTitle, '')}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted"
                    >
                      <FileText className="h-3 w-3 text-emerald-400" /> Roteiro
                    </button>
                    <button
                      type="button"
                      onClick={() => onSaveToTopicBank(q.title, q.originalTitle)}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium hover:bg-muted"
                      title="Enviar para o Banco de Temas do canal selecionado"
                    >
                      <Lightbulb className="h-3 w-3 text-amber-400" /> Banco de Temas
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQueueItem(q.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <YouTubeApiKeyModal
        isOpen={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        onSaved={() => {
          setKeyModalOpen(false);
          addToast('Chave salva. Clique em Atualizar de novo.', 'success');
        }}
      />
      <ScriptModal
        isOpen={scriptOpen}
        onClose={() => setScriptOpen(false)}
        script={scriptData}
        loading={scriptLoading}
        sourceTitle={scriptSource}
      />
    </div>
  );
}
