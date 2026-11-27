import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GRAMMAR, grammarFor, grammarLevel } from '../data/grammar';
import { GlossaryText, RubyText, SpeakButton } from '../components';
import { useApp } from '../state';
import type { Track } from '../types';

export function GrammarHome() {
  const { settings } = useApp();
  const [level, setLevel] = useState(Math.min(settings.level, settings.track === 'hsk3' ? 9 : 6));
  const max = settings.track === 'hsk3' ? 9 : 6;
  const points = grammarFor(settings.track, level);
  const progress = settings.grammarProgress ?? {};

  return (
    <div className="stack">
      <h1>Grammar</h1>
      <p className="muted">Each point is explained in Chinese using words from this level or earlier. English stays hidden until you ask for it. Pinyin is on for HSK 1.</p>
      <div className="row">
        {Array.from({ length: max }, (_, index) => index + 1).map((item) => (
          <button key={item} type="button" className={`btn ${item === level ? 'btn-primary' : ''}`} onClick={() => setLevel(item)}>
            {settings.track === 'hsk3' ? `Band ${item}` : `HSK ${item}`}
          </button>
        ))}
      </div>
      {points.length === 0 && <p>No points are tagged at this level yet. Try the one below or above.</p>}
      <div className="stack">
        {points.map((point) => {
          const score = progress[point.id];
          return (
            <Link key={point.id} className="card grammar-link" to={`/grammar/${point.id}`}>
              <RubyText text={point.title} />
              <span className="muted">{score ? `${score.correct}/${score.total}` : 'Not yet'}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function GrammarLesson() {
  const { id } = useParams();
  const { settings, updateSettings } = useApp();
  const point = GRAMMAR.find((item) => item.id === id);
  const [english, setEnglish] = useState(false);
  const [picked, setPicked] = useState<(number | null)[]>(() => point?.quiz.map(() => null) ?? []);
  const [saved, setSaved] = useState(false);

  if (!point) {
    return (
      <div className="stack">
        <h1>Missing lesson</h1>
        <Link to="/grammar">Back to grammar</Link>
      </div>
    );
  }
  const lesson = point;

  const showPinyin = lesson.h <= 1 || settings.showPinyin;
  const done = picked.every((choice) => choice != null);
  const correct = picked.filter((choice, index) => choice === lesson.quiz[index].answer).length;

  function choose(quizIndex: number, option: number) {
    setPicked((current) => current.map((value, index) => (index === quizIndex ? option : value)));
  }

  function save() {
    if (!done || saved) return;
    updateSettings({
      grammarProgress: {
        ...settings.grammarProgress,
        [lesson.id]: { correct, total: lesson.quiz.length, at: Date.now() },
      },
    });
    setSaved(true);
  }

  return (
    <div className="stack">
      <Link to="/grammar">All grammar</Link>
      <div className="row spread">
        <p className="eyebrow">{levelLabel(settings.track, grammarLevel(lesson, settings.track))}</p>
        <button type="button" className={`btn ${english ? 'btn-primary' : ''}`} aria-pressed={english} onClick={() => setEnglish((value) => !value)}>
          English
        </button>
      </div>
      <div className="row spread">
        <h1><RubyText text={lesson.title} /></h1>
        <SpeakButton text={lesson.explain} label="Play the explanation" />
      </div>
      <GlossaryText text={lesson.explain} showPinyin={showPinyin} />
      {english && <p className="note">{lesson.explainEn}</p>}
      <h2>Examples</h2>
      {lesson.examples.map((example) => (
        <div key={example.zh} className="card stack">
          <div className="row spread">
            <GlossaryText text={example.zh} showPinyin={showPinyin} />
            <SpeakButton text={example.zh} label="Play the example" />
          </div>
          {english && <p className="muted">{example.en}</p>}
        </div>
      ))}
      <h2>Practice</h2>
      {lesson.quiz.map((quiz, quizIndex) => (
        <fieldset key={quiz.prompt} className="card stack">
          <legend><RubyText text={quiz.prompt} /></legend>
          {quiz.options.map((option, optionIndex) => {
            const choice = picked[quizIndex];
            const state = choice == null ? '' : optionIndex === quiz.answer ? 'correct' : optionIndex === choice ? 'wrong' : '';
            return (
              <button key={option} type="button" className={`choice ${state}`} disabled={choice != null} onClick={() => choose(quizIndex, optionIndex)}>
                <RubyText text={option} />
              </button>
            );
          })}
        </fieldset>
      ))}
      {done && (
        <div className="stack">
          <p>{correct} of {lesson.quiz.length} right.</p>
          <button type="button" className="btn btn-primary" onClick={save} disabled={saved}>{saved ? 'Saved' : 'Save progress'}</button>
        </div>
      )}
    </div>
  );
}

function levelLabel(track: Track, level: number): string {
  return track === 'hsk3' ? `Band ${level}` : `HSK ${level}`;
}

export function grammarDoneIds(progress: Record<string, { total: number }> | undefined): string[] {
  return Object.entries(progress ?? {}).filter(([, score]) => score.total > 0).map(([id]) => id);
}
