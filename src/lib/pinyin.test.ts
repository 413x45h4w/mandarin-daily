import { describe, expect, it } from 'vitest';
import { lettersAndTones, normalizePinyinInput, pinyinMatches, similarity, splitPinyin, toneOfSyllable } from './pinyin';

describe('pinyin', () => {
  it('reads tone marks and digits', () => {
    expect(toneOfSyllable('nǐ')).toBe(3);
    expect(toneOfSyllable('hao3')).toBe(3);
    expect(toneOfSyllable('de')).toBe(5);
    expect(splitPinyin('nǐ hǎo').map((s) => s.tone)).toEqual([3, 3]);
  });

  it('matches typed pinyin against numeric targets', () => {
    expect(pinyinMatches('nǐ hǎo', 'ni3 hao3')).toBe('match');
    expect(pinyinMatches('ni3hao3', 'ni3 hao3')).toBe('match');
    expect(pinyinMatches('ni hao', 'ni3 hao3')).toBe('need-tones');
    expect(pinyinMatches('ni3 hao4', 'ni3 hao3')).toBe('wrong');
    expect(lettersAndTones('nǚ').tones).toEqual([3]);
    expect(pinyinMatches('nǚ', 'nv3')).toBe('match');
  });

  it('normalizes custom-word pinyin', () => {
    expect(normalizePinyinInput('ni3 hao3')).toEqual({ p: 'nǐ hǎo', n: 'ni3 hao3' });
    expect(normalizePinyinInput('nǐ hǎo')?.n).toBe('ni3 hao3');
    expect(normalizePinyinInput('hello')).toBeNull();
  });

  it('scores spoken transcripts', () => {
    expect(similarity('你好。', '你好')).toBe(1);
    expect(similarity('你好吗', '你好')).toBeGreaterThan(0.5);
    expect(similarity('谢谢', '学习')).toBeLessThan(0.5);
  });
});
