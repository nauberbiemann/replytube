'use client';

import React, { useState } from 'react';
import { Channel, ChannelContext } from '@/lib/types';
import {
  Radio,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';

interface ChannelManagerProps {
  channels: Channel[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string, description: string) => void;
  onEdit: (id: string, name: string, description: string) => void;
  onRemove: (id: string) => void;
  loading: boolean;
  context: ChannelContext | null;
}

export function ChannelManager({
  channels,
  selectedId,
  onSelect,
  onCreate,
  onEdit,
  onRemove,
  loading,
  context,
}: ChannelManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const selectedChannel = channels.find((c) => c.id === selectedId) ?? null;

  const handleOpenNew = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (channel: Channel) => {
    setEditingId(channel.id);
    setName(channel.name);
    setDescription(channel.description);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    if (editingId) {
      onEdit(editingId, name, description);
    } else {
      onCreate(name, description);
    }
    setModalOpen(false);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-1 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-semibold tracking-tight">Contexto do canal</h2>
        </div>
        {context && !loading && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Canal Ativo
          </span>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Canal cadastrado</label>
        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
          >
            <option value="" disabled>
              {channels.length ? 'Selecione um canal...' : 'Nenhum canal cadastrado'}
            </option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            Novo
          </button>
        </div>

        {selectedChannel && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {selectedChannel.description}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenEdit(selectedChannel)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                title="Editar canal"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(selectedChannel.id)}
                className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition"
                title="Remover canal"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-red-500" />
          <span>Ativando tom de voz e diretrizes do canal com IA...</span>
        </div>
      )}

      {context && !loading && (
        <div className="space-y-2 rounded-lg border border-border/80 bg-muted/30 p-3.5 text-xs leading-relaxed">
          <div>
            <span className="font-semibold text-foreground">Nicho:</span>{' '}
            <span className="text-muted-foreground">{context.nicho}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">Tom de Voz:</span>{' '}
            <span className="text-muted-foreground">{context.tomDeVoz}</span>
          </div>
          {context.publico && (
            <div>
              <span className="font-semibold text-foreground">Público:</span>{' '}
              <span className="text-muted-foreground">{context.publico}</span>
            </div>
          )}
          {context.temasChave && context.temasChave.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {context.temasChave.map((tema) => (
                <span
                  key={tema}
                  className="rounded-md bg-background px-2 py-0.5 text-[11px] font-medium text-foreground/80 border border-border/80 shadow-2xs"
                >
                  {tema}
                </span>
              ))}
            </div>
          )}
          {context.resumo && (
            <p className="pt-1 text-[11px] text-muted-foreground border-t border-border/50">
              {context.resumo}
            </p>
          )}
        </div>
      )}

      {/* Modal Dialog para Cadastro/Edição */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {editingId ? 'Editar Canal' : 'Cadastrar Novo Canal'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {editingId
                    ? 'Atualize as diretrizes do canal. O contexto será reanalisado.'
                    : 'Informe o nome e o tom de voz para a IA calibrar as respostas.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="ch-name">
                  Nome do canal
                </label>
                <input
                  id="ch-name"
                  type="text"
                  placeholder="Ex.: Radar Polonês, AutoFlow, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="ch-desc">
                  Diretrizes, Nicho e Tom de Voz
                </label>
                <textarea
                  id="ch-desc"
                  rows={5}
                  placeholder="Cole aqui o nicho, estilo de escrita, vocabulário característico, se deve responder com humor, de forma técnica ou formal..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !description.trim()}
                  className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {editingId ? 'Salvar Alterações' : 'Salvar Canal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
