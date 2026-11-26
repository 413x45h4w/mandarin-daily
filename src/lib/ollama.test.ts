import { describe, expect, it } from 'vitest';
import { failureMessage, readChatStream } from './ollama';

describe('Ollama errors', () => {
  const base = { url: 'http://localhost:11434', origin: 'https://413x45h4w.github.io', model: 'qwen3-abliterated' };

  it('does not blame CORS for a timeout or a reachable server', () => {
    expect(failureMessage({ ...base, kind: 'timeout' })).not.toMatch(/OLLAMA_ORIGINS/);
    expect(failureMessage({ ...base, kind: 'timeout' })).toMatch(/5 minutes/);
    expect(failureMessage({ ...base, kind: 'network' })).not.toMatch(/OLLAMA_ORIGINS/);
    expect(failureMessage({ ...base, kind: 'abort' })).toBe('Cancelled.');
  });

  it('mentions OLLAMA_ORIGINS only when the server cannot be reached', () => {
    const message = failureMessage({ ...base, kind: 'unreachable' });
    expect(message).toMatch(/OLLAMA_ORIGINS/);
    expect(message).toContain(base.origin);
  });

  it('suggests installed models when the chosen model is missing', () => {
    const message = failureMessage({
      ...base,
      kind: 'http',
      status: 404,
      detail: 'model "qwen3-abliterated" not found',
      models: ['qwen2.5:7b', 'llama3.2'],
    });
    expect(message).toContain('qwen2.5:7b');
    expect(message).not.toMatch(/OLLAMA_ORIGINS/);
  });
});

describe('chat stream', () => {
  it('joins content split across chunks', async () => {
    const encoder = new TextEncoder();
    const pieces = [
      '{"message":{"content":"ZH: 你"}}\n{"message":{"content":"好"}}\n',
      '{"message":{"content":"！"},"done":true}',
    ];
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const piece of pieces) controller.enqueue(encoder.encode(piece));
        controller.close();
      },
    });
    const seen: string[] = [];
    const full = await readChatStream(body, (text) => seen.push(text));
    expect(full).toBe('ZH: 你好！');
    expect(seen).toEqual(['ZH: 你', 'ZH: 你好', 'ZH: 你好！']);
  });
});
