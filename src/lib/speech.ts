export interface SpeakOptions {
  voiceURI?: string;
  traditional?: boolean;
  rate?: number;
}

function voiceScore(voice: SpeechSynthesisVoice, traditional: boolean): number {
  const lang = voice.lang.toLowerCase().replace('_', '-');
  const name = voice.name.toLowerCase();
  const chinese = lang.startsWith('zh') || name.includes('chinese') || name.includes('mandarin') || name.includes('中文');
  if (!chinese) return -1;
  let score = 0;
  if (traditional) {
    if (lang.includes('tw') || lang.includes('hk')) score += 40;
    if (lang.includes('cn')) score += 8;
  } else {
    if (lang.includes('cn') || lang === 'zh') score += 40;
    if (lang.includes('tw') || lang.includes('hk')) score += 10;
  }
  if (name.includes('xiaoxiao') || name.includes('xiaoyi')) score += 20;
  if (name.includes('yunxi') || name.includes('yunyang')) score += 16;
  if (name.includes('ting')) score += 12;
  if (name.includes('google')) score += 8;
  if (name.includes('natural') || name.includes('premium') || name.includes('enhanced')) score += 6;
  if (voice.localService) score += 2;
  return score;
}

export function chineseVoices(traditional = false): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voiceScore(voice, traditional) >= 0)
    .sort((a, b) => voiceScore(b, traditional) - voiceScore(a, traditional));
}

export function pickVoice(voices: SpeechSynthesisVoice[], options?: SpeakOptions): SpeechSynthesisVoice | null {
  if (options?.voiceURI) {
    const saved = voices.find((voice) => voice.voiceURI === options.voiceURI);
    if (saved) return saved;
  }
  const ranked = [...voices].sort(
    (a, b) => voiceScore(b, !!options?.traditional) - voiceScore(a, !!options?.traditional),
  );
  return ranked.find((voice) => voiceScore(voice, !!options?.traditional) >= 0) ?? null;
}

let speakTimer = 0;

export function speak(text: string, options?: SpeakOptions): void {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) return;
  window.clearTimeout(speakTimer);
  const attempt = (tries: number) => {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (voices.length === 0 && tries < 5) {
      speakTimer = window.setTimeout(() => attempt(tries + 1), 160);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.traditional ? 'zh-TW' : 'zh-CN';
    utterance.rate = options?.rate ?? 0.92;
    const voice = pickVoice(voices, options);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    try {
      synth.cancel();
      synth.speak(utterance);
    } catch {
      /* some browsers throw if speech is unavailable */
    }
  };
  attempt(0);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.clearTimeout(speakTimer);
  window.speechSynthesis.cancel();
}

export interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: BrowserSpeechResult) => void) | null;
  onerror: (() => void) | null;
}

interface BrowserSpeechResult {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

export function speechRecognitionCtor(): (new () => BrowserSpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function canRecognizeSpeech(): boolean {
  return speechRecognitionCtor() !== null;
}
