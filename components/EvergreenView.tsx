'use client';

import React, { useState, useMemo } from 'react';
import {
  EVERGREEN_CATEGORIES,
  EvergreenCategory,
  EvergreenNiche,
  EvergreenTerm,
} from '@/lib/evergreenData';
import {
  Sprout,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Youtube,
  Facebook,
  RotateCcw,
  Clock,
  Layers,
  Flame,
  Check,
  Globe2,
  Copy,
  X,
} from 'lucide-react';

interface EvergreenViewProps {
  appPassword?: string;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToMinaDeOuro?: (query: string) => void;
}

export function EvergreenView({
  appPassword = '',
  addToast,
  onNavigateToMinaDeOuro,
}: EvergreenViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>('saude-bem-estar');
  const [expandedNicheId, setExpandedNicheId] = useState<string | null>('exercicios-casa');
  const [selectedTerm, setSelectedTerm] = useState<EvergreenTerm | null>({
    pt: 'treino em casa',
    en: 'home workout',
    es: 'entrenamiento en casa',
  });

  // Custom search translation state
  const [customTermTranslations, setCustomTermTranslations] = useState<EvergreenTerm | null>(null);
  const [translatingWithAi, setTranslatingWithAi] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  // Stats calculation
  const totalCategories = EVERGREEN_CATEGORIES.length;
  const totalNiches = useMemo(
    () => EVERGREEN_CATEGORIES.reduce((acc, cat) => acc + cat.niches.length, 0),
    []
  );
  const totalTerms = useMemo(
    () =>
      EVERGREEN_CATEGORIES.reduce(
        (acc, cat) => acc + cat.niches.reduce((nAcc, n) => nAcc + n.terms.length, 0),
        0
      ),
    []
  );

  // Filtering based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return EVERGREEN_CATEGORIES;
    const query = searchQuery.toLowerCase().trim();

    return EVERGREEN_CATEGORIES.map((cat) => {
      const matchCat = cat.title.toLowerCase().includes(query);
      const filteredNiches = cat.niches
        .map((niche) => {
          const matchNiche = niche.title.toLowerCase().includes(query);
          const filteredTerms = niche.terms.filter(
            (t) =>
              t.pt.toLowerCase().includes(query) ||
              t.en.toLowerCase().includes(query) ||
              t.es.toLowerCase().includes(query)
          );
          if (matchCat || matchNiche || filteredTerms.length > 0) {
            return {
              ...niche,
              terms: filteredTerms.length > 0 ? filteredTerms : niche.terms,
            };
          }
          return null;
        })
        .filter(Boolean) as EvergreenNiche[];

      return {
        ...cat,
        niches: filteredNiches,
      };
    }).filter((cat) => cat.niches.length > 0);
  }, [searchQuery]);

  const handleToggleCategory = (catId: string) => {
    if (expandedCategoryId === catId) {
      setExpandedCategoryId(null);
    } else {
      setExpandedCategoryId(catId);
      // Auto expand first niche of this category
      const cat = EVERGREEN_CATEGORIES.find((c) => c.id === catId);
      if (cat && cat.niches.length > 0) {
        setExpandedNicheId(cat.niches[0].id);
      }
    }
  };

  const handleToggleNiche = (nicheId: string) => {
    setExpandedNicheId((prev) => (prev === nicheId ? null : nicheId));
  };

  const handleSelectTerm = (term: EvergreenTerm) => {
    setSelectedTerm(term);
  };

  const handleCloseAll = () => {
    setExpandedCategoryId(null);
    setExpandedNicheId(null);
    setSelectedTerm(null);
    setSearchQuery('');
    setCustomTermTranslations(null);
  };

  const handleTranslateCustomTerm = async () => {
    if (!searchQuery.trim()) return;

    setTranslatingWithAi(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (appPassword) headers['x-app-password'] = appPassword;

      const res = await fetch('/api/evergreen/translate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ term: searchQuery.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.term) {
        addToast(data.error || 'Falha ao traduzir termo.', 'error');
        return;
      }

      setCustomTermTranslations(data.term);
      setSelectedTerm(data.term);
      addToast('Termo traduzido para Inglês e Espanhol!', 'success');
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Erro na tradução.', 'error');
    } finally {
      setTranslatingWithAi(false);
    }
  };

  // Build outbound URLs
  const getFacebookUrl = (query: string) => {
    // Facebook Watch video search (clean, reliable, avoids broken filter tokens)
    return `https://www.facebook.com/watch/search/?q=${encodeURIComponent(query)}`;
  };

  const getYouTubeShortsUrl = (query: string) => {
    // This month, sort by view count, duration <= 20 min (4-20m)
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=CAMSBAgEGAM%3D`;
  };

  const getYouTubeLongUrl = (query: string) => {
    // This month, sort by view count, duration > 20 min
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=CAMSBAgEGAI%3D`;
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedQuery(text);
    setTimeout(() => setCopiedQuery(null), 1500);
  };

  const isSelectedTermInActiveNiche = useMemo(() => {
    if (!selectedTerm || !expandedNicheId) return false;
    return filteredCategories.some((cat) =>
      cat.niches.some((n) => n.id === expandedNicheId && n.terms.some((t) => t.pt === selectedTerm.pt))
    );
  }, [selectedTerm, expandedNicheId, filteredCategories]);

  const topCardTerm = useMemo(() => {
    if (customTermTranslations) return customTermTranslations;
    if (searchQuery.trim() && !isSelectedTermInActiveNiche) {
      return { pt: searchQuery.trim(), en: searchQuery.trim(), es: searchQuery.trim() };
    }
    if (selectedTerm && !isSelectedTermInActiveNiche) {
      return selectedTerm;
    }
    return null;
  }, [customTermTranslations, searchQuery, isSelectedTermInActiveNiche, selectedTerm]);

  const renderCard = (term: EvergreenTerm, isInline = false) => {
    return (
      <div
        className={`rounded-2xl border ${
          isInline
            ? 'border-teal-500/40 bg-card/95 shadow-md my-3 p-4'
            : 'border-teal-500/30 bg-card p-5 shadow-lg'
        } space-y-3 animate-in fade-in duration-200`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-border/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 font-bold text-xs">
              🎯
            </span>
            <div>
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                {isInline ? 'Termo Ativo' : 'Links de Pesquisa Instantânea'}
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">
                Termo: "{term.pt}"
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToMinaDeOuro && (
              <button
                type="button"
                onClick={() => onNavigateToMinaDeOuro(term.pt)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2.5 py-1 text-[11px] font-semibold transition"
                title="Ir para a Mina de Ouro com este tema"
              >
                <Sparkles className="h-3 w-3" /> Minerar com IA →
              </button>
            )}

            {isInline && (
              <button
                type="button"
                onClick={() => setSelectedTerm(null)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                title="Fechar painel deste termo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3 Linhas de Idiomas: Inglês, Português e Espanhol */}
        <div className="space-y-2">
          {[
            { lang: 'Inglês', flag: '🇬🇧', query: term.en },
            { lang: 'Português', flag: '🇧🇷', query: term.pt },
            { lang: 'Espanhol', flag: '🇪🇸', query: term.es },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-muted/25 px-3 py-2 hover:bg-muted/40 transition"
            >
              <div className="flex items-center gap-2.5 min-w-[180px]">
                <span className="text-sm">{item.flag}</span>
                <div>
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase">
                    {item.lang}
                  </span>
                  <p className="text-xs font-bold text-foreground font-mono flex items-center gap-1.5">
                    {item.query}
                    <button
                      type="button"
                      onClick={() => handleCopy(item.query)}
                      className="text-muted-foreground hover:text-foreground transition p-0.5"
                      title="Copiar termo"
                    >
                      {copiedQuery === item.query ? (
                        <Check className="h-3 w-3 text-teal-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </p>
                </div>
              </div>

              {/* Botões de Ação Direta */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {/* Facebook este mês */}
                <a
                  href={getFacebookUrl(item.query)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 text-[11px] font-semibold text-blue-400 transition shadow-xs group"
                  title="Abrir busca de vídeos no Facebook Watch"
                >
                  <Facebook className="h-3 w-3 fill-current" />
                  <span>Facebook este mês</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70 group-hover:opacity-100 transition" />
                </a>

                {/* YouTube <= 20 min */}
                <a
                  href={getYouTubeShortsUrl(item.query)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-400 transition shadow-xs group"
                  title="Vídeos com até 20 minutos do último mês ordenados por visualizações"
                >
                  <Youtube className="h-3.5 w-3.5 fill-current text-red-500" />
                  <span>YouTube ≤ 20 min</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70 group-hover:opacity-100 transition" />
                </a>

                {/* YouTube > 20 min */}
                <a
                  href={getYouTubeLongUrl(item.query)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-400 transition shadow-xs group"
                  title="Vídeos longos com mais de 20 minutos do último mês ordenados por visualizações"
                >
                  <Youtube className="h-3.5 w-3.5 fill-current text-red-500" />
                  <span>YouTube &gt; 20 min</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70 group-hover:opacity-100 transition" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-950/40 via-background to-card p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm shrink-0 text-2xl">
              🌱
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-foreground font-serif">
                  Conteúdo <span className="italic text-teal-400">Evergreen</span>
                </h2>
                <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-400 border border-teal-500/20">
                  Radar Viral
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                Nichos que não caducam com os termos mais procurados do mundo. Clique em qualquer termo para ver as versões em <strong>Inglês</strong>, <strong>Português</strong> e <strong>Espanhol</strong> e pesquisar direto no YouTube e no Facebook com filtro de vídeos deste mês!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCloseAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Fechar tudo
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="pt-2 border-t border-border/60">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setCustomTermTranslations(null);
                }
              }}
              placeholder="Digite um termo ou palavra-chave — ex: carros usados, bem descida, airfryer..."
              className="w-full rounded-xl border border-input bg-background pl-10 pr-32 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition font-mono"
            />
            {searchQuery.trim() && (
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleTranslateCustomTerm}
                  disabled={translatingWithAi}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 px-2.5 py-1.5 text-[11px] font-semibold transition"
                  title="Traduzir termo para Inglês e Espanhol usando IA gpt-4o-mini"
                >
                  <Sparkles className="h-3 w-3" />
                  {translatingWithAi ? 'Traduzindo...' : 'Traduzir com IA'}
                </button>
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2.5 px-1">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
              <strong>{totalNiches} nichos carregados</strong> • <strong>{totalTerms} termos</strong> • <strong>3 idiomas (PT, EN, ES)</strong>
            </span>
            <span>Links com filtro automático de vídeos deste mês</span>
          </div>
        </div>
      </div>

      {/* Caixa de Termo Ativo / Ações de Pesquisa no topo (apenas quando não renderizado inline no nicho aberto) */}
      {topCardTerm && renderCard(topCardTerm, false)}

      {/* Lista de Categorias & Nichos Accordion */}
      <div className="space-y-3">
        {filteredCategories.map((category) => {
          const isCategoryOpen = expandedCategoryId === category.id;

          return (
            <div
              key={category.id}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs transition"
            >
              {/* Category Header */}
              <button
                type="button"
                onClick={() => handleToggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/40 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.icon}</span>
                  <h3 className="text-sm font-bold text-foreground">
                    {category.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {category.niches.length} nichos
                  </span>
                  {isCategoryOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Subcategories / Niches */}
              {isCategoryOpen && (
                <div className="border-t border-border/80 bg-muted/10 divide-y divide-border/60">
                  {category.niches.map((niche) => {
                    const isNicheOpen = expandedNicheId === niche.id;

                    return (
                      <div key={niche.id} className="p-4 space-y-3">
                        <button
                          type="button"
                          onClick={() => handleToggleNiche(niche.id)}
                          className="w-full flex items-center justify-between text-left group"
                        >
                          <div className="flex items-center gap-2">
                            {isNicheOpen ? (
                              <ChevronDown className="h-4 w-4 text-teal-400 shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                            )}
                            <h4
                              className={`text-xs font-bold transition ${
                                isNicheOpen ? 'text-teal-400' : 'text-foreground group-hover:text-teal-400'
                              }`}
                            >
                              {niche.title}
                            </h4>
                          </div>

                          <span className="text-[11px] text-muted-foreground">
                            {niche.terms.length} termos
                          </span>
                        </button>

                        {/* Terms Pills */}
                        {isNicheOpen && (
                          <div className="space-y-3 pt-2 animate-in fade-in duration-150">
                            <div className="flex flex-wrap gap-2">
                              {niche.terms.map((term, tIdx) => {
                                const isSelected = selectedTerm?.pt === term.pt;

                                return (
                                  <button
                                    key={tIdx}
                                    type="button"
                                    onClick={() => handleSelectTerm(term)}
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-teal-500/25 text-teal-300 border border-teal-500/50 shadow-sm font-semibold ring-1 ring-teal-400/50'
                                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60'
                                    }`}
                                  >
                                    {term.pt}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Inline Action Card when term in this niche is selected */}
                            {selectedTerm && niche.terms.some((t) => t.pt === selectedTerm.pt) && (
                              renderCard(selectedTerm, true)
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
