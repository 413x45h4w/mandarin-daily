import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state';
import type { GoalMinutes, Track, Word } from '../types';

const CLASSIC = [
  { level: 1, title: 'HSK 1', text: 'First conversations, tones, and daily nouns.' },
  { level: 2, title: 'HSK 2', text: 'Routines, shopping, and simple plans.' },
  { level: 3, title: 'HSK 3', text: 'Short stories and everyday opinions.' },
  { level: 4, title: 'HSK 4', text: 'Work, travel, and longer explanations.' },
  { level: 5, title: 'HSK 5', text: 'News, essays, and abstract ideas.' },
  { level: 6, title: 'HSK 6', text: 'Advanced reading and precise speech.' },
];

const HSK3 = [
  ...CLASSIC.map((item) => ({ ...item, title: `Band ${item.level}`, text: `New HSK 3.0 band ${item.level}.` })),
  { level: 7, title: 'Bands 7–9', text: 'The advanced new-HSK list, for wide reading.' },
];

export function Onboarding() {
  const { settings, updateSettings, index } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<'welcome' | 'track' | 'level' | 'quiz' | 'goal'>('welcome');
  const [track, setTrack] = useState<Track>(settings.track);
  const [level, setLevel] = useState(settings.level || 1);
  const [goal, setGoal] = useState<GoalMinutes>(settings.goalMinutes);
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [qi, setQi] = useState(0);
  const [correct, setCorrect] = useState(0);
  const options = track === 'classic' ? CLASSIC : HSK3;

  function count(lv: number) {
    return index.words.filter((word) => !word.alt && (track === 'classic' ? word.h === lv : word.b === lv)).length;
  }

  function finish() {
    updateSettings({ onboarded: true, track, level, goalMinutes: goal });
    navigate('/');
  }

  return (
    <div className="onboard">
      {step === 'welcome' && (
        <section className="stack">
          <span className="seal" aria-hidden="true">文</span>
          <p className="eyebrow">每天一点中文</p>
          <h1>A calm daily Mandarin practice.</h1>
          <p>Ten to thirty minutes. Reviews that come back when you need them, plus tones, listening, speaking, writing, and a short reading. Everything stays on this device.</p>
          <button type="button" className="btn btn-primary btn-xl" onClick={() => setStep('track')}>Start</button>
        </section>
      )}
      {step === 'track' && (
        <section className="stack">
          <p className="eyebrow">Which list?</p>
          <h1>Pick a syllabus</h1>
          <div className="choice-grid">
            <button type="button" className={`choice ${track === 'classic' ? 'on' : ''}`} onClick={() => setTrack('classic')}>
              <strong>HSK 2.0</strong>
              <span>The familiar 1–6 levels. HSK 1 is about 150 words, a gentle start.</span>
            </button>
            <button type="button" className={`choice ${track === 'hsk3' ? 'on' : ''}`} onClick={() => setTrack('hsk3')}>
              <strong>HSK 3.0</strong>
              <span>The newer bands, including 7–9. Band 1 is a larger beginner list.</span>
            </button>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setStep('level')}>Continue</button>
        </section>
      )}
      {step === 'level' && (
        <section className="stack">
          <p className="eyebrow">Your level</p>
          <h1>Where should new words start?</h1>
          <div className="choice-grid">
            {options.map((item) => (
              <button key={item.level} type="button" className={`choice ${level === item.level ? 'on' : ''}`} onClick={() => setLevel(item.level)}>
                <strong>{item.title}</strong>
                <span>{item.text} {count(item.level).toLocaleString()} words at this band.</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => {
              const made = makeQuiz(index.words, track);
              setQuiz(made);
              setQi(0);
              setCorrect(0);
              setStep(made.length ? 'quiz' : 'goal');
            }}
          >
            Not sure — quiz me
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setStep('goal')}>Use this level</button>
        </section>
      )}
      {step === 'quiz' && quiz[qi] && (
        <section className="stack">
          <p className="eyebrow">Question {qi + 1} of {quiz.length}</p>
          <h1 className="hanzi xl" lang="zh-CN">{quiz[qi].prompt}</h1>
          <div className="choices">
            {quiz[qi].options.map((option, index) => (
              <button
                key={option}
                type="button"
                className="choice"
                onClick={() => {
                  const hit = index === quiz[qi].answer;
                  const nextCorrect = correct + (hit ? 1 : 0);
                  if (qi + 1 >= quiz.length) {
                    const ratio = nextCorrect / quiz.length;
                    const recommended = ratio < 0.25 ? 1 : ratio < 0.45 ? 2 : ratio < 0.6 ? 3 : ratio < 0.75 ? 4 : ratio < 0.9 ? 5 : 6;
                    setLevel(track === 'hsk3' && ratio > 0.95 ? 7 : recommended);
                    setCorrect(nextCorrect);
                    setStep('goal');
                  } else {
                    setCorrect(nextCorrect);
                    setQi(qi + 1);
                  }
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      )}
      {step === 'goal' && (
        <section className="stack">
          <p className="eyebrow">Suggested level: {track === 'hsk3' && level >= 7 ? '7–9' : level}</p>
          <h1>Daily goal</h1>
          <div className="choice-grid">
            {options.map((item) => (
              <button key={item.level} type="button" className={`choice ${level === item.level ? 'on' : ''}`} onClick={() => setLevel(item.level)}>
                <strong>{item.title}</strong>
              </button>
            ))}
          </div>
          <div className="choice-grid goals">
            {([10, 20, 30] as GoalMinutes[]).map((minutes) => (
              <button key={minutes} type="button" className={`choice ${goal === minutes ? 'on' : ''}`} onClick={() => setGoal(minutes)}>
                <strong>{minutes} min</strong>
                <span>{minutes === 10 ? 'A short, steady day' : minutes === 20 ? 'The usual session' : 'A deeper mix'}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary btn-xl" onClick={finish}>Go to today</button>
        </section>
      )}
    </div>
  );
}

interface QuizItem {
  prompt: string;
  options: string[];
  answer: number;
}

function makeQuiz(words: Word[], track: Track): QuizItem[] {
  const bands = track === 'classic' ? [1, 1, 2, 2, 3, 3, 4, 5] : [1, 2, 2, 3, 3, 4, 5, 6];
  const items: QuizItem[] = [];
  bands.forEach((level, i) => {
    const pool = words.filter((word) => !word.alt && (track === 'classic' ? word.h : word.b) === level && word.m.length > 8 && !/particle|marker|surname/i.test(word.m));
    if (pool.length < 4) return;
    const sorted = [...pool].sort((a, b) => a.q - b.q);
    const word = sorted[Math.min(sorted.length - 1, 10 + i * 5)];
    const options = [shortMeaning(word.m)];
    for (const other of sorted) {
      if (other.id === word.id) continue;
      const text = shortMeaning(other.m);
      if (!options.includes(text)) options.push(text);
      if (options.length === 4) break;
    }
    if (options.length < 4) return;
    const answer = (i * 3) % 4;
    const correct = options.shift() as string;
    options.splice(answer, 0, correct);
    items.push({ prompt: word.s, options, answer });
  });
  return items;
}

function shortMeaning(meaning: string): string {
  return meaning.split(';')[0].replace(/\([^)]*\)/g, '').trim();
}
