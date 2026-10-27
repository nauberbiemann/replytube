'use client';

import React, { useState } from 'react';
import { CommentItem } from '@/lib/types';
import {
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Loader2,
  CornerDownLeft,
  User,
  Lightbulb,
  Trash2,
  Plus,
} from 'lucide-react';

interface CommentCardProps {
  item: CommentItem;
  onRefine: (id: string, instruction: string) => Promise<void>;
  onRemoveSavedTopic?: (commentId: string, savedTopicId: string) => void;
  onManualSaveTopic?: (commentId: string, topicTitle: string) => void;
}

export function CommentCard({
  item,
  onRefine,
  onRemoveSavedTopic,
  onManualSaveTopic,
}: CommentCardProps) {
  const [copied, setCopied] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [refining, setRefining] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleRefine = async () => {
    if (!instruction.trim() || refining) return;
    setRefining(true);
    try {
      await onRefine(item.id, instruction.trim());
      setInstruction('');
    } finally {
      setRefining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleRefine();
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-border/80">
      <div className="grid h-auto gap-0 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Lado Esquerdo: Comentário Original & Print */}
        <div className="bg-muted/20 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Comentário Original</span>
          </div>

          {item.imageDataUrl && (
            <div className="overflow-hidden rounded-lg border border-border bg-background/50 p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageDataUrl}
                alt={`Print de ${item.nickname}`}
                className="max-h-48 w-full object-contain rounded"
              />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                @{item.nickname.replace(/^@/, '')}
              </span>
              {item.personName && (
                <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-500 border border-red-500/20">
                  <User className="h-2.5 w-2.5" />
                  {item.personName}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {item.commentText}
            </p>
          </div>

          {/* Selo de Tema Extraído / Salvo Automaticamente */}
          {item.suggestedTopic && item.savedTopicId ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 text-[11px]">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-400 block">
                    Tema salvo automaticamente:
                  </span>
                  <span className="text-foreground/90">{item.suggestedTopic}</span>
                </div>
              </div>
              {onRemoveSavedTopic && (
                <button
                  type="button"
                  onClick={() => onRemoveSavedTopic(item.id, item.savedTopicId!)}
                  className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition shrink-0"
                  title="Remover este tema do Banco de Temas"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            onManualSaveTopic && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onManualSaveTopic(
                      item.id,
                      item.suggestedTopic || item.commentText.slice(0, 110)
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[10px] font-medium text-amber-400 hover:bg-amber-500/15 transition"
                >
                  <Plus className="h-3 w-3" />
                  Salvar como Ideia de Tema
                </button>
              </div>
            )
          )}
        </div>

        {/* Lado Direito: Resposta Gerada e Refinamento */}
        <div className="flex flex-col justify-between bg-card p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                Resposta Sugerida
              </span>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-semibold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    Copiar
                  </>
                )}
              </button>
            </div>

            <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground rounded-lg bg-muted/30 p-3 border border-border/40 font-normal">
              {item.reply}
            </p>
          </div>

          {/* Área de Refinamento */}
          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                Ajuste rápido:
              </span>
              <button
                type="button"
                disabled={refining}
                onClick={async () => {
                  setRefining(true);
                  try {
                    await onRefine(item.id, 'Deixe super curto, no máximo 1 ou 2 frases certeiras. PROIBIDO começar com "Fala [Nome]!" nem com saudações prontas. Vá direto ao ponto levantado.');
                  } finally {
                    setRefining(false);
                  }
                }}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition shadow-2xs disabled:opacity-50"
              >
                ⚡ Mais Curto
              </button>
              <button
                type="button"
                disabled={refining}
                onClick={async () => {
                  setRefining(true);
                  try {
                    await onRefine(item.id, 'Rebata de forma suave, amigável e elegante, trazendo uma perspectiva diferente ou nuance do tema sem confrontar agressivamente, respeitando a colocação do inscrito mas defendendo o ponto do vídeo.');
                  } finally {
                    setRefining(false);
                  }
                }}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition shadow-2xs disabled:opacity-50"
              >
                🛡️ Rebater de Leve
              </button>
              <button
                type="button"
                disabled={refining}
                onClick={async () => {
                  setRefining(true);
                  try {
                    await onRefine(item.id, 'Rebata o comentário com firmeza, dados reais do vídeo e um toque de ironia/humor inteligente de quem entende do assunto, sem papo corporativo de assessor de imprensa.');
                  } finally {
                    setRefining(false);
                  }
                }}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition shadow-2xs disabled:opacity-50"
              >
                🔥 Rebater / Firme
              </button>
              <button
                type="button"
                disabled={refining}
                onClick={async () => {
                  setRefining(true);
                  try {
                    await onRefine(item.id, 'Deixe bem solto, espontâneo e descontraído, com linguagem pura de criador do YouTube, sem clichês de ChatGPT.');
                  } finally {
                    setRefining(false);
                  }
                }}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition shadow-2xs disabled:opacity-50"
              >
                💬 Mais Informal
              </button>
              <button
                type="button"
                disabled={refining}
                onClick={async () => {
                  setRefining(true);
                  try {
                    await onRefine(item.id, 'Mantenha o argumento principal conectado ao tema do vídeo, mas finalize convidando o inscrito a acompanhar os próximos vídeos do canal e utilizando de forma natural os bordões oficiais do canal.');
                  } finally {
                    setRefining(false);
                  }
                }}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition shadow-2xs disabled:opacity-50"
              >
                🎬 Fechar c/ Canal / Bordão
              </button>
              <button
                type="button"
                disabled={refining}
                onClick={async () => {
                  setRefining(true);
                  try {
                    await onRefine(item.id, 'Mantenha o argumento principal, mas finalize com uma pergunta técnica curta e instigante diretamente ligada ao tema do vídeo para estimular o inscrito a responder de volta.');
                  } finally {
                    setRefining(false);
                  }
                }}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition shadow-2xs disabled:opacity-50"
              >
                ❓ Pergunta no Tema
              </button>
              <button
                type="button"
                disabled={refining}
                title="Traduz a resposta atual para o idioma exato em que o comentário original foi escrito"
                onClick={async () => {
                  setRefining(true);
                  try {
                    await onRefine(
                      item.id,
                      'Traduza a resposta atual INTEGRALMENTE para o mesmo idioma em que o comentário original do inscrito foi escrito, mantendo 100% do sentido técnico, da fluência nativa e adaptando naturalmente o fechamento/bordão para esse idioma.'
                    );
                  } finally {
                    setRefining(false);
                  }
                }}
                className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition shadow-2xs disabled:opacity-50"
              >
                🌐 Idioma do Comentário
              </button>
              <button
                type="button"
                disabled={refining}
                title="Traduz a resposta atual de volta para Português do Brasil"
                onClick={async () => {
                  setRefining(true);
                  try {
                    await onRefine(
                      item.id,
                      'Traduza a resposta atual INTEGRALMENTE para Português do Brasil, mantendo o sentido técnico exato e os bordões originais do canal em português.'
                    );
                  } finally {
                    setRefining(false);
                  }
                }}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition shadow-2xs disabled:opacity-50"
              >
                🇧🇷 PT-BR
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={refining}
                  rows={2}
                  placeholder="Digite sua diretriz exata (ex: 'Destaque o custo 30% menor do KC-390', 'Feche convidando para os próximos vídeos')... [Ctrl+Enter]"
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={handleRefine}
                  disabled={refining || !instruction.trim()}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {refining ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Refinando...
                    </>
                  ) : (
                    <>
                      <CornerDownLeft className="h-3.5 w-3.5" />
                      Refinar
                    </>
                  )}
                </button>
              </div>

              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span>💡</span>
                <span><strong>Fidelidade Estrita:</strong> A IA agora foca 100% no argumento que você digitar, sem inventar assuntos nem repetir clichês.</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
