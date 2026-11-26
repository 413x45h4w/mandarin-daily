import type { GrammarPoint } from '../data/grammar';
import { grammarLevel } from '../data/grammar';
import type { PlacementSkills, Sentence, Track, Word } from '../types';
import { hashString } from './pinyin';

export const SKILLS = ['vocab', 'reading', 'grammar', 'listening'] as const;
export type Skill = (typeof SKILLS)[number];
export const ITEMS_PER_SKILL = 5;

export interface PlacementItem {
  skill: Skill;
  level: number;
  prompt: string;
  speak: string;
  choices: string[];
  answer: number;
  reveal: string;
}

export interface PlacementAnswer {
  skill: Skill;
  level: number;
  correct: boolean;
}

export type SkillLevels = PlacementSkills;

let tertileCache: { a: number; b: number } | null = null;

/** The source list marks bands 7–9 as one band. Split that pool by frequency so a result can name 7, 8, or 9. */
export function advancedBand(word: Word, words: Word[]): number {
  if (word.b >= 1 && word.b <= 6) return word.b;
  if (word.b !== 7) return 0;
  if (!tertileCache) {
    const qs = words.filter((item) => !item.alt && item.b === 7).map((item) => item.q).sort((a, b) => a - b);
    tertileCache = {
      a: qs[Math.floor(qs.length / 3)] ?? 0,
      b: qs[Math.floor((2 * qs.length) / 3)] ?? 0,
    };
  }
  if (word.q <= tertileCache.a) return 7;
  if (word.q <= tertileCache.b) return 8;
  return 9;
}

export function maxPlacementLevel(track: Track): number {
  return track === 'classic' ? 6 : 9;
}

export function wordBand(word: Word, track: Track, words: Word[]): number {
  if (word.alt) return 0;
  if (track === 'classic') return word.h;
  return advancedBand(word, words);
}

export function startingLevel(track: Track): number {
  return track === 'classic' ? 3 : 4;
}

export function stepLevel(level: number, correct: boolean, max: number): number {
  if (correct) return Math.min(max, level + 1);
  return Math.max(1, level - 1);
}

/** Highest level the person has shown, pulled down when they miss. */
export function skillEstimate(answers: PlacementAnswer[]): number {
  let ability = 1;
  for (const answer of answers) {
    if (answer.correct) ability = Math.max(ability, answer.level);
    else ability = Math.min(ability, Math.max(1, answer.level - 1));
  }
  return ability;
}

export function overallLevel(skills: SkillLevels): number {
  const values = SKILLS.map((skill) => skills[skill]).sort((a, b) => a - b);
  return Math.round((values[1] + values[2]) / 2);
}

function gloss(word: Word): string {
  const parts = word.m.split(';').map((part) => part.trim()).filter((part) => part && !/^(surname\b|variant of|old variant|archaic variant)/i.test(part));
  const text = (parts[0] || '').replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  return text.length > 72 ? `${text.slice(0, 69)}…` : text;
}

function atLevel(words: Word[], track: Track, level: number, all: Word[]): Word[] {
  return words.filter((word) => wordBand(word, track, all) === level && gloss(word).length > 1);
}

function choicesFrom(correct: string, pool: string[], salt: string): { choices: string[]; answer: number } | null {
  const unique = [...new Set(pool.filter((item) => item && item !== correct))];
  if (unique.length < 3) return null;
  const start = hashString(salt) % unique.length;
  const distractors: string[] = [];
  for (let i = 0; i < unique.length && distractors.length < 3; i += 1) {
    const item = unique[(start + i) % unique.length];
    if (!distractors.includes(item)) distractors.push(item);
  }
  if (distractors.length < 3) return null;
  const answer = hashString(`${salt}|a`) % 4;
  const choices = distractors.slice();
  choices.splice(answer, 0, correct);
  return { choices, answer };
}

export interface PlacementBanks {
  words: Word[];
  sentences: Sentence[];
  grammar: GrammarPoint[];
}

function sentenceLevel(sentence: Sentence, track: Track): number {
  if (track === 'classic') return sentence.h;
  if (sentence.b >= 1 && sentence.b <= 6) return sentence.b;
  if (sentence.b >= 7 || sentence.h >= 6) return 7;
  return sentence.h || 0;
}

export function hasPlacementBank(skill: Skill, track: Track, level: number, banks: PlacementBanks): boolean {
  if (skill === 'vocab') return atLevel(banks.words, track, level, banks.words).length >= 4;
  if (skill === 'grammar') return banks.grammar.some((point) => grammarLevel(point, track) === level && point.quiz.length > 0);
  if (track === 'hsk3' && level >= 7) return banks.sentences.filter((sentence) => sentenceLevel(sentence, track) >= 7 || sentence.h >= 6).length >= 4;
  return banks.sentences.filter((sentence) => sentenceLevel(sentence, track) === level).length >= 4;
}

export function clampToBank(skill: Skill, track: Track, level: number, banks: PlacementBanks): number {
  const max = maxPlacementLevel(track);
  const target = Math.min(max, Math.max(1, level));
  if (hasPlacementBank(skill, track, target, banks)) return target;
  for (let distance = 1; distance <= max; distance += 1) {
    if (target - distance >= 1 && hasPlacementBank(skill, track, target - distance, banks)) return target - distance;
    if (target + distance <= max && hasPlacementBank(skill, track, target + distance, banks)) return target + distance;
  }
  return target;
}

export function makePlacementItem(skill: Skill, track: Track, level: number, banks: PlacementBanks, salt: string): PlacementItem | null {
  const used = clampToBank(skill, track, level, banks);
  if (skill === 'vocab') {
    const pool = atLevel(banks.words, track, used, banks.words);
    if (pool.length < 4) return null;
    const word = pool[hashString(`${salt}|w`) % pool.length];
    const made = choicesFrom(gloss(word), pool.map(gloss), `${salt}|g`);
    if (!made) return null;
    return { skill, level: used, prompt: word.s, speak: word.s, choices: made.choices, answer: made.answer, reveal: gloss(word) };
  }
  if (skill === 'grammar') {
    const points = banks.grammar.filter((point) => grammarLevel(point, track) === used);
    const quizzes = points.flatMap((point) => point.quiz.map((quiz) => ({ point, quiz })));
    if (!quizzes.length) return null;
    const picked = quizzes[hashString(`${salt}|q`) % quizzes.length];
    return {
      skill,
      level: used,
      prompt: picked.quiz.prompt,
      speak: '',
      choices: picked.quiz.options,
      answer: picked.quiz.answer,
      reveal: picked.point.title,
    };
  }
  const pool = track === 'hsk3' && used >= 7
    ? banks.sentences.filter((sentence) => sentence.h >= 6 || sentence.b >= 7)
    : banks.sentences.filter((sentence) => sentenceLevel(sentence, track) === used);
  if (pool.length < 4) return null;
  const sentence = pool[hashString(`${salt}|s`) % pool.length];
  const made = choicesFrom(sentence.en, pool.map((item) => item.en), `${salt}|e`);
  if (!made) return null;
  return {
    skill,
    level: used,
    prompt: skill === 'listening' ? '' : sentence.zh,
    speak: sentence.zh,
    choices: made.choices,
    answer: made.answer,
    reveal: sentence.zh,
  };
}
