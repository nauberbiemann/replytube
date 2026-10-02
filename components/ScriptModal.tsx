'use client';

import React, { useState } from 'react';
import { ScriptOutline } from '@/lib/types';
import {
  FileText,
  Copy,
  Check,
  Download,
  X,
  Sparkles,
  Flame,
  Clapperboard,
  Image,
  Clock,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

interface ScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: ScriptOutline | null;
  loading: boolean;
  sourceTitle?: string;
}

export function ScriptModal({
  isOpen,
  onClose,
  script,
  loading,
  sourceTitle,
}: ScriptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = (s: ScriptOutline): string => {
    return `# 🎬 Roteiro de Vídeo: ${s.title}

## 🖼️ Ideia de Thumbnail
${s.thumbnailIdea}

---

## 🪝 Gancho Inicial (0 a 15 segundos)
${s.hook}

---

## ⏳ Promessa de Retenção (15 a 45 segundos)
${s.retentionPromise}

---

## 📑 Desenvolvimento do Conteúdo
${s.mainPoints
  .map(
    (point, idx) => `### Bloco ${idx + 1}: ${point.title}
${point.content}
${point.keyQuoteOrExample ? `> **Destaque/Exemplo:** ${point.keyQuoteOrExample}` : ''}
`
  )
  .join('\n')}

---

## ⚡ Clímax & Revelação
${s.climax}

---

## 🎯 Chamada para Ação (CTA)
${s.cta}
`;
  };

  const handleCopy = async () => {
    if (!script) return;
    const text = generateMarkdown(script);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!script) return;
    const text = generateMarkdown(script);
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `roteiro-${script.title.slice(0, 30).toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Clapperboard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Roteirizador Instantâneo</h2>
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  IA gpt-4o-mini
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-md">
                {sourceTitle ? `Baseado em: "${sourceTitle}"` : 'Estrutura estratégica de alta retenção'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {script && !loading && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
                  title="Copiar Roteiro Formatado"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Copiar
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm"
                  title="Baixar em Markdown (.md)"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar .md
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-purple-500/20 border-t-purple-600 animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-purple-500 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Escrevendo roteiro magnético...
                </p>
                <p className="text-xs text-muted-foreground">
                  Estruturando gancho, gatilhos de retenção e blocos de conteúdo com gpt-4o-mini
                </p>
              </div>
            </div>
          ) : script ? (
            <div className="space-y-6">
              {/* Título e Thumbnail Card */}
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  <Flame className="h-4 w-4" /> Título Recomendado para Alto CTR
                </div>
                <h3 className="text-lg font-black text-foreground tracking-tight">
                  {script.title}
                </h3>

                <div className="pt-2 border-t border-purple-500/10">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                    <Image className="h-3.5 w-3.5 text-purple-500" /> Conceito de Capa (Thumbnail):
                  </div>
                  <p className="text-xs text-foreground bg-card/60 p-2.5 rounded-lg border border-border leading-relaxed">
                    {script.thumbnailIdea}
                  </p>
                </div>
              </div>

              {/* Gancho & Promessa */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Clock className="h-3.5 w-3.5" /> Gancho Inicial (0 a 15s)
                  </div>
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line italic">
                    "{script.hook}"
                  </p>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <Sparkles className="h-3.5 w-3.5" /> Promessa de Retenção (15 a 45s)
                  </div>
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line italic">
                    "{script.retentionPromise}"
                  </p>
                </div>
              </div>

              {/* Blocos de Conteúdo */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-purple-500" /> Desenvolvimento do Vídeo
                </h4>
                <div className="space-y-3">
                  {script.mainPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/10 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                          {idx + 1}
                        </span>
                        <h5 className="text-xs font-bold text-foreground">
                          {point.title}
                        </h5>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed pl-7 whitespace-pre-line">
                        {point.content}
                      </p>
                      {point.keyQuoteOrExample && (
                        <div className="ml-7 rounded-lg border border-border bg-muted/40 p-2.5 text-[11px] text-foreground italic">
                          💡 <strong>Destaque / Exemplo:</strong> {point.keyQuoteOrExample}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Clímax & CTA */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Flame className="h-3.5 w-3.5" /> Clímax & Revelação
                  </div>
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                    {script.climax}
                  </p>
                </div>

                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                    <MessageSquare className="h-3.5 w-3.5" /> Chamada para Ação (CTA)
                  </div>
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                    {script.cta}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-muted-foreground">
              Nenhum roteiro gerado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
