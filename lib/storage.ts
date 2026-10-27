import { Channel, SavedTopic } from './types';

const STORAGE_KEY = 'replytube.channels';
const TOPICS_STORAGE_KEY = 'replytube.saved_topics';

export function getStoredChannels(): Channel[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChannels(channels: Channel[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
  } catch (err) {
    console.error('Erro ao salvar canais no localStorage:', err);
  }
}

export function createChannel(name: string, description: string): Channel {
  const newChannel: Channel = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString(),
  };
  const current = getStoredChannels();
  const updated = [...current, newChannel];
  saveChannels(updated);
  return newChannel;
}

export function updateChannel(id: string, name: string, description: string, cachedContext?: Channel['cachedContext']): Channel[] {
  const current = getStoredChannels();
  const updated = current.map((c) => {
    if (c.id !== id) return c;
    const descChanged = c.description !== description.trim();
    return {
      ...c,
      name: name.trim(),
      description: description.trim(),
      cachedContext: cachedContext !== undefined ? cachedContext : descChanged ? undefined : c.cachedContext,
    };
  });
  saveChannels(updated);
  return updated;
}

export function saveChannelContextCache(id: string, cachedContext: Channel['cachedContext']): Channel[] {
  const current = getStoredChannels();
  const updated = current.map((c) => (c.id === id ? { ...c, cachedContext } : c));
  saveChannels(updated);
  return updated;
}

export function removeChannel(id: string): Channel[] {
  const current = getStoredChannels();
  const updated = current.filter((c) => c.id !== id);
  saveChannels(updated);
  return updated;
}

export function getStoredTopics(): SavedTopic[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TOPICS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredTopics(topics: SavedTopic[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
  } catch (err) {
    console.error('Erro ao salvar temas no localStorage:', err);
  }
}

export function addSavedTopic(
  topic: Omit<SavedTopic, 'id' | 'createdAt'>
): { saved: SavedTopic; list: SavedTopic[]; alreadyExisted: boolean } {
  const current = getStoredTopics();
  const normalizedTitle = topic.topicTitle.trim().toLowerCase();
  const normalizedComment = topic.commentText.trim().slice(0, 120).toLowerCase();

  const existing = current.find(
    (t) =>
      t.channelName === topic.channelName &&
      (t.topicTitle.trim().toLowerCase() === normalizedTitle ||
        (normalizedComment.length > 20 &&
          t.commentText.trim().slice(0, 120).toLowerCase() === normalizedComment))
  );

  if (existing) {
    return { saved: existing, list: current, alreadyExisted: true };
  }

  const newTopic: SavedTopic = {
    id: crypto.randomUUID(),
    channelId: topic.channelId,
    channelName: topic.channelName || 'Geral',
    topicTitle: topic.topicTitle.trim(),
    commentText: topic.commentText.trim().slice(0, 350),
    nickname: topic.nickname || 'Inscrito',
    sourceVideoTitle: topic.sourceVideoTitle?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  const updated = [newTopic, ...current];
  saveStoredTopics(updated);
  return { saved: newTopic, list: updated, alreadyExisted: false };
}

export function updateSavedTopicTitle(id: string, topicTitle: string): SavedTopic[] {
  const current = getStoredTopics();
  const updated = current.map((t) =>
    t.id === id ? { ...t, topicTitle: topicTitle.trim() } : t
  );
  saveStoredTopics(updated);
  return updated;
}

export function removeSavedTopic(id: string): SavedTopic[] {
  const current = getStoredTopics();
  const updated = current.filter((t) => t.id !== id);
  saveStoredTopics(updated);
  return updated;
}
