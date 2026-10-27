import { Channel } from './types';

const STORAGE_KEY = 'replytube.channels';

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
