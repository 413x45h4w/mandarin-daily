import type { Passage, Track } from '../types';
import { hashString } from './pinyin';
import { KEEP_ALIVE, probeOllama } from './ollama';

export function passageLevel(passage: Passage, track: Track): number {
  return track === 'classic' ? passage.h : passage.b;
}

export function choosePassage(
  passages: Passage[],
  track: Track,
  level: number,
  options?: { seenIds?: string[]; focus?: string[]; salt?: string },
): Passage | null {
  const stretch = level + 1;
  const eligible = passages.filter((passage) => {
    const band = passageLevel(passage, track);
    return band > 0 && band <= stretch;
  });
  if (!eligible.length) return null;
  const seenIds = options?.seenIds ?? [];
  const seen = new Set(seenIds);
  const focus = (options?.focus ?? []).filter((word) => word.length > 0);
  const salt = options?.salt ?? '';
  const unseen = eligible.filter((passage) => !seen.has(passage.id));
  if (unseen.length) {
    return [...unseen].sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id))[0];
  }
  const order = new Map(seenIds.map((id, index) => [id, index]));
  return [...eligible].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0) || a.id.localeCompare(b.id))[0];

  function score(passage: Passage): number {
    const text = passage.paragraphs.join('');
    let hits = 0;
    for (const word of focus) if (text.includes(word)) hits += 1;
    const band = passageLevel(passage, track);
    const levelBonus = band === level ? 3 : band === stretch ? 1 : 0;
    const jitter = hashString(`${salt}|${passage.id}`) % 5;
    return hits * 10 + levelBonus + jitter;
  }
}

export function rememberPassage(seenIds: string[] | undefined, id: string): string[] {
  return [...(seenIds ?? []).filter((item) => item !== id), id].slice(-500);
}

export function parseGeneratedPassage(raw: string, level: number): Passage | null {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let data: {
    title?: string;
    paragraphs?: unknown;
    questions?: { prompt?: string; options?: unknown; answer?: number }[];
  };
  try {
    data = JSON.parse(cleaned.slice(start, end + 1)) as typeof data;
  } catch {
    return null;
  }
  const paragraphs = Array.isArray(data.paragraphs) ? data.paragraphs.filter((line): line is string => typeof line === 'string' && line.trim().length > 0) : [];
  const questions = (data.questions ?? []).flatMap((question) => {
    const options = Array.isArray(question.options) ? question.options.filter((option): option is string => typeof option === 'string') : [];
    const answer = question.answer ?? 0;
    if (!question.prompt || options.length < 2 || answer < 0 || answer >= options.length) return [];
    return [{ prompt: question.prompt, options, answer }];
  });
  if (!data.title || paragraphs.length < 2 || questions.length < 1) return null;
  const band = Math.min(Math.max(level, 1), 9);
  return {
    id: `fresh-${hashString(data.title + paragraphs.join(''))}`,
    h: Math.min(band, 6),
    b: band,
    format: 'Fresh story',
    title: data.title,
    paragraphs,
    questions,
  };
}

export async function generateFreshPassage(options: {
  url: string;
  model: string;
  level: number;
  words: string[];
  signal?: AbortSignal;
}): Promise<Passage | null> {
  const up = await probeOllama(options.url);
  if (!up) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90000);
  const onAbort = () => ctrl.abort();
  options.signal?.addEventListener('abort', onAbort);
  const words = options.words.slice(0, 12).join('、') || '今天';
  const prompt = [
    `Write one short graded reading in simplified Chinese for a learner at HSK ${options.level}.`,
    'Four to six short sentences. A dialogue, diary, message, or news brief is fine.',
    `Use these study words when they fit naturally: ${words}.`,
    'Then two English comprehension questions with three options each. The answer field is the index of the correct option.',
    'Reply with JSON only:',
    '{"title":"...","paragraphs":["..."],"questions":[{"prompt":"...","options":["...","...","..."],"answer":0}]}',
  ].join('\n');
  try {
    const res = await fetch(`${options.url.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: options.model,
        stream: false,
        think: false,
        keep_alive: KEEP_ALIVE,
        options: { temperature: 0.8 },
        messages: [
          { role: 'system', content: 'You write short graded Chinese readings. Reply with JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { message?: { content?: string; thinking?: string } };
    const text = data.message?.content?.trim() || data.message?.thinking?.trim() || '';
    return parseGeneratedPassage(text, options.level);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', onAbort);
  }
}
