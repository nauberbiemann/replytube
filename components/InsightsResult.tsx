'use client';

import React, { useState } from 'react';
import {
  InsightsAnalysisResult,
  ContentIdea,
  PainPoint,
  Expectation,
} from '@/lib/types';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RotateCcw,
  Flame,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Video,
  Clapperboard,
  Quote,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface InsightsResultProps {
  data: InsightsAnalysisResult;
  onReset: () => void;
  onGenerateScript: (params: {
    title: string;
    hook?: string;
    premise?: string;
    targetPainOrExpectation?: string;
    format?: string;
  }) => void;
}

export function InsightsResult({
  data,
  onReset,
  onGenerateScript,
}: InsightsResultProps) {
  const [copied, setCopied] = useState(false);

  const generateMarkdownReport = (): string => {
    return `# 💎 MINA DE OURO - Relatório de Audiência & Ideias de Conteúdo

**Vídeo Analisado:** ${data.videoTitle || 'N/A'}  
**Canal:** ${data.channelTitle || 'N/A'}  
**Comentários Minerados:** ${data.totalCommentsAnalyzed}  
**Data:** ${new Date(data.analyzedAt).toLocaleDateString('pt-BR')}  

---

## 📊 1. Resumo Executivo da Audiência
- **Sentimento Geral:** ${data.summary.overallSentiment.toUpperCase()} (${data.summary.sentimentBreakdown.positive}% Positivo / ${data.summary.sentimentBreakdown.neutral}% Neutro / ${data.summary.sentimentBreakdown.negative}% Negativo)
- **Tom dos Comentários:** ${data.summary.tone}
- **Perfil dos Espectadores:** ${data.summary.profile}
- **💡 Insight Mais Valioso (Key Takeaway):** ${data.summary.keyTakeaway}

---

## 🔥 2. Dores, Frustrações e Objeções da Audiência
${data.pains
  .map(
    (p, i) => `### ${i + 1}. ${p.topic} [Intensidade: ${p.intensity.toUpperCase()}]
${p.description}

**Evidências nos Comentários:**
${p.evidence.map((quote) => `- "${quote}"`).join('\n')}
`
  )
  .join('\n')}

---

## 🎯 3. Expectativas, Dúvidas e Pedidos Frequentes
${data.expectations
  .map(
    (e, i) => `### ${i + 1}. ${e.topic} [Frequência: ${e.frequency.toUpperCase()}]
${e.description}

**Evidências nos Comentários:**
${e.evidence.map((quote) => `- "${quote}"`).join('\n')}
`
  )
  .join('\n')}

---

## 💎 4. Mina de Ouro: Ideias de Novos Vídeos
${data.contentIdeas
  .map(
    (idea, i) => `### ${i + 1}. ${idea.title}
- **Formato:** ${idea.format} | **Potencial:** ${idea.potential.toUpperCase()}
- **Gancho Inicial (0-15s):** "${idea.hook}"
- **Premissa / Ângulo:** ${idea.premise}
- **Resolve a Dor/Desejo:** ${idea.targetPainOrExpectation}
`
  )
  .join('\n')}
`;
  };

  const handleCopyReport = async () => {
    const text = generateMarkdownReport();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    const text = generateMarkdownReport();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = (data.videoTitle || 'relatorio-comentarios')
      .slice(0, 30)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    link.download = `mina-de-ouro-${safeTitle}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sentimentColor =
    data.summary.overallSentiment === 'positivo'
      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      : data.summary.overallSentiment === 'negativo'
      ? 'text-red-500 bg-red-500/10 border-red-500/20'
      : 'text-amber-500 bg-amber-500/10 border-amber-500/20';

  return (
    <div className="space-y-6">
      {/* Top Banner / Video Header */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            {data.thumbnailUrl && (
              <img
                src={data.thumbnailUrl}
                alt="Thumbnail do vídeo"
                className="h-16 w-28 rounded-xl object-cover border border-border shadow-xs shrink-0"
              />
            )}
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  MINA DE OURO ATIVA
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {data.totalCommentsAnalyzed} comentários analisados
                </span>
              </div>
              <h2 className="text-base font-bold text-foreground leading-snug truncate max-w-xl">
                {data.videoTitle || 'Vídeo Analisado'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {data.channelTitle && `Canal: ${data.channelTitle} • `}
                {new Date(data.analyzedAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
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
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
              title="Baixar Relatório em Markdown"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" /> Baixar .md
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Nova Mineração
            </button>
          </div>
        </div>

        {/* Triple Sentiment Bar */}
        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-purple-500" /> Distribuição de Sentimento:
            </span>
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span className="text-emerald-500 flex items-center gap-1">
                <Smile className="h-3 w-3" /> {data.summary.sentimentBreakdown.positive}% Positivo
              </span>
              <span className="text-amber-500 flex items-center gap-1">
                <Meh className="h-3 w-3" /> {data.summary.sentimentBreakdown.neutral}% Neutro
              </span>
              <span className="text-red-500 flex items-center gap-1">
                <Frown className="h-3 w-3" /> {data.summary.sentimentBreakdown.negative}% Negativo
              </span>
            </div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-muted flex">
            <div
              style={{ width: `${data.summary.sentimentBreakdown.positive}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`${data.summary.sentimentBreakdown.positive}% Positivo`}
            />
            <div
              style={{ width: `${data.summary.sentimentBreakdown.neutral}%` }}
              className="bg-amber-500 transition-all duration-500"
              title={`${data.summary.sentimentBreakdown.neutral}% Neutro`}
            />
            <div
              style={{ width: `${data.summary.sentimentBreakdown.negative}%` }}
              className="bg-red-500 transition-all duration-500"
              title={`${data.summary.sentimentBreakdown.negative}% Negativo`}
            />
          </div>
        </div>
      </div>

      {/* Pilar 1: Resumo Executivo & Perfil */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            👥 Perfil da Audiência
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {data.summary.profile}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            🎙️ Tom Predominante
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {data.summary.tone}
          </p>
        </div>

        <div className={`rounded-2xl border p-4 space-y-2 ${sentimentColor}`}>
          <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> Sentimento Geral
          </div>
          <p className="text-xs font-semibold capitalize leading-relaxed">
            {data.summary.overallSentiment}
          </p>
        </div>
      </div>

      {/* Key Takeaway Card */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
          <Lightbulb className="h-4 w-4" /> Insight Mais Valioso (Key Takeaway)
        </div>
        <p className="text-xs font-medium text-foreground leading-relaxed">
          {data.summary.keyTakeaway}
        </p>
      </div>

      {/* Pilar 4 (Destaque Principal): MINA DE OURO - IDEIAS DE VÍDEOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                💎 Mina de Ouro: Ideias de Novos Vídeos
              </h3>
              <p className="text-xs text-muted-foreground">
                Conceitos formulados diretamente para explorar as demandas e brechas dos comentários
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {data.contentIdeas.length} Oportunidades
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {data.contentIdeas.map((idea) => {
            const potentialBadge =
              idea.potential === 'viral'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                : idea.potential === 'alto'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';

            return (
              <div
                key={idea.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-purple-500/40 transition group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {idea.format}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase ${potentialBadge}`}
                    >
                      Potencial: {idea.potential}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition leading-snug">
                    {idea.title}
                  </h4>

                  <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1.5">
                    <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Flame className="h-3 w-3" /> Gancho Inicial (0-15s):
                    </p>
                    <p className="text-xs text-foreground italic leading-relaxed">
                      "{idea.hook}"
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      🎯 Por que vai funcionar:
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {idea.premise}
                    </p>
                  </div>

                  <div className="text-[10px] text-muted-foreground">
                    <strong className="text-foreground">Resolve:</strong> {idea.targetPainOrExpectation}
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() =>
                      onGenerateScript({
                        title: idea.title,
                        hook: idea.hook,
                        premise: idea.premise,
                        targetPainOrExpectation: idea.targetPainOrExpectation,
                        format: idea.format,
                      })
                    }
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 py-2.5 text-xs font-bold text-white transition shadow-sm"
                  >
                    <Clapperboard className="h-3.5 w-3.5" />
                    Gerar Roteiro Completo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Pilar 2 (Dores) e Pilar 3 (Expectativas) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pilar 2: Dores & Frustrações */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                <AlertCircle className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                🔥 Dores & Frustrações Mineradas
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {data.pains.length} identificadas
            </span>
          </div>

          <div className="space-y-3">
            {data.pains.map((pain) => {
              const intensityBadge =
                pain.intensity === 'alta'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                  : pain.intensity === 'media'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : 'bg-muted text-muted-foreground border-border';

              return (
                <div
                  key={pain.id}
                  className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-foreground">
                      {pain.topic}
                    </h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase ${intensityBadge}`}
                    >
                      Intensidade {pain.intensity}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pain.description}
                  </p>

                  {pain.evidence && pain.evidence.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Quote className="h-3 w-3 text-red-500" /> Citações dos Espectadores:
                      </p>
                      <div className="space-y-1">
                        {pain.evidence.map((quote, qIdx) => (
                          <div
                            key={qIdx}
                            className="rounded-lg border border-border bg-muted/40 p-2 text-[11px] text-foreground italic"
                          >
                            "{quote}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        onGenerateScript({
                          title: `Como Resolver: ${pain.topic}`,
                          premise: pain.description,
                          targetPainOrExpectation: `Dor do público: ${pain.topic}`,
                          format: 'Vídeo Longo',
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      <Sparkles className="h-3 w-3" /> Criar vídeo resolvendo esta dor →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pilar 3: Expectativas & Pedidos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <HelpCircle className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                🎯 Expectativas & Dúvidas Frequentes
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {data.expectations.length} identificadas
            </span>
          </div>

          <div className="space-y-3">
            {data.expectations.map((exp) => {
              return (
                <div
                  key={exp.id}
                  className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-foreground">
                      {exp.topic}
                    </h4>
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase">
                      {exp.frequency}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {exp.description}
                  </p>

                  {exp.evidence && exp.evidence.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Quote className="h-3 w-3 text-blue-500" /> Pedidos Literais:
                      </p>
                      <div className="space-y-1">
                        {exp.evidence.map((quote, qIdx) => (
                          <div
                            key={qIdx}
                            className="rounded-lg border border-border bg-muted/40 p-2 text-[11px] text-foreground italic"
                          >
                            "{quote}"
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        onGenerateScript({
                          title: `Respondendo: ${exp.topic}`,
                          premise: exp.description,
                          targetPainOrExpectation: `Expectativa dos viewers: ${exp.topic}`,
                          format: 'Vídeo Longo',
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      <Sparkles className="h-3 w-3" /> Criar vídeo atendendo este pedido →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
