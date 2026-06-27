import { useState, useEffect } from 'react';
import { C, AREA_COLORS, AREA_LABELS, GOAL_OPTIONS, ED } from '../constants.js';
import { ED_GYM } from '../data/exercises.js';
import { Btn, Card, Tag, Section } from '../components.jsx';
import {
  generateProgram, generateCustomProgram, buildGymProgram,
  suggestIntensity, readiness, resumableSession, readCheckin,
} from '../engine.js';

/* ── GoalPicker ── */
function GoalPicker({ selected, onChange }) {
  const toggle = (key) => {
    if (selected.includes(key)) onChange(selected.filter(k => k !== key));
    else onChange([...selected, key]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {GOAL_OPTIONS.map(g => {
        const on = selected.includes(g.key);
        const color = AREA_COLORS[g.key] || C.teal;
        return (
          <button
            key={g.key}
            onClick={() => toggle(g.key)}
            style={{
              padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
              background: on ? color : C.tint, color: on ? '#fff' : C.body,
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: 'all .15s',
            }}
          >{g.label}</button>
        );
      })}
    </div>
  );
}

/* ── ExRow ── */
function ExRow({ ex, index }) {
  const [open, setOpen] = useState(false);
  const color = AREA_COLORS[ex.area] || C.teal;
  const phaseEmoji = { warmup: '🔥', main: '💪', cooldown: '🧘' }[ex.phase] || '';
  const progIcon = ex.prog === 'up' ? '↑' : ex.prog === 'down' ? '↓' : '';
  const progColor = ex.prog === 'up' ? '#2FA56B' : ex.prog === 'down' ? C.orange : C.muted;

  return (
    <div style={{ borderRadius: 14, background: C.tint, overflow: 'hidden', transition: 'all .2s' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '13px 16px', border: 'none', background: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{ex.name}</span>
            {ex.regressed && <span style={{ fontSize: 11, color: C.orange, fontWeight: 600 }}>adapté</span>}
            {progIcon && <span style={{ fontSize: 11, color: progColor, fontWeight: 700 }}>{progIcon}</span>}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>{ex.doseText}</div>
        </div>
        <span style={{ fontSize: 14, color: C.muted, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ex.position && (
            <div style={{ fontSize: 12, color: C.muted }}>
              <strong style={{ color: C.body }}>Position :</strong> {ex.position}
            </div>
          )}
          {ex.desc && <div style={{ fontSize: 13, color: C.body, lineHeight: 1.5 }}>{ex.desc}</div>}
          {ex.conseil && (
            <div style={{ background: '#FFF8E6', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#A06B00' }}>
              💡 {ex.conseil}
            </div>
          )}
          {ex.alternative && (
            <div style={{ fontSize: 12, color: C.muted }}>
              <strong>Alternative :</strong> {ex.alternative}
            </div>
          )}
          {ex.levelNote && (
            <div style={{ fontSize: 11, color: C.teal, fontWeight: 600 }}>{ex.levelNote}</div>
          )}
          {ex.nextCue && (
            <div style={{ fontSize: 11, color: C.muted }}>Progression possible : {ex.nextCue}</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── ReasonsCard ── */
function ReasonsCard({ reasons }) {
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ background: C.tint }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit', padding: 0 }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Pourquoi cette séance ?</span>
        <span style={{ color: C.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
      </button>
      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reasons.map((r, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.teal }}>{r.t}</div>
              <div style={{ fontSize: 12, color: C.body }}>{r.d}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── ProgramScreen ── */
export function ProgramScreen({ metrics, onStart, onBack }) {
  const [mode, setMode] = useState('ai'); // ai | custom | gym | week
  const [program, setProgram] = useState(null);
  const [customGoals, setCustomGoals] = useState(['lower', 'balance']);
  const [customIntensity, setCustomIntensity] = useState('moderee');
  const [gymId, setGymId] = useState(1);
  const [location, setLocation] = useState('maison');
  const [equipment, setEquipment] = useState(['bodyweight']);

  const resume = resumableSession();

  useEffect(() => {
    const context = { location, equipment };
    if (mode === 'ai') setProgram(generateProgram(metrics, context));
    else if (mode === 'custom') setProgram(generateCustomProgram(customGoals, customIntensity, metrics, context));
    else if (mode === 'gym') setProgram(buildGymProgram(gymId, context, metrics));
    else if (mode === 'week') setProgram(null);
  }, [mode, metrics, customGoals, customIntensity, gymId, location, equipment]);

  const tabStyle = (t) => ({
    flex: 1, padding: '8px 0', border: 'none', borderBottom: mode === t ? `2px solid ${C.teal}` : '2px solid transparent',
    background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
    color: mode === t ? C.teal : C.muted, transition: 'all .15s',
  });

  const intensityOptions = [
    { key: 'legere', label: 'Légère', n: 4 },
    { key: 'moderee', label: 'Modérée', n: 5 },
    { key: 'soutenue', label: 'Soutenue', n: 6 },
  ];

  return (
    <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: C.muted, padding: 0, lineHeight: 1 }}>‹</button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>Ta séance</div>
          {program && <div style={{ fontSize: 12, color: C.muted }}>{program.duration} min · {program.intensity}</div>}
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.line}`, marginBottom: 0, paddingLeft: 12, paddingRight: 12 }}>
        <button style={tabStyle('ai')} onClick={() => setMode('ai')}>IA</button>
        <button style={tabStyle('custom')} onClick={() => setMode('custom')}>Sur mesure</button>
        <button style={tabStyle('gym')} onClick={() => setMode('gym')}>Salle</button>
      </div>

      <div className="scroll" style={{ flex: 1, padding: '16px 16px 100px' }}>
        {/* Resume banner */}
        {resume && (
          <div style={{ background: '#FFF8E6', borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#A06B00' }}>Séance en cours</div>
              <div style={{ fontSize: 12, color: C.muted }}>Reprendre là où tu t'es arrêté</div>
            </div>
            <Btn small label="Reprendre" onClick={() => onStart(null, resume)} />
          </div>
        )}

        {/* Location/Equipment */}
        {mode !== 'gym' && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            {['maison', 'salle'].map(l => (
              <button key={l} onClick={() => setLocation(l)} style={{
                padding: '7px 16px', borderRadius: 99, border: 'none', cursor: 'pointer',
                background: location === l ? C.teal : C.tint, color: location === l ? '#fff' : C.body,
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              }}>{l === 'maison' ? 'Maison' : 'Salle'}</button>
            ))}
          </div>
        )}

        {/* Custom mode controls */}
        {mode === 'custom' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
            <Section label="Zones ciblées">
              <GoalPicker selected={customGoals} onChange={setCustomGoals} />
            </Section>
            <Section label="Intensité">
              <div style={{ display: 'flex', gap: 8 }}>
                {intensityOptions.map(o => (
                  <button key={o.key} onClick={() => setCustomIntensity(o.key)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: customIntensity === o.key ? C.teal : C.tint,
                    color: customIntensity === o.key ? '#fff' : C.body,
                    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  }}>{o.label}<br /><span style={{ fontSize: 10, opacity: .7 }}>{o.n} ex.</span></button>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Gym mode controls */}
        {mode === 'gym' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {ED_GYM.map(g => (
              <button key={g.id} onClick={() => setGymId(g.id)} style={{
                flex: 1, padding: '10px 12px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: gymId === g.id ? C.teal : C.tint, color: gymId === g.id ? '#fff' : C.body,
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit', textAlign: 'left',
              }}>
                <div>{g.title}</div>
                <div style={{ fontSize: 10, opacity: .7, marginTop: 2 }}>{g.subtitle}</div>
              </button>
            ))}
          </div>
        )}

        {program && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Program title */}
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{program.title}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{program.exercises?.length} exercices · {program.duration} min</div>
            </div>

            {/* Reasons */}
            {program.reasons && program.reasons.length > 0 && (
              <ReasonsCard reasons={program.reasons} />
            )}

            {/* Exercises */}
            <Section label="Exercices">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {program.exercises?.map((ex, i) => <ExRow key={ex.id || i} ex={ex} index={i} />)}
              </div>
            </Section>
          </div>
        )}
      </div>

      {/* Start button */}
      {program && (
        <div style={{ position: 'absolute', bottom: 76, left: 16, right: 16 }}>
          <Btn full label={`Commencer · ${program.duration} min`} onClick={() => onStart(program)} />
        </div>
      )}
    </div>
  );
}
