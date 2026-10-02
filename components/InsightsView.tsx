'use client';

import React, { useState, useEffect } from 'react';
import { ChannelContext, InsightsAnalysisResult, ScriptOutline } from '@/lib/types';
import { YouTubeApiKeyModal } from './YouTubeApiKeyModal';
import { ScriptModal } from './ScriptModal';
import { InsightsResult } from './InsightsResult';
import {
  Sparkles,
  Youtube,
  KeyRound,
  FileText,
  Search,
  Loader2,
  AlertCircle,
  HelpCircle,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  Tv,
  Film,
  Compass,
} from 'lucide-react';

interface InsightsViewProps {
  appPassword?: string;
  channelContext?: ChannelContext | null;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function InsightsView({
  appPassword = '',
  channelContext,
  addToast,
}: InsightsViewProps) {
  const [inputMode, setInputMode] = useState<'channel' | 'video' | 'manual'>('channel');

  // Channel mode state
  const [channelUrl, setChannelUrl] = useState('');
  const [viralCount, setViralCount] = useState<number>(3);
  const [commentsPerVideo, setCommentsPerVideo] = useState<number>(40);

  // Single Video mode state
  const [videoUrl, setVideoUrl] = useState('');
  const [maxResults, setMaxResults] = useState<number>(100);

  // Manual mode state
  const [manualComments, setManualComments] = useState('');
  const [manualVideoTitle, setManualVideoTitle] = useState('');
  const [manualTopic, setManualTopic] = useState('');

  // Execution state
  const [statusStep, setStatusStep] = useState<'idle' | 'fetching' | 'analyzing' | 'done'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<InsightsAnalysisResult | null>(null);

  // API Key modal
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [savedApiKey, setSavedApiKey] = useState<string>('');

  // Script Modal state
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [scriptData, setScriptData] = useState<ScriptOutline | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptSourceTitle, setScriptSourceTitle] = useState('');

  // Load saved API key & last analysis from localStorage
  useEffect(() => {
    const key = localStorage.getItem('replytube_youtube_api_key') || '';
    setSavedApiKey(key);

    const saved = localStorage.getItem('replytube_latest_insights');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.summary && parsed.contentIdeas) {
          setAnalysisResult(parsed);
          setStatusStep('done');
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const handleStartAnalysis = async () => {
    if (statusStep === 'fetching' || statusStep === 'analyzing') return;

    // 1. MODO CANAL INTEIRO (VÍDEOS MAIS VIRAIS)
    if (inputMode === 'channel') {
      if (!channelUrl.trim()) {
        addToast('Insira o link ou @handle do canal (ex: @manualdomundo).', 'error');
        return;
      }

      setStatusStep('fetching');
      setStatusMessage('Localizando canal e identificando os vídeos mais virais...');

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (appPassword) headers['x-app-password'] = appPassword;

        const fetchRes = await fetch('/api/insights/fetch-channel-viral', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            channelUrl: channelUrl.trim(),
            viralCount,
            commentsPerVideo,
            apiKey: savedApiKey || undefined,
          }),
        });

        const fetchData = await fetchRes.json();

        if (!fetchRes.ok) {
          if (fetchData.requiresApiKey) {
            setIsApiKeyModalOpen(true);
            addToast(fetchData.error || 'Configure sua chave da API do YouTube.', 'info');
          } else {
            addToast(fetchData.error || 'Falha ao escanear canal.', 'error');
          }
          setStatusStep('idle');
          return;
        }

        const comments: string[] = fetchData.comments || [];
        if (comments.length === 0) {
          addToast('Nenhum comentário retornado dos vídeos virais deste canal.', 'error');
          setStatusStep('idle');
          return;
        }

        setStatusStep('analyzing');
        setStatusMessage(
          `Minerando ${comments.length} comentários dos ${fetchData.viralVideos?.length || 0} vídeos mais virais de "${fetchData.channelTitle}" com gpt-4o-mini...`
        );

        const analyzeRes = await fetch('/api/insights/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            comments,
            videoTitle: `Vídeos Mais Virais de ${fetchData.channelTitle}`,
            channelTitle: fetchData.channelTitle,
            channelAvatar: fetchData.channelAvatar,
            viralVideos: fetchData.viralVideos,
            thumbnailUrl: fetchData.viralVideos?.[0]?.thumbnailUrl,
            videoUrl: channelUrl.trim(),
            customTopic: `Varredura dos ${fetchData.viralVideos?.length} vídeos mais vistos do canal`,
          }),
        });

        const analyzeData = await analyzeRes.json();
        if (!analyzeRes.ok || !analyzeData.result) {
          addToast(analyzeData.error || 'Falha ao processar a análise com IA.', 'error');
          setStatusStep('idle');
          return;
        }

        setAnalysisResult(analyzeData.result);
        localStorage.setItem('replytube_latest_insights', JSON.stringify(analyzeData.result));
        setStatusStep('done');
        addToast('Mina de Ouro do canal minerada com sucesso!', 'success');
      } catch (err: any) {
        console.error(err);
        addToast(err?.message || 'Erro inesperado na análise do canal.', 'error');
        setStatusStep('idle');
      }
    } 
    // 2. MODO VÍDEO ÚNICO
    else if (inputMode === 'video') {
      if (!videoUrl.trim()) {
        addToast('Insira a URL do vídeo do YouTube.', 'error');
        return;
      }

      setStatusStep('fetching');
      setStatusMessage('Buscando comentários na YouTube Data API...');

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (appPassword) headers['x-app-password'] = appPassword;

        const fetchRes = await fetch('/api/insights/fetch-comments', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            videoUrl: videoUrl.trim(),
            maxResults,
            apiKey: savedApiKey || undefined,
          }),
        });

        const fetchData = await fetchRes.json();

        if (!fetchRes.ok) {
          if (fetchData.requiresApiKey) {
            setIsApiKeyModalOpen(true);
            addToast(fetchData.error || 'Configure sua chave da API do YouTube.', 'info');
          } else {
            addToast(fetchData.error || 'Falha ao buscar comentários.', 'error');
          }
          setStatusStep('idle');
          return;
        }

        const comments: string[] = fetchData.comments || [];
        if (comments.length === 0) {
          addToast('Nenhum comentário retornado para este vídeo.', 'error');
          setStatusStep('idle');
          return;
        }

        // Pass to AI Analyzer
        setStatusStep('analyzing');
        setStatusMessage(`Minerando ${comments.length} comentários com gpt-4o-mini...`);

        const analyzeRes = await fetch('/api/insights/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            comments,
            videoTitle: fetchData.videoTitle,
            channelTitle: fetchData.channelTitle,
            thumbnailUrl: fetchData.thumbnailUrl,
            videoUrl: videoUrl.trim(),
            customTopic: channelContext?.nicho || '',
          }),
        });

        const analyzeData = await analyzeRes.json();
        if (!analyzeRes.ok || !analyzeData.result) {
          addToast(analyzeData.error || 'Falha ao processar a análise com IA.', 'error');
          setStatusStep('idle');
          return;
        }

        setAnalysisResult(analyzeData.result);
        localStorage.setItem('replytube_latest_insights', JSON.stringify(analyzeData.result));
        setStatusStep('done');
        addToast('Mina de Ouro minerada com sucesso!', 'success');
      } catch (err: any) {
        console.error(err);
        addToast(err?.message || 'Erro inesperado na análise.', 'error');
        setStatusStep('idle');
      }
    } 
    // 3. MODO MANUAL
    else {
      if (!manualComments.trim()) {
        addToast('Cole ao menos alguns comentários no campo de texto.', 'error');
        return;
      }

      const parsedComments = manualComments
        .split('\n')
        .map((c) => c.trim())
        .filter((c) => c.length > 2);

      if (parsedComments.length === 0) {
        addToast('Nenhum comentário válido identificado.', 'error');
        return;
      }

      setStatusStep('analyzing');
      setStatusMessage(`Minerando ${parsedComments.length} comentários com gpt-4o-mini...`);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (appPassword) headers['x-app-password'] = appPassword;

        const analyzeRes = await fetch('/api/insights/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            comments: parsedComments,
            videoTitle: manualVideoTitle.trim() || 'Comentários Colados Manualmente',
            channelTitle: channelContext?.nicho ? `Nicho: ${channelContext.nicho}` : 'Audiência Externa',
            customTopic: manualTopic.trim(),
          }),
        });

        const analyzeData = await analyzeRes.json();
        if (!analyzeRes.ok || !analyzeData.result) {
          addToast(analyzeData.error || 'Falha ao processar a análise com IA.', 'error');
          setStatusStep('idle');
          return;
        }

        setAnalysisResult(analyzeData.result);
        localStorage.setItem('replytube_latest_insights', JSON.stringify(analyzeData.result));
        setStatusStep('done');
        addToast('Mina de Ouro minerada com sucesso!', 'success');
      } catch (err: any) {
        console.error(err);
        addToast(err?.message || 'Erro inesperado na análise.', 'error');
        setStatusStep('idle');
      }
    }
  };

  const handleResetAnalysis = () => {
    setAnalysisResult(null);
    setStatusStep('idle');
    localStorage.removeItem('replytube_latest_insights');
  };

  const handleGenerateScript = async (params: {
    title: string;
    hook?: string;
    premise?: string;
    targetPainOrExpectation?: string;
    format?: string;
  }) => {
    setScriptSourceTitle(params.title);
    setScriptModalOpen(true);
    setScriptData(null);
    setScriptLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (appPassword) headers['x-app-password'] = appPassword;

      const res = await fetch('/api/insights/generate-script', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...params,
          channelContext: channelContext || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.script) {
        addToast(data.error || 'Falha ao gerar roteiro.', 'error');
        setScriptModalOpen(false);
        return;
      }

      setScriptData(data.script);
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Erro ao gerar roteiro.', 'error');
      setScriptModalOpen(false);
    } finally {
      setScriptLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Explanatório */}
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-background to-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-xs">
                💎
              </span>
              <h2 className="text-lg font-black tracking-tight text-foreground">
                Mina de Ouro de Audiência & Ideias
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                gpt-4o-mini
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Descubra o que o público ama, odeia e implora para ver. Analise canais inteiros pelos vídeos mais virais ou foque em vídeos específicos com inteligência artificial.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsApiKeyModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition shadow-xs shrink-0 self-start md:self-center"
          >
            <KeyRound className="h-3.5 w-3.5 text-purple-500" />
            {savedApiKey ? 'Chave YouTube Configurada ✓' : 'Configurar Chave YouTube'}
          </button>
        </div>
      </div>

      {/* Se já tiver resultado pronto e não estiver minerando de novo */}
      {analysisResult && statusStep === 'done' ? (
        <InsightsResult
          data={analysisResult}
          onReset={handleResetAnalysis}
          onGenerateScript={handleGenerateScript}
        />
      ) : (
        /* Painel de Configuração e Entrada */
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          {/* Seletor de Modo: Canal Inteiro vs Vídeo Único vs Manual */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
            <button
              type="button"
              onClick={() => setInputMode('channel')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                inputMode === 'channel'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Flame className="h-4 w-4 text-amber-300" />
              Canal Inteiro (Vídeos Mais Virais)
            </button>

            <button
              type="button"
              onClick={() => setInputMode('video')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                inputMode === 'video'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Film className="h-4 w-4" />
              Vídeo Específico
            </button>

            <button
              type="button"
              onClick={() => setInputMode('manual')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                inputMode === 'manual'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-4 w-4" />
              Colar Manualmente
            </button>
          </div>

          {/* 1. Modo Canal Inteiro */}
          {inputMode === 'channel' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tv className="h-3.5 w-3.5 text-purple-500" /> Link do Canal ou @handle:
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    Ex: @manualdomundo, @nostalgiatv ou youtube.com/@nome
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                    placeholder="Ex: @manualdomundo ou https://www.youtube.com/@flowpodcast"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition font-mono"
                    disabled={statusStep === 'fetching' || statusStep === 'analyzing'}
                  />
                </div>
              </div>

              {/* Controles de Vídeos Virais & Comentários */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3.5">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-semibold text-foreground">
                      Quantos Vídeos Virais:
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[
                      { label: 'Top 3 (Focado)', val: 3 },
                      { label: 'Top 5 (Profundo)', val: 5 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setViralCount(opt.val)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          viralCount === opt.val
                            ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                            : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3.5">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-semibold text-foreground">
                      Coments por Vídeo:
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[
                      { label: '30', val: 30 },
                      { label: '40 (Recomendado)', val: 40 },
                      { label: '50', val: 50 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setCommentsPerVideo(opt.val)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          commentsPerVideo === opt.val
                            ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                            : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-[11px] text-muted-foreground leading-relaxed">
                💡 <strong>Como funciona:</strong> O ReplyTube pesquisa o canal, ranqueia os vídeos com mais visualizações de todos os tempos, coleta as dezenas de comentários mais relevantes de cada um e sintetiza todas as dores, pedidos e ideias virais em um único relatório.
              </div>
            </div>
          )}

          {/* 2. Modo Vídeo Específico */}
          {inputMode === 'video' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>URL do Vídeo (de qualquer canal ou seu):</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    Aceita links do YouTube, Shorts ou youtu.be
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                    disabled={statusStep === 'fetching' || statusStep === 'analyzing'}
                  />
                </div>
              </div>

              {/* Quantidade de comentários */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-3.5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-semibold text-foreground">
                    Profundidade da Mineração:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[
                    { label: 'Rápida (50)', val: 50 },
                    { label: 'Recomendada (100)', val: 100 },
                    { label: 'Profunda (150)', val: 150 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setMaxResults(opt.val)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        maxResults === opt.val
                          ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                          : 'bg-card text-muted-foreground hover:bg-muted border border-border'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. Modo Manual */}
          {inputMode === 'manual' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Título do Vídeo ou Canal (Opcional):
                  </label>
                  <input
                    type="text"
                    value={manualVideoTitle}
                    onChange={(e) => setManualVideoTitle(e.target.value)}
                    placeholder="Ex: Por que a Embraer domina o setor regional"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Contexto / Foco Adicional (Opcional):
                  </label>
                  <input
                    type="text"
                    value={manualTopic}
                    onChange={(e) => setManualTopic(e.target.value)}
                    placeholder="Ex: Aviação comercial, tecnologia brasileira"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Cole os Comentários (um por linha):</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    Suporta comentários copiados do YouTube, TikTok, Instagram ou transcrições
                  </span>
                </label>
                <textarea
                  value={manualComments}
                  onChange={(e) => setManualComments(e.target.value)}
                  rows={6}
                  placeholder="Cole aqui os comentários...&#10;Ex:&#10;Muito bom, mas você esqueceu de falar sobre o motor!&#10;Quando sai a parte 2 sobre a Boeing?&#10;Não concordo com a comparação..."
                  className="w-full rounded-xl border border-input bg-background p-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition font-mono"
                  disabled={statusStep === 'analyzing'}
                />
              </div>
            </div>
          )}

          {/* Action Button & Status */}
          <div className="pt-2">
            {statusStep === 'fetching' || statusStep === 'analyzing' ? (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 flex items-center gap-3 animate-pulse">
                <Loader2 className="h-5 w-5 text-purple-600 animate-spin shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">
                    {statusMessage}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {inputMode === 'channel'
                      ? 'Cruzando dados de múltiplos vídeos virais e extraindo ideias de novos conteúdos.'
                      : 'A IA está processando sentimento, dores, expectativas e criando ideias de vídeos de alto CTR.'}
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartAnalysis}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 py-3.5 text-xs font-bold text-white transition shadow-sm"
              >
                <Sparkles className="h-4 w-4" />
                {inputMode === 'channel'
                  ? '🔥 Varrer Canal & Minerar Vídeos Virais com IA'
                  : inputMode === 'video'
                  ? '💎 Minerar Mina de Ouro do Vídeo com IA'
                  : '💎 Minerar Comentários com IA'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal para Chave do YouTube API */}
      <YouTubeApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaved={(key) => setSavedApiKey(key)}
      />

      {/* Modal do Roteirizador Instantâneo */}
      <ScriptModal
        isOpen={scriptModalOpen}
        onClose={() => setScriptModalOpen(false)}
        script={scriptData}
        loading={scriptLoading}
        sourceTitle={scriptSourceTitle}
      />
    </div>
  );
}
