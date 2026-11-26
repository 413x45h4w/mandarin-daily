import type { DayLog, StoredCard } from '../types';
import { addDays, todayKey } from './dates';
import { isMature } from './srs';

export function emptyDay(date: string): DayLog {
  return { date, seconds: 0, correct: 0, wrong: 0, introduced: 0, byType: {} };
}

export function dayActive(day?: DayLog): boolean {
  if (!day) return false;
  return day.seconds >= 45 || day.correct + day.wrong >= 1;
}

export function streakCount(days: Map<string, DayLog>, today = todayKey()): number {
  let cursor = today;
  if (!dayActive(days.get(cursor))) cursor = addDays(cursor, -1);
  let count = 0;
  while (dayActive(days.get(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
    if (count > 5000) break;
  }
  return count;
}

export interface HeatCell {
  date: string;
  minutes: number;
  level: number;
}

export function heatmapCells(days: Map<string, DayLog>, today = new Date()): HeatCell[] {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - end.getDay() - 16 * 7);
  const cells: HeatCell[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = todayKey(cursor);
    const seconds = days.get(date)?.seconds ?? 0;
    const minutes = Math.round(seconds / 60);
    const level = minutes <= 0 ? 0 : minutes < 5 ? 1 : minutes < 15 ? 2 : minutes < 30 ? 3 : 4;
    cells.push({ date, minutes, level });
  }
  return cells;
}

export function totals(days: Iterable<DayLog>): { correct: number; wrong: number; byType: Record<string, { correct: number; wrong: number }> } {
  const byType: Record<string, { correct: number; wrong: number }> = {};
  let correct = 0;
  let wrong = 0;
  for (const day of days) {
    correct += day.correct;
    wrong += day.wrong;
    for (const [kind, stat] of Object.entries(day.byType)) {
      const row = byType[kind] ?? { correct: 0, wrong: 0 };
      row.correct += stat.correct;
      row.wrong += stat.wrong;
      byType[kind] = row;
    }
  }
  return { correct, wrong, byType };
}

export function weakCards(cards: Iterable<StoredCard>): StoredCard[] {
  return [...cards]
    .filter((card) => card.reps > 0 && (card.lapses >= 1 || card.difficulty >= 6.5))
    .sort((a, b) => b.lapses - a.lapses || b.difficulty - a.difficulty || a.stability - b.stability)
    .slice(0, 24);
}

export function learnedCount(cards: Iterable<StoredCard>): number {
  let n = 0;
  for (const card of cards) if (card.reps > 0) n += 1;
  return n;
}

export function matureCount(cards: Iterable<StoredCard>): number {
  let n = 0;
  for (const card of cards) if (isMature(card)) n += 1;
  return n;
}
