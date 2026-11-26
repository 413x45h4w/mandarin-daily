import type { Passage, Sentence, StoredCard, Track, Word } from '../types';
import { hashString } from './pinyin';
import { choosePassage } from './readings';
import { inPool } from './segment';
import { isDue } from './srs';

export type Exercise =
  | { kind: 'flash'; wordId: string; direction: 'zh-en' | 'en-zh'; intro?: boolean }
  | { kind: 'tone'; wordId: string }
  | { kind: 'tone-pair'; wordId: string }
  | { kind: 'listen'; sentenceId: string; choices: string[]; answer: number; wordId?: string }
  | { kind: 'dictate'; wordId: string; choices: string[]; answer: number }
  | { kind: 'speak'; wordId: string; sentenceId?: string }
  | { kind: 'build'; sentenceId: string; wordId?: string }
  | { kind: 'write'; wordId: string; char: string }
  | { kind: 'read'; passageId: string };

export interface SessionInput {
  track: Track;
  level: number;
  goal: 10 | 20 | 30;
  words: Word[];
  sentences: Sentence[];
  passages: Passage[];
  cards: StoredCard[];
  mode: 'daily' | 'weak';
  now: number;
  dayKey: string;
  seenPassageIds?: string[];
  focusWords?: string[];
}

const KIND_ORDER = ['tone', 'flash-en', 'listen', 'speak', 'build', 'write', 'dictate', 'tone-pair'] as const;

export function buildSession(input: SessionInput): Exercise[] {
  if (input.mode === 'weak') return buildWeak(input);
  return buildDaily(input);
}

function buildDaily(input: SessionInput): Exercise[] {
  const { track, level, goal, dayKey } = input;
  const byId = new Map(input.words.map((word) => [word.id, word]));
  const pool = input.words
    .filter((word) => inPool(word, track, level))
    .sort((a, b) => levelRank(a, track) - levelRank(b, track) || a.q - b.q || a.id.localeCompare(b.id));
  const cardById = new Map(input.cards.map((card) => [card.wordId, card]));
  const newCap = goal === 30 ? 8 : goal === 20 ? 6 : 4;
  const reviewCap = goal === 30 ? 18 : goal === 20 ? 12 : 8;
  const target = goal === 30 ? 28 : goal === 20 ? 20 : 14;

  const deckNew = pool.filter((word) => {
    const card = cardById.get(word.id);
    return card && card.reps === 0;
  });
  const unseen = pool.filter((word) => !cardById.has(word.id));
  const newWords = [...deckNew, ...unseen].slice(0, newCap);

  let reviews = input.cards
    .filter((card) => isDue(card, input.now) && byId.has(card.wordId) && inPool(byId.get(card.wordId) as Word, track, level))
    .sort((a, b) => a.due - b.due)
    .slice(0, reviewCap)
    .map((card) => byId.get(card.wordId) as Word);

  let maintenance = false;
  if (newWords.length === 0 && reviews.length === 0) {
    maintenance = true;
    reviews = input.cards
      .filter((card) => card.reps > 0 && byId.has(card.wordId))
      .sort((a, b) => b.lapses - a.lapses || a.stability - b.stability)
      .slice(0, 8)
      .map((card) => byId.get(card.wordId) as Word);
  }

  const exercises: Exercise[] = [];
  const seen = new Set<string>();
  const push = (exercise: Exercise | null) => {
    if (!exercise) return false;
    const key = exerciseKey(exercise);
    if (seen.has(key)) return false;
    seen.add(key);
    exercises.push(exercise);
    return true;
  };

  for (const word of newWords) {
    push({ kind: 'flash', wordId: word.id, direction: 'zh-en', intro: true });
  }

  const cycle = [...reviews, ...newWords];
  const usableSentences = sentencesFor(input.sentences, track, level);
  const offset = hashString(dayKey) % KIND_ORDER.length;
  let guard = 0;
  let cursor = 0;
  while (exercises.length < target && cycle.length && guard < 500) {
    guard += 1;
    const word = cycle[cursor % cycle.length];
    const type = KIND_ORDER[(cursor + offset) % KIND_ORDER.length];
    cursor += 1;
    push(makeExercise(type, word, input, usableSentences));
  }

  if (maintenance && exercises.length < 8) {
    for (const word of reviews) {
      push({ kind: 'flash', wordId: word.id, direction: 'en-zh' });
      push({ kind: 'tone', wordId: word.id });
      if (exercises.length >= target) break;
    }
  }

  const passage = choosePassage(input.passages, track, level, {
    seenIds: input.seenPassageIds ?? [],
    focus: input.focusWords ?? [],
    salt: dayKey,
  });
  if (passage) push({ kind: 'read', passageId: passage.id });
  return exercises;
}

function buildWeak(input: SessionInput): Exercise[] {
  const byId = new Map(input.words.map((word) => [word.id, word]));
  const weak = input.cards
    .filter((card) => card.reps > 0 && (card.lapses >= 1 || card.difficulty >= 6.5) && byId.has(card.wordId))
    .sort((a, b) => b.lapses - a.lapses || b.difficulty - a.difficulty)
    .slice(0, 8)
    .map((card) => byId.get(card.wordId) as Word);
  if (!weak.length) return [];
  const exercises: Exercise[] = [];
  const types = ['flash', 'tone', 'speak', 'write', 'dictate'] as const;
  weak.forEach((word, index) => {
    const type = types[index % types.length];
    if (type === 'flash') exercises.push({ kind: 'flash', wordId: word.id, direction: index % 2 ? 'en-zh' : 'zh-en' });
    else if (type === 'tone') exercises.push({ kind: 'tone', wordId: word.id });
    else if (type === 'speak') exercises.push({ kind: 'speak', wordId: word.id });
    else if (type === 'write') exercises.push({ kind: 'write', wordId: word.id, char: pickChar(word, input.dayKey) });
    else exercises.push(dictate(word, input));
  });
  return exercises.filter(Boolean) as Exercise[];
}

function makeExercise(
  type: (typeof KIND_ORDER)[number],
  word: Word,
  input: SessionInput,
  sentences: Sentence[],
): Exercise | null {
  if (type === 'flash-en') return { kind: 'flash', wordId: word.id, direction: 'en-zh' };
  if (type === 'tone') return { kind: 'tone', wordId: word.id };
  if (type === 'tone-pair') {
    const tones = toneNumbers(word);
    if (tones.length !== 2) return null;
    return { kind: 'tone-pair', wordId: word.id };
  }
  if (type === 'speak') {
    const sentence = pickSentence(sentences, `${word.id}|speak|${input.dayKey}`, (s) => s.tiles.includes(word.s) && s.tiles.length <= 8);
    return { kind: 'speak', wordId: word.id, sentenceId: sentence?.id };
  }
  if (type === 'listen') {
    const pool = sentences.filter((s) => s.tiles.length >= 2);
    const sentence = pickSentence(pool, `${word.id}|listen|${input.dayKey}`, (s) => s.tiles.includes(word.s)) ?? pickSentence(pool, `${word.id}|listen2|${input.dayKey}`);
    if (!sentence) return null;
    const choices = choiceList(pool.map((s) => s.en), sentence.en, `${sentence.id}|en`);
    if (!choices) return null;
    return { kind: 'listen', sentenceId: sentence.id, choices: choices.choices, answer: choices.answer, wordId: word.id };
  }
  if (type === 'build') {
    const sentence =
      pickSentence(sentences, `${word.id}|build|${input.dayKey}`, (s) => s.tiles.includes(word.s) && s.tiles.length >= 3 && s.tiles.length <= 7) ??
      pickSentence(sentences, `${word.id}|build2|${input.dayKey}`, (s) => s.tiles.length >= 3 && s.tiles.length <= 7);
    if (!sentence) return null;
    return { kind: 'build', sentenceId: sentence.id, wordId: word.id };
  }
  if (type === 'write') return { kind: 'write', wordId: word.id, char: pickChar(word, input.dayKey) };
  if (type === 'dictate') return dictate(word, input);
  return null;
}

function dictate(word: Word, input: SessionInput): Exercise {
  const pool = input.words.filter((other) => !other.alt && other.id !== word.id && Array.from(other.s).length === Array.from(word.s).length && (input.track === 'classic' ? other.h === word.h || other.h === input.level : other.b === word.b || other.b === input.level));
  const options = [word.s];
  const start = hashString(`${word.id}|dict|${input.dayKey}`) % Math.max(1, pool.length);
  for (let i = 0; i < pool.length && options.length < 4; i++) {
    const candidate = pool[(start + i) % pool.length].s;
    if (!options.includes(candidate)) options.push(candidate);
  }
  const answer = hashString(`${word.id}|dicta|${input.dayKey}`) % options.length;
  const choices = options.slice();
  const [correct] = choices.splice(0, 1);
  choices.splice(answer, 0, correct);
  return { kind: 'dictate', wordId: word.id, choices, answer };
}

function sentencesFor(sentences: Sentence[], track: Track, level: number): Sentence[] {
  return sentences.filter((sentence) => {
    if (track === 'classic') return sentence.h > 0 && sentence.h <= level;
    return (sentence.b > 0 && sentence.b <= level) || (sentence.h > 0 && sentence.h <= Math.min(level, 6));
  });
}

function pickSentence(sentences: Sentence[], salt: string, pred?: (s: Sentence) => boolean): Sentence | undefined {
  const list = pred ? sentences.filter(pred) : sentences;
  if (!list.length) return undefined;
  return list[hashString(salt) % list.length];
}

function choiceList(pool: string[], correct: string, salt: string): { choices: string[]; answer: number } | null {
  const unique = [...new Set(pool.filter((item) => item && item !== correct))];
  if (unique.length < 2) return null;
  const start = hashString(salt) % unique.length;
  const distractors: string[] = [];
  for (let i = 0; i < unique.length && distractors.length < 3; i++) {
    distractors.push(unique[(start + i) % unique.length]);
  }
  const answer = hashString(`${salt}|a`) % (distractors.length + 1);
  const choices = distractors.slice();
  choices.splice(answer, 0, correct);
  return { choices, answer };
}

export function pickPassage(passages: Passage[], track: Track, level: number, dayKey: string, seenIds: string[] = [], focus: string[] = []): Passage | null {
  return choosePassage(passages, track, level, { seenIds, focus, salt: dayKey });
}

export function toneNumbers(word: Word): number[] {
  return word.n
    .split(/\s+/)
    .filter(Boolean)
    .map((syllable) => {
      const match = syllable.match(/([1-5])$/);
      return match ? Number(match[1]) : 5;
    });
}

export function pickChar(word: Word, salt: string): string {
  const chars = Array.from(word.s).filter((ch) => /[\u3400-\u9fff]/.test(ch));
  if (!chars.length) return Array.from(word.s)[0] || word.s;
  return chars[hashString(`${salt}|${word.id}|char`) % chars.length];
}

function levelRank(word: Word, track: Track): number {
  return track === 'classic' ? word.h || 9 : word.b || 9;
}

function exerciseKey(exercise: Exercise): string {
  if (exercise.kind === 'flash') return `flash:${exercise.wordId}:${exercise.direction}`;
  if (exercise.kind === 'listen') return `listen:${exercise.sentenceId}`;
  if (exercise.kind === 'build') return `build:${exercise.sentenceId}`;
  if (exercise.kind === 'read') return `read:${exercise.passageId}`;
  if (exercise.kind === 'speak') return `speak:${exercise.wordId}:${exercise.sentenceId ?? ''}`;
  if (exercise.kind === 'write') return `write:${exercise.wordId}:${exercise.char}`;
  if (exercise.kind === 'dictate') return `dictate:${exercise.wordId}`;
  return `${exercise.kind}:${exercise.wordId}`;
}

export const EXERCISE_LABEL: Record<string, string> = {
  flash: 'Flashcards',
  tone: 'Tones',
  'tone-pair': 'Tone pairs',
  listen: 'Listening',
  dictate: 'Dictation',
  speak: 'Speaking',
  build: 'Sentences',
  write: 'Writing',
  read: 'Reading',
};
