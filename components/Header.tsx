'use client';

import React, { useEffect, useState } from 'react';
import { Youtube, RefreshCw, Moon, Sun, Sparkles, Lock, MessageSquare, Gem, Sprout, Cpu } from 'lucide-react';

interface HeaderProps {
  onResetCycle: () => void;
  hasPassword?: boolean;
  onLock?: () => void;
  activeTab?: 'replies' | 'insights' | 'evergreen';
  onTabChange?: (tab: 'replies' | 'insights' | 'evergreen') => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

export function Header({
  onResetCycle,
  hasPassword,
  onLock,
  activeTab = 'replies',
  onTabChange,
  selectedModel = 'gpt-4o-mini',
  onModelChange,
}: HeaderProps) {
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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:bg-red-500/20 dark:text-red-500 shadow-sm border border-red-500/20 shrink-0">
            <Youtube className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-foreground">ReplyTube</h1>
              <div className="hidden sm:inline-flex items-center rounded-full border border-border/80 bg-muted/60 p-0.5 text-[10px] font-semibold shadow-inner">
                <button
                  type="button"
                  onClick={() => onModelChange?.('gpt-4o-mini')}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
                    selectedModel === 'gpt-4o-mini'
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="gpt-4o-mini: Rápido e econômico (cota diária de 2.5 milhões de tokens gratuitos)"
                >
                  <Sparkles className="h-2.5 w-2.5 text-emerald-400" />
                  gpt-4o-mini
                </button>
                <button
                  type="button"
                  onClick={() => onModelChange?.('gpt-4o')}
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition ${
                    selectedModel === 'gpt-4o'
                      ? 'bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30 shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="gpt-4o: Alta capacidade de raciocínio lógico e adesão rigorosa a instruções complexas"
                >
                  <Cpu className="h-2.5 w-2.5 text-purple-400" />
                  gpt-4o
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              IA para Criadores do YouTube
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        {onTabChange && (
          <div className="flex items-center rounded-xl border border-border bg-muted/50 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => onTabChange('replies')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'replies'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-red-500" />
              <span>Respostas</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('insights')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'insights'
                  ? 'bg-card text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Gem className="h-3.5 w-3.5 text-purple-500" />
              <span>Mina de Ouro</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('evergreen')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'evergreen'
                  ? 'bg-card text-teal-500 dark:text-teal-400 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sprout className="h-3.5 w-3.5 text-teal-400" />
              <span>Evergreen</span>
              <span className="hidden md:inline-block rounded-full bg-teal-500/20 px-1.5 py-0.2 text-[9px] font-bold text-teal-400">
                Viral
              </span>
            </button>
          </div>
        )}

        {/* Right Tools */}
        <div className="flex items-center gap-2 shrink-0">
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

          {activeTab === 'replies' && (
            <button
              type="button"
              onClick={onResetCycle}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 sm:px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted shadow-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Limpar / Novo Ciclo</span>
              <span className="sm:hidden">Limpar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
