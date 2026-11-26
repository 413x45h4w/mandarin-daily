import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state';
import { chineseVoices } from '../lib/speech';
import type { GoalMinutes, Theme, Track } from '../types';

export function Settings() {
  const { settings, updateSettings, exportBackup, importBackup, resetProgress } = useApp();
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const load = () => setVoices(chineseVoices(settings.traditional));
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, [settings.traditional]);

  async function toggleReminder(enabled: boolean) {
    if (!enabled) {
      updateSettings({ reminderEnabled: false });
      return;
    }
    if (typeof Notification === 'undefined') {
      setMessage('This browser has no Notification API.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setMessage('Permission was not granted. The switch stays off.');
      return;
    }
    updateSettings({ reminderEnabled: true });
    setMessage('Reminders only fire while this app is open. Phones do not run a reliable background alarm for a site without a push server.');
  }

  return (
    <div className="stack">
      <h1>Settings</h1>
      <fieldset className="card stack">
        <legend>Appearance</legend>
        <label className="field">Theme
          <select value={settings.theme} onChange={(event) => updateSettings({ theme: event.target.value as Theme })}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <Toggle label="Show pinyin beside characters" checked={settings.showPinyin} onChange={(showPinyin) => updateSettings({ showPinyin })} />
        <p className="muted tiny">Quizzes still hide pinyin until you answer.</p>
        <Toggle label="Color tones" checked={settings.toneColors} onChange={(toneColors) => updateSettings({ toneColors })} />
        <Toggle label="Traditional characters" checked={settings.traditional} onChange={(traditional) => updateSettings({ traditional })} />
      </fieldset>
      <fieldset className="card stack">
        <legend>Study</legend>
        <label className="field">Syllabus
          <select value={settings.track} onChange={(event) => updateSettings({ track: event.target.value as Track })}>
            <option value="classic">HSK 2.0</option>
            <option value="hsk3">HSK 3.0</option>
          </select>
        </label>
        <label className="field">Level
          <select value={settings.level} onChange={(event) => updateSettings({ level: Number(event.target.value) })}>
            {[1, 2, 3, 4, 5, 6, 7].filter((level) => settings.track === 'hsk3' || level < 7).map((level) => (
              <option key={level} value={level}>{level === 7 ? 'Bands 7–9' : `Level ${level}`}</option>
            ))}
          </select>
        </label>
        <label className="field">Daily goal
          <select value={settings.goalMinutes} onChange={(event) => updateSettings({ goalMinutes: Number(event.target.value) as GoalMinutes })}>
            <option value={10}>10 minutes</option>
            <option value={20}>20 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
        </label>
        <p className="muted tiny">Changing level changes which new words appear. Cards you already have stay in the deck.</p>
        <Link to="/welcome">Retake placement</Link>
      </fieldset>
      <fieldset className="card stack">
        <legend>Audio</legend>
        <label className="field">Chinese voice
          <select value={settings.voiceURI} onChange={(event) => updateSettings({ voiceURI: event.target.value })}>
            <option value="">Best available</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>
            ))}
          </select>
        </label>
        {voices.length === 0 && <p className="muted">No zh voice detected yet. Install a Chinese speech voice in the system settings.</p>}
      </fieldset>
      <fieldset className="card stack">
        <legend>Reminder</legend>
        <Toggle label="Daily reminder" checked={settings.reminderEnabled} onChange={(value) => void toggleReminder(value)} />
        <label className="field">Time
          <input type="time" value={settings.reminderTime} onChange={(event) => updateSettings({ reminderTime: event.target.value })} />
        </label>
        <p className="muted tiny">Best effort only. A installed PWA still cannot promise a background notification on iOS, and most browsers only deliver this while the page is open.</p>
      </fieldset>
      <fieldset className="card stack">
        <legend>Conversation partner</legend>
        <label className="field">Ollama URL
          <input value={settings.ollamaUrl} onChange={(event) => updateSettings({ ollamaUrl: event.target.value })} autoCapitalize="none" />
        </label>
        <label className="field">Model
          <input value={settings.ollamaModel} onChange={(event) => updateSettings({ ollamaModel: event.target.value })} autoCapitalize="none" />
        </label>
      </fieldset>
      <fieldset className="card stack">
        <legend>Your data</legend>
        <button type="button" className="btn" onClick={exportBackup}>Export progress JSON</button>
        <label className="btn">
          Import progress JSON
          <input
            className="sr-only"
            type="file"
            accept="application/json"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              try {
                await importBackup(JSON.parse(await file.text()));
                setMessage('Progress restored on this device.');
              } catch (err) {
                setMessage(err instanceof Error ? err.message : 'Could not import that file.');
              }
            }}
          />
        </label>
        {!confirmReset ? (
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(true)}>Reset progress</button>
        ) : (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              void resetProgress().then(() => {
                setConfirmReset(false);
                setMessage('Progress cleared. Your level and settings stayed.');
              });
            }}
          >
            Confirm reset
          </button>
        )}
      </fieldset>
      {message && <p role="status" className="banner">{message}</p>}
      <Link to="/about">About, sources, and licenses</Link>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
