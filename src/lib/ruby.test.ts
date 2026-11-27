import { describe, expect, it } from 'vitest';
import { GRAMMAR } from '../data/grammar';
import { LEXICON, SENTENCES } from '../data/content';
import { PASSAGES } from '../data/passages';
import { buildIndex } from './segment';
import { annotate, hanziWithoutPinyin } from './ruby';

const index = buildIndex(LEXICON);
const SAMPLE = '你好，我是小明。今天早上我认识了新同学李华。李华是来自北京的。她会说英语，也和我一起开早会。我们都很开心，因为今天天气很好，还都来得早。我想去公园跑步，谢谢你的建议！';

describe('pinyin on every character', () => {
  it('covers the reported passage, including names and 英语', () => {
    expect(hanziWithoutPinyin(SAMPLE, index)).toEqual([]);
    const readings = annotate(SAMPLE, index).map((token) => token.pinyin.toLowerCase()).join(' ');
    expect(readings).toContain('xiǎo');
    expect(readings).toContain('míng');
    expect(readings).toContain('lǐ');
    expect(readings).toContain('huá');
    expect(readings).toContain('yīng');
    expect(readings).toContain('yǔ');
    const english = annotate(SAMPLE, index).find((token) => token.text.includes('英'));
    expect(english?.text).toBe('英语');
  });

  it('does not let an unleveled compound steal the next character', () => {
    const tokens = annotate('她大约跟我同年纪。', index).map((token) => token.text);
    expect(tokens.join('')).toContain('年纪');
    expect(hanziWithoutPinyin('她大约跟我同年纪。', index)).toEqual([]);
  });

  it('finds a reading for every hanzi in passages, lessons, and sentences', () => {
    const problems: string[] = [];
    for (const passage of PASSAGES) {
      for (const text of [passage.title, ...passage.paragraphs]) {
        const missing = hanziWithoutPinyin(text, index);
        if (missing.length) problems.push(`${passage.id} ${text} :: ${missing.join(' ')}`);
      }
    }
    for (const point of GRAMMAR) {
      const texts = [
        point.title,
        point.explain,
        ...point.examples.map((example) => example.zh),
        ...point.quiz.flatMap((quiz) => [quiz.prompt, ...quiz.options]),
      ];
      for (const text of texts) {
        const missing = hanziWithoutPinyin(text, index);
        if (missing.length) problems.push(`${point.id} ${text} :: ${missing.join(' ')}`);
      }
    }
    for (const sentence of SENTENCES) {
      const missing = hanziWithoutPinyin(sentence.zh, index);
      if (missing.length) problems.push(`${sentence.id} ${sentence.zh} :: ${missing.join(' ')}`);
    }
    expect(problems).toEqual([]);
  });
});
