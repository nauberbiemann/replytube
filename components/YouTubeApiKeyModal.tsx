'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, ExternalLink, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

interface YouTubeApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (key: string) => void;
}

export function YouTubeApiKeyModal({ isOpen, onClose, onSaved }: YouTubeApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('replytube_youtube_api_key') || '';
      setApiKey(stored);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      localStorage.setItem('replytube_youtube_api_key', trimmed);
    } else {
      localStorage.removeItem('replytube_youtube_api_key');
    }
    setSavedSuccess(true);
    setTimeout(() => {
      onSaved(trimmed);
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('replytube_youtube_api_key');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Chave da YouTube Data API v3</h2>
              <p className="text-xs text-muted-foreground">Para buscar comentários de qualquer vídeo automaticamente</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-muted-foreground">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-2 text-foreground">
            <p className="font-semibold text-blue-500 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> 100% Gratuito pela Google Cloud:
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              O Google disponibiliza uma cota gratuita diária de <strong>10.000 unidades</strong> (permite analisar cerca de 100 vídeos com 100 comentários por dia sem nenhum custo).
            </p>
            <a
              href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ativar YouTube Data API v3 no Google Cloud <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Cole sua Chave de API do YouTube:
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ex: AIzaSyD..."
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Sua chave fica salva apenas no seu próprio navegador (localStorage).
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          {apiKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-red-500 hover:underline"
            >
              Remover chave
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={savedSuccess}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white transition shadow-sm"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4" /> Salvo!
                </>
              ) : (
                'Salvar Chave'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
