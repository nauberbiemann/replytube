'use client';

import React from 'react';
import { CommentItem } from '@/lib/types';
import { CommentCard } from './CommentCard';
import { MessageSquareDashed } from 'lucide-react';

interface SessionThreadProps {
  items: CommentItem[];
  onRefine: (id: string, instruction: string) => Promise<void>;
}

export function SessionThread({ items, onRefine }: SessionThreadProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
          Thread da sessão
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {items.length}
          </span>
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <MessageSquareDashed className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Nenhum comentário ainda
          </p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Copie o print de um comentário no YouTube e dê <strong>Ctrl+V</strong> aqui para gerar a primeira resposta.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <CommentCard key={item.id} item={item} onRefine={onRefine} />
          ))}
        </div>
      )}
    </section>
  );
}
