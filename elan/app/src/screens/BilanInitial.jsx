import { useState } from 'react';
import { C, EQUIP, GOAL_OPTIONS } from '../constants.js';
import { Btn, Card } from '../components.jsx';
import { saveBaseline, hasBaseline } from '../engine.js';

/* ── Chip ── */
function Chip({ label, on, color = C.teal, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px', borderRadius: 99, border: `1.5px solid ${on ? color : C.line}`,
        background: on ? color + '18' : 'transparent', color: on ? color : C.body,
        fontSize: 12, fontWeight: on ? 600 : 400, fontFamily: 'inherit', cursor: 'pointer',
        transition: 'all .15s',
      }}
    >{label}</button>
  );
}

/* ── Section ── */
function Sect({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{label}</div>
      {children}
    </div>
  );
}

/* ── NumInput ── */
function NumInput({ label, value, onChange, unit, min = 0, max = 999, step = 1 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.tint, borderRadius: 12, padding: '10px 14px' }}>
      <span style={{ fontSize: 13, color: C.body }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => onChange(Math.max(min, value - step))} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: C.line, cursor: 'pointer', fontSize: 18, color: C.ink }}>−</button>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.ink, minWidth: 50, textAlign: 'center' }}>{value}{unit && <span style={{ fontSize: 12, color: C.muted }}> {unit}</span>}</span>
        <button onClick={() => onChange(Math.min(max, value + step))} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: C.teal, cursor: 'pointer', fontSize: 18, color: '#fff' }}>+</button>
      </div>
    </div>
  );
}

/* ── TextInput ── */
function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <span style={{ fontSize: 12, color: C.muted }}>{label}</span>}
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ padding: '10px 12px', border: `1px solid ${C.line}`, borderRadius: 12, fontFamily: 'inherit', fontSize: 14, color: C.ink, background: '#fff', outline: 'none' }}
      />
    </div>
  );
}

const STEPS_DEF = ['profile', 'neuro', 'tests', 'confirm'];

/* ── BilanInitial ── */
export function BilanInitial({ onDone }) {
  const [step, setStep] = useState(0);

  /* Profile */
  const [age, setAge] = useState(50);
  const [activity, setActivity] = useState('moderement');
  const [equipment, setEquipment] = useState(['bodyweight']);
  const [goals, setGoals] = useState(['lower', 'balance']);

  /* Neuro */
  const [diagYear, setDiagYear] = useState(2018);
  const [edss, setEdss] = useState(2);
  const [symptoms, setSymptoms] = useState([]);
  const [notes, setNotes] = useState('');

  /* Tests */
  const [wallSit, setWallSit] = useState(30);
  const [pushup, setPushup] = useState(5);
  const [plank, setPlank] = useState(20);
  const [balanceL, setBalanceL] = useState(15);
  const [balanceR, setBalanceR] = useState(12);
  const [reach, setReach] = useState(-5);

  const activityOptions = [
    { key: 'sedentaire', label: 'Sédentaire' },
    { key: 'moderement', label: 'Modérément actif' },
    { key: 'actif', label: 'Actif' },
  ];

  const symptomOptions = [
    { key: 'fatigue', label: 'Fatigue' },
    { key: 'equilibre', label: 'Équilibre' },
    { key: 'spasticite', label: 'Spasticité' },
    { key: 'sensibilite', label: 'Troubles sensitifs' },
    { key: 'chaleur', label: 'Sensibilité chaleur' },
    { key: 'vision', label: 'Troubles visuels' },
    { key: 'cognition', label: 'Troubles cognitifs' },
  ];

  const toggleEquip = (id) => setEquipment(e => e.includes(id) ? e.filter(x => x !== id) : [...e, id]);
  const toggleGoal = (k) => setGoals(g => g.includes(k) ? g.filter(x => x !== k) : [...g, k]);
  const toggleSymptom = (k) => setSymptoms(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);

  const handleSave = () => {
    const data = {
      profile: { age, activity, equipment, goals },
      neuro: { diagYear, edss, symptoms, notes },
      tests: { wallSit, pushup, plank, balanceL, balanceR, reach },
    };
    saveBaseline(data);
    onDone();
  };

  const progress = step / (STEPS_DEF.length - 1);

  if (step === 0) {
    return (
      <div className="screen-in" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>Bilan initial</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Ces informations permettent d'adapter le programme à ta situation. Tu pourras les modifier à tout moment.</div>
        </div>

        <Sect label="Ton âge">
          <NumInput label="Âge" value={age} onChange={setAge} unit="ans" min={18} max={90} />
        </Sect>

        <Sect label="Niveau d'activité">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activityOptions.map(o => (
              <button key={o.key} onClick={() => setActivity(o.key)} style={{
                padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${activity === o.key ? C.teal : C.line}`,
                background: activity === o.key ? C.tint : '#fff', color: activity === o.key ? C.teal : C.body,
                fontSize: 13, fontWeight: activity === o.key ? 600 : 400, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
              }}>{o.label}</button>
            ))}
          </div>
        </Sect>

        <Sect label="Matériel disponible">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EQUIP.map(e => <Chip key={e.id} label={e.label} on={equipment.includes(e.id)} onClick={() => toggleEquip(e.id)} />)}
          </div>
        </Sect>

        <Sect label="Objectifs prioritaires">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GOAL_OPTIONS.map(g => <Chip key={g.key} label={g.label} on={goals.includes(g.key)} onClick={() => toggleGoal(g.key)} />)}
          </div>
        </Sect>

        <Btn full label="Suivant →" onClick={() => setStep(1)} />
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="screen-in" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>Profil neurologique</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>2 / 4 — Ces données restent sur ton appareil.</div>
        </div>

        <Sect label="Année de diagnostic">
          <NumInput label="Année de diagnostic" value={diagYear} onChange={setDiagYear} min={1990} max={new Date().getFullYear()} step={1} />
        </Sect>

        <Sect label="Score EDSS (si connu)">
          <NumInput label="EDSS" value={edss} onChange={setEdss} unit="/10" min={0} max={10} step={0.5} />
          <div style={{ fontSize: 11, color: C.muted }}>Si tu ne connais pas ton EDSS, laisse la valeur par défaut.</div>
        </Sect>

        <Sect label="Symptômes principaux (cocher ce qui s'applique)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {symptomOptions.map(s => <Chip key={s.key} label={s.label} on={symptoms.includes(s.key)} onClick={() => toggleSymptom(s.key)} />)}
          </div>
        </Sect>

        <Sect label="Notes pour le programme (optionnel)">
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Ex : douleur genou gauche, éviter les rotations..."
            style={{ padding: '10px 12px', border: `1px solid ${C.line}`, borderRadius: 12, fontFamily: 'inherit', fontSize: 13, color: C.ink, minHeight: 80, resize: 'vertical' }}
          />
        </Sect>

        <div style={{ display: 'flex', gap: 8 }}>
          <Btn full outline label="‹ Retour" onClick={() => setStep(0)} />
          <Btn full label="Suivant →" onClick={() => setStep(2)} />
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="screen-in" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>Tests de départ</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>3 / 4 — Fais les tests à ton rythme, sans forcer. Les valeurs ajustent ton niveau de départ.</div>
        </div>

        <div style={{ background: '#FFF8E6', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#A06B00' }}>
          ⚠️ Ne réalise ces tests que si tu te sens en forme. Arrête immédiatement si tu ressens une douleur ou une fatigue anormale.
        </div>

        <NumInput label="Chaise au mur (secondes)" value={wallSit} onChange={setWallSit} unit="s" min={0} max={300} />
        <NumInput label="Pompes (répétitions max)" value={pushup} onChange={setPushup} unit="reps" min={0} max={100} />
        <NumInput label="Gainage planche (secondes)" value={plank} onChange={setPlank} unit="s" min={0} max={300} />
        <NumInput label="Équilibre pied gauche (secondes)" value={balanceL} onChange={setBalanceL} unit="s" min={0} max={60} />
        <NumInput label="Équilibre pied droit (secondes)" value={balanceR} onChange={setBalanceR} unit="s" min={0} max={60} />
        <NumInput label="Flexion avant (cm, 0 = niveau cheville)" value={reach} onChange={setReach} unit="cm" min={-30} max={30} step={1} />

        <div style={{ display: 'flex', gap: 8 }}>
          <Btn full outline label="‹ Retour" onClick={() => setStep(1)} />
          <Btn full label="Voir le résumé →" onClick={() => setStep(3)} />
        </div>
      </div>
    );
  }

  if (step === 3) {
    const preview = [
      { label: 'Âge', val: `${age} ans` },
      { label: 'Activité', val: activityOptions.find(o => o.key === activity)?.label },
      { label: 'Équipement', val: equipment.map(e => EQUIP.find(q => q.id === e)?.label).filter(Boolean).join(', ') },
      { label: 'Diagnostic', val: `${diagYear} (EDSS ${edss})` },
      { label: 'Chaise au mur', val: `${wallSit} s` },
      { label: 'Pompes', val: `${pushup} reps` },
      { label: 'Gainage', val: `${plank} s` },
      { label: 'Équilibre', val: `G:${balanceL}s / D:${balanceR}s` },
      { label: 'Flexion avant', val: `${reach} cm` },
    ];

    return (
      <div className="screen-in" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>Résumé</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>4 / 4 — Vérifie tes informations avant de valider.</div>
        </div>

        <Card>
          {preview.map(p => (
            <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.line}` }}>
              <span style={{ fontSize: 13, color: C.muted }}>{p.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{p.val}</span>
            </div>
          ))}
        </Card>

        <div style={{ fontSize: 12, color: C.muted, textAlign: 'center' }}>
          Ces données sont stockées uniquement sur ton appareil.
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Btn full outline label="‹ Modifier" onClick={() => setStep(2)} />
          <Btn full label="Valider et commencer ✓" onClick={handleSave} />
        </div>
      </div>
    );
  }

  return null;
}
