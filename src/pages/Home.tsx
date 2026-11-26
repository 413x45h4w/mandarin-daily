import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state';
import { GoalRing, HanziBlock, SpeakButton } from '../components';
import { formatLongDate, greeting, todayKey } from '../lib/dates';
import { chineseVoices } from '../lib/speech';
import { inPool, wordOfDay } from '../lib/segment';
import { isDue } from '../lib/srs';
import { dayActive, streakCount } from '../lib/stats';

export function Home() {
  const { settings, cards, days, index, updateSettings } = useApp();
  const today = todayKey();
  const log = days.get(today);
  const streak = streakCount(days, today);
  const due = [...cards.values()].filter((card) => {
    const word = index.byId.get(card.wordId);
    return word && isDue(card) && inPool(word, settings.track, settings.level);
  }).length;
  const fresh = index.words.filter((word) => inPool(word, settings.track, settings.level) && !cards.has(word.id)).length;
  const daily = wordOfDay(index.words, today, settings.track, settings.level);
  const [voiceState, setVoiceState] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [install, setInstall] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setVoiceState('missing');
      return;
    }
    const check = () => setVoiceState(chineseVoices(settings.traditional).length ? 'ok' : 'missing');
    check();
    window.speechSynthesis.addEventListener('voiceschanged', check);
    const timer = window.setTimeout(check, 1200);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', check);
      window.clearTimeout(timer);
    };
  }, [settings.traditional]);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  return (
    <div className="stack">
      <p className="eyebrow">{formatLongDate()}</p>
      <h1>{greeting()}</h1>
      <section className="hero">
        <GoalRing seconds={log?.seconds ?? 0} goal={settings.goalMinutes} />
        <div>
          <p className="streak">{streak > 0 ? `${streak} day streak` : 'Start a streak today'}</p>
          <p className="muted">{due} due · {fresh} new words waiting</p>
          {dayActive(log) && <p className="good-text">You already practiced today.</p>}
        </div>
      </section>
      <Link className="btn btn-primary btn-xl" to="/practice">
        {dayActive(log) ? 'Practice more' : 'Practice today'}
      </Link>
      <Link className="btn" to="/drill">Drill weak words</Link>
      {voiceState === 'missing' && !settings.voiceHintDismissed && (
        <div className="banner">
          <p>No Chinese voice is installed in this browser, so audio buttons stay quiet. On macOS, add 普通话 in Spoken Content. On Windows, add a Chinese language pack. Quizzes still work.</p>
          <button type="button" className="btn btn-ghost" onClick={() => updateSettings({ voiceHintDismissed: true })}>Dismiss</button>
        </div>
      )}
      {install && !settings.installHintDismissed && (
        <div className="banner">
          <p>Install Mandarin Daily for a full-screen icon and offline use after this visit.</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              void install.prompt();
              setInstall(null);
            }}
          >
            Install
          </button>
        </div>
      )}
      {daily && (
        <section className="card">
          <p className="eyebrow">Word of the day</p>
          <HanziBlock word={daily} size="lg" />
          <p>{daily.m}</p>
          <div className="row">
            <SpeakButton text={daily.s} />
            <Link to={`/words/${encodeURIComponent(daily.id)}`}>Open</Link>
          </div>
        </section>
      )}
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
