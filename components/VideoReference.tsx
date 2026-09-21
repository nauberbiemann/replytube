'use client';

import React, { useRef } from 'react';
import { Film, Upload, X } from 'lucide-react';

interface VideoReferenceProps {
  title: string;
  onTitleChange: (val: string) => void;
  image: string;
  onImageChange: (dataUrl: string) => void;
  disabled?: boolean;
}

export function VideoReference({
  title,
  onTitleChange,
  image,
  onImageChange,
  disabled = false,
}: VideoReferenceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileChange(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    const items = Array.from(e.clipboardData.items);
    const item = items.find((it) => it.type.startsWith('image/'));
    if (item) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) handleFileChange(file);
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2 pb-1 border-b border-border/40">
        <Film className="h-4 w-4 text-red-500" />
        <h2 className="text-sm font-semibold tracking-tight">Vídeo de referência</h2>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="video-title" className="text-xs font-medium text-muted-foreground">
          Título / tema do vídeo
        </label>
        <textarea
          id="video-title"
          rows={2}
          disabled={disabled}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ex.: Por que nenhum avião americano consegue substituir o Embraer — análise do mercado regional..."
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Print do vídeo (opcional)
        </label>
        <div
          tabIndex={0}
          onPaste={handlePaste}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !image && !disabled && fileInputRef.current?.click()}
          className="group relative flex min-h-[70px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border/80 p-2 text-center transition hover:border-red-500/50 hover:bg-muted/20 focus:border-red-500 focus:outline-none"
        >
          {image ? (
            <div className="relative max-h-28 w-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="Vídeo referência"
                className="max-h-24 rounded-md object-contain border border-border"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageChange('');
                }}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-muted-foreground shadow hover:bg-background hover:text-foreground"
                title="Remover imagem"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="pointer-events-none flex flex-col items-center gap-1 py-1 text-xs text-muted-foreground">
              <Upload className="h-4 w-4 text-muted-foreground/80 group-hover:text-red-500 transition" />
              <span>Clique ou cole aqui o print do vídeo</span>
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

      <p className="text-[11px] text-muted-foreground">
        As respostas serão escritas considerando o assunto deste vídeo.
      </p>
    </div>
  );
}
