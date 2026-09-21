'use client';

import React, { useRef, useEffect } from 'react';
import {
  MessageSquarePlus,
  Upload,
  Send,
  Loader2,
  X,
  StopCircle,
} from 'lucide-react';

interface CommentUploaderProps {
  image: string;
  onImageChange: (dataUrl: string) => void;
  fallbackText: string;
  onFallbackTextChange: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
  onCancel: () => void;
  ocrFailed?: boolean;
}

export function CommentUploader({
  image,
  onImageChange,
  fallbackText,
  onFallbackTextChange,
  onSubmit,
  loading,
  disabled,
  onCancel,
  ocrFailed,
}: CommentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fallbackTextRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ocrFailed && fallbackTextRef.current) {
      fallbackTextRef.current.focus();
    }
  }, [ocrFailed]);

  const handleFileChange = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImageChange(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (loading || disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileChange(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (loading || disabled) return;
    const items = Array.from(e.clipboardData.items);
    const item = items.find((it) => it.type.startsWith('image/'));
    if (item) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) handleFileChange(file);
    }
  };

  const canSubmit = !loading && !disabled && (Boolean(image) || fallbackText.trim().length > 0);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2 pb-1 border-b border-border/40">
        <MessageSquarePlus className="h-4 w-4 text-red-500" />
        <h2 className="text-sm font-semibold tracking-tight">Novo comentário</h2>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Print do comentário
        </label>
        <div
          tabIndex={0}
          onPaste={handlePaste}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !image && !loading && fileInputRef.current?.click()}
          className="group relative flex min-h-[90px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border/80 p-3 text-center transition hover:border-red-500/50 hover:bg-muted/20 focus:border-red-500 focus:outline-none"
        >
          {image ? (
            <div className="relative max-h-36 w-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="Comentário"
                className="max-h-32 rounded-md object-contain border border-border"
              />
              {!loading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageChange('');
                  }}
                  className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-muted-foreground shadow hover:bg-background hover:text-foreground"
                  title="Remover print"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="pointer-events-none flex flex-col items-center gap-1.5 py-2 text-xs text-muted-foreground">
              <Upload className="h-5 w-5 text-muted-foreground/80 group-hover:text-red-500 transition" />
              <span className="font-medium text-foreground/80">
                Clique, arraste ou cole (Ctrl+V) uma imagem
              </span>
              <span className="text-[10px] text-muted-foreground">
                Cole direto de qualquer ponto da tela
              </span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="fallback-text" className="text-xs font-medium text-muted-foreground">
          Texto do comentário (opcional — use se o OCR falhar)
        </label>
        <textarea
          ref={fallbackTextRef}
          id="fallback-text"
          rows={2}
          value={fallbackText}
          onChange={(e) => onFallbackTextChange(e.target.value)}
          placeholder="Cole aqui o texto do comentário caso a leitura da imagem falhe..."
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Lendo print & Gerando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Gerar Resposta
            </>
          )}
        </button>

        {loading && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-muted transition"
            title="Cancelar geração"
          >
            <StopCircle className="h-4 w-4" />
            Cancelar
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        {disabled
          ? '⚠️ Selecione e ative um canal antes de gerar respostas.'
          : 'Dica: Você pode dar Ctrl+V em qualquer lugar da tela com o print copiado.'}
      </p>
    </div>
  );
}
