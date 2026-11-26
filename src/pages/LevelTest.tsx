import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GRAMMAR } from '../data/grammar';
import { SENTENCES } from '../data/content';
import {
  ITEMS_PER_SKILL,
  SKILLS,
  clampToBank,
  makePlacementItem,
  maxPlacementLevel,
  overallLevel,
  skillEstimate,
  startingLevel,
  stepLevel,
  type PlacementAnswer,
  type PlacementItem,
  type Skill,
} from '../lib/placement';
import { speak } from '../lib/speech';
import { useApp } from '../state';
import type { PlacementRecord, Track } from '../types';

const SKILL_LABEL: Record<Skill, string> = {
  vocab: 'Vocabulary',
  reading: 'Reading',
  grammar: 'Grammar',
  listening: 'Listening',
};

export function LevelTest() {
  const { ready, settings, updateSettings, index } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const incoming = (location.state as { track?: Track } | null)?.track;
  const [track, setTrack] = useState<Track>(incoming || settings.track);
  const [phase, setPhase] = useState<'intro' | 'ask' | 'result'>('intro');
  const [skillIndex, setSkillIndex] = useState(0);
  const [item, setItem] = useState<PlacementItem | null>(null);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [record, setRecord] = useState<PlacementRecord | null>(null);
  const [salt, setSalt] = useState(1);
  const banks = useMemo(() => ({ words: index.words, sentences: SENTENCES, grammar: GRAMMAR }), [index.words]);
  const history = settings.placementHistory ?? [];
  const max = maxPlacementLevel(track);

  if (!ready) return null;

  function begin() {
    const first = SKILLS[0];
    const level = clampToBank(first, track, startingLevel(track), banks);
    setSkillIndex(0);
    setAnswers([]);
    setPicked(null);
    setRecord(null);
    setSalt(1);
    setItem(makePlacementItem(first, track, level, banks, `${track}|${first}|1`));
    setPhase('ask');
  }

  function finish(nextAnswers: PlacementAnswer[]) {
    const skills = {
      vocab: skillEstimate(nextAnswers.filter((answer) => answer.skill === 'vocab')),
      reading: skillEstimate(nextAnswers.filter((answer) => answer.skill === 'reading')),
      grammar: skillEstimate(nextAnswers.filter((answer) => answer.skill === 'grammar')),
      listening: skillEstimate(nextAnswers.filter((answer) => answer.skill === 'listening')),
    };
    const next: PlacementRecord = {
      id: `p${Date.now()}`,
      at: Date.now(),
      track,
      level: overallLevel(skills),
      skills,
      correct: nextAnswers.filter((answer) => answer.correct).length,
      total: nextAnswers.length,
      applied: false,
    };
    setRecord(next);
    updateSettings({ placementHistory: [next, ...history].slice(0, 12) });
    setPhase('result');
  }

  function choose(indexPicked: number) {
    if (!item || picked != null) return;
    const correct = indexPicked === item.answer;
    setPicked(indexPicked);
    const nextAnswers = [...answers, { skill: item.skill, level: item.level, correct }];
    window.setTimeout(() => {
      setAnswers(nextAnswers);
      setPicked(null);
      const inSkill = nextAnswers.filter((answer) => answer.skill === item.skill).length;
      if (inSkill < ITEMS_PER_SKILL) {
        const level = clampToBank(item.skill, track, stepLevel(item.level, correct, max), banks);
        const nextSalt = salt + 1;
        setSalt(nextSalt);
        setItem(makePlacementItem(item.skill, track, level, banks, `${track}|${item.skill}|${nextSalt}`));
        return;
      }
      const nextSkill = skillIndex + 1;
      if (nextSkill < SKILLS.length) {
        const skill = SKILLS[nextSkill];
        const level = clampToBank(skill, track, startingLevel(track), banks);
        const nextSalt = salt + 1;
        setSalt(nextSalt);
        setSkillIndex(nextSkill);
        setItem(makePlacementItem(skill, track, level, banks, `${track}|${skill}|${nextSalt}`));
        return;
      }
      finish(nextAnswers);
    }, 700);
  }

  function apply(entry: PlacementRecord) {
    updateSettings({
      track: entry.track,
      level: entry.level,
      onboarded: true,
      placementHistory: (settings.placementHistory ?? history).map((itemRow) => (itemRow.id === entry.id ? { ...itemRow, applied: true } : itemRow)),
    });
    navigate('/');
  }

  const back = settings.onboarded ? '/settings' : '/welcome';

  if (phase === 'intro') {
    return (
      <div className="onboard">
        <section className="stack">
          <p className="eyebrow">Level test</p>
          <h1>Where are you, really?</h1>
          <p>Twenty questions across vocabulary, reading, grammar, and listening. A right answer moves up a level. A miss moves down. You can retake it whenever you want.</p>
          <div className="choice-grid">
            <button type="button" className={`choice ${track === 'classic' ? 'on' : ''}`} onClick={() => setTrack('classic')}>
              <strong>HSK 2.0</strong>
              <span>Levels 1–6.</span>
            </button>
            <button type="button" className={`choice ${track === 'hsk3' ? 'on' : ''}`} onClick={() => setTrack('hsk3')}>
              <strong>HSK 3.0</strong>
              <span>Bands 1–9. Bands 7–9 share one official list, split here by frequency.</span>
            </button>
          </div>
          <button type="button" className="btn btn-primary btn-xl" onClick={begin}>Start the test</button>
          <Link to={back}>Not now</Link>
          {history.length > 0 && <History rows={history} />}
        </section>
      </div>
    );
  }

  if (phase === 'result' && record) {
    return (
      <div className="onboard">
        <section className="stack">
          <p className="eyebrow">Estimated level</p>
          <h1>{record.track === 'hsk3' ? `Band ${record.level}` : `HSK ${record.level}`}</h1>
          <p>{record.correct} of {record.total} right. The level is the middle of the four skills, so one strong skill does not hide a weak one.</p>
          <SkillBars skills={record.skills} max={maxPlacementLevel(record.track)} />
          <button type="button" className="btn btn-primary btn-xl" onClick={() => apply(record)}>Use this level</button>
          <button type="button" className="btn" onClick={begin}>Retake</button>
          <Link to={back}>Keep my current level</Link>
          {history.length > 1 && <History rows={history} />}
        </section>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="onboard">
        <p>This level has no question ready.</p>
        <button type="button" className="btn" onClick={() => setPhase('intro')}>Back</button>
      </div>
    );
  }

  const skillCount = answers.filter((answer) => answer.skill === item.skill).length + 1;
  const overallCount = answers.length + 1;

  return (
    <div className="onboard">
      <section className="stack">
        <div className="row spread">
          <p className="eyebrow">{SKILL_LABEL[item.skill]} · {skillCount} of {ITEMS_PER_SKILL}</p>
          <span className="muted tiny">{overallCount} / {SKILLS.length * ITEMS_PER_SKILL}</span>
        </div>
        <div className="bar" aria-hidden="true"><span style={{ width: `${((overallCount - 1) / (SKILLS.length * ITEMS_PER_SKILL)) * 100}%` }} /></div>
        <p className="muted tiny">Trying {track === 'hsk3' ? 'band' : 'level'} {item.level}</p>
        {item.skill === 'listening' ? (
          <div className="stack">
            <h1>What did you hear?</h1>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => speak(item.speak, { voiceURI: settings.voiceURI, traditional: settings.traditional, rate: 0.9 })}
            >
              Play
            </button>
          </div>
        ) : (
          <h1 className={item.skill === 'vocab' || item.skill === 'reading' ? 'hanzi lg' : ''} lang="zh-CN">{item.prompt}</h1>
        )}
        <div className="stack">
          {item.choices.map((choice, indexChoice) => {
            const state = picked == null ? '' : indexChoice === item.answer ? 'correct' : indexChoice === picked ? 'wrong' : '';
            return (
              <button
                key={choice}
                type="button"
                className={`choice ${state}`}
                disabled={picked != null}
                onClick={() => choose(indexChoice)}
              >
                {choice}
              </button>
            );
          })}
        </div>
        {picked != null && item.skill === 'listening' && <p className="hanzi" lang="zh-CN">{item.reveal}</p>}
        <button type="button" className="btn btn-ghost" onClick={() => setPhase('intro')}>Stop</button>
      </section>
    </div>
  );
}

function SkillBars({ skills, max }: { skills: PlacementRecord['skills']; max: number }) {
  return (
    <div className="card stack">
      {SKILLS.map((skill) => (
        <div className="skill" key={skill}>
          <span>{SKILL_LABEL[skill]}</span>
          <span className="meter" aria-hidden="true"><span style={{ width: `${(skills[skill] / max) * 100}%` }} /></span>
          <strong>{skills[skill]}</strong>
        </div>
      ))}
    </div>
  );
}

function History({ rows }: { rows: PlacementRecord[] }) {
  return (
    <div className="stack">
      <h2>Earlier tests</h2>
      {rows.map((row) => (
        <p key={row.id} className="muted">
          {new Date(row.at).toLocaleDateString()} · {row.track === 'hsk3' ? `Band ${row.level}` : `HSK ${row.level}`} · {row.correct}/{row.total}
          {row.applied ? ' · applied' : ''}
        </p>
      ))}
    </div>
  );
}
