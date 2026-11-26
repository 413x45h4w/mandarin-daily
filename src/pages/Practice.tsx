import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rating } from 'ts-fsrs';
import { useApp } from '../state';
import type { StoredCard, Word } from '../types';
import { rememberPassage } from '../lib/readings';
import { buildSession, EXERCISE_LABEL, type Exercise } from '../lib/session';
import { todayKey } from '../lib/dates';
import {
  BuildDrill,
  DictateDrill,
  FlashDrill,
  ListenDrill,
  ReadDrill,
  SpeakDrill,
  ToneDrill,
  WriteDrill,
  type DrillResult,
} from '../session/drills';

export function Practice({ mode }: { mode: 'daily' | 'weak' }) {
  const app = useApp();
  const [round, setRound] = useState(0);
  return <PracticeRun key={`${mode}-${round}`} mode={mode} round={round} onAgain={() => setRound((n) => n + 1)} app={app} />;
}

function PracticeRun({
  mode,
  round,
  onAgain,
  app,
}: {
  mode: 'daily' | 'weak';
  round: number;
  onAgain: () => void;
  app: ReturnType<typeof useApp>;
}) {
  const navigate = useNavigate();
  const queue = useMemo(
    () =>
      buildSession({
        track: app.settings.track,
        level: app.settings.level,
        goal: app.settings.goalMinutes,
        words: app.index.words,
        sentences: app.sentences,
        passages: app.passages,
        cards: [...app.cards.values()],
        seenPassageIds: app.settings.seenPassageIds ?? [],
        focusWords: learningForms([...app.cards.values()], app.index.byId),
        mode,
        now: Date.now(),
        dayKey: `${todayKey()}#${round}`,
      }),
    // Build once per mount. The key on PracticeRun changes for another round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const touched = useRef(new Set<string>());
  const runningRef = useRef(true);
  runningRef.current = index < queue.length;

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!runningRef.current || document.visibilityState !== 'visible') return;
      app.addSeconds(1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [app.addSeconds]);

  if (!queue.length) {
    return (
      <div className="practice">
        <div className="drill">
          <h1>{mode === 'weak' ? 'No weak words yet' : 'Nothing to study'}</h1>
          <p className="muted">Finish a few sessions, or add words from the dictionary. Missed and difficult cards show up here.</p>
          <Link className="btn btn-primary" to="/">Back home</Link>
        </div>
      </div>
    );
  }

  if (!runningRef.current) {
    const total = correct + wrong;
    return (
      <div className="practice">
        <div className="drill">
          <p className="eyebrow">Session complete</p>
          <h1>Nice work</h1>
          <p>{total ? `${correct} of ${total} right` : 'All done'} · {mode === 'weak' ? 'weak-word drill' : 'daily mix'}</p>
          <div className="row">
            <Link className="btn btn-primary" to="/">Back home</Link>
            <button type="button" className="btn" onClick={onAgain}>Another round</button>
          </div>
        </div>
      </div>
    );
  }

  const exercise = queue[index];
  function finish(result: DrillResult) {
    if (exercise.kind === 'read') {
      app.updateSettings({ seenPassageIds: rememberPassage(app.settings.seenPassageIds, exercise.passageId) });
    }
    if (result.wordId && result.rating) {
      const key = `${result.wordId}:${result.source}`;
      const hadFlash = touched.current.has(`${result.wordId}:flash`);
      const shouldGrade = result.source === 'flash' || result.rating === Rating.Again || !hadFlash;
      if (shouldGrade && !touched.current.has(key)) {
        app.gradeWord(result.wordId, result.rating);
        touched.current.add(key);
        if (result.source === 'flash') touched.current.add(`${result.wordId}:flash`);
      }
    }
    app.recordExercise(result.kind, result.correct);
    if (result.correct) setCorrect((n) => n + 1);
    else setWrong((n) => n + 1);
    setIndex((n) => n + 1);
  }

  return (
    <div className="practice">
      <header className="practice-bar">
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>Close</button>
        <div className="bar" aria-hidden="true">
          <span style={{ width: `${(index / queue.length) * 100}%` }} />
        </div>
        <span className="muted">{index + 1}/{queue.length}</span>
      </header>
      <p className="sr-only" aria-live="polite">Exercise {index + 1} of {queue.length}, {EXERCISE_LABEL[exercise.kind] ?? exercise.kind}</p>
      <DrillView exercise={exercise} onDone={finish} />
    </div>
  );
}

function DrillView({ exercise, onDone }: { exercise: Exercise; onDone: (result: DrillResult) => void }) {
  const { index, sentences, passages } = useApp();
  if (exercise.kind === 'flash' || exercise.kind === 'tone' || exercise.kind === 'tone-pair' || exercise.kind === 'dictate' || exercise.kind === 'speak' || exercise.kind === 'write') {
    const word = index.byId.get(exercise.wordId);
    if (!word) return <Missing onDone={() => onDone({ kind: exercise.kind, correct: false, source: 'objective' })} />;
    if (exercise.kind === 'flash') return <FlashDrill exercise={exercise} word={word} onDone={onDone} />;
    if (exercise.kind === 'tone' || exercise.kind === 'tone-pair') return <ToneDrill word={word} mode={exercise.kind} onDone={onDone} />;
    if (exercise.kind === 'dictate') return <DictateDrill exercise={exercise} word={word} onDone={onDone} />;
    if (exercise.kind === 'speak') return <SpeakDrill word={word} sentence={exercise.sentenceId ? sentences.find((s) => s.id === exercise.sentenceId) : undefined} onDone={onDone} />;
    return <WriteDrill word={word} char={exercise.char} onDone={onDone} />;
  }
  if (exercise.kind === 'listen' || exercise.kind === 'build') {
    const sentence = sentences.find((item) => item.id === exercise.sentenceId);
    if (!sentence) return <Missing onDone={() => onDone({ kind: exercise.kind, correct: false, source: 'objective' })} />;
    if (exercise.kind === 'listen') return <ListenDrill exercise={exercise} sentence={sentence} onDone={onDone} />;
    return <BuildDrill exercise={exercise} sentence={sentence} onDone={onDone} />;
  }
  const passage = passages.find((item) => item.id === exercise.passageId);
  if (!passage) return <Missing onDone={() => onDone({ kind: 'read', correct: false, source: 'objective' })} />;
  return <ReadDrill passage={passage} onDone={onDone} />;
}

function learningForms(cards: StoredCard[], byId: Map<string, Word>): string[] {
  const forms: string[] = [];
  const ranked = [...cards].sort((a, b) => b.lapses - a.lapses || a.due - b.due || a.stability - b.stability);
  for (const card of ranked) {
    const word = byId.get(card.wordId)?.s;
    if (!word || forms.includes(word)) continue;
    forms.push(word);
    if (forms.length >= 24) break;
  }
  return forms;
}

function Missing({ onDone }: { onDone: () => void }) {
  return (
    <div className="drill">
      <p>This item is missing from the deck.</p>
      <button type="button" className="btn" onClick={onDone}>Continue</button>
    </div>
  );
}
