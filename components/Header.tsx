'use client';

import React, { useEffect, useState } from 'react';
import { Youtube, RefreshCw, Moon, Sun, Sparkles, Lock } from 'lucide-react';

interface HeaderProps {
  onResetCycle: () => void;
  hasPassword?: boolean;
  onLock?: () => void;
}

export function Header({ onResetCycle, hasPassword, onLock }: HeaderProps) {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('replytube_theme');
    const prefersDark = saved !== null ? saved === 'dark' : true;
    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('replytube_theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:bg-red-500/20 dark:text-red-500 shadow-sm border border-red-500/20">
            <Youtube className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-foreground">ReplyTube</h1>
              <span
                title="Modelo contemplado na sua cota diária de 2.5 milhões de tokens gratuitos!"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-help"
              >
                <Sparkles className="h-2.5 w-2.5" />
                gpt-4o-mini
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Respostas inteligentes para comentários do YouTube
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasPassword && (
            <button
              type="button"
              onClick={onLock}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/60 text-emerald-500 transition hover:bg-muted"
              title="Acesso protegido por senha (clique para bloquear)"
            >
              <Lock className="h-4 w-4" />
            </button>
          )}

          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground transition hover:text-foreground hover:bg-muted"
              title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>
          )}

          <button
            type="button"
            onClick={onResetCycle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            Limpar / Novo Ciclo
          </button>
        </div>
      </div>
    </header>
  );
}
