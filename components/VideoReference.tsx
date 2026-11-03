'use client';

import React, { useState } from 'react';
import { Film, Lock, Unlock, Loader2, X, History, Link2 } from 'lucide-react';
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

const looksLikeUrl = (s: string) => /youtu\.?be|youtube\.com|^[a-zA-Z0-9_-]{11}$/.test(s.trim());

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

  const handleLock = async () => {
    const value = input.trim();
    if (!value || loading) return;

    if (!looksLikeUrl(value)) {
      onLock({ id: `t:${value.toLowerCase()}`, title: value });
      setInput('');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-app-password': appPassword },
        body: JSON.stringify({
          videoUrl: value,
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
    } catch (err: any) {
      addToast(`${err?.message || 'Erro ao buscar vídeo.'} Você pode digitar o título manualmente.`, 'error');
    } finally {
      setLoading(false);
    }
  };

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
              <img src={lockedVideo.thumbnailUrl} alt="" className="h-12 w-20 rounded-md object-cover border border-border shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-snug">{lockedVideo.title}</p>
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
              onClick={onUnlock}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              <Unlock className="h-3.5 w-3.5" /> Destravar
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Destravado: o app lê o título do vídeo ao lado de cada comentário no print. Para responder um vídeo
          por vez (mais preciso), cole o link abaixo e trave.
        </p>
      )}

      {(!lockedVideo || showRecent) && (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={input}
                disabled={disabled || loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLock()}
                placeholder="Link do vídeo (ou digite o título)"
                className="w-full rounded-lg border border-input bg-background pl-8 pr-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              onClick={handleLock}
              disabled={!input.trim() || disabled || loading}
              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
              Travar
            </button>
          </div>

          {recentVideos.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recentes</p>
              <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                {recentVideos
                  .filter((v) => v.id !== lockedVideo?.id)
                  .map((v) => (
                    <div key={v.id} className="group flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          onLock({ id: v.id, title: v.title, description: v.description, url: v.url, thumbnailUrl: v.thumbnailUrl });
                          setShowRecent(false);
                        }}
                        className="flex-1 text-left truncate rounded-md border border-border/60 bg-muted/20 px-2 py-1 text-[11px] text-foreground hover:border-red-500/40 hover:bg-muted disabled:opacity-50"
                        title={v.title}
                      >
                        🎬 {v.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveRecent(v.id)}
                        className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400"
                        title="Remover da lista"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
