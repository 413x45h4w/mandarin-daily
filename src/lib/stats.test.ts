import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { dayActive, emptyDay, heatmapCells, streakCount } from './stats';
import type { DayLog } from '../types';

function day(date: string, extra: Partial<DayLog> = {}): DayLog {
  return { ...emptyDay(date), seconds: 120, correct: 3, wrong: 1, ...extra };
}

describe('streaks', () => {
  it('counts today and previous days', () => {
    const today = '2026-11-26';
    const days = new Map<string, DayLog>([
      [today, day(today)],
      [addDays(today, -1), day(addDays(today, -1))],
      [addDays(today, -2), day(addDays(today, -2), { seconds: 0, correct: 0, wrong: 0 })],
      [addDays(today, -3), day(addDays(today, -3))],
    ]);
    expect(dayActive(days.get(addDays(today, -2)))).toBe(false);
    expect(streakCount(days, today)).toBe(2);
  });

  it('keeps yesterday’s streak before today’s practice', () => {
    const today = '2026-11-26';
    const days = new Map<string, DayLog>([[addDays(today, -1), day(addDays(today, -1))]]);
    expect(streakCount(days, today)).toBe(1);
  });

  it('builds a Sunday-aligned heatmap that includes today', () => {
    const today = new Date(2026, 10, 26);
    const cells = heatmapCells(new Map(), today);
    expect(cells.at(-1)?.date).toBe('2026-11-26');
    expect(new Date(`${cells[0].date}T12:00:00`).getDay()).toBe(0);
    expect(cells.length).toBe(16 * 7 + today.getDay() + 1);
    expect(cells[0].level).toBe(0);
  });
});
