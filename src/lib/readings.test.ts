import { describe, expect, it } from 'vitest';
import { PASSAGES } from '../data/passages';
import { choosePassage, parseGeneratedPassage, rememberPassage } from './readings';

describe('passage pool', () => {
  it('has many original readings at every level', () => {
    for (let level = 1; level <= 6; level++) {
      expect(PASSAGES.filter((passage) => passage.h === level).length).toBeGreaterThanOrEqual(8);
    }
    for (const band of [7, 8, 9]) {
      expect(PASSAGES.filter((passage) => passage.b === band).length).toBeGreaterThanOrEqual(4);
    }
    const formats = new Set(PASSAGES.map((passage) => passage.format));
    expect(formats.size).toBeGreaterThanOrEqual(6);
    expect(PASSAGES.every((passage) => passage.questions.length >= 2)).toBe(true);
  });
});

describe('choosePassage', () => {
  const sample = PASSAGES.filter((passage) => passage.h === 1);

  it('prefers an unseen passage and then the one with study words', () => {
    const first = choosePassage(sample, 'classic', 1, { seenIds: [], focus: ['医院'], salt: 'a' });
    expect(first).toBeTruthy();
    const again = choosePassage(sample, 'classic', 1, { seenIds: sample.map((passage) => passage.id).filter((id) => id !== first?.id), focus: [], salt: 'a' });
    expect(again?.id).toBe(first?.id);
    const withWord = choosePassage(sample, 'classic', 1, { seenIds: [], focus: ['医院', '医生'], salt: 'same' });
    expect(withWord?.paragraphs.join('')).toMatch(/医院|医生/);
  });

  it('allows one level of stretch and remembers seen ids', () => {
    const picked = choosePassage(PASSAGES, 'classic', 1, { salt: 'stretch' });
    expect(picked && picked.h <= 2).toBe(true);
    const seen = rememberPassage(['p-old'], 'p-new');
    expect(seen.at(-1)).toBe('p-new');
    expect(rememberPassage(seen, 'p-old').at(-1)).toBe('p-old');
  });

  it('parses a model JSON story', () => {
    const raw = '```json\n{"title":"雨天","paragraphs":["今天下雨。","我在家看书。"],"questions":[{"prompt":"Where am I?","options":["Home","School","A shop"],"answer":0}]}\n```';
    const passage = parseGeneratedPassage(raw, 1);
    expect(passage?.title).toBe('雨天');
    expect(passage?.questions[0].answer).toBe(0);
    expect(parseGeneratedPassage('not json', 1)).toBeNull();
  });
});
