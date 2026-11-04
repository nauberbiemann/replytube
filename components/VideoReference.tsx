'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Film, Lock, Unlock, Loader2, X, History, Link2, Search, Plus } from 'lucide-react';
import { LockedVideo } from '@/lib/types';

interface VideoReferenceProps {
  lockedVideo: LockedVideo | null;
  recentVideos: LockedVideo[];
  onLock: (video: Omit<LockedVideo, 'usedAt' | 'channelId'>) => void;
  onUnlock: () => void;
  onRemoveRecent: (id: string) => void;
  appPassword: string;
  disabled?: boolean;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const looksLikeUrl = (s: string) =>
  /(?:https?:\/\/)?(?:[\w-]+\.)?(?:youtube\.com|youtu\.be)\//i.test(s.trim());

const stripAccents = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// Ignora acentos e pontos separadores de milhar (ex: "10000" encontra "10.000")
const normalizeSearch = (s: string) => stripAccents(s).replace(/(\d)\.(?=\d)/g, '$1');

function highlightMatches(title: string, rawQuery: string): React.ReactNode {
  const terms = stripAccents(rawQuery)
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (terms.length === 0) return title;

  const normTitle = stripAccents(title);
  if (normTitle.length !== title.length) return title;

  const ranges: Array<[number, number]> = [];
  for (const term of terms) {
    let idx = normTitle.indexOf(term);
    while (idx !== -1) {
      ranges.push([idx, idx + term.length]);
      idx = normTitle.indexOf(term, idx + term.length);
    }
  }
  if (ranges.length === 0) return title;

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [start, end] of ranges) {
    if (merged.length > 0 && start <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
    } else {
      merged.push([start, end]);
    }
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  merged.forEach(([start, end], i) => {
    if (start > cursor) parts.push(title.slice(cursor, start));
    parts.push(
      <mark
        key={i}
        className="rounded-sm bg-amber-500/25 px-0.5 font-semibold text-amber-200"
      >
        {title.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < title.length) parts.push(title.slice(cursor));
  return parts;
}

export function VideoReference({
  lockedVideo,
  recentVideos,
  onLock,
  onUnlock,
  onRemoveRecent,
  appPassword,
  disabled = false,
  addToast,
}: VideoReferenceProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const availableVideos = useMemo(
    () => recentVideos.filter((v) => v.id !== lockedVideo?.id),
    [recentVideos, lockedVideo?.id]
  );

  const trimmed = input.trim();
  const isUrl = looksLikeUrl(trimmed);
  const isFiltering = trimmed.length > 0 && !isUrl;

  const filteredVideos = useMemo(() => {
    if (!isFiltering) return availableVideos;
    const tokens = normalizeSearch(trimmed).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return availableVideos;
    return availableVideos.filter((v) => {
      const hay = normalizeSearch(v.title);
      return tokens.every((tk) => hay.includes(tk));
    });
  }, [availableVideos, isFiltering, trimmed]);

  useEffect(() => {
    setActiveIndex(0);
  }, [trimmed]);

  useEffect(() => {
    if (showRecent) {
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [showRecent]);

  const selectSavedVideo = (v: LockedVideo) => {
    onLock({
      id: v.id,
      title: v.title,
      description: v.description,
      url: v.url,
      thumbnailUrl: v.thumbnailUrl,
    });
    setInput('');
    setShowRecent(false);
  };

  const lockManualTitle = (rawTitle: string) => {
    const clean = rawTitle.trim();
    if (!clean) return;
    onLock({ id: `t:${clean.toLowerCase()}`, title: clean });
    setInput('');
    setShowRecent(false);
  };

  const handleLock = async () => {
    if (!trimmed || loading) return;

    if (!isUrl) {
      if (filteredVideos.length > 0) {
        const chosen = filteredVideos[Math.min(activeIndex, filteredVideos.length - 1)];
        selectSavedVideo(chosen);
        return;
      }
      lockManualTitle(trimmed);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-app-password': appPassword },
        body: JSON.stringify({
          videoUrl: trimmed,
          apiKey: localStorage.getItem('replytube_youtube_api_key') || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao buscar o vídeo.');
      onLock({
        id: data.videoId,
        title: data.title,
        description: data.description,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
      });
      setInput('');
      setShowRecent(false);
    } catch (err: any) {
      addToast(
        `${err?.message || 'Erro ao buscar vídeo.'} Você pode digitar o título manualmente.`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && isFiltering && filteredVideos.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredVideos.length);
      return;
    }
    if (e.key === 'ArrowUp' && isFiltering && filteredVideos.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredVideos.length) % filteredVideos.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLock();
      return;
    }
    if (e.key === 'Escape') {
      if (input) {
        e.preventDefault();
        setInput('');
      } else if (showRecent) {
        setShowRecent(false);
      }
    }
  };

  const hasExactSavedMatch =
    isFiltering &&
    filteredVideos.some((v) => stripAccents(v.title.trim()) === stripAccents(trimmed));

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-semibold tracking-tight">Vídeo das respostas</h2>
        </div>
        {lockedVideo ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/20">
            <Lock className="h-3 w-3" /> Travado
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">Destravado</span>
        )}
      </div>

      {lockedVideo ? (
        <div className="space-y-2">
          <div className="flex gap-2.5">
            {lockedVideo.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lockedVideo.thumbnailUrl}
                alt=""
                className="h-12 w-20 rounded-md object-cover border border-border shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-snug">
                {lockedVideo.title}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {lockedVideo.description
                  ? '✓ Descrição do vídeo usada como contexto'
                  : 'Só o título (cole o link para trazer a descrição)'}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setShowRecent((v) => !v)}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              <History className="h-3.5 w-3.5" /> Trocar vídeo
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setInput('');
                setShowRecent(false);
                onUnlock();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              <Unlock className="h-3.5 w-3.5" /> Destravar
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Destravado: o app lê o título do vídeo ao lado de cada comentário no print. Para responder
          um vídeo por vez (mais preciso), cole o link ou pesquise pelo título salvo abaixo.
        </p>
      )}

      {(!lockedVideo || showRecent) && (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              {isFiltering ? (
                <Search className="h-3.5 w-3.5 text-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              ) : (
                <Link2 className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={input}
                disabled={disabled || loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  availableVideos.length > 0
                    ? 'Cole o link ou digite parte do título salvo...'
                    : 'Link do vídeo (ou digite o título)'
                }
                className="w-full rounded-lg border border-input bg-background pl-8 pr-7 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
              />
              {input && !loading && (
                <button
                  type="button"
                  onClick={() => {
                    setInput('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  title="Limpar busca"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleLock}
              disabled={!trimmed || disabled || loading}
              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 shrink-0"
              title={
                isFiltering && filteredVideos.length > 0
                  ? 'Travar o vídeo filtrado em destaque (Enter)'
                  : 'Travar vídeo'
              }
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              Travar
            </button>
          </div>

          {availableVideos.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {isFiltering
                    ? `Filtrados (${filteredVideos.length} de ${availableVideos.length})`
                    : `Vídeos salvos (${availableVideos.length})`}
                </p>
                {isFiltering && filteredVideos.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">↑↓ · Enter seleciona</span>
                )}
              </div>

              {filteredVideos.length > 0 ? (
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {filteredVideos.map((v, idx) => {
                    const isHighlighted =
                      isFiltering && idx === Math.min(activeIndex, filteredVideos.length - 1);
                    return (
                      <div key={v.id} className="group flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={disabled}
                          onMouseEnter={() => isFiltering && setActiveIndex(idx)}
                          onClick={() => selectSavedVideo(v)}
                          className={`flex-1 text-left rounded-md border px-2 py-1.5 text-[11px] text-foreground transition disabled:opacity-50 ${
                            isFiltering ? 'line-clamp-2 leading-snug' : 'truncate'
                          } ${
                            isHighlighted
                              ? 'border-red-500/60 bg-red-500/10'
                              : 'border-border/60 bg-muted/20 hover:border-red-500/40 hover:bg-muted'
                          }`}
                          title={v.title}
                        >
                          <span>🎬 {isFiltering ? highlightMatches(v.title, trimmed) : v.title}</span>
                          {v.description && isFiltering && (
                            <span className="ml-1.5 inline-block rounded bg-emerald-500/15 px-1 py-0.2 text-[9px] font-medium text-emerald-400">
                              ✓ link/desc
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveRecent(v.id)}
                          className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 shrink-0"
                          title="Remover da lista"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 px-3 py-2 text-[11px] text-muted-foreground">
                  Nenhum vídeo salvo contém <span className="font-medium text-foreground">&ldquo;{trimmed}&rdquo;</span>.
                  Cole o link do YouTube ou clique em <strong>Travar</strong> para usar este texto como título.
                </div>
              )}

              {isFiltering && filteredVideos.length > 0 && !hasExactSavedMatch && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => lockManualTitle(trimmed)}
                  className="w-full flex items-center gap-1.5 rounded-md border border-dashed border-border/60 px-2 py-1 text-left text-[10px] text-muted-foreground hover:border-border hover:text-foreground transition"
                >
                  <Plus className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    Usar <strong>&ldquo;{trimmed}&rdquo;</strong> como novo título (sem link)
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
