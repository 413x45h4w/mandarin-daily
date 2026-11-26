import { describe, expect, it } from 'vitest';
import { LEXICON, SENTENCES } from '../data/content';
import { PASSAGES } from '../data/passages';
import { buildIndex, inPool, segment } from './segment';
import { isPunct } from './segment';
import { buildSession } from './session';

const index = buildIndex(LEXICON);

describe('bundled content', () => {
  it('includes core beginner words', () => {
    const nihao = LEXICON.find((word) => word.s === '你好' && !word.alt);
    const xiexie = LEXICON.find((word) => word.s === '谢谢' && !word.alt);
    expect(nihao?.h).toBe(1);
    expect(nihao?.p.replace(/\s/g, '')).toBe('nǐhǎo');
    expect(xiexie?.h).toBe(1);
    expect(LEXICON.filter((word) => word.h === 1 && !word.alt).length).toBeGreaterThan(140);
  });

  it('segments every passage with words at or below its level', () => {
    const problems: string[] = [];
    for (const passage of PASSAGES) {
      for (const paragraph of passage.paragraphs) {
        const tokens = segment(paragraph, index);
        const unknown = tokens.filter((token) => !token.word && !isPunct(token.text)).map((token) => token.text);
        if (unknown.length) problems.push(`${passage.id} unknown ${paragraph} :: ${unknown.join(' ')}`);
        const tooHard = tokens
          .filter((token) => {
            const word = token.word;
            if (!word) return false;
            if (word.h > passage.h) return true;
            return word.h === 0 && Array.from(word.s).length > 1;
          })
          .map((token) => `${token.word?.s}:${token.word?.h}`);
        if (tooHard.length) problems.push(`${passage.id} hard ${paragraph} :: ${tooHard.join(' ')}`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe('daily session', () => {
  it('mixes several exercise types for a new HSK 1 learner', () => {
    const session = buildSession({
      track: 'classic',
      level: 1,
      goal: 10,
      words: LEXICON,
      sentences: SENTENCES,
      passages: PASSAGES,
      cards: [],
      mode: 'daily',
      now: Date.parse('2026-11-26T15:00:00Z'),
      dayKey: '2026-11-26',
    });
    expect(session.length).toBeGreaterThanOrEqual(10);
    const kinds = new Set(session.map((item) => item.kind));
    expect(kinds.has('flash')).toBe(true);
    expect(kinds.has('read')).toBe(true);
    expect(kinds.size).toBeGreaterThanOrEqual(5);
    const intros = session.filter((item) => item.kind === 'flash' && item.intro);
    expect(intros.length).toBeGreaterThan(0);
    for (const item of intros) {
      if (item.kind !== 'flash') continue;
      const word = index.byId.get(item.wordId);
      expect(word && inPool(word, 'classic', 1)).toBe(true);
    }
  });

  it('returns no weak drill before any lapses', () => {
    expect(
      buildSession({
        track: 'classic',
        level: 1,
        goal: 10,
        words: LEXICON,
        sentences: SENTENCES,
        passages: PASSAGES,
        cards: [],
        mode: 'weak',
        now: Date.now(),
        dayKey: '2026-11-26',
      }),
    ).toEqual([]);
  });
});
