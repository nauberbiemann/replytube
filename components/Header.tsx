'use client';

import React, { useEffect, useState } from 'react';
import { Youtube, RefreshCw, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  onResetCycle: () => void;
}

export function Header({ onResetCycle }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:bg-red-500/20 dark:text-red-500 shadow-sm border border-red-500/20">
            <Youtube className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight">ReplyTube</h1>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/20">
                gpt-4o-mini
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Respostas inteligentes para comentários do YouTube
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground hover:bg-muted"
            title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onResetCycle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:bg-muted shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Limpar / Novo Ciclo
          </button>
        </div>
      </div>
    </header>
  );
}
