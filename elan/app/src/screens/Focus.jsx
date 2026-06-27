import { useState, useEffect, useRef, useCallback } from 'react';
import { C, AREA_COLORS, AREA_LABELS } from '../constants.js';
import { Btn, Card, CircleTimer, RingChart } from '../components.jsx';
import { beep } from '../utils/audio.js';
import {
  logSession, logSessionDone, saveSessionState, clearSessionState,
  streak, weekDoneCount, readDiff,
} from '../engine.js';

/* ── Stepper ── */
function Stepper({ value, onChange, min = 0, max = 999, step = 1, label, unit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {label && <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: C.tint, cursor: 'pointer', fontSize: 20, color: C.ink }}
        >−</button>
        <div style={{ textAlign: 'center', minWidth: 60 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: C.ink }}>{value}</span>
          {unit && <span style={{ fontSize: 13, color: C.muted, marginLeft: 4 }}>{unit}</span>}
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: C.teal, cursor: 'pointer', fontSize: 20, color: '#fff' }}
        >+</button>
      </div>
    </div>
  );
}

/* ── WeightStepper for gym exercises ── */
function WeightStepper({ ex, setIdx, onChange }) {
  const [weight, setWeight] = useState(12.5);
  const [reps, setReps] = useState(ex.reps || 8);

  useEffect(() => { onChange(setIdx, weight, reps); }, [weight, reps]);

  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
      <Stepper label="Charge" value={weight} step={2.5} min={0} max={200} unit="kg" onChange={setWeight} />
      <Stepper label="Répétitions" value={reps} step={1} min={1} max={30} unit="reps" onChange={setReps} />
    </div>
  );
}

/* ── ExerciseCard ── */
function ExerciseCard({ ex, onOutcome, onGymLog }) {
  const [phase, setPhase] = useState('preview'); // preview | work | rest | gym
  const [elapsed, setElapsed] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const intervalRef = useRef(null);
  const workDur = ex.workSec > 0 ? ex.workSec : 0;
  const restDur = ex.restSec || 60;
  const color = AREA_COLORS[ex.area] || C.teal;
  const isTime = ex.sec > 0 || (ex.unit === 'time');
  const isTimed = workDur > 0 && !ex.weighted;
  const isReps = ex.unit === 'reps' && !ex.weighted;

  useEffect(() => { return () => clearInterval(intervalRef.current); }, []);

  const startTimer = useCallback((dur, onEnd) => {
    setElapsed(0);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (next >= dur) { clearInterval(intervalRef.current); onEnd(); }
        if (next === dur - 3) beep(660, 0.1);
        if (next === dur) beep(880, 0.18);
        return next;
      });
    }, 1000);
  }, []);

  const finishSet = useCallback(() => {
    const nextSet = currentSet + 1;
    if (nextSet >= (ex.sets || 1)) {
      setPhase('done_ex');
    } else {
      setCurrentSet(nextSet);
      setPhase('rest');
      if (restDur > 0) startTimer(restDur, () => { setPhase('work'); startTimer(workDur, finishSet); });
    }
  }, [currentSet, ex.sets, restDur, workDur]);

  const startWork = () => {
    setPhase('work');
    if (isTimed && workDur > 0) startTimer(workDur, finishSet);
  };

  const handleComplete = (out) => {
    setOutcome(out);
    if (ex.id) logSession(ex.id, out, ex.area, 'moderate');
    onOutcome(out);
  };

  if (ex.weighted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 14, color: C.body, lineHeight: 1.5 }}>{ex.desc}</div>
        {ex.sets > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: ex.sets }).map((_, i) => (
              <div key={i} style={{ background: C.tint, borderRadius: 12, padding: '12px 16px' }}>
                <WeightStepper ex={ex} setIdx={i} onChange={(si, w, r) => onGymLog && onGymLog(ex.id, i, w, r)} />
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn full outline label="Trop lourd" color={C.orange} onClick={() => handleComplete('hard')} />
          <Btn full label="Terminé ✓" onClick={() => handleComplete('ok')} />
        </div>
      </div>
    );
  }

  if (phase === 'preview' || phase === 'rest') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {phase === 'rest' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Récupération — série {currentSet + 1}/{ex.sets}</div>
            <CircleTimer total={restDur} elapsed={elapsed} color={C.muted} size={120} />
          </div>
        )}
        {phase === 'preview' && (
          <>
            {ex.position && <div style={{ fontSize: 13, color: C.muted }}><strong style={{ color: C.body }}>Position :</strong> {ex.position}</div>}
            <div style={{ fontSize: 14, color: C.body, lineHeight: 1.55 }}>{ex.desc}</div>
            {ex.conseil && (
              <div style={{ background: '#FFF8E6', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#A06B00' }}>💡 {ex.conseil}</div>
            )}
          </>
        )}
        <Btn full label={phase === 'rest' ? 'Passer' : 'Commencer'} color={color} onClick={startWork} />
      </div>
    );
  }

  if (phase === 'work') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {isTimed ? (
          <CircleTimer total={workDur} elapsed={elapsed} color={color} size={160} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 700, color: C.ink }}>
              {ex.reps || ex.sets}
            </div>
            <div style={{ fontSize: 16, color: C.muted }}>
              {ex.reps ? 'répétitions' : 'séries'}
              {ex.side === 'each' ? ` par ${ex.sideLabel || 'côté'}` : ''}
            </div>
          </div>
        )}
        {ex.sets > 1 && (
          <div style={{ fontSize: 12, color: C.muted }}>Série {currentSet + 1} / {ex.sets}</div>
        )}
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <Btn full outline label="Trop difficile" color={C.orange} small onClick={() => { clearInterval(intervalRef.current); setPhase('done_ex'); setOutcome('hard'); if (ex.id) logSession(ex.id, 'hard', ex.area, 'moderate'); onOutcome('hard'); }} />
          <Btn full label="Terminé ✓" onClick={() => { clearInterval(intervalRef.current); if (currentSet + 1 >= (ex.sets || 1)) { setPhase('done_ex'); } else { setCurrentSet(c => c + 1); if (restDur > 0) { setPhase('rest'); startTimer(restDur, () => startWork()); } else startWork(); } }} />
        </div>
      </div>
    );
  }

  if (phase === 'done_ex') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>✓</div>
        <div style={{ fontSize: 15, color: C.body, textAlign: 'center' }}>Exercice terminé</div>
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <Btn full outline small label="Trop facile" color={C.teal} onClick={() => handleComplete('easy')} />
          <Btn full small label="Suivant →" onClick={() => handleComplete('ok')} />
        </div>
      </div>
    );
  }

  return null;
}

/* ── FocusScreen ── */
export function FocusScreen({ program, onDone, onBack }) {
  const [exIdx, setExIdx] = useState(() => {
    if (program?.resumeIdx != null) return program.resumeIdx;
    return 0;
  });
  const [outcomes, setOutcomes] = useState({});
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const startTime = useRef(Date.now());

  const exercises = program?.exercises || [];
  const ex = exercises[exIdx];

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (done) return;
    saveSessionState({ resumeIdx: exIdx, sessionId: program?.sessionId, outcomes });
  }, [exIdx, outcomes, done]);

  const handleOutcome = (out) => {
    const newOutcomes = { ...outcomes, [ex.id]: out };
    setOutcomes(newOutcomes);
    const nextIdx = exIdx + 1;
    if (nextIdx >= exercises.length) {
      clearInterval(timerRef.current);
      clearSessionState();
      logSessionDone({ id: program.sessionId, region: program.region, intent: program.intent });
      setDone(true);
    } else {
      setExIdx(nextIdx);
    }
  };

  const totalSec = elapsed;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

  if (done) {
    const hardCount = Object.values(outcomes).filter(o => o === 'hard').length;
    const easyCount = Object.values(outcomes).filter(o => o === 'easy').length;
    const s = streak();
    return (
      <div className="screen-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 20px 20px', gap: 24 }}>
        {/* Completion header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginTop: 8 }}>Séance terminée !</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{program.title}</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12 }}>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>{timeStr}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Durée réelle</div>
          </Card>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.teal }}>{exercises.filter(e => e.phase !== 'warmup').length}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Exercices</div>
          </Card>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.orange }}>{s}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Jours de suite</div>
          </Card>
        </div>

        {/* Feedback summary */}
        {(hardCount > 0 || easyCount > 0) && (
          <Card style={{ background: C.tint }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 8 }}>Adaptations pour la prochaine fois</div>
            {hardCount > 0 && <div style={{ fontSize: 12, color: C.orange }}>↓ {hardCount} exercice{hardCount > 1 ? 's' : ''} allégé{hardCount > 1 ? 's' : ''}</div>}
            {easyCount > 0 && <div style={{ fontSize: 12, color: C.teal }}>↑ {easyCount} exercice{easyCount > 1 ? 's' : ''} progressé{easyCount > 1 ? 's' : ''}</div>}
          </Card>
        )}

        <Btn full label="Retour au tableau de bord" onClick={onDone} />
      </div>
    );
  }

  if (!ex) return null;

  const progress = (exIdx / exercises.length) * 100;
  const color = AREA_COLORS[ex.area] || C.teal;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: C.muted, padding: 0 }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.muted }}>{exIdx + 1} / {exercises.length}</span>
            <span style={{ fontSize: 12, color: C.muted, fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
          </div>
          <div style={{ height: 4, background: C.line, borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: C.teal, borderRadius: 2, transition: 'width .4s ease' }} />
          </div>
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, padding: '20px 20px 24px' }}>
        {/* Phase badge */}
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: ex.phase === 'warmup' ? C.amber : ex.phase === 'cooldown' ? '#7BA83E' : color }}>
            {ex.phase === 'warmup' ? '🔥 Échauffement' : ex.phase === 'cooldown' ? '🧘 Retour au calme' : '💪 Exercice principal'}
          </span>
        </div>

        {/* Exercise name */}
        <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 4, lineHeight: 1.2 }}>{ex.name}</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
          {ex.doseText}
          {ex.tempo && <span style={{ color: C.orange }}> · {ex.tempo}</span>}
          {ex.mod && <span style={{ color: C.teal }}> · {ex.mod}</span>}
        </div>

        {/* Exercise card */}
        <ExerciseCard ex={ex} onOutcome={handleOutcome} />
      </div>
    </div>
  );
}
