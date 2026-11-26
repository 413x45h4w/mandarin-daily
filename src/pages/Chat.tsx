import { useState, type FormEvent } from 'react';
import { useApp } from '../state';
import { GlossaryText, PinyinLine } from '../components';
import { noteIsEmpty, parseTutor, tutorSystemPrompt } from '../lib/tutor';
import type { ChatMessage } from '../types';

export function Chat() {
  const { settings, chat, setChat } = useApp();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const origin = typeof window === 'undefined' ? 'https://413x45h4w.github.io' : window.location.origin;

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    const user: ChatMessage = { id: crypto.randomUUID(), role: 'user', text, zh: '', py: '', en: '', note: '', at: Date.now() };
    const history = [...chat, user];
    setChat(history);
    setDraft('');
    setBusy(true);
    setError('');
    try {
      const reply = await askOllama(settings.ollamaUrl, settings.ollamaModel, [
        { role: 'system', content: tutorSystemPrompt(settings.track, settings.level) },
        ...history.slice(-8).map((message) => ({ role: message.role === 'tutor' ? 'assistant' : 'user', content: message.text })),
      ]);
      const parsed = parseTutor(reply);
      const tutor: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'tutor',
        text: reply,
        zh: parsed.zh,
        py: parsed.py,
        en: parsed.en,
        note: parsed.note,
        at: Date.now(),
      };
      setChat([...history, tutor]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ollama could not be reached.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack chat">
      <h1>Conversation partner</h1>
      <p className="muted">Optional. This talks to a local Ollama model. Everything else in the app works without it. Start Ollama with <code>OLLAMA_ORIGINS={origin}</code> so the browser is allowed to call {settings.ollamaUrl}.</p>
      <div className="thread">
        {chat.length === 0 && <p className="muted">Say hi in Chinese or English. Replies show characters first. Tap a message for pinyin and English.</p>}
        {chat.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
      </div>
      {error && (
        <div className="banner" role="alert">
          <p>Can’t reach Ollama at {settings.ollamaUrl}. Is it running, and does OLLAMA_ORIGINS include {origin}? {error}</p>
        </div>
      )}
      <form className="composer" onSubmit={(event) => void send(event)}>
        <label className="sr-only" htmlFor="chat-input">Message</label>
        <textarea id="chat-input" rows={3} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="试着用中文说说今天。" />
        <button type="submit" className="btn btn-primary" disabled={busy || !draft.trim()}>{busy ? 'Thinking…' : 'Send'}</button>
      </form>
      {chat.length > 0 && <button type="button" className="btn btn-ghost" onClick={() => setChat([])}>Clear chat</button>}
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const [open, setOpen] = useState(false);
  if (message.role === 'user') {
    return <p className="bubble me">{message.text}</p>;
  }
  return (
    <div className="bubble tutor">
      <GlossaryText text={message.zh || message.text} showPinyin={false} />
      <button type="button" className="btn btn-ghost" onClick={() => setOpen((value) => !value)}>
        {open ? 'Hide pinyin and English' : 'Pinyin and English'}
      </button>
      {open && (
        <div className="stack">
          {message.py && <PinyinLine pinyin={message.py} />}
          {message.en && <p>{message.en}</p>}
          {!message.py && !message.en && <p className="muted">The model did not split out pinyin and English. Raw reply: {message.text}</p>}
          {!noteIsEmpty(message.note) && <p className="note">Note: {message.note}</p>}
        </div>
      )}
    </div>
  );
}

async function askOllama(url: string, model: string, messages: { role: string; content: string }[]): Promise<string> {
  const base = url.replace(/\/$/, '');
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 45000);
  try {
    let res: Response;
    try {
      res = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false }),
        signal: ctrl.signal,
      });
    } catch {
      throw new Error('The request failed before Ollama answered. Check that it is running and that this origin is listed in OLLAMA_ORIGINS.');
    }
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 180);
      throw new Error(detail || `Ollama returned HTTP ${res.status}.`);
    }
    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content?.trim();
    if (!content) throw new Error('The model returned an empty reply.');
    return content;
  } finally {
    window.clearTimeout(timer);
  }
}
