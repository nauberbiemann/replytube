'use client';

import React, { useMemo, useState } from 'react';
import { CommentItem } from '@/lib/types';
import { CommentCard } from './CommentCard';
import { MessageSquareDashed, ChevronDown, ChevronRight } from 'lucide-react';

interface SessionThreadProps {
  items: CommentItem[];
  onRefine: (id: string, instruction: string) => Promise<void>;
  onRemoveSavedTopic?: (commentId: string, savedTopicId: string) => void;
  onManualSaveTopic?: (commentId: string, topicTitle: string) => void;
}

export function SessionThread({
  items,
  onRefine,
  onRemoveSavedTopic,
  onManualSaveTopic,
}: SessionThreadProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Agrupa por vídeo mantendo a ordem (grupo mais recente primeiro)
  const groups = useMemo(() => {
    const map = new Map<string, CommentItem[]>();
    items.forEach((it) => {
      const key = it.videoTitle?.trim() || 'Vídeo não identificado';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
          Thread da sessão
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {items.length}
          </span>
          {groups.length > 1 && (
            <span className="text-[11px] font-normal text-muted-foreground">
              · {groups.length} vídeos
            </span>
          )}
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <MessageSquareDashed className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">Nenhum comentário ainda</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Copie o print de um comentário no YouTube e dê <strong>Ctrl+V</strong> aqui para gerar a primeira resposta.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([title, groupItems]) => {
            const isCollapsed = collapsed[title];
            return (
              <div key={title} className="space-y-3">
                <button
                  type="button"
                  onClick={() => setCollapsed((p) => ({ ...p, [title]: !p[title] }))}
                  className="w-full flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left text-xs hover:bg-muted/50"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate font-semibold text-foreground">🎬 {title}</span>
                  <span className="ml-auto shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground border border-border">
                    {groupItems.length} {groupItems.length === 1 ? 'resposta' : 'respostas'}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="space-y-4">
                    {groupItems.map((item) => (
                      <CommentCard
                        key={item.id}
                        item={item}
                        onRefine={onRefine}
                        onRemoveSavedTopic={onRemoveSavedTopic}
                        onManualSaveTopic={onManualSaveTopic}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
