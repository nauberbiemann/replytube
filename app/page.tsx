'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Channel, ChannelContext, CommentItem } from '@/lib/types';
import {
  getStoredChannels,
  createChannel,
  updateChannel,
  removeChannel,
} from '@/lib/storage';
import { Header } from '@/components/Header';
import { ChannelManager } from '@/components/ChannelManager';
import { VideoReference } from '@/components/VideoReference';
import { CommentUploader } from '@/components/CommentUploader';
import { SessionThread } from '@/components/SessionThread';
import { PasswordModal } from '@/components/PasswordModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function DashboardPage() {
  // Autenticação e Proteção por Senha
  const [appPassword, setAppPassword] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [requiresPassword, setRequiresPassword] = useState<boolean>(false);

  // Canais e Contexto
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [channelContext, setChannelContext] = useState<ChannelContext | null>(null);
  const [contextLoading, setContextLoading] = useState<boolean>(false);

  // Vídeo de Referência
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [videoImage, setVideoImage] = useState<string>('');

  // Novo Comentário
  const [commentImage, setCommentImage] = useState<string>('');
  const [fallbackText, setFallbackText] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [ocrFailed, setOcrFailed] = useState<boolean>(false);

  // Thread da Sessão
  const [threadItems, setThreadItems] = useState<CommentItem[]>([]);

  // Notificações Toast
  const [toasts, setToasts] = useState<Toast[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const selectedChannelRef = useRef<ChannelContext | null>(null);
  const generatingRef = useRef<boolean>(false);
  const videoTitleRef = useRef<string>('');
  const videoImageRef = useRef<string>('');
  const appPasswordRef = useRef<string>('');

  // Manter refs atualizadas para os event listeners
  useEffect(() => {
    selectedChannelRef.current = channelContext;
  }, [channelContext]);

  useEffect(() => {
    generatingRef.current = generating;
  }, [generating]);

  useEffect(() => {
    videoTitleRef.current = videoTitle;
    videoImageRef.current = videoImage;
  }, [videoTitle, videoImage]);

  useEffect(() => {
    appPasswordRef.current = appPassword;
  }, [appPassword]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Verificar proteção por senha na inicialização
  useEffect(() => {
    const checkPasswordRequirement = async () => {
      const savedPass = localStorage.getItem('replytube_access_password') || '';
      try {
        const res = await fetch('/api/verify-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: savedPass }),
        });
        const data = await res.json();
        setRequiresPassword(data.requiresPassword);
        if (data.requiresPassword) {
          if (data.valid) {
            setAppPassword(savedPass);
            setIsLocked(false);
          } else {
            setIsLocked(true);
          }
        } else {
          setIsLocked(false);
        }
      } catch (err) {
        console.error('Erro ao verificar senha:', err);
      }
    };

    checkPasswordRequirement();
  }, []);

  const handleUnlockSuccess = (pass: string) => {
    localStorage.setItem('replytube_access_password', pass);
    setAppPassword(pass);
    setIsLocked(false);
    addToast('Acesso desbloqueado com sucesso!', 'success');

    // Se já havia canal carregado, ativa-o
    if (channels.length > 0 && selectedChannelId) {
      const ch = channels.find((c) => c.id === selectedChannelId);
      if (ch) analyzeChannel(ch.description, pass);
    }
  };

  const handleLockManual = () => {
    localStorage.removeItem('replytube_access_password');
    setAppPassword('');
    setIsLocked(true);
    addToast('Aplicativo bloqueado.', 'info');
  };

  // Carregar canais do localStorage ao iniciar
  useEffect(() => {
    const stored = getStoredChannels();
    setChannels(stored);
    if (stored.length > 0) {
      handleSelectChannel(stored[0].id, stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analisar contexto do canal selecionado
  const analyzeChannel = async (description: string, passOverride?: string) => {
    setContextLoading(true);
    try {
      const pass = passOverride !== undefined ? passOverride : appPasswordRef.current;
      const res = await fetch('/api/analyze-channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-password': pass,
        },
        body: JSON.stringify({ channelDescription: description }),
      });

      if (res.status === 401) {
        setIsLocked(true);
        throw new Error('Acesso bloqueado: senha incorreta ou necessária.');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao analisar canal.');
      }

      const ctx: ChannelContext = {
        ...data,
        channelDescription: description,
      };

      setChannelContext(ctx);
      addToast('Canal ativado! Cole o print do comentário para responder.', 'success');
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || 'Erro ao analisar o canal.', 'error');
    } finally {
      setContextLoading(false);
    }
  };

  const handleSelectChannel = (id: string, list = channels) => {
    const channel = list.find((c) => c.id === id);
    if (!channel) return;
    setSelectedChannelId(id);
    analyzeChannel(channel.description);
  };

  const handleCreateChannel = (name: string, description: string) => {
    const created = createChannel(name, description);
    const updated = [...channels, created];
    setChannels(updated);
    setSelectedChannelId(created.id);
    analyzeChannel(created.description);
  };

  const handleEditChannel = (id: string, name: string, description: string) => {
    const updated = updateChannel(id, name, description);
    setChannels(updated);
    if (selectedChannelId === id) {
      analyzeChannel(description);
    }
  };

  const handleRemoveChannel = (id: string) => {
    const updated = removeChannel(id);
    setChannels(updated);
    if (selectedChannelId === id) {
      if (updated.length > 0) {
        handleSelectChannel(updated[0].id, updated);
      } else {
        setSelectedChannelId('');
        setChannelContext(null);
      }
    }
  };

  // Gerar resposta do comentário
  const handleGenerateReply = useCallback(
    async (overrideImage?: string, overrideText?: string) => {
      const imageToSend = overrideImage !== undefined ? overrideImage : commentImage;
      const textToSend = overrideText !== undefined ? overrideText : fallbackText;

      const currentContext = selectedChannelRef.current;
      if (!currentContext) {
        addToast('Selecione e ative um canal antes de gerar respostas.', 'info');
        return;
      }

      if (!imageToSend && !textToSend.trim()) {
        addToast('Envie um print ou digite o texto do comentário.', 'info');
        return;
      }

      if (generatingRef.current) return;

      setOcrFailed(false);
      setGenerating(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch('/api/generate-reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-app-password': appPasswordRef.current,
          },
          body: JSON.stringify({
            context: currentContext,
            commentImageDataUrl: imageToSend,
            commentTextFallback: textToSend,
            videoTitle: videoTitleRef.current,
            videoImageDataUrl: videoImageRef.current,
          }),
          signal: controller.signal,
        });

        if (res.status === 401) {
          setIsLocked(true);
          throw new Error('Acesso bloqueado: senha incorreta ou necessária.');
        }

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 422) {
            setOcrFailed(true);
          }
          throw new Error(data.error || 'Falha ao processar o comentário.');
        }

        const newItem: CommentItem = {
          id: crypto.randomUUID(),
          nickname: data.nickname,
          commentText: data.commentText,
          reply: data.reply,
          imageDataUrl: imageToSend,
          createdAt: new Date().toISOString(),
        };

        setThreadItems((prev) => [newItem, ...prev]);
        setCommentImage('');
        setFallbackText('');
        addToast(`Resposta gerada para @${data.nickname.replace(/^@/, '')}!`, 'success');
      } catch (err: any) {
        if (controller.signal.aborted) {
          addToast('Geração de resposta cancelada.', 'info');
          return;
        }
        addToast(err?.message || 'Erro ao gerar resposta.', 'error');
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setGenerating(false);
      }
    },
    [commentImage, fallbackText]
  );

  const handleCancelGenerate = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setGenerating(false);
  };

  // Refinar resposta existente
  const handleRefineReply = async (id: string, instruction: string) => {
    const item = threadItems.find((t) => t.id === id);
    if (!item) return;

    try {
      const res = await fetch('/api/refine-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-password': appPasswordRef.current,
        },
        body: JSON.stringify({
          commentText: item.commentText,
          nickname: item.nickname,
          previousReply: item.reply,
          instruction,
          videoTitle: videoTitleRef.current,
          context: selectedChannelRef.current,
        }),
      });

      if (res.status === 401) {
        setIsLocked(true);
        throw new Error('Acesso bloqueado: senha incorreta ou necessária.');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao refinar resposta.');
      }

      setThreadItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, reply: data.reply } : it))
      );
      addToast('Resposta refinada com sucesso!', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Erro ao refinar resposta.', 'error');
    }
  };

  // Resetar ciclo da sessão
  const handleResetCycle = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setGenerating(false);
    setCommentImage('');
    setFallbackText('');
    setVideoTitle('');
    setVideoImage('');
    setThreadItems([]);
    addToast('Novo ciclo iniciado!', 'info');
  };

  // Global Paste Listener (Ctrl+V em qualquer lugar da tela)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Ignorar se a tela estiver bloqueada por senha
      if (isLocked) return;

      const activeEl = document.activeElement;
      if (
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItem = Array.from(items).find((item) =>
        item.type.startsWith('image/')
      );

      if (!imageItem) return;

      if (!selectedChannelRef.current) {
        addToast('Cadastre ou selecione um canal antes de colar o print.', 'info');
        return;
      }

      if (generatingRef.current) {
        e.preventDefault();
        addToast('Aguarde a resposta atual antes de colar outro comentário.', 'info');
        return;
      }

      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        setCommentImage(dataUrl);
        handleGenerateReply(dataUrl, '');
      };
      reader.readAsDataURL(file);
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [handleGenerateReply, isLocked]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        onResetCycle={handleResetCycle}
        hasPassword={requiresPassword}
        onLock={handleLockManual}
      />

      {/* Modal de Bloqueio por Senha */}
      <PasswordModal isOpen={isLocked} onSuccess={handleUnlockSuccess} />

      {/* Floating Toasts */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-3 text-xs shadow-lg backdrop-blur-md transition animate-in fade-in slide-in-from-top-2 duration-200 ${
              toast.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200'
                : toast.type === 'error'
                ? 'border-red-500/30 bg-red-950/90 text-red-200'
                : 'border-border bg-card/95 text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
              {toast.type === 'info' && <Info className="h-4 w-4 text-blue-400 shrink-0" />}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded p-0.5 opacity-70 hover:opacity-100 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <main className="mx-auto max-w-6xl px-4 pt-6">
        <div className="grid items-start gap-6 lg:grid-cols-[380px,1fr]">
          {/* Coluna Esquerda: Contexto, Vídeo e Novo Comentário */}
          <aside className="space-y-4">
            <ChannelManager
              channels={channels}
              selectedId={selectedChannelId}
              onSelect={(id) => handleSelectChannel(id)}
              onCreate={handleCreateChannel}
              onEdit={handleEditChannel}
              onRemove={handleRemoveChannel}
              loading={contextLoading}
              context={channelContext}
            />

            <VideoReference
              title={videoTitle}
              onTitleChange={setVideoTitle}
              image={videoImage}
              onImageChange={setVideoImage}
              disabled={generating}
            />

            <CommentUploader
              image={commentImage}
              onImageChange={setCommentImage}
              fallbackText={fallbackText}
              onFallbackTextChange={setFallbackText}
              onSubmit={() => handleGenerateReply()}
              loading={generating}
              disabled={!channelContext}
              onCancel={handleCancelGenerate}
              ocrFailed={ocrFailed}
            />
          </aside>

          {/* Coluna Direita: Thread da Sessão com Histórico e Refinamento */}
          <SessionThread
            items={threadItems}
            onRefine={handleRefineReply}
          />
        </div>
      </main>
    </div>
  );
}
