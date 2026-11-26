import { stripThink } from './tutor';

export const KEEP_ALIVE = '30m';
export const CHAT_TIMEOUT_MS = 5 * 60 * 1000;

export type OllamaFailureKind = 'abort' | 'timeout' | 'unreachable' | 'network' | 'http' | 'empty';

export class OllamaError extends Error {
  readonly kind: OllamaFailureKind;

  constructor(kind: OllamaFailureKind, message: string) {
    super(message);
    this.name = 'OllamaError';
    this.kind = kind;
  }
}

export function ollamaBase(url: string): string {
  return url.trim().replace(/\/$/, '');
}

export function failureMessage(options: {
  kind: OllamaFailureKind;
  url: string;
  origin: string;
  model: string;
  status?: number;
  detail?: string;
  models?: string[];
}): string {
  const { kind, url, origin, model, status, detail, models } = options;
  if (kind === 'abort') return 'Cancelled.';
  if (kind === 'timeout') {
    return 'Still waiting after 5 minutes. A large model can take a couple of minutes to load the first time. Send again once it has finished loading.';
  }
  if (kind === 'unreachable') {
    return `Can't reach Ollama at ${url}. If it is running, restart it with OLLAMA_ORIGINS including ${origin}.`;
  }
  if (kind === 'network') {
    return `The chat request failed, but Ollama at ${url} is responding. Try again.`;
  }
  if (kind === 'empty') return 'The model returned an empty reply.';
  const notFound = status === 404 || /not found/i.test(detail ?? '');
  if (notFound) {
    const listed = (models ?? []).filter(Boolean);
    const suggestion = listed.length ? ` Installed models: ${listed.join(', ')}.` : ' No models are installed yet.';
    return `Ollama doesn't have “${model}”.${suggestion}`;
  }
  const extra = detail?.trim() ? ` ${detail.trim().slice(0, 180)}` : '';
  return `Ollama returned HTTP ${status ?? 'error'}.${extra}`;
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException
    ? err.name === 'AbortError'
    : err instanceof Error && err.name === 'AbortError';
}

export interface ChatChunk {
  message?: { content?: string; thinking?: string };
  thinking?: string;
  error?: string;
}

/** Prefer spoken content. Thinking-capable models sometimes put the whole answer in `thinking` and leave `content` empty. */
export function chooseReply(content: string, thinking: string): string {
  const body = content.trim() ? content : thinking;
  return stripThink(body).trim();
}

export async function readChatStream(body: ReadableStream<Uint8Array>, onDelta: (full: string) => void): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let thinking = '';
  const take = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let chunk: ChatChunk;
    try {
      chunk = JSON.parse(trimmed) as ChatChunk;
    } catch {
      throw new Error(trimmed.slice(0, 180));
    }
    if (chunk.error) throw new Error(chunk.error);
    content += chunk.message?.content ?? '';
    thinking += chunk.message?.thinking ?? chunk.thinking ?? '';
    const reply = chooseReply(content, thinking);
    if (reply) onDelta(reply);
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) take(line);
  }
  buffer += decoder.decode();
  if (buffer.trim()) take(buffer);
  return chooseReply(content, thinking);
}

async function withTimeout<T>(work: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await work(ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}

export async function probeOllama(url: string, timeoutMs = 8000): Promise<boolean> {
  try {
    return await withTimeout(async (signal) => {
      const res = await fetch(`${ollamaBase(url)}/api/version`, { signal });
      return res.ok;
    }, timeoutMs);
  } catch {
    return false;
  }
}

export async function listModels(url: string, timeoutMs = 8000): Promise<string[]> {
  try {
    return await withTimeout(async (signal) => {
      const res = await fetch(`${ollamaBase(url)}/api/tags`, { signal });
      if (!res.ok) return [];
      const data = (await res.json()) as { models?: { name?: string }[] };
      return (data.models ?? []).map((model) => model.name ?? '').filter(Boolean);
    }, timeoutMs);
  } catch {
    return [];
  }
}

export async function warmModel(url: string, model: string, signal: AbortSignal): Promise<'ok' | 'missing' | 'unreachable' | 'timeout' | 'aborted'> {
  try {
    const res = await fetch(`${ollamaBase(url)}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, keep_alive: KEEP_ALIVE, stream: false, think: false }),
      signal,
    });
    if (res.status === 404) return 'missing';
    await res.body?.cancel()?.catch(() => undefined);
    return 'ok';
  } catch (err) {
    if (isAbortError(err)) return signal.reason === 'timeout' ? 'timeout' : 'aborted';
    const up = await probeOllama(url);
    return up ? 'ok' : 'unreachable';
  }
}

export async function streamChat(options: {
  url: string;
  model: string;
  origin: string;
  messages: { role: string; content: string }[];
  signal: AbortSignal;
  timeoutMs?: number;
  onDelta?: (full: string) => void;
}): Promise<string> {
  const { url, model, origin, messages, signal, onDelta } = options;
  const timeoutMs = options.timeoutMs ?? CHAT_TIMEOUT_MS;
  const ctrl = new AbortController();
  const onParentAbort = () => ctrl.abort(signal.reason === 'timeout' ? 'timeout' : 'user');
  if (signal.aborted) onParentAbort();
  else signal.addEventListener('abort', onParentAbort, { once: true });
  const timer = setTimeout(() => {
    if (!ctrl.signal.aborted) ctrl.abort('timeout');
  }, timeoutMs);
  const base = ollamaBase(url);
  try {
    let res: Response;
    try {
      res = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true, keep_alive: KEEP_ALIVE, think: false }),
        signal: ctrl.signal,
      });
    } catch (err) {
      if (isAbortError(err)) {
        const kind = ctrl.signal.reason === 'timeout' ? 'timeout' : 'abort';
        throw new OllamaError(kind, failureMessage({ kind, url: base, origin, model }));
      }
      const up = await probeOllama(base);
      const kind = up ? 'network' : 'unreachable';
      throw new OllamaError(kind, failureMessage({ kind, url: base, origin, model }));
    }
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      const models = res.status === 404 || /not found/i.test(detail) ? await listModels(base) : undefined;
      throw new OllamaError('http', failureMessage({ kind: 'http', url: base, origin, model, status: res.status, detail, models }));
    }
    if (!res.body) {
      const data = (await res.json()) as ChatChunk;
      const content = chooseReply(data.message?.content ?? '', data.message?.thinking ?? data.thinking ?? '');
      if (!content) throw new OllamaError('empty', failureMessage({ kind: 'empty', url: base, origin, model }));
      onDelta?.(content);
      return content;
    }
    let content = '';
    try {
      content = await readChatStream(res.body, (full) => onDelta?.(full));
    } catch (err) {
      if (isAbortError(err)) {
        const kind = ctrl.signal.reason === 'timeout' ? 'timeout' : 'abort';
        throw new OllamaError(kind, failureMessage({ kind, url: base, origin, model }));
      }
      const detail = err instanceof Error ? err.message : '';
      throw new OllamaError('http', failureMessage({ kind: 'http', url: base, origin, model, detail }));
    }
    if (!content) throw new OllamaError('empty', failureMessage({ kind: 'empty', url: base, origin, model }));
    return content;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onParentAbort);
  }
}
