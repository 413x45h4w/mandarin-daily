export type Track = 'classic' | 'hsk3';
export type Theme = 'system' | 'light' | 'dark';
export type GoalMinutes = 10 | 20 | 30;

export interface Word {
  id: string;
  s: string;
  t: string;
  p: string;
  n: string;
  m: string;
  /** Classic HSK 2.0 level, 1–6. 0 if the word is not on that list. */
  h: number;
  /** New HSK 3.0 band, 1–6, or 7 for bands 7–9. 0 if absent. */
  b: number;
  /** Lower is more frequent. */
  q: number;
  pos: string;
  /** 0 = preferred reading for study, 1 = extra pronunciation. */
  alt: number;
}

export interface Sentence {
  id: string;
  zh: string;
  en: string;
  py: string;
  tiles: string[];
  h: number;
  b: number;
  src: 'original' | 'tatoeba';
}

export interface Passage {
  id: string;
  h: number;
  b: number;
  /** Short label such as diary, dialogue, news. */
  format?: string;
  title: string;
  paragraphs: string[];
  questions: { prompt: string; options: string[]; answer: number }[];
}

export interface Settings {
  onboarded: boolean;
  track: Track;
  level: number;
  goalMinutes: GoalMinutes;
  showPinyin: boolean;
  toneColors: boolean;
  traditional: boolean;
  theme: Theme;
  reminderEnabled: boolean;
  reminderTime: string;
  voiceURI: string;
  ollamaUrl: string;
  ollamaModel: string;
  voiceHintDismissed: boolean;
  installHintDismissed: boolean;
  /** Passage ids the reader has already seen, oldest first. */
  seenPassageIds?: string[];
}

export interface StoredCard {
  wordId: string;
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: number | null;
}

export interface TypeStat {
  correct: number;
  wrong: number;
}

export interface DayLog {
  date: string;
  seconds: number;
  correct: number;
  wrong: number;
  introduced: number;
  byType: Record<string, TypeStat>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  zh: string;
  py: string;
  en: string;
  note: string;
  at: number;
}

export interface BackupFile {
  version: 1;
  exportedAt: string;
  settings: Settings;
  cards: StoredCard[];
  days: DayLog[];
  customWords: Word[];
  chat: ChatMessage[];
}

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  track: 'classic',
  level: 1,
  goalMinutes: 10,
  showPinyin: true,
  toneColors: true,
  traditional: false,
  theme: 'system',
  reminderEnabled: false,
  reminderTime: '20:00',
  voiceURI: '',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'qwen3-abliterated',
  voiceHintDismissed: false,
  installHintDismissed: false,
};
