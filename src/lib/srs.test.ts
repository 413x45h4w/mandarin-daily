import { describe, expect, it } from 'vitest';
import { Rating } from 'ts-fsrs';
import { cardToStored, emptyStored, gradeCard, intervalLabels, storedToCard } from './srs';

describe('FSRS storage', () => {
  it('schedules Again sooner than Good', () => {
    const now = new Date('2026-11-26T15:00:00Z');
    const labels = intervalLabels(null, now);
    expect(labels[Rating.Again].length).toBeGreaterThan(0);
    expect(labels[Rating.Good].length).toBeGreaterThan(0);
    const again = gradeCard(null, '爱~ai4', Rating.Again, now);
    const good = gradeCard(null, '爱~ai4', Rating.Good, now);
    expect(again.due).toBeLessThanOrEqual(good.due);
    expect(good.reps).toBeGreaterThan(0);
  });

  it('round-trips a card through storage', () => {
    const stored = gradeCard(emptyStored('你~ni3'), '你~ni3', Rating.Good, new Date('2026-11-26T15:00:00Z'));
    const back = cardToStored(stored.wordId, storedToCard(stored));
    expect(back).toEqual(stored);
  });
});
