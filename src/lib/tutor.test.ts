import { describe, expect, it } from 'vitest';
import { buildChatMessages, freshReply, liveTutorText, noteIsEmpty, parseTutor, repliesTooSimilar, stripThink, tutorSystemPrompt, withRepeatNudge } from './tutor';

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

  it('builds a multi-turn history and drops old turns past the budget', () => {
    const history = [
      { role: 'user' as const, text: '你好', zh: '' },
      { role: 'tutor' as const, text: 'ZH: 你好！\nPY: nǐ hǎo\nEN: Hi\nNOTE: none', zh: '你好！今天天气真好，你去公园了吗？' },
      { role: 'user' as const, text: '我觉得今天天气真的不好。', zh: '' },
    ];
    const messages = buildChatMessages({ system: 'Be a tutor.', history });
    expect(messages[0]).toEqual({ role: 'system', content: 'Be a tutor.' });
    expect(messages.map((message) => message.role)).toEqual(['system', 'user', 'assistant', 'user']);
    expect(messages[2].content).toBe('你好！今天天气真好，你去公园了吗？');
    expect(messages[2].content).not.toContain('PY:');
    expect(messages[3].content).toContain('天气真的不好');
    const bulky = Array.from({ length: 12 }, (_, index) => ({
      role: 'user' as const,
      text: `旧消息${index}${'很长'.repeat(40)}`,
      zh: '',
    }));
    bulky.push({ role: 'user', text: '最后一句', zh: '' });
    const trimmed = buildChatMessages({ system: 'sys', history: bulky, maxChars: 30 });
    expect(trimmed[0].role).toBe('system');
    expect(trimmed.at(-1)?.content).toBe('最后一句');
    expect(trimmed.some((message) => message.content.startsWith('旧消息0'))).toBe(false);
  });

  it('uses thinking when content only repeats the previous reply', () => {
    const previous = '你好！今天天气真好，你去公园了吗？';
    const thinking = 'ZH: 那你在家跟家人一起吃饭吧？贱人会听起来像家人。\nPY: nà nǐ zài jiā\nEN: So you are eating at home with your family?\nNOTE: 贱人会 is probably a typo for 家人.';
    const picked = freshReply(`ZH: ${previous}`, thinking, previous);
    expect(picked).toContain('家人');
    expect(picked).not.toBe(previous);
  });

  it('flags a copied tutor reply and can nudge a retry', () => {
    const first = '你好！今天天气真好，你去公园了吗？';
    expect(repliesTooSimilar(first, `  ${first} `)).toBe(true);
    expect(repliesTooSimilar(first, '那你在家跟家人一起吃饭吧？')).toBe(false);
    const nudged = withRepeatNudge(buildChatMessages({
      system: 'sys',
      history: [
        { role: 'user', text: '你好', zh: '' },
        { role: 'tutor', text: first, zh: first },
        { role: 'user', text: '我不去公园。', zh: '' },
      ],
    }));
    expect(nudged.at(-1)?.role).toBe('user');
    expect(nudged.at(-1)?.content).toContain('不要重复');
    expect(nudged.filter((message) => message.role === 'user')).toHaveLength(3);
  });

  it('tells the tutor to follow the latest sentence and not repeat itself', () => {
    const prompt = tutorSystemPrompt('classic', 1);
    expect(prompt).toContain('不好意思，我没听懂');
    expect(prompt).toContain('Never repeat');
  });

  it('keeps an unlabeled reply as Chinese text', () => {
    const parsed = parseTutor('你好！');
    expect(parsed.zh).toBe('你好！');
    expect(parsed.en).toBe('');
  });
});
