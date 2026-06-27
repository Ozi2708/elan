import { useState, useEffect, useRef } from 'react';
import { C } from '../constants.js';
import { Btn, Card, CircleTimer } from '../components.jsx';
import { stretchingExercises } from '../data/exercises.js';
import { beep } from '../utils/audio.js';

/* ── StretchCard ── */
function StretchCard({ stretch, onDone }) {
  const [phase, setPhase] = useState('preview'); // preview | timer | rest | done
  const [elapsed, setElapsed] = useState(0);
  const [side, setSide] = useState(0); // 0=first, 1=second
  const [set, setSet] = useState(0);
  const ref = useRef(null);
  const dur = stretch.sec || stretch.workSec || 45;
  const sets = stretch.sets || 2;
  const totalRounds = sets * (stretch.doseText?.includes('jambe') || stretch.doseText?.includes('côté') ? 2 : 1);

  useEffect(() => () => clearInterval(ref.current), []);

  const startTimer = (d, onEnd) => {
    setElapsed(0);
    clearInterval(ref.current);
    ref.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (next === d - 3) beep(660, 0.1);
        if (next >= d) { clearInterval(ref.current); onEnd(); }
        return next;
      });
    }, 1000);
  };

  const handleTimerEnd = () => {
    const nextSide = side + 1;
    const sideCount = stretch.doseText?.includes('jambe') || stretch.doseText?.includes('côté') ? 2 : 1;
    if (nextSide < sideCount) {
      setSide(nextSide);
      setPhase('rest');
      setTimeout(() => { setPhase('timer'); startTimer(dur, handleTimerEnd); }, 3000);
    } else {
      setSide(0);
      const nextSet = set + 1;
      if (nextSet >= sets) {
        setPhase('done');
        onDone();
      } else {
        setSet(nextSet);
        setPhase('rest');
        setTimeout(() => { setPhase('timer'); startTimer(dur, handleTimerEnd); }, 4000);
      }
    }
  };

  if (phase === 'preview') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {stretch.position && (
          <div style={{ fontSize: 13, color: C.muted }}>
            <strong style={{ color: C.body }}>Position :</strong> {stretch.position}
          </div>
        )}
        <div style={{ fontSize: 14, color: C.body, lineHeight: 1.6 }}>{stretch.desc}</div>
        {stretch.conseil && (
          <div style={{ background: '#FFF8E6', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#A06B00' }}>
            💡 {stretch.conseil}
          </div>
        )}
        <div style={{ fontSize: 12, color: C.muted }}>{stretch.doseText}</div>
        <Btn full label={`Commencer — ${dur}s`} onClick={() => { setPhase('timer'); startTimer(dur, handleTimerEnd); }} />
      </div>
    );
  }

  if (phase === 'timer') {
    const hasSides = stretch.doseText?.includes('jambe') || stretch.doseText?.includes('côté');
    const sideLabel = hasSides ? (side === 0 ? ' · Gauche' : ' · Droite') : '';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <CircleTimer total={dur} elapsed={elapsed} color={C.teal} size={150} fill />
        <div style={{ fontSize: 14, color: C.body, textAlign: 'center' }}>
          Série {set + 1}/{sets}{sideLabel}
        </div>
        <Btn small outline label="Passer" onClick={() => { clearInterval(ref.current); handleTimerEnd(); }} />
      </div>
    );
  }

  if (phase === 'rest') {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 8 }}>Changez de côté</div>
        <div style={{ fontSize: 14, color: C.muted }}>Prends 3–4 secondes puis continue…</div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: 36 }}>✓</div>
        <div style={{ fontSize: 15, color: C.teal, fontWeight: 600 }}>Étirement terminé</div>
      </div>
    );
  }

  return null;
}

/* ── StretchingScreen ── */
export function StretchingScreen() {
  const [selected, setSelected] = useState(null); // null | index
  const [done, setDone] = useState(new Set());
  const [mode, setMode] = useState('all'); // all | zones

  const zones = [...new Set(stretchingExercises.map(e => e.zone).filter(Boolean))];
  const [activeZone, setActiveZone] = useState(null);

  const displayed = mode === 'zones' && activeZone
    ? stretchingExercises.filter(e => e.zone === activeZone)
    : stretchingExercises;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Étirements</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{stretchingExercises.length} étirements · anti-spasticité SEP</div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setMode('all')}
            style={{ padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: mode === 'all' ? C.teal : C.tint, color: mode === 'all' ? '#fff' : C.body }}
          >Tous</button>
          <button
            onClick={() => setMode('zones')}
            style={{ padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: mode === 'zones' ? C.teal : C.tint, color: mode === 'zones' ? '#fff' : C.body }}
          >Par zone</button>
        </div>

        {/* Zone filters */}
        {mode === 'zones' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            <button
              onClick={() => setActiveZone(null)}
              style={{ padding: '5px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', background: !activeZone ? C.teal : C.tint, color: !activeZone ? '#fff' : C.body }}
            >Toutes les zones</button>
            {zones.map(z => (
              <button
                key={z}
                onClick={() => setActiveZone(z === activeZone ? null : z)}
                style={{ padding: '5px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', background: activeZone === z ? C.teal : C.tint, color: activeZone === z ? '#fff' : C.body }}
              >{z}</button>
            ))}
          </div>
        )}
      </div>

      {selected !== null ? (
        /* Active stretch view */
        <div className="scroll" style={{ flex: 1, padding: '16px 16px 90px' }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: C.muted, padding: 0 }}>‹</button>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{displayed[selected]?.name}</div>
              {displayed[selected]?.zone && <div style={{ fontSize: 12, color: C.muted }}>Zone : {displayed[selected].zone}</div>}
            </div>
          </div>
          <StretchCard
            stretch={displayed[selected]}
            onDone={() => {
              setDone(d => new Set([...d, displayed[selected].id]));
              setTimeout(() => {
                const next = selected + 1;
                if (next < displayed.length) setSelected(next);
                else setSelected(null);
              }, 1500);
            }}
          />

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {selected > 0 && <Btn small outline label="‹ Précédent" onClick={() => setSelected(selected - 1)} />}
            {selected < displayed.length - 1 && <Btn small label="Suivant ›" onClick={() => setSelected(selected + 1)} />}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="scroll" style={{ flex: 1, padding: '0 16px 90px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {done.size > 0 && (
            <div style={{ padding: '8px 12px', background: C.tint, borderRadius: 12, fontSize: 12, color: C.teal, fontWeight: 600 }}>
              ✓ {done.size} / {displayed.length} étirement{done.size > 1 ? 's' : ''} terminé{done.size > 1 ? 's' : ''}
            </div>
          )}

          {displayed.map((s, i) => {
            const isDone = done.has(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setSelected(i)}
                style={{
                  width: '100%', padding: '13px 14px', border: 'none', borderRadius: 14,
                  background: isDone ? C.teal + '12' : C.card, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(14,81,74,.05)',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: isDone ? C.teal : C.tint,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: isDone ? '#fff' : C.muted,
                }}>
                  {isDone ? '✓' : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isDone ? C.teal : C.ink }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{s.doseText}{s.zone ? ` · ${s.zone}` : ''}</div>
                </div>
                <span style={{ fontSize: 18, color: C.muted }}>›</span>
              </button>
            );
          })}

          {displayed.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 14 }}>Aucun étirement pour cette zone.</div>
          )}

          {/* Start all button */}
          {displayed.length > 0 && selected === null && (
            <div style={{ marginTop: 8 }}>
              <Btn full label="Commencer la séance complète" onClick={() => setSelected(0)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
