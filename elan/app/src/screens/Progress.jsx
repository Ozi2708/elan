import { useState } from 'react';
import { C, AREA_COLORS, AREA_LABELS, ED } from '../constants.js';
import { Card, Section, Btn, LineChart, RingChart, Tag } from '../components.jsx';
import {
  mergedStrength, lastStrength, readWalk6, addWalk6, removeWalk6,
  longTermGoals, sts7, readProg, streak, weekDoneCount, bestStreak,
  resetAllData, readBilanHidden, bilanHiddenHas, toggleBilanHidden,
} from '../engine.js';
import { ED_GYM } from '../data/exercises.js';

/* ── StrengthProgress ── */
function StrengthProgress() {
  const gymExercises = ED_GYM.flatMap(g => g.exercises.filter(e => e.weighted));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {gymExercises.map(ex => {
        const log = mergedStrength(ex.id);
        const last = lastStrength(ex.id);
        if (!log.length) return null;
        const weights = log.map(e => e.weight || 0);
        return (
          <Card key={ex.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{ex.name}</div>
                {last && <div style={{ fontSize: 12, color: C.muted }}>{last.weight} kg × {last.reps} reps</div>}
              </div>
              {log.length >= 2 && (
                <div style={{ fontSize: 12, color: weights[weights.length - 1] > weights[0] ? C.teal : C.orange }}>
                  {weights[weights.length - 1] > weights[0] ? '↑' : '→'} {weights[weights.length - 1]} kg
                </div>
              )}
            </div>
            {log.length >= 2 && <LineChart data={weights} color={C.teal} height={60} />}
          </Card>
        );
      })}
    </div>
  );
}

/* ── GoalGauge ── */
function GoalGauge() {
  const goals = longTermGoals();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {goals.map(g => (
        <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <RingChart value={g.pct} max={100} color={g.color} size={56} strokeWidth={6} label={`${g.pct}%`} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{g.label}</span>
              <span style={{ fontSize: 11, color: C.muted }}>Palier {g.palier}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{g.current}{g.unit} → {g.target}{g.unit}</div>
            <div style={{ height: 4, background: C.line, borderRadius: 2, marginTop: 4 }}>
              <div style={{ height: '100%', width: `${g.pct}%`, background: g.color, borderRadius: 2, transition: 'width .4s' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Walk6Card ── */
function Walk6Card() {
  const [data, setData] = useState(readWalk6());
  const [addMode, setAddMode] = useState(false);
  const [meters, setMeters] = useState(380);
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));

  const distances = data.map(d => d.m);
  const last = data[data.length - 1];
  const first = data[0];
  const trend = data.length >= 2 ? last.m - first.m : 0;

  const doAdd = () => {
    const updated = addWalk6(meters, dateStr);
    setData(updated);
    setAddMode(false);
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Test de marche 6 min</div>
          {last && <div style={{ fontSize: 12, color: C.muted }}>{last.m} m · {last.date}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {trend !== 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: trend > 0 ? C.teal : C.orange }}>
              {trend > 0 ? '+' : ''}{trend} m
            </span>
          )}
          <Btn small outline label="+ Ajouter" onClick={() => setAddMode(a => !a)} />
        </div>
      </div>

      {distances.length >= 2 && <LineChart data={distances} color={C.teal} height={80} />}

      {addMode && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Distance (m)</div>
              <input
                type="number" value={meters} onChange={e => setMeters(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.line}`, borderRadius: 10, fontFamily: 'inherit', fontSize: 14, color: C.ink }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Date</div>
              <input
                type="date" value={dateStr} onChange={e => setDateStr(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: `1px solid ${C.line}`, borderRadius: 10, fontFamily: 'inherit', fontSize: 14, color: C.ink }}
              />
            </div>
          </div>
          <Btn full small label="Enregistrer" onClick={doAdd} />

          {data.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {data.slice().reverse().slice(0, 4).map(e => (
                <div key={e.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: C.body }}>{e.date}</span>
                  <span style={{ color: C.ink, fontWeight: 600 }}>{e.m} m</span>
                  <button onClick={() => { const u = removeWalk6(e.date); setData(u); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.muted, fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

/* ── FocusBalance ── */
function FocusBalance() {
  const areas = Object.entries(ED.focusAreas || {});
  const focusAreas = ED.focusAreas || [];
  const total = focusAreas.reduce((s, a) => s + a.count, 0) || 1;

  return (
    <Card>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 12 }}>Répartition des séances</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {focusAreas.map(a => {
          const color = AREA_COLORS[a.key] || C.teal;
          const pct = Math.round(a.count / total * 100);
          return (
            <div key={a.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: C.body }}>{AREA_LABELS[a.key] || a.key}</span>
                <span style={{ color: C.muted }}>{a.count} · {pct}%</span>
              </div>
              <div style={{ height: 6, background: C.line, borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, animation: 'barGrow .5s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── BilanHistorique ── */
function BilanHistorique() {
  const bil = ED.bilans || [];
  if (!bil.length) return null;
  const tests = ED.tests || [];
  const [hidden, setHidden] = useState(readBilanHidden());

  const toggleHide = (month, key) => {
    const next = toggleBilanHidden(month, key);
    setHidden(next);
  };

  return (
    <Card>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 12 }}>Bilans mensuels</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tests.map(t => {
          const vals = bil.filter(b => !bilanHiddenHas(b.month, t.key)).map(b => b[t.key]).filter(v => v != null);
          if (!vals.length) return null;
          const last = vals[vals.length - 1];
          const first = vals[0];
          const trend = vals.length >= 2 ? last - first : 0;
          return (
            <div key={t.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{t.short}</span>
                  <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>{last} {t.unit}</span>
                </div>
                {trend !== 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: trend > 0 ? t.color : C.muted }}>
                    {trend > 0 ? '+' : ''}{trend} {t.unit}
                  </span>
                )}
              </div>
              {vals.length >= 2 && <LineChart data={vals} color={t.color} height={56} />}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── DataSettings ── */
function DataSettings({ onReset }) {
  const [confirm, setConfirm] = useState(false);
  const [keys] = useState([
    { key: 'elan_difficulties', label: 'Difficultés exercices' },
    { key: 'elan_strength', label: 'Musculation salle' },
    { key: 'elan_sts_log', label: 'Sit-to-Stand' },
    { key: 'elan_progress', label: 'Progression exercices' },
    { key: 'elan_baseline', label: 'Bilan initial' },
    { key: 'elan_sessHistory', label: 'Historique séances' },
    { key: 'elan_checkin', label: 'Check-in du jour' },
    { key: 'elan_walk6', label: 'Test de marche 6 min' },
    { key: 'elan_bilan_done', label: 'Bilan mensuel' },
    { key: 'elan_rt_base', label: 'Baseline temps de réaction' },
  ]);

  const deleteOne = (key) => {
    try { localStorage.removeItem(key); } catch (e) {}
  };

  return (
    <Card style={{ background: '#FFF5F5' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#C0392B', marginBottom: 12 }}>Gestion des données</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {keys.map(k => (
          <div key={k.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: C.body }}>{k.label}</span>
            <button
              onClick={() => deleteOne(k.key)}
              style={{ fontSize: 11, color: C.orange, border: `1px solid ${C.orange}30`, borderRadius: 8, padding: '3px 8px', background: 'none', cursor: 'pointer' }}
            >Supprimer</button>
          </div>
        ))}
      </div>

      {!confirm ? (
        <Btn full outline label="Réinitialiser toutes les données" color="#C0392B" onClick={() => setConfirm(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: '#C0392B', textAlign: 'center' }}>Toutes les données seront supprimées. Confirmer ?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn full outline small label="Annuler" onClick={() => setConfirm(false)} />
            <Btn full small label="Supprimer tout" color="#C0392B" style={{ background: '#C0392B' }} onClick={() => { resetAllData(); setConfirm(false); onReset && onReset(); }} />
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── StsCard ── */
function StsCard() {
  const avg = sts7();
  if (!avg) return null;
  return (
    <Card style={{ background: C.tint }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Sit-to-Stand (moy. 7j)</div>
          <div style={{ fontSize: 11, color: C.muted }}>{avg.n} mesures cette semaine</div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.teal }}>{avg.mean}<span style={{ fontSize: 13, color: C.muted }}> reps</span></div>
      </div>
    </Card>
  );
}

/* ── ProgressScreen ── */
export function ProgressScreen({ onOpenBilan }) {
  const [tab, setTab] = useState('forme'); // forme | objectifs | salle | data
  const tabs = [
    { id: 'forme', label: 'Forme' },
    { id: 'objectifs', label: 'Objectifs' },
    { id: 'salle', label: 'Salle' },
    { id: 'data', label: 'Données' },
  ];

  const tabStyle = (t) => ({
    flex: 1, padding: '8px 0', border: 'none',
    borderBottom: tab === t ? `2px solid ${C.teal}` : '2px solid transparent',
    background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
    color: tab === t ? C.teal : C.muted,
  });

  const s = streak(), w = weekDoneCount(), b = bestStreak();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 14 }}>Progrès</div>
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.line}` }}>
          {tabs.map(t => <button key={t.id} style={tabStyle(t.id)} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tab === 'forme' && (
          <>
            {/* Streak */}
            <Card style={{ background: 'linear-gradient(135deg, #0B8071, #2FBFA1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Série en cours</div>
                  <div style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>{s} <span style={{ fontSize: 14 }}>jours</span></div>
                  <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 12, marginTop: 2 }}>Meilleur : {b} · Cette semaine : {w}/5</div>
                </div>
                <span style={{ fontSize: 40 }}>🔥</span>
              </div>
            </Card>

            {/* Forme history */}
            {(ED.formeHistory || []).length >= 2 && (
              <Card>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 8 }}>Forme ({ED.formeHistory.length} dernières séances)</div>
                <LineChart data={ED.formeHistory} color={C.teal} height={80} />
              </Card>
            )}

            <StsCard />
            <FocusBalance />
            <Walk6Card />
            <BilanHistorique />

            {onOpenBilan && (
              <Btn full outline label="Bilan mensuel →" onClick={onOpenBilan} />
            )}
          </>
        )}

        {tab === 'objectifs' && (
          <>
            <div style={{ fontSize: 13, color: C.muted }}>Objectifs long terme basés sur ton bilan initial.</div>
            <GoalGauge />
          </>
        )}

        {tab === 'salle' && (
          <>
            <div style={{ fontSize: 13, color: C.muted }}>Progression des charges à la salle.</div>
            <StrengthProgress />
          </>
        )}

        {tab === 'data' && (
          <DataSettings onReset={() => window.location.reload()} />
        )}
      </div>
    </div>
  );
}
