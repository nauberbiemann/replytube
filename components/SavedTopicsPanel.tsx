'use client';

import React, { useState, useMemo } from 'react';
import { SavedTopic } from '@/lib/types';
import {
  Lightbulb,
  Copy,
  Check,
  Trash2,
  Download,
  Search,
  Plus,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Film,
} from 'lucide-react';

interface SavedTopicsPanelProps {
  topics: SavedTopic[];
  activeChannelName?: string;
  onAddManualTopic: (title: string) => void;
  onUpdateTopic: (id: string, newTitle: string) => void;
  onRemoveTopic: (id: string) => void;
}

export function SavedTopicsPanel({
  topics,
  activeChannelName,
  onAddManualTopic,
  onUpdateTopic,
  onRemoveTopic,
}: SavedTopicsPanelProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filterChannel, setFilterChannel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [manualTitle, setManualTitle] = useState<string>('');

  const channelNames = useMemo(() => {
    const set = new Set<string>();
    topics.forEach((t) => {
      if (t.channelName) set.add(t.channelName);
    });
    return Array.from(set);
  }, [topics]);

  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      if (filterChannel !== 'ALL' && t.channelName !== filterChannel) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.topicTitle.toLowerCase().includes(q) ||
          t.commentText.toLowerCase().includes(q) ||
          t.nickname.toLowerCase().includes(q) ||
          (t.sourceVideoTitle || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [topics, filterChannel, searchQuery]);

  const handleCopyAll = async () => {
    if (filteredTopics.length === 0) return;
    const text = filteredTopics
      .map(
        (t, idx) =>
          `${idx + 1}. [${t.channelName}] ${t.topicTitle}${
            t.sourceVideoTitle ? ` (Origem: ${t.sourceVideoTitle})` : ''
          }\n   💬 Comentário (${t.nickname}): "${t.commentText}"`
      )
      .join('\n\n');

    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportCsv = () => {
    if (filteredTopics.length === 0) return;
    const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    const headers = ['Data', 'Canal', 'Tema Sugerido', 'Inscrito', 'Comentario Original', 'Video de Origem'];
    const rows = filteredTopics.map((t) => [
      new Date(t.createdAt).toLocaleDateString('pt-BR'),
      escapeCsv(t.channelName),
      escapeCsv(t.topicTitle),
      escapeCsv(t.nickname),
      escapeCsv(t.commentText),
      escapeCsv(t.sourceVideoTitle || ''),
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `banco-de-temas-replytube-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    onAddManualTopic(manualTitle.trim());
    setManualTitle('');
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-card shadow-sm overflow-hidden">
      {/* Cabeçalho Expansível */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-500/5 hover:bg-amber-500/10 transition text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                Banco de Temas dos Comentários
              </span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                {topics.length} {topics.length === 1 ? 'tema salvo' : 'temas salvos'}
              </span>
              <span className="hidden sm:inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                ⚡ Salvo Automático & Permanente
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              A IA identifica e guarda automaticamente boas ideias de vídeos nos comentários (não apaga ao fechar ou limpar sessão).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
          <span>{isOpen ? 'Ocultar' : 'Ver Temas'}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-border space-y-3">
          {/* Barra de Filtros, Busca e Exportação */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar tema, palavra-chave ou inscrito..."
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {channelNames.length > 1 && (
                <select
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                  className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">Todos os canais ({topics.length})</option>
                  {channelNames.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyAll}
                disabled={filteredTopics.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition disabled:opacity-50"
              >
                {copiedAll ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Lista Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    Copiar Todos ({filteredTopics.length})
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredTopics.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50"
                title="Baixar planilha CSV compatível com Excel"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar CSV
              </button>
            </div>
          </div>

          {/* Adicionar Tema Manual */}
          <form onSubmit={handleSaveManual} className="flex gap-2">
            <input
              type="text"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder={`Adicionar ideia avulsa de tema para ${activeChannelName || 'o canal'}...`}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={!manualTitle.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 transition disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Salvar Tema
            </button>
          </form>

          {/* Lista de Temas Salvos */}
          {filteredTopics.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
              Nenhum tema salvo ainda. Quando você responder comentários que tragam boas pautas, a IA salvará os temas aqui automaticamente!
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="rounded-lg border border-border/80 bg-muted/20 p-3 flex flex-col gap-1.5 hover:border-amber-500/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                          {topic.channelName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(topic.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        {topic.sourceVideoTitle && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground truncate max-w-xs">
                            <Film className="h-2.5 w-2.5 shrink-0" />
                            {topic.sourceVideoTitle}
                          </span>
                        )}
                      </div>

                      {editingId === topic.id ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1 rounded border border-amber-500 bg-background px-2 py-1 text-xs text-foreground"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (editingText.trim()) {
                                onUpdateTopic(topic.id, editingText.trim());
                              }
                              setEditingId(null);
                            }}
                            className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-foreground leading-snug">
                          💡 {topic.topicTitle}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(topic.topicTitle);
                          setCopiedId(topic.id);
                          setTimeout(() => setCopiedId(null), 1500);
                        }}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                        title="Copiar título do tema"
                      >
                        {copiedId === topic.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(topic.id);
                          setEditingText(topic.topicTitle);
                        }}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                        title="Editar tema"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveTopic(topic.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition"
                        title="Excluir tema"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {topic.commentText && (
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-background/50 rounded px-2 py-1.5 border border-border/40">
                      <MessageSquare className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/70" />
                      <span className="line-clamp-2">
                        <strong className="text-foreground/80">
                          @{topic.nickname.replace(/^@/, '')}:
                        </strong>{' '}
                        {topic.commentText}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
