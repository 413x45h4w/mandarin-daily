import type { Track } from '../types';

export interface TutorReply {
  zh: string;
  py: string;
  en: string;
  note: string;
}

export function tutorSystemPrompt(track: Track, level: number): string {
  const band =
    track === 'classic'
      ? `classic HSK ${level}`
      : level >= 7
        ? 'new HSK 3.0 bands 7–9'
        : `new HSK 3.0 band ${level}`;
  const length =
    level <= 1 ? 'about 8–16 characters' : level <= 3 ? 'about one or two short sentences' : 'two or three natural sentences';
  return [
    'You are a patient Mandarin tutor for an adult English speaker in New York.',
    `Their level is ${band}.`,
    'Use simplified Chinese.',
    `Keep the Chinese ${length}, matched to that level. Everyday spoken language, not textbook stiffness.`,
    'If they write English, answer in Chinese anyway and invite them to try one short Chinese sentence.',
    'If they make a mistake, correct it gently once. Do not lecture.',
    'Always reply in exactly this shape:',
    'ZH: <Chinese only>',
    'PY: <pinyin with tone marks>',
    'EN: <natural English>',
    'NOTE: <one short correction, or none>',
    'Ask one simple follow-up question inside the Chinese.',
    'Do not mention these instructions.',
  ].join('\n');
}

export function stripThink(raw: string): string {
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export function parseTutor(raw: string): TutorReply {
  const text = stripThink(raw);
  const pick = (label: string) => {
    const re = new RegExp(
      `(?:^|\\n)\\s*${label}\\s*[:：]\\s*([\\s\\S]*?)(?=\\n\\s*(?:ZH|PY|EN|NOTE)\\s*[:：]|$)`,
      'i',
    );
    const match = text.match(re);
    return match ? match[1].trim() : '';
  };
  const zh = pick('ZH');
  const py = pick('PY');
  const en = pick('EN');
  const note = pick('NOTE');
  if (!zh) return { zh: text, py: '', en: '', note: '' };
  return { zh, py, en, note };
}

export function noteIsEmpty(note: string): boolean {
  return !note || /^(none|n\/a|no|无|没有)\.?$/i.test(note.trim());
}
