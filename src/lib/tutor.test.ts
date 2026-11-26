import { describe, expect, it } from 'vitest';
import { noteIsEmpty, parseTutor, stripThink } from './tutor';

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

  it('keeps an unlabeled reply as Chinese text', () => {
    const parsed = parseTutor('你好！');
    expect(parsed.zh).toBe('你好！');
    expect(parsed.en).toBe('');
  });
});
