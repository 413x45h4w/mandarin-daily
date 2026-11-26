import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { BackupFile, ChatMessage, DayLog, Settings, StoredCard, Word } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface Schema extends DBSchema {
  kv: { key: string; value: Settings };
  cards: { key: string; value: StoredCard };
  days: { key: string; value: DayLog };
  custom: { key: string; value: Word };
  chat: { key: string; value: ChatMessage };
}

let database: Promise<IDBPDatabase<Schema>> | null = null;

function db() {
  if (!database) {
    database = openDB<Schema>('mandarin-daily', 1, {
      upgrade(store) {
        store.createObjectStore('kv');
        store.createObjectStore('cards', { keyPath: 'wordId' });
        store.createObjectStore('days', { keyPath: 'date' });
        store.createObjectStore('custom', { keyPath: 'id' });
        store.createObjectStore('chat', { keyPath: 'id' });
      },
    });
  }
  return database;
}

export async function loadAll(): Promise<{
  settings: Settings;
  cards: StoredCard[];
  days: DayLog[];
  customWords: Word[];
  chat: ChatMessage[];
}> {
  const store = await db();
  const [settings, cards, days, customWords, chat] = await Promise.all([
    store.get('kv', 'settings'),
    store.getAll('cards'),
    store.getAll('days'),
    store.getAll('custom'),
    store.getAll('chat'),
  ]);
  return {
    settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) },
    cards,
    days,
    customWords,
    chat: chat.sort((a, b) => a.at - b.at),
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const store = await db();
  await store.put('kv', settings, 'settings');
}

export async function saveCard(card: StoredCard): Promise<void> {
  const store = await db();
  await store.put('cards', card);
}

export async function deleteCard(wordId: string): Promise<void> {
  const store = await db();
  await store.delete('cards', wordId);
}

export async function saveDay(day: DayLog): Promise<void> {
  const store = await db();
  await store.put('days', day);
}

export async function saveCustom(word: Word): Promise<void> {
  const store = await db();
  await store.put('custom', word);
}

export async function deleteCustom(id: string): Promise<void> {
  const store = await db();
  await store.delete('custom', id);
}

export async function saveChat(messages: ChatMessage[]): Promise<void> {
  const store = await db();
  const tx = store.transaction('chat', 'readwrite');
  await tx.store.clear();
  for (const message of messages.slice(-80)) await tx.store.put(message);
  await tx.done;
}

export async function replaceAll(backup: BackupFile): Promise<void> {
  const store = await db();
  const tx = store.transaction(['kv', 'cards', 'days', 'custom', 'chat'], 'readwrite');
  await Promise.all([
    tx.objectStore('cards').clear(),
    tx.objectStore('days').clear(),
    tx.objectStore('custom').clear(),
    tx.objectStore('chat').clear(),
  ]);
  await tx.objectStore('kv').put(backup.settings, 'settings');
  for (const card of backup.cards) await tx.objectStore('cards').put(card);
  for (const day of backup.days) await tx.objectStore('days').put(day);
  for (const word of backup.customWords) await tx.objectStore('custom').put(word);
  for (const message of backup.chat.slice(-80)) await tx.objectStore('chat').put(message);
  await tx.done;
}

export async function clearProgress(): Promise<void> {
  const store = await db();
  const tx = store.transaction(['cards', 'days', 'custom', 'chat'], 'readwrite');
  await Promise.all([
    tx.objectStore('cards').clear(),
    tx.objectStore('days').clear(),
    tx.objectStore('custom').clear(),
    tx.objectStore('chat').clear(),
  ]);
  await tx.done;
}

export function isBackup(value: unknown): value is BackupFile {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<BackupFile>;
  return row.version === 1 && !!row.settings && Array.isArray(row.cards) && Array.isArray(row.days);
}
