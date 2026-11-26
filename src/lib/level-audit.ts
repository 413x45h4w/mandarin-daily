import type { Passage, Sentence, Word } from '../types';
import type { GrammarPoint } from '../data/grammar';
import { isPunct, segment, type LexiconIndex } from './segment';

export interface Coverage {
  content: number;
  inLevel: number;
  /** Tokens whose HSK 2.0 level is known and at or below the cap. */
  leveled: number;
  over: string[];
  unknown: string[];
  /** Share of content tokens that are acceptable at this cap. */
  share: number;
  /** Share of content tokens that are real HSK headwords at or below the cap. */
  leveledShare: number;
}

export function coverText(text: string, index: LexiconIndex, maxH: number, allow: string[] = []): Coverage {
  const allowed = new Set(allow);
  const tokens = segment(text, index).filter((token) => !isPunct(token.text) && !/^_+$/.test(token.text));
  const over: string[] = [];
  const unknown: string[] = [];
  let inLevel = 0;
  let leveled = 0;
  for (const token of tokens) {
    const word = token.word;
    if (!word) {
      unknown.push(token.text);
      continue;
    }
    if (allowed.has(word.s)) {
      inLevel += 1;
      leveled += 1;
      continue;
    }
    const multiUnleveled = word.h === 0 && Array.from(word.s).length > 1;
    if (word.h > maxH || multiUnleveled) {
      over.push(`${word.s}:${word.h}`);
      continue;
    }
    inLevel += 1;
    if (word.h > 0 && word.h <= maxH) leveled += 1;
  }
  const content = tokens.length;
  return {
    content,
    inLevel,
    leveled,
    over,
    unknown,
    share: content ? inLevel / content : 1,
    leveledShare: content ? leveled / content : 1,
  };
}

export function grammarText(point: GrammarPoint): string {
  let text = [
    point.explain,
    ...point.examples.map((example) => example.zh),
    ...point.quiz.flatMap((item) => [item.prompt, ...item.options]),
  ].join('\n');
  const patterns = [...point.pattern].sort((a, b) => Array.from(b).length - Array.from(a).length);
  for (const word of patterns) text = text.split(word).join(' ');
  return text;
}

export function sentenceProblems(sentence: Sentence, index: LexiconIndex): string[] {
  const tokens = segment(sentence.zh, index).filter((token) => token.word);
  const levels = tokens.map((token) => token.word?.h ?? 0).filter((level) => level > 0);
  const max = levels.length ? Math.max(...levels) : 0;
  const problems: string[] = [];
  if (sentence.h > 0 && max > sentence.h) problems.push(`${sentence.id} tagged h${sentence.h} but contains h${max}`);
  if (sentence.h > 0 && max > 0 && sentence.h !== max) problems.push(`${sentence.id} tagged h${sentence.h} expected h${max}`);
  const unknown = segment(sentence.zh, index).filter((token) => !token.word && !isPunct(token.text));
  if (unknown.length) problems.push(`${sentence.id} unknown ${unknown.map((token) => token.text).join(' ')}`);
  return problems;
}

export function preferredCounts(words: Word[]): { h: Record<number, number>; b: Record<number, number> } {
  const preferred = words.filter((word) => !word.alt);
  const h: Record<number, number> = {};
  const b: Record<number, number> = {};
  for (let level = 1; level <= 6; level += 1) h[level] = preferred.filter((word) => word.h === level).length;
  for (let level = 1; level <= 7; level += 1) b[level] = preferred.filter((word) => word.b === level).length;
  return { h, b };
}

export function passageReport(passages: Passage[], index: LexiconIndex): { id: string; share: number; leveledShare: number; over: string[]; unknown: string[] }[] {
  return passages.map((passage) => {
    const text = passage.paragraphs.join('\n');
    const cover = coverText(text, index, passage.h);
    return { id: passage.id, share: cover.share, leveledShare: cover.leveledShare, over: cover.over, unknown: cover.unknown };
  });
}
