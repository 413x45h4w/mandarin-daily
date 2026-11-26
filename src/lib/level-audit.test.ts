import { describe, expect, it } from 'vitest';
import { GRAMMAR } from '../data/grammar';
import { LEXICON, SENTENCES } from '../data/content';
import { PASSAGES } from '../data/passages';
import { grammarText, coverText, passageReport, preferredCounts, sentenceProblems } from './level-audit';
import { buildIndex } from './segment';
import { hasPlacementBank, makePlacementItem, type PlacementBanks } from './placement';

const index = buildIndex(LEXICON);
const banks: PlacementBanks = { words: LEXICON, sentences: SENTENCES, grammar: GRAMMAR };

describe('level audit', () => {
  it('keeps a preferred headword for every official HSK band', () => {
    const counts = preferredCounts(LEXICON);
    expect(counts.h[1]).toBeGreaterThanOrEqual(150);
    expect(counts.h[2]).toBeGreaterThanOrEqual(147);
    expect(counts.h[3]).toBeGreaterThanOrEqual(298);
    expect(counts.h[4]).toBeGreaterThanOrEqual(598);
    expect(counts.h[5]).toBeGreaterThanOrEqual(1298);
    expect(counts.h[6]).toBeGreaterThanOrEqual(2500);
    expect(counts.b[1]).toBeGreaterThanOrEqual(500);
    expect(counts.b[7]).toBeGreaterThanOrEqual(5600);
    const bySimp = new Map(LEXICON.filter((word) => !word.alt).map((word) => [word.s, word]));
    expect(bySimp.get('你好')?.h).toBe(1);
    expect(bySimp.get('桔子')?.h).toBe(5);
    expect(bySimp.get('贤惠')?.h).toBe(6);
    expect(bySimp.get('做主')?.h).toBe(6);
    expect(bySimp.get('干吗')?.b).toBe(3);
    expect(bySimp.get('辞典')?.b).toBe(5);
  });

  it('keeps passages and grammar inside their tagged level', () => {
    const passages = passageReport(PASSAGES, index);
    const weak = passages.filter((row) => row.over.length || row.unknown.length || row.share < 1 || row.leveledShare < 0.75);
    const grammarProblems: string[] = [];
    for (const point of GRAMMAR) {
      const cover = coverText(grammarText(point), index, point.h, point.pattern);
      if (cover.over.length || cover.unknown.length || cover.share < 1) {
        grammarProblems.push(`${point.id} h${point.h} over=${cover.over.join(',')} unknown=${cover.unknown.join(' ')} share=${cover.share.toFixed(2)} leveled=${cover.leveledShare.toFixed(2)}`);
      }
    }
    expect({ weak: weak.map((row) => `${row.id} share=${row.share.toFixed(2)} leveled=${row.leveledShare.toFixed(2)} over=${row.over.join(',')} unknown=${row.unknown.join(' ')}`), grammarProblems }).toEqual({ weak: [], grammarProblems: [] });
  });

  it('tags each sentence with the hardest HSK word in it', () => {
    const problems = SENTENCES.flatMap((sentence) => sentenceProblems(sentence, index));
    expect(problems.slice(0, 12)).toEqual([]);
    expect(problems).toHaveLength(0);
  });

  it('can build a placement item for every skill and level', () => {
    for (const track of ['classic', 'hsk3'] as const) {
      const max = track === 'classic' ? 6 : 9;
      for (let level = 1; level <= max; level += 1) {
        for (const skill of ['vocab', 'reading', 'grammar', 'listening'] as const) {
          expect(hasPlacementBank(skill, track, level, banks), `${track} ${skill} ${level}`).toBe(true);
          const item = makePlacementItem(skill, track, level, banks, `${track}|${skill}|${level}`);
          expect(item, `${track} ${skill} ${level}`).toBeTruthy();
          expect(item?.choices).toHaveLength(4);
          expect(item && item.answer >= 0 && item.answer < 4).toBe(true);
          expect(item?.choices[item.answer]).toBeTruthy();
        }
      }
    }
  });
});
