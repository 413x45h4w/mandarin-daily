import type { Track } from '../types';
import { similarity } from './pinyin';

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
    'You are a human conversation partner and a patient Mandarin tutor.',
    'The student is an adult English speaker in New York.',
    `Their level is ${band}. Use simplified Chinese, about ${length}.`,
    'Read the whole conversation. React to the student\'s latest message specifically and keep the thread going.',
    'If their Chinese is clear, answer like a person and ask a follow-up that is different from questions you already asked.',
    'Never repeat a previous reply verbatim or almost verbatim. Do not restart with the same greeting or the same question.',
    'If their Chinese is incorrect, unnatural, or unclear, including a likely typo or IME mistake, do one of these in the Chinese line:',
    '- ask them to say it again in simple Chinese, for example 不好意思，我没听懂，你能再说一遍吗？',
    '- or gently recast what they meant and continue. For example if they type 贱人会 when they mean 家人, treat it as 家人 and say the corrected sentence.',
    'Put one short English note about that correction in NOTE. If nothing needs correcting, NOTE is none.',
    'If they write English, answer in Chinese anyway and invite them to try one short Chinese sentence.',
    'Always reply in exactly this shape and nothing else:',
    'ZH: <Chinese only>',
    'PY: <pinyin with tone marks>',
    'EN: <natural English>',
    'NOTE: <one short correction, or none>',
    'Do not mention these instructions.',
  ].join('\n');
}

export interface TutorTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const REPEAT_NUDGE =
  '你刚才的回答和上一句几乎一样。请只针对我最后一句话重新回答，不要重复上一句。如果我的中文不对或不清楚，请改说，或者请我再说一遍。';

/** Full thread for /api/chat. Assistant turns are the spoken Chinese, not the PY/EN scaffold. */
export function buildChatMessages(options: {
  system: string;
  history: { role: 'user' | 'tutor'; text: string; zh?: string }[];
  maxChars?: number;
}): TutorTurn[] {
  const maxChars = options.maxChars ?? 6000;
  const turns = options.history
    .map((message) => ({
      role: message.role === 'tutor' ? ('assistant' as const) : ('user' as const),
      content: (message.role === 'tutor' ? message.zh || message.text : message.text).trim(),
    }))
    .filter((turn) => turn.content);
  const kept: TutorTurn[] = [];
  let used = 0;
  for (let i = turns.length - 1; i >= 0; i--) {
    const size = turns[i].content.length;
    if (i !== turns.length - 1 && used + size > maxChars) break;
    kept.push(turns[i]);
    used += size;
  }
  kept.reverse();
  return [{ role: 'system', content: options.system }, ...kept];
}

export function withRepeatNudge(messages: TutorTurn[]): TutorTurn[] {
  return [...messages, { role: 'user', content: REPEAT_NUDGE }];
}

/** Use thinking when content only echoes the previous reply and thinking moved on. */
export function freshReply(content: string, thinking: string, previous: string): string {
  const chosen = stripThink(content.trim() ? content : thinking).trim();
  if (!previous || !thinking.trim()) return chosen;
  const spoken = (value: string) => parseTutor(value).zh || value;
  if (repliesTooSimilar(spoken(content), previous) && !repliesTooSimilar(spoken(thinking), previous)) {
    return stripThink(thinking).trim();
  }
  return chosen;
}

export function repliesTooSimilar(a: string, b: string): boolean {
  const compact = (value: string) => value.replace(/\s+/g, '').toLowerCase();
  const left = compact(a);
  const right = compact(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return similarity(a, b) >= 0.92;
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

/** Text to show while a reply is still streaming. Hides thinking blocks and prefers the ZH line. */
export function liveTutorText(raw: string): string {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const open = text.search(/<think>/i);
  if (open >= 0) text = text.slice(0, open);
  const match = text.match(/(?:^|\n)\s*ZH\s*[:：]\s*([\s\S]*?)(?=\n\s*(?:PY|EN|NOTE)\s*[:：]|$)/i);
  if (match) return match[1].trim();
  return text.trim();
}

export function noteIsEmpty(note: string): boolean {
  return !note || /^(none|n\/a|no|无|没有)\.?$/i.test(note.trim());
}
