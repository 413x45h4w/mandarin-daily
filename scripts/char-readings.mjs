/**
 * One learner reading for every single simplified character in CC-CEDICT.
 * Used when a character is not its own HSK headword (names, 明, 李, 简…).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const text = readFileSync(resolve(root, 'data/raw/cedict_ts.u8'), 'utf8');

function numericSyllableToMark(syl) {
  const m = String(syl).toLowerCase().match(/^([a-züv:]+)([1-5])$/i);
  if (!m) return syl.toLowerCase();
  let body = m[1].replace(/u:/g, 'ü').replace(/v/g, 'ü');
  const tone = Number(m[2]);
  if (tone === 5) return body;
  const marks = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };
  const chars = [...body];
  let idx = chars.findIndex((ch) => ch === 'a' || ch === 'e');
  if (idx < 0 && body.includes('ou')) idx = chars.indexOf('o');
  if (idx < 0) {
    for (let i = chars.length - 1; i >= 0; i -= 1) {
      if (marks[chars[i]]) {
        idx = i;
        break;
      }
    }
  }
  if (idx < 0 || !marks[chars[idx]]) return body;
  chars[idx] = marks[chars[idx]][tone - 1];
  return chars.join('');
}

function score(pinyin, meaning) {
  let value = 0;
  if (/^[A-Z]/.test(pinyin)) value += 40;
  if (/^surname\b/i.test(meaning)) value += 50;
  if (/\bvariant of\b|old variant|archaic variant/i.test(meaning)) value += 80;
  if (/\(literary\)|\(bound form\)|\babbr\./i.test(meaning)) value += 20;
  if (/dynasty|legendary|emperor/i.test(meaning)) value += 30;
  return value;
}

const byChar = new Map();
for (const line of text.split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
  if (!match) continue;
  const simp = match[2];
  if ([...simp].length !== 1) continue;
  const syllables = match[3].split(/\s+/);
  if (syllables.length !== 1) continue;
  const meaning = match[4].split('/').filter(Boolean).slice(0, 2).join('; ').slice(0, 80);
  const reading = { p: numericSyllableToMark(syllables[0]), n: syllables[0].toLowerCase(), m: meaning, score: score(syllables[0], meaning) };
  const prev = byChar.get(simp);
  if (!prev || reading.score < prev.score) byChar.set(simp, reading);
}

const out = {};
for (const [char, reading] of [...byChar.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh'))) {
  out[char] = reading.p;
}
const file = resolve(root, 'src/data/char-readings.json');
writeFileSync(file, JSON.stringify(out));
console.log('characters', Object.keys(out).length, 'bytes', Buffer.byteLength(JSON.stringify(out)));
for (const ch of ['明', '李', '华', '英', '语', '简', '讯', '晨']) {
  console.log(ch, out[ch]);
}
