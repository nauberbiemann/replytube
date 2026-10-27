'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Channel, ChannelContext, CommentItem, SavedTopic } from '@/lib/types';
import {
  getStoredChannels,
  createChannel,
  updateChannel,
  removeChannel,
  saveChannelContextCache,
  getStoredTopics,
  addSavedTopic,
  updateSavedTopicTitle,
  removeSavedTopic,
} from '@/lib/storage';
import { optimizeImageFile } from '@/lib/image-optimizer';
import { Header } from '@/components/Header';
import { ChannelManager } from '@/components/ChannelManager';
import { VideoReference } from '@/components/VideoReference';
import { CommentUploader } from '@/components/CommentUploader';
import { SessionThread } from '@/components/SessionThread';
import { SavedTopicsPanel } from '@/components/SavedTopicsPanel';
import { PasswordModal } from '@/components/PasswordModal';
import { InsightsView } from '@/components/InsightsView';
import { EvergreenView } from '@/components/EvergreenView';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function DashboardPage() {
  // Navegação de Abas
  const [activeTab, setActiveTab] = useState<'replies' | 'insights' | 'evergreen'>('replies');
  const activeTabRef = useRef<'replies' | 'insights' | 'evergreen'>('replies');

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

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

  // Banco de Temas Salvos (Permanente no localStorage)
  const [savedTopics, setSavedTopics] = useState<SavedTopic[]>([]);

  // Notificações Toast
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const selectedModelRef = useRef<string>('gpt-4o-mini');

  const abortControllerRef = useRef<AbortController | null>(null);
  const selectedChannelRef = useRef<ChannelContext | null>(null);
  const selectedChannelIdRef = useRef<string>('');
  const generatingRef = useRef<boolean>(false);
  const videoTitleRef = useRef<string>('');
  const videoImageRef = useRef<string>('');
  const appPasswordRef = useRef<string>('');

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  useEffect(() => {
    const saved = localStorage.getItem('replytube_selected_model');
    if (saved && ['gpt-4o-mini', 'gpt-4o'].includes(saved)) {
      setSelectedModel(saved);
      selectedModelRef.current = saved;
    }
  }, []);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    selectedModelRef.current = model;
    localStorage.setItem('replytube_selected_model', model);
    addToast(
      model === 'gpt-4o'
        ? 'Modelo alternado para GPT-4o (Máxima precisão e raciocínio).'
        : 'Modelo alternado para GPT-4o-mini (Rápido e econômico).',
      'info'
    );
  };

  // Manter refs atualizadas para os event listeners
  useEffect(() => {
    selectedChannelRef.current = channelContext;
  }, [channelContext]);

  useEffect(() => {
    selectedChannelIdRef.current = selectedChannelId;
  }, [selectedChannelId]);

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
      if (ch) {
        if (ch.cachedContext) {
          setChannelContext({ ...ch.cachedContext, channelDescription: ch.description });
        } else {
          analyzeChannel(ch.description, pass, ch.id);
        }
      }
    }
  };

  const handleLockManual = () => {
    localStorage.removeItem('replytube_access_password');
    setAppPassword('');
    setIsLocked(true);
    addToast('Aplicativo bloqueado.', 'info');
  };

  // Carregar canais e banco de temas do localStorage ao iniciar
  useEffect(() => {
    const stored = getStoredChannels();
    setChannels(stored);
    if (stored.length > 0) {
      handleSelectChannel(stored[0].id, stored);
    }
    setSavedTopics(getStoredTopics());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analisar contexto do canal selecionado
  const analyzeChannel = async (description: string, passOverride?: string, channelIdToCache?: string) => {
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
      if (channelIdToCache) {
        const updatedList = saveChannelContextCache(channelIdToCache, ctx);
        setChannels(updatedList);
      }
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
    if (channel.cachedContext) {
      setChannelContext({
        ...channel.cachedContext,
        channelDescription: channel.description,
      });
      return;
    }
    analyzeChannel(channel.description, undefined, channel.id);
  };

  const handleCreateChannel = (name: string, description: string) => {
    const created = createChannel(name, description);
    const updated = [...channels, created];
    setChannels(updated);
    setSelectedChannelId(created.id);
    analyzeChannel(created.description, undefined, created.id);
  };

  const handleEditChannel = (id: string, name: string, description: string) => {
    const updated = updateChannel(id, name, description);
    setChannels(updated);
    if (selectedChannelId === id) {
      analyzeChannel(description, undefined, id);
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
            recentReplies: threadItems.slice(0, 2).map((t) => t.reply),
            model: selectedModelRef.current,
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

        const resolvedVideoTitle =
          videoTitleRef.current.trim() || data.detectedVideoTitle || '';

        if (data.detectedVideoTitle && !videoTitleRef.current.trim()) {
          setVideoTitle(data.detectedVideoTitle);
        }

        const storedChs = getStoredChannels();
        const activeCh = storedChs.find((c) => c.id === selectedChannelIdRef.current);
        const channelName = activeCh?.name || currentContext.nicho || 'Canal';

        const extractedList: any[] =
          Array.isArray(data.comments) && data.comments.length > 0
            ? data.comments
            : [
                {
                  nickname: data.nickname,
                  personName: data.personName,
                  commentText: data.commentText,
                  videoTitle: resolvedVideoTitle,
                  suggestedTopic: data.suggestedTopic,
                  reply: data.reply,
                },
              ];

        const newItems: CommentItem[] = [];
        let latestSavedTopics = getStoredTopics();

        for (const entry of extractedList) {
          let savedTopicId: string | undefined;
          const rawTopic = (entry.suggestedTopic || '').trim();
          const itemVideoTitle = entry.videoTitle || resolvedVideoTitle;

          if (rawTopic.length > 5) {
            const result = addSavedTopic({
              channelId: selectedChannelIdRef.current || undefined,
              channelName,
              topicTitle: rawTopic,
              commentText: entry.commentText || textToSend,
              nickname: entry.nickname || 'Inscrito',
              sourceVideoTitle: itemVideoTitle,
            });
            savedTopicId = result.saved.id;
            latestSavedTopics = result.list;
          }

          newItems.push({
            id: crypto.randomUUID(),
            nickname: entry.nickname || 'Espectador',
            personName: entry.personName || '',
            commentText: entry.commentText || textToSend,
            reply: entry.reply || '',
            suggestedTopic: rawTopic || undefined,
            savedTopicId,
            imageDataUrl: imageToSend,
            createdAt: new Date().toISOString(),
          });
        }

        setSavedTopics(latestSavedTopics);
        setThreadItems((prev) => [...newItems, ...prev]);
        setCommentImage('');
        setFallbackText('');

        if (newItems.length > 1) {
          addToast(
            `${newItems.length} comentários divididos e respondidos individualmente!`,
            'success'
          );
        } else {
          const displayName =
            newItems[0]?.personName ||
            (newItems[0]?.nickname || '').replace(/^@/, '');
          addToast(`Resposta gerada para ${displayName}!`, 'success');
        }
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
          personName: item.personName,
          previousReply: item.reply,
          instruction,
          videoTitle: videoTitleRef.current,
          context: selectedChannelRef.current,
          model: selectedModelRef.current,
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

  // Gerenciamento do Banco de Temas Salvos
  const handleAddManualTopic = (title: string) => {
    const activeCh = channels.find((c) => c.id === selectedChannelId);
    const channelName = activeCh?.name || channelContext?.nicho || 'Geral';
    const result = addSavedTopic({
      channelId: selectedChannelId || undefined,
      channelName,
      topicTitle: title,
      commentText: '',
      nickname: 'Manual',
      sourceVideoTitle: videoTitle,
    });
    setSavedTopics(result.list);
    addToast('Tema adicionado ao Banco de Temas!', 'success');
  };

  const handleUpdateSavedTopic = (id: string, newTitle: string) => {
    const updated = updateSavedTopicTitle(id, newTitle);
    setSavedTopics(updated);
    setThreadItems((prev) =>
      prev.map((it) =>
        it.savedTopicId === id ? { ...it, suggestedTopic: newTitle } : it
      )
    );
    addToast('Tema atualizado!', 'success');
  };

  const handleRemoveSavedTopic = (id: string, commentId?: string) => {
    const updated = removeSavedTopic(id);
    setSavedTopics(updated);
    setThreadItems((prev) =>
      prev.map((it) =>
        it.savedTopicId === id || (commentId && it.id === commentId)
          ? { ...it, savedTopicId: undefined }
          : it
      )
    );
    addToast('Tema removido do Banco de Temas.', 'info');
  };

  const handleManualSaveFromComment = (commentId: string, topicTitle: string) => {
    const item = threadItems.find((t) => t.id === commentId);
    if (!item) return;
    const activeCh = channels.find((c) => c.id === selectedChannelId);
    const channelName = activeCh?.name || channelContext?.nicho || 'Canal';
    const result = addSavedTopic({
      channelId: selectedChannelId || undefined,
      channelName,
      topicTitle,
      commentText: item.commentText,
      nickname: item.nickname,
      sourceVideoTitle: videoTitle,
    });
    setSavedTopics(result.list);
    setThreadItems((prev) =>
      prev.map((it) =>
        it.id === commentId
          ? { ...it, suggestedTopic: topicTitle, savedTopicId: result.saved.id }
          : it
      )
    );
    addToast('Tema salvo no Banco de Temas!', 'success');
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
      if (activeTabRef.current !== 'replies') {
        return;
      }

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

      optimizeImageFile(file, {
        maxWidth: 960,
        quality: 0.82,
      })
        .then((optimizedDataUrl) => {
          setCommentImage(optimizedDataUrl);
          handleGenerateReply(optimizedDataUrl, '');
        })
        .catch(() => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = String(reader.result || '');
            setCommentImage(dataUrl);
            handleGenerateReply(dataUrl, '');
          };
          reader.readAsDataURL(file);
        });
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
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
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
        {activeTab === 'replies' ? (
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

            {/* Coluna Direita: Banco de Temas Salvos + Thread da Sessão */}
            <div className="space-y-4">
              <SavedTopicsPanel
                topics={savedTopics}
                activeChannelName={
                  channels.find((c) => c.id === selectedChannelId)?.name
                }
                onAddManualTopic={handleAddManualTopic}
                onUpdateTopic={handleUpdateSavedTopic}
                onRemoveTopic={(id) => handleRemoveSavedTopic(id)}
              />

              <SessionThread
                items={threadItems}
                onRefine={handleRefineReply}
                onRemoveSavedTopic={(commentId, savedId) =>
                  handleRemoveSavedTopic(savedId, commentId)
                }
                onManualSaveTopic={handleManualSaveFromComment}
              />
            </div>
          </div>
        ) : activeTab === 'insights' ? (
          <InsightsView
            appPassword={appPassword}
            channelContext={channelContext}
            addToast={addToast}
          />
        ) : (
          <EvergreenView
            appPassword={appPassword}
            addToast={addToast}
            onNavigateToMinaDeOuro={(topic) => {
              setActiveTab('insights');
              addToast(`Tema "${topic}" selecionado para a Mina de Ouro!`, 'info');
            }}
          />
        )}
      </main>
    </div>
  );
}
