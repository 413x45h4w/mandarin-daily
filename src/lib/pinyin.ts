const MARKS: Record<string, { base: string; tone: number }> = {
  ā: { base: 'a', tone: 1 },
  á: { base: 'a', tone: 2 },
  ǎ: { base: 'a', tone: 3 },
  à: { base: 'a', tone: 4 },
  ē: { base: 'e', tone: 1 },
  é: { base: 'e', tone: 2 },
  ě: { base: 'e', tone: 3 },
  è: { base: 'e', tone: 4 },
  ī: { base: 'i', tone: 1 },
  í: { base: 'i', tone: 2 },
  ǐ: { base: 'i', tone: 3 },
  ì: { base: 'i', tone: 4 },
  ō: { base: 'o', tone: 1 },
  ó: { base: 'o', tone: 2 },
  ǒ: { base: 'o', tone: 3 },
  ò: { base: 'o', tone: 4 },
  ū: { base: 'u', tone: 1 },
  ú: { base: 'u', tone: 2 },
  ǔ: { base: 'u', tone: 3 },
  ù: { base: 'u', tone: 4 },
  ǖ: { base: 'v', tone: 1 },
  ǘ: { base: 'v', tone: 2 },
  ǚ: { base: 'v', tone: 3 },
  ǜ: { base: 'v', tone: 4 },
  Ā: { base: 'a', tone: 1 },
  Á: { base: 'a', tone: 2 },
  Ǎ: { base: 'a', tone: 3 },
  À: { base: 'a', tone: 4 },
  Ē: { base: 'e', tone: 1 },
  É: { base: 'e', tone: 2 },
  Ě: { base: 'e', tone: 3 },
  È: { base: 'e', tone: 4 },
  Ī: { base: 'i', tone: 1 },
  Í: { base: 'i', tone: 2 },
  Ǐ: { base: 'i', tone: 3 },
  Ì: { base: 'i', tone: 4 },
  Ō: { base: 'o', tone: 1 },
  Ó: { base: 'o', tone: 2 },
  Ǒ: { base: 'o', tone: 3 },
  Ò: { base: 'o', tone: 4 },
  Ū: { base: 'u', tone: 1 },
  Ú: { base: 'u', tone: 2 },
  Ǔ: { base: 'u', tone: 3 },
  Ù: { base: 'u', tone: 4 },
  Ǖ: { base: 'v', tone: 1 },
  Ǘ: { base: 'v', tone: 2 },
  Ǚ: { base: 'v', tone: 3 },
  Ǜ: { base: 'v', tone: 4 },
};

const TONE_VOWEL: Record<string, string> = {
  a: 'āáǎà',
  e: 'ēéěè',
  i: 'īíǐì',
  o: 'ōóǒò',
  u: 'ūúǔù',
  v: 'ǖǘǚǜ',
};

export interface Syllable {
  text: string;
  tone: number;
}

export function toneOfSyllable(syllable: string): number {
  for (const ch of syllable) {
    const mark = MARKS[ch];
    if (mark) return mark.tone;
  }
  const digit = syllable.match(/([1-5])(?!.*[1-5])/);
  if (digit) return Number(digit[1]);
  return 5;
}

export function splitPinyin(pinyin: string): Syllable[] {
  return pinyin
    .split(/\s+/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ text, tone: toneOfSyllable(text) }));
}

export function toneClass(tone: number, enabled: boolean): string {
  if (!enabled) return '';
  return `tone tone-${tone}`;
}

function prep(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/u:/g, 'v')
    .replace(/ü/g, 'v');
}

export function lettersAndTones(input: string): { letters: string; tones: number[] } {
  let letters = '';
  const tones: number[] = [];
  for (const ch of prep(input)) {
    if (/[1-5]/.test(ch)) {
      tones.push(Number(ch));
      continue;
    }
    const mark = MARKS[ch];
    if (mark) {
      letters += mark.base;
      tones.push(mark.tone);
      continue;
    }
    if (/[a-z]/.test(ch)) letters += ch;
  }
  return { letters, tones };
}

export type PinyinVerdict = 'match' | 'need-tones' | 'wrong';

/** Compare a typed answer with numeric pinyin such as "ni3 hao3". */
export function pinyinMatches(input: string, targetNumeric: string): PinyinVerdict {
  const got = lettersAndTones(input);
  const want = lettersAndTones(targetNumeric);
  if (!got.letters || got.letters !== want.letters) return 'wrong';
  if (got.tones.length < want.tones.length) return 'need-tones';
  if (got.tones.length !== want.tones.length) return 'wrong';
  for (let i = 0; i < want.tones.length; i++) {
    if (got.tones[i] !== want.tones[i]) return 'wrong';
  }
  return 'match';
}

function markSyllable(body: string, tone: number): string {
  const chars = [...body.replace(/u:/g, 'ü').replace(/v/g, 'ü')];
  if (tone === 5) return chars.join('');
  const plain = chars.map((ch) => (ch === 'ü' ? 'v' : ch));
  let idx = plain.findIndex((ch) => ch === 'a' || ch === 'e');
  if (idx < 0 && plain.includes('o') && plain.includes('u')) {
    const o = plain.indexOf('o');
    const u = plain.indexOf('u');
    if (o === u + 1) idx = o;
  }
  if (idx < 0) {
    for (let i = plain.length - 1; i >= 0; i--) {
      if (TONE_VOWEL[plain[i]]) {
        idx = i;
        break;
      }
    }
  }
  if (idx < 0) return chars.join('');
  const key = plain[idx];
  const row = TONE_VOWEL[key];
  if (!row) return chars.join('');
  chars[idx] = row[tone - 1];
  return chars.join('');
}

/** Accept "ni3 hao3" or "nǐ hǎo" and return both displays. */
export function normalizePinyinInput(input: string): { p: string; n: string } | null {
  const raw = input.trim();
  if (!raw) return null;
  const parts = raw.split(/\s+/);
  const marked: string[] = [];
  const numeric: string[] = [];
  for (const part of parts) {
    const { letters, tones } = lettersAndTones(part);
    if (!letters || tones.length !== 1) return null;
    const tone = tones[0];
    numeric.push(`${letters}${tone}`.replace(/v/g, 'v'));
    marked.push(markSyllable(letters, tone));
  }
  if (!numeric.length) return null;
  return { p: marked.join(' '), n: numeric.join(' ').replace(/v/g, 'v') };
}

export function hashString(input: string): number {
  let n = 2166136261;
  for (let i = 0; i < input.length; i++) {
    n ^= input.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
}

export function similarity(a: string, b: string): number {
  const x = a.replace(/[^\u3400-\u9fff]/g, '');
  const y = b.replace(/[^\u3400-\u9fff]/g, '');
  if (!x || !y) return 0;
  if (x === y) return 1;
  const d = levenshtein(x, y);
  return 1 - d / Math.max(x.length, y.length);
}

function levenshtein(a: string, b: string): number {
  const xs = [...a];
  const ys = [...b];
  const row = Array.from({ length: ys.length + 1 }, (_, i) => i);
  for (let i = 1; i <= xs.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= ys.length; j++) {
      const tmp = row[j];
      row[j] = xs[i - 1] === ys[j - 1] ? prev : Math.min(prev, row[j], row[j - 1]) + 1;
      prev = tmp;
    }
  }
  return row[ys.length];
}
