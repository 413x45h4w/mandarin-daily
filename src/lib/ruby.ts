import readingsJson from '../data/char-readings.json';
import type { Word } from '../types';
import { isPunct, type LexiconIndex } from './segment';

const READINGS = readingsJson as Record<string, string>;
const HAN = /[\u3400-\u9fff]/;

export interface RubyToken {
  text: string;
  /** Empty when the token is punctuation or a character with no known reading. */
  pinyin: string;
  word: Word | null;
}

export function charPinyin(ch: string): string {
  return READINGS[ch] ?? '';
}

function standalone(index: LexiconIndex, ch: string): boolean {
  return (index.bySimp.get(ch)?.length ?? 0) > 0;
}

/**
 * Readings for display. Classic HSK words still win. A new-HSK word is kept
 * when its characters are not headwords of their own (英语, 纵然), so it does
 * not swallow a real word the way 同年 would swallow 年纪. Anything left over
 * gets a CC-CEDICT character reading.
 */
export function annotate(text: string, index: LexiconIndex): RubyToken[] {
  const chars = Array.from(text);
  const parts: RubyToken[] = [];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (isPunct(ch) || !HAN.test(ch)) {
      parts.push({ text: ch, pinyin: '', word: null });
      i += 1;
      continue;
    }
    let classic: Word | null = null;
    let classicLen = 0;
    let opaque: Word | null = null;
    let opaqueLen = 0;
    const upper = Math.min(index.maxLen, chars.length - i);
    for (let len = upper; len >= 1; len -= 1) {
      const slice = chars.slice(i, i + len).join('');
      const hits = index.bySimp.get(slice);
      if (!hits?.length) continue;
      const classicHits = hits.filter((word) => word.h > 0);
      if (classicHits.length) {
        classic = classicHits[0];
        classicLen = len;
        break;
      }
      if (!opaque && len > 1) {
        const word = hits[0];
        if (Array.from(word.s).some((piece) => !standalone(index, piece))) {
          opaque = word;
          opaqueLen = len;
        }
      }
    }
    const word = classic ?? opaque;
    const foundLen = classic ? classicLen : opaqueLen;
    if (word && foundLen > 0 && word.p.trim()) {
      parts.push({ text: word.s, pinyin: word.p, word });
      i += foundLen;
      continue;
    }
    const single = index.bySimp.get(ch)?.[0];
    if (single?.p.trim()) {
      parts.push({ text: single.s, pinyin: single.p, word: single });
      i += 1;
      continue;
    }
    parts.push({ text: ch, pinyin: charPinyin(ch), word: null });
    i += 1;
  }
  return parts;
}

export function hanziWithoutPinyin(text: string, index: LexiconIndex): string[] {
  const missing: string[] = [];
  for (const token of annotate(text, index)) {
    if (![...token.text].some((ch) => HAN.test(ch))) continue;
    if (!token.pinyin.trim()) missing.push(token.text);
  }
  return missing;
}
