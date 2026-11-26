import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { LEXICON, SENTENCES } from './data/content';
import { PASSAGES } from './data/passages';
import { clearProgress, deleteCard, deleteCustom, isBackup, loadAll, replaceAll, saveCard, saveChat, saveCustom, saveDay, saveSettings } from './lib/db';
import { buildIndex, type LexiconIndex } from './lib/segment';
import { emptyDay } from './lib/stats';
import { emptyStored, gradeCard, intervalLabels, type Grade } from './lib/srs';
import { todayKey } from './lib/dates';
import {
  DEFAULT_SETTINGS,
  type BackupFile,
  type ChatMessage,
  type DayLog,
  type Settings,
  type StoredCard,
  type Word,
} from './types';

interface AppValue {
  ready: boolean;
  error: string;
  settings: Settings;
  cards: Map<string, StoredCard>;
  days: Map<string, DayLog>;
  customWords: Word[];
  chat: ChatMessage[];
  index: LexiconIndex;
  sentences: typeof SENTENCES;
  passages: typeof PASSAGES;
  updateSettings: (patch: Partial<Settings>) => void;
  gradeWord: (wordId: string, rating: Grade) => void;
  addToDeck: (wordId: string) => void;
  removeFromDeck: (wordId: string) => void;
  addCustomWord: (word: Word) => void;
  removeCustomWord: (id: string) => void;
  addSeconds: (seconds: number) => void;
  recordExercise: (kind: string, correct: boolean) => void;
  intervalsFor: (wordId: string) => Record<Grade, string>;
  setChat: (messages: ChatMessage[]) => void;
  exportBackup: () => void;
  importBackup: (value: unknown) => Promise<void>;
  resetProgress: () => Promise<void>;
}

const Ctx = createContext<AppValue | null>(null);

function applyTheme(theme: Settings['theme']) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
  root.style.colorScheme = theme === 'system' ? 'light dark' : theme;
  try {
    localStorage.setItem('md-theme', theme);
  } catch {
    /* private mode */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [cards, setCards] = useState<Map<string, StoredCard>>(new Map());
  const [days, setDays] = useState<Map<string, DayLog>>(new Map());
  const [customWords, setCustomWords] = useState<Word[]>([]);
  const [chat, setChatState] = useState<ChatMessage[]>([]);
  const cardsRef = useRef(cards);
  const daysRef = useRef(days);
  const settingsRef = useRef(settings);
  cardsRef.current = cards;
  daysRef.current = days;
  settingsRef.current = settings;

  useEffect(() => {
    let cancel = false;
    loadAll()
      .then((data) => {
        if (cancel) return;
        setSettings(data.settings);
        setCards(new Map(data.cards.map((card) => [card.wordId, card])));
        setDays(new Map(data.days.map((day) => [day.date, day])));
        setCustomWords(data.customWords);
        setChatState(data.chat);
        applyTheme(data.settings.theme);
        setReady(true);
      })
      .catch(() => {
        if (!cancel) setError('This browser blocked on-device storage. Allow site data, then reload.');
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (ready) applyTheme(settings.theme);
  }, [settings.theme, ready]);

  const index = useMemo(() => buildIndex([...LEXICON, ...customWords]), [customWords]);

  const updateDay = useCallback((mut: (day: DayLog) => void) => {
    const key = todayKey();
    const current = daysRef.current.get(key) ?? emptyDay(key);
    const byType: DayLog['byType'] = {};
    for (const [kind, stat] of Object.entries(current.byType)) byType[kind] = { ...stat };
    const next = { ...current, byType };
    mut(next);
    const map = new Map(daysRef.current);
    map.set(key, next);
    daysRef.current = map;
    setDays(map);
    void saveDay(next);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      settingsRef.current = next;
      void saveSettings(next);
      return next;
    });
  }, []);

  const gradeWord = useCallback((wordId: string, rating: Grade) => {
    const prev = cardsRef.current.get(wordId) ?? null;
    const before = prev?.reps ?? 0;
    const next = gradeCard(prev, wordId, rating);
    const map = new Map(cardsRef.current);
    map.set(wordId, next);
    cardsRef.current = map;
    setCards(map);
    void saveCard(next);
    if (before === 0 && next.reps > 0) updateDay((day) => { day.introduced += 1; });
  }, [updateDay]);

  const addToDeck = useCallback((wordId: string) => {
    if (cardsRef.current.has(wordId)) return;
    const fresh = emptyStored(wordId);
    const map = new Map(cardsRef.current);
    map.set(wordId, fresh);
    cardsRef.current = map;
    setCards(map);
    void saveCard(fresh);
  }, []);

  const removeFromDeck = useCallback((wordId: string) => {
    const map = new Map(cardsRef.current);
    map.delete(wordId);
    cardsRef.current = map;
    setCards(map);
    void deleteCard(wordId);
  }, []);

  const addCustomWord = useCallback((word: Word) => {
    setCustomWords((prev) => [...prev.filter((item) => item.id !== word.id), word]);
    void saveCustom(word);
  }, []);

  const removeCustomWord = useCallback((id: string) => {
    setCustomWords((prev) => prev.filter((word) => word.id !== id));
    void deleteCustom(id);
    removeFromDeck(id);
  }, [removeFromDeck]);

  const addSeconds = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    updateDay((day) => { day.seconds += seconds; });
  }, [updateDay]);

  const recordExercise = useCallback((kind: string, correct: boolean) => {
    updateDay((day) => {
      if (correct) day.correct += 1;
      else day.wrong += 1;
      const row = day.byType[kind] ?? { correct: 0, wrong: 0 };
      if (correct) row.correct += 1;
      else row.wrong += 1;
      day.byType[kind] = row;
    });
  }, [updateDay]);

  const intervalsFor = useCallback((wordId: string) => {
    return intervalLabels(cardsRef.current.get(wordId) ?? null);
  }, []);

  const setChat = useCallback((messages: ChatMessage[]) => {
    const next = messages.slice(-80);
    setChatState(next);
    void saveChat(next);
  }, []);

  const exportBackup = useCallback(() => {
    const payload: BackupFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: settingsRef.current,
      cards: [...cardsRef.current.values()],
      days: [...daysRef.current.values()],
      customWords,
      chat,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mandarin-daily-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [customWords, chat]);

  const importBackup = useCallback(async (value: unknown) => {
    if (!isBackup(value)) throw new Error('That file is not a Mandarin Daily backup.');
    const settingsNext = { ...DEFAULT_SETTINGS, ...value.settings, onboarded: true };
    const backup = {
      ...value,
      settings: settingsNext,
      customWords: value.customWords ?? [],
      chat: value.chat ?? [],
    };
    await replaceAll(backup);
    setSettings(settingsNext);
    settingsRef.current = settingsNext;
    const cardMap = new Map(backup.cards.map((card) => [card.wordId, card]));
    const dayMap = new Map(backup.days.map((day) => [day.date, day]));
    cardsRef.current = cardMap;
    daysRef.current = dayMap;
    setCards(cardMap);
    setDays(dayMap);
    setCustomWords(backup.customWords);
    setChatState(backup.chat);
  }, []);

  const resetProgress = useCallback(async () => {
    await clearProgress();
    cardsRef.current = new Map();
    daysRef.current = new Map();
    setCards(new Map());
    setDays(new Map());
    setCustomWords([]);
    setChatState([]);
    setSettings((prev) => {
      const next = { ...prev, seenPassageIds: [] };
      void saveSettings(next);
      settingsRef.current = next;
      return next;
    });
  }, []);

  const value: AppValue = {
    ready,
    error,
    settings,
    cards,
    days,
    customWords,
    chat,
    index,
    sentences: SENTENCES,
    passages: PASSAGES,
    updateSettings,
    gradeWord,
    addToDeck,
    removeFromDeck,
    addCustomWord,
    removeCustomWord,
    addSeconds,
    recordExercise,
    intervalsFor,
    setChat,
    exportBackup,
    importBackup,
    resetProgress,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
