import { describe, expect, it } from 'vitest';
import { liveTutorText, noteIsEmpty, parseTutor, stripThink } from './tutor';

describe('tutor replies', () => {
  it('parses the labeled format and ignores hidden thinking', () => {
    const raw = `<think>draft</think>
ZH: 你好，你今天怎么样？
PY: nǐ hǎo, nǐ jīn tiān zěn me yàng?
EN: Hi, how are you today?
NOTE: none`;
    expect(stripThink(raw).startsWith('ZH:')).toBe(true);
    const parsed = parseTutor(raw);
    expect(parsed.zh).toContain('你好');
    expect(parsed.en).toContain('how are you');
    expect(noteIsEmpty(parsed.note)).toBe(true);
  });

  it('shows Chinese as it streams and hides an unfinished think block', () => {
    expect(liveTutorText('<think>still going')).toBe('');
    expect(liveTutorText('<think>draft</think>\nZH: 你好')).toBe('你好');
    expect(liveTutorText('你好')).toBe('你好');
  });

  it('keeps an unlabeled reply as Chinese text', () => {
    const parsed = parseTutor('你好！');
    expect(parsed.zh).toBe('你好！');
    expect(parsed.en).toBe('');
  });
});
