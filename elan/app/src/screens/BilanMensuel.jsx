import { useState, useEffect, useRef } from 'react';
import { C, ED } from '../constants.js';
import { Btn, Card, CircleTimer } from '../components.jsx';
import { markBilanDone, bilanDoneThisMonth } from '../engine.js';

/* ── NumStepper ── */
function NumStepper({ value, onChange, min = 0, max = 300, step = 1, unit, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {label && <div style={{ fontSize: 12, color: C.muted }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <button onClick={() => onChange(Math.max(min, value - step))} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: C.tint, cursor: 'pointer', fontSize: 22, color: C.ink }}>−</button>
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: C.ink }}>{value}</span>
          {unit && <span style={{ fontSize: 14, color: C.muted, marginLeft: 4 }}>{unit}</span>}
        </div>
        <button onClick={() => onChange(Math.min(max, value + step))} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: C.teal, cursor: 'pointer', fontSize: 22, color: '#fff' }}>+</button>
      </div>
    </div>
  );
}

/* ── How ── */
function How({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.teal, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: 0 }}>
        {open ? '▾ Masquer' : '▸ Comment faire ?'}
      </button>
      {open && <div style={{ marginTop: 8, fontSize: 13, color: C.body, lineHeight: 1.55, background: C.tint, borderRadius: 12, padding: '10px 14px' }}>{text}</div>}
    </div>
  );
}

/* ── SafetyNote ── */
function SafetyNote({ text }) {
  return (
    <div style={{ background: '#FFF8E6', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#A06B00' }}>
      ⚠️ {text}
    </div>
  );
}

/* ── HoldStep — chrono avec tenue ── */
function HoldStep({ label, onDone }) {
  const [phase, setPhase] = useState('ready'); // ready | countdown | done
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const ref = useRef(null);

  const start = () => {
    setPhase('countdown');
    setElapsed(0);
    ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const stop = () => {
    clearInterval(ref.current);
    const t = elapsed;
    setResult(t);
    setPhase('done');
  };

  useEffect(() => () => clearInterval(ref.current), []);

  if (phase === 'done') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: C.teal }}>{result}s</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>Tenue réalisée</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn full outline small label="Refaire" onClick={() => setPhase('ready')} />
          <Btn full small label="Valider" onClick={() => onDone(result)} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <CircleTimer total={0} elapsed={elapsed} color={phase === 'countdown' ? C.teal : C.line} size={140} fill={false}>
        <span style={{ fontSize: 36, fontWeight: 700, color: C.ink }}>{elapsed}s</span>
      </CircleTimer>
      {phase === 'ready' ? (
        <Btn label="Commencer le chrono" onClick={start} />
      ) : (
        <Btn label="Stop" color={C.orange} onClick={stop} />
      )}
    </div>
  );
}

/* ── CountStep — compter les répétitions en 30s ── */
function CountStep({ label, duration = 30, onDone }) {
  const [phase, setPhase] = useState('ready');
  const [elapsed, setElapsed] = useState(0);
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  const start = () => {
    setPhase('counting');
    setElapsed(0);
    setCount(0);
    ref.current = setInterval(() => setElapsed(e => {
      if (e + 1 >= duration) { clearInterval(ref.current); setPhase('done'); }
      return e + 1;
    }), 1000);
  };

  useEffect(() => () => clearInterval(ref.current), []);

  if (phase === 'done') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, fontWeight: 700, color: C.teal }}>{count}</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>répétitions en {duration}s</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn full outline small label="Refaire" onClick={() => setPhase('ready')} />
          <Btn full small label="Valider" onClick={() => onDone(count)} />
        </div>
      </div>
    );
  }

  if (phase === 'counting') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <CircleTimer total={duration} elapsed={elapsed} color={C.teal} size={120} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, fontWeight: 700, color: C.ink }}>{count}</div>
          <div style={{ fontSize: 12, color: C.muted }}>répétitions</div>
        </div>
        <Btn label="+ 1 répétition" color={C.teal} style={{ fontSize: 20, padding: '18px 40px' }} onClick={() => setCount(c => c + 1)} />
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: C.body, marginBottom: 16 }}>{label}</div>
      <Btn label={`Commencer (${duration} s)`} onClick={start} />
    </div>
  );
}

/* ── WallStep ── */
function WallStep({ onDone }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 14, color: C.body }}>Dos contre le mur, cuisses parallèles au sol. Tiens le plus longtemps possible.</div>
      <How text="Colle le dos au mur, pieds à ~50 cm du mur, genoux à 90°. Lance le chrono dès que tu es en position. Stop dès que tu dois remonter ou si tu sens une douleur." />
      <SafetyNote text="Ne descends pas trop bas si tu as des douleurs aux genoux. Garde les mains sur les cuisses ou le long du mur." />
      <HoldStep label="Chaise au mur" onDone={onDone} />
    </div>
  );
}

/* ── BalanceStep ── */
function BalanceStep({ onDone }) {
  const [side, setSide] = useState(null); // null | left | right
  const [leftT, setLeftT] = useState(null);
  const [rightT, setRightT] = useState(null);

  if (leftT !== null && rightT !== null) {
    const best = Math.max(leftT, rightT);
    return (
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: C.body }}>Gauche : {leftT}s · Droite : {rightT}s</div>
        <div style={{ fontSize: 48, fontWeight: 700, color: C.teal }}>{best}s</div>
        <div style={{ fontSize: 12, color: C.muted }}>Meilleur côté retenu</div>
        <Btn label="Valider" onClick={() => onDone(best)} />
      </div>
    );
  }

  if (side === null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 14, color: C.body }}>Tiens sur un pied, sans chaussures, les mains à portée d'un appui.</div>
        <How text="Debout, les mains près d'une chaise (sans s'y tenir). Lève un pied de quelques cm et tiens le plus longtemps possible (max 60 s). Répète de l'autre côté." />
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn full label="Pied gauche d'abord" onClick={() => setSide('left')} />
          <Btn full label="Pied droit d'abord" onClick={() => setSide('right')} />
        </div>
      </div>
    );
  }

  const currentSide = side;
  const handleDone = (t) => {
    if (currentSide === 'left') { setLeftT(t); setSide('right'); }
    else { setRightT(t); setSide(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Pied {currentSide === 'left' ? 'gauche' : 'droit'}</div>
      {leftT !== null && <div style={{ fontSize: 12, color: C.muted }}>Gauche : {leftT}s</div>}
      <HoldStep label={`Équilibre pied ${currentSide === 'left' ? 'gauche' : 'droit'}`} onDone={handleDone} />
    </div>
  );
}

/* ── ReachStep ── */
function ReachStep({ onDone }) {
  const [cm, setCm] = useState(-5);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 14, color: C.body }}>Debout, pieds joints. Penche-toi en avant, mains le long des jambes. Mesure jusqu'où arrivent le bout des doigts (référence = 0 au niveau des chevilles).</div>
      <How text="Valeurs positives = tu dépasses la cheville. Valeurs négatives = tu t'arrêtes avant. Note la valeur sans forcer ni rebondir." />
      <NumStepper value={cm} onChange={setCm} min={-30} max={30} step={1} unit="cm" label="Distance (- = avant cheville, + = après)" />
      <Btn label="Valider" onClick={() => onDone(cm)} />
    </div>
  );
}

/* ── BilanMensuel ── */
const STEPS = [
  { key: 'sts',     label: 'Chaise contre le mur', short: 'Force des jambes', color: '#12A38C' },
  { key: 'pushup',  label: 'Pompes',                short: 'Haut du corps',   color: '#2FA56B' },
  { key: 'plank',   label: 'Gainage — planche',     short: 'Tronc',           color: '#0E8FB0' },
  { key: 'balance', label: 'Tenir sur un pied',     short: 'Équilibre',       color: '#3A7FCC' },
  { key: 'reach',   label: 'Flexion avant',         short: 'Souplesse',       color: '#7BA83E' },
];

export function BilanMensuel({ onDone }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [results, setResults] = useState({});
  const [done, setDone] = useState(bilanDoneThisMonth());

  const handleResult = (val) => {
    const key = STEPS[stepIdx].key;
    const newResults = { ...results, [key]: val };
    setResults(newResults);
    if (stepIdx + 1 >= STEPS.length) {
      markBilanDone();
      setDone(true);
    } else {
      setStepIdx(i => i + 1);
    }
  };

  if (done || Object.keys(results).length === STEPS.length) {
    const last = ED.bilans ? ED.bilans[ED.bilans.length - 1] : {};
    return (
      <div className="screen-in" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🏅</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginTop: 8 }}>Bilan enregistré !</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Tes résultats du mois</div>
        </div>

        {Object.keys(results).length > 0 && (
          <Card>
            {STEPS.map(s => {
              const v = results[s.key];
              const prev = last[s.key];
              const diff = v != null && prev != null ? v - prev : null;
              return (
                <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${C.line}` }}>
                  <span style={{ fontSize: 13, color: C.body }}>{s.short}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {diff !== null && (
                      <span style={{ fontSize: 11, color: diff >= 0 ? C.teal : C.orange }}>
                        {diff >= 0 ? '+' : ''}{diff}
                      </span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{v != null ? v : '—'}</span>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        <Btn full label="Retour" onClick={onDone} />
      </div>
    );
  }

  const step = STEPS[stepIdx];
  const progress = stepIdx / STEPS.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>Bilan mensuel</div>
          <div style={{ fontSize: 12, color: C.muted }}>{stepIdx + 1}/{STEPS.length}</div>
        </div>
        <div style={{ height: 4, background: C.line, borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: step.color, borderRadius: 2, transition: 'width .4s' }} />
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: step.color, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>{step.short}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{step.label}</div>
        </div>

        {step.key === 'sts' && <WallStep onDone={handleResult} />}
        {step.key === 'pushup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 14, color: C.body }}>Fais le maximum de pompes, en t'arrêtant avant de perdre la forme.</div>
            <How text="Position de pompe classique ou inclinée (contre un mur/plan). Descends jusqu'à ce que les coudes soient à 90° et remonte. Compte jusqu'à ne plus pouvoir garder la forme." />
            <CountStep label="Lance le test quand tu es prêt" duration={120} onDone={handleResult} />
          </div>
        )}
        {step.key === 'plank' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 14, color: C.body }}>Gainage en planche : tiens la position le plus longtemps possible.</div>
            <How text="Avant-bras au sol, corps aligné épaules-hanches-talons. Lance le chrono et arrête dès que le bassin descend ou que tu ne peux plus respirer normalement." />
            <SafetyNote text="Pas de douleur dans le dos ou les épaules. Arrête si tu ressens une gêne." />
            <HoldStep label="Gainage planche" onDone={handleResult} />
          </div>
        )}
        {step.key === 'balance' && <BalanceStep onDone={handleResult} />}
        {step.key === 'reach' && <ReachStep onDone={handleResult} />}

        {stepIdx > 0 && (
          <button onClick={() => setStepIdx(i => i - 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.muted, fontSize: 13, padding: 0 }}>‹ Étape précédente</button>
        )}
      </div>
    </div>
  );
}
