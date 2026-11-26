import type { Track, Word } from '../types';

const PUNCT = new Set(
  Array.from(' \t\n\r，。！？、；：,.!?;:""“”‘’「」『』（）()《》…—～~·・-'),
);

export function isPunct(ch: string): boolean {
  return PUNCT.has(ch);
}

export interface Token {
  text: string;
  word: Word | null;
}

export interface LexiconIndex {
  words: Word[];
  byId: Map<string, Word>;
  bySimp: Map<string, Word[]>;
  maxLen: number;
}

const PARTICLE_READING: Record<string, string> = {
  了: 'le5',
  的: 'de5',
  得: 'de5',
  地: 'de5',
  着: 'zhe5',
  过: 'guo5',
  吗: 'ma5',
  呢: 'ne5',
  吧: 'ba5',
  啊: 'a5',
};

function particleRank(word: Word): number {
  const want = PARTICLE_READING[word.s];
  if (!want) return 1;
  return word.n.replace(/\s+/g, '') === want ? 0 : 1;
}

export function buildIndex(words: Word[]): LexiconIndex {
  const byId = new Map<string, Word>();
  const bySimp = new Map<string, Word[]>();
  let maxLen = 1;
  for (const word of words) {
    byId.set(word.id, word);
    maxLen = Math.max(maxLen, Array.from(word.s).length);
    const list = bySimp.get(word.s);
    if (list) list.push(word);
    else bySimp.set(word.s, [word]);
  }
  for (const list of bySimp.values()) {
    list.sort((a, b) => particleRank(a) - particleRank(b) || a.alt - b.alt || (a.h || 9) - (b.h || 9) || a.q - b.q);
  }
  return { words, byId, bySimp, maxLen };
}

export function segment(text: string, index: LexiconIndex): Token[] {
  const chars = Array.from(text);
  const parts: Token[] = [];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (isPunct(ch)) {
      parts.push({ text: ch, word: null });
      i += 1;
      continue;
    }
    let found: Word | null = null;
    let foundLen = 0;
    const upper = Math.min(index.maxLen, chars.length - i);
    for (let len = upper; len >= 1; len--) {
      const slice = chars.slice(i, i + len).join('');
      const hits = index.bySimp.get(slice);
      if (!hits?.length) continue;
      const classic = hits.filter((word) => word.h > 0);
      if (classic.length) {
        found = classic[0];
        foundLen = len;
        break;
      }
      if (len === 1) {
        found = hits[0];
        foundLen = 1;
        break;
      }
    }
    if (found) {
      parts.push({ text: found.s, word: found });
      i += foundLen;
    } else {
      parts.push({ text: ch, word: null });
      i += 1;
    }
  }
  return parts;
}

export function levelOf(word: Word, track: Track): number {
  return track === 'classic' ? word.h : word.b;
}

export function inPool(word: Word, track: Track, level: number): boolean {
  if (word.alt) return false;
  const lv = levelOf(word, track);
  return lv > 0 && lv <= level;
}

export function displayHanzi(word: Word, traditional: boolean): string {
  return traditional && word.t ? word.t : word.s;
}

export function searchWords(query: string, index: LexiconIndex, limit = 40): Word[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const han = /[\u3400-\u9fff]/.test(q);
  if (!han && q.replace(/[^a-z0-9]/g, '').length < 2) return [];
  const folded = q.normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9\u3400-\u9fff]+/gi, '');
  const hits: { word: Word; rank: number }[] = [];
  for (const word of index.words) {
    let rank = 0;
    if (han) {
      if (word.s === q) rank = 0;
      else if (word.t === q) rank = 1;
      else if (word.s.startsWith(q) || word.t.startsWith(q)) rank = 2;
      else if (word.s.includes(q) || word.t.includes(q)) rank = 3;
      else continue;
    } else {
      const py = word.n.replace(/[0-9\s]/g, '');
      const marked = word.p.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z]+/g, '');
      const meaning = word.m.toLowerCase();
      if (py === folded || marked === folded) rank = 0;
      else if (py.startsWith(folded) || marked.startsWith(folded)) rank = 1;
      else if (meaning.includes(q)) rank = 2;
      else if (py.includes(folded) || marked.includes(folded)) rank = 3;
      else continue;
    }
    hits.push({ word, rank });
  }
  hits.sort((a, b) => a.rank - b.rank || a.word.alt - b.word.alt || a.word.q - b.word.q || a.word.s.length - b.word.s.length);
  return hits.slice(0, limit).map((hit) => hit.word);
}

export function wordOfDay(words: Word[], dayKey: string, track: Track, level: number): Word | null {
  const pool = words.filter((word) => inPool(word, track, level) && word.s.length > 0 && word.m.length > 2);
  if (!pool.length) return null;
  let n = 0;
  for (const ch of dayKey) n = (n * 33 + ch.charCodeAt(0)) >>> 0;
  return pool[n % pool.length];
}

const POS: Record<string, string> = {
  n: 'noun',
  v: 'verb',
  a: 'adjective',
  d: 'adverb',
  r: 'pronoun',
  m: 'number',
  q: 'measure word',
  p: 'preposition',
  c: 'conjunction',
  u: 'particle',
  y: 'particle',
  t: 'time',
  s: 'place',
  f: 'direction',
  i: 'idiom',
  l: 'phrase',
  e: 'interjection',
  vn: 'verb',
  ad: 'adverb',
  nr: 'name',
  ns: 'place',
  nz: 'noun',
};

export function posLabel(pos: string): string {
  if (!pos) return '';
  return pos
    .split(',')
    .map((code) => POS[code] || '')
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ');
}

export function levelBadges(word: Word): string {
  const bits: string[] = [];
  if (word.h) bits.push(`HSK ${word.h}`);
  if (word.b) bits.push(word.b >= 7 ? 'HSK 3.0 7–9' : `HSK 3.0 band ${word.b}`);
  return bits.join(' · ');
}
