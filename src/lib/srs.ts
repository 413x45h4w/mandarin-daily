import {
  Rating,
  State,
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card,
  type Grade,
} from 'ts-fsrs';
import type { StoredCard } from '../types';

const scheduler = fsrs(
  generatorParameters({
    enable_fuzz: true,
    enable_short_term: true,
  }),
);

export { Rating, State };
export type { Grade };

export function emptyStored(wordId: string, now = new Date()): StoredCard {
  return cardToStored(wordId, createEmptyCard(now));
}

export function cardToStored(wordId: string, card: Card): StoredCard {
  return {
    wordId,
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.getTime() : null,
  };
}

export function storedToCard(card: StoredCard): Card {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  };
}

export function gradeCard(card: StoredCard | null, wordId: string, rating: Grade, now = new Date()): StoredCard {
  const current = card ? storedToCard(card) : createEmptyCard(now);
  const next = scheduler.next(current, now, rating);
  return cardToStored(wordId, next.card);
}

export function intervalLabels(card: StoredCard | null, now = new Date()): Record<Grade, string> {
  const current = card ? storedToCard(card) : createEmptyCard(now);
  const preview = scheduler.repeat(current, now);
  return {
    [Rating.Again]: formatGap(preview[Rating.Again].card.due, now),
    [Rating.Hard]: formatGap(preview[Rating.Hard].card.due, now),
    [Rating.Good]: formatGap(preview[Rating.Good].card.due, now),
    [Rating.Easy]: formatGap(preview[Rating.Easy].card.due, now),
  };
}

export function formatGap(due: Date, now: Date): string {
  const mins = Math.round((due.getTime() - now.getTime()) / 60000);
  if (mins <= 1) return '1m';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  if (months < 18) return `${months}mo`;
  const years = Math.round(days / 365);
  return `${Math.max(1, years)}y`;
}

export function isDue(card: StoredCard, now = Date.now()): boolean {
  return card.reps > 0 && card.due <= now;
}

export function isMature(card: StoredCard): boolean {
  return card.state === State.Review && (card.scheduled_days >= 21 || card.stability >= 21);
}
