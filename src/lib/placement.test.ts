import { describe, expect, it } from 'vitest';
import { overallLevel, skillEstimate, stepLevel, type PlacementAnswer } from './placement';

describe('placement scoring', () => {
  it('moves up after a correct answer and down after a miss', () => {
    expect(stepLevel(3, true, 6)).toBe(4);
    expect(stepLevel(6, true, 6)).toBe(6);
    expect(stepLevel(3, false, 6)).toBe(2);
    expect(stepLevel(1, false, 6)).toBe(1);
  });

  it('estimates a skill from the staircase', () => {
    const answers: PlacementAnswer[] = [
      { skill: 'vocab', level: 3, correct: true },
      { skill: 'vocab', level: 4, correct: true },
      { skill: 'vocab', level: 5, correct: false },
      { skill: 'vocab', level: 4, correct: false },
      { skill: 'vocab', level: 3, correct: true },
    ];
    expect(skillEstimate(answers)).toBe(3);
  });

  it('uses the middle of the four skills as the level to apply', () => {
    expect(overallLevel({ vocab: 2, reading: 4, grammar: 3, listening: 5 })).toBe(4);
    expect(overallLevel({ vocab: 1, reading: 1, grammar: 6, listening: 6 })).toBe(4);
  });
});
