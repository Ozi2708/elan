import { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../constants.js';
import { Btn, Card, EnergyGauge, MetricSlider } from '../components.jsx';
import {
  streak, weekDoneCount, bestStreak, saveCheckin, readCheckin,
  checkedInToday, sessionDoneToday, suggestIntensity,
} from '../engine.js';

/* ── StreakBanner ── */
export function StreakBanner({ onTap }) {
  const s = streak(), w = weekDoneCount(), b = bestStreak();
  return (
    <Card style={{ background: 'linear-gradient(135deg, #0B8071 0%, #2FBFA1 100%)', cursor: 'pointer' }} onClick={onTap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>Série en cours</div>
          <div style={{ color: '#fff', fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>{s} <span style={{ fontSize: 16 }}>jour{s > 1 ? 's' : ''}</span></div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, marginTop: 2 }}>Record : {b} jours · Cette semaine : {w}/5</div>
        </div>
        <div style={{ fontSize: 44 }}>🔥</div>
      </div>
    </Card>
  );
}

/* ── ReactionTest (check-in version) ── */
function readRTBase() { try { return JSON.parse(localStorage.getItem('elan_rt_base') || 'null'); } catch (e) { return null; } }
function pushRTBase(ms) {
  const base = readRTBase();
  if (!base) { localStorage.setItem('elan_rt_base', JSON.stringify({ baseline: ms, n: 1, date: new Date().toISOString().slice(0, 10) })); return { baseline: ms, delta: 0 }; }
  const newBase = Math.round((base.baseline * 3 + ms) / 4);
  localStorage.setItem('elan_rt_base', JSON.stringify({ ...base, baseline: newBase, n: (base.n || 1) + 1, date: new Date().toISOString().slice(0, 10) }));
  return { baseline: newBase, delta: Math.round(ms - base.baseline) };
}

export function ReactionTest({ onDone }) {
  const [phase, setPhase] = useState('intro'); // intro | waiting | active | result | done
  const [trial, setTrial] = useState(0);
  const [results, setResults] = useState([]);
  const [shown, setShown] = useState(false);
  const startRef = useRef(null);
  const timerRef = useRef(null);

  const COLORS = ['#2FBFA1', '#3A7FCC', '#F2602E', '#E08A0B'];
  const N_TRIALS = 4;

  const startWait = useCallback(() => {
    setPhase('waiting');
    setShown(false);
    const delay = 1200 + Math.random() * 2800;
    timerRef.current = setTimeout(() => {
      startRef.current = Date.now();
      setShown(true);
      setPhase('active');
    }, delay);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleTap = () => {
    if (phase === 'intro') { setPhase('waiting'); startWait(); return; }
    if (phase === 'waiting') {
      clearTimeout(timerRef.current);
      setPhase('intro'); // false start
      return;
    }
    if (phase === 'active') {
      const rt = Date.now() - startRef.current;
      const next = [...results, rt];
      setResults(next);
      if (next.length >= N_TRIALS) {
        const mean = Math.round(next.reduce((a, b) => a + b, 0) / next.length);
        const { baseline, delta } = pushRTBase(mean);
        setPhase('done');
        setTimeout(() => onDone({ mean, delta, baseline }), 800);
      } else {
        setTrial(t => t + 1);
        setTimeout(startWait, 600);
      }
    }
  };

  const progress = results.length / N_TRIALS;
  const color = COLORS[trial % COLORS.length];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '20px 0' }}>
      <div style={{ fontSize: 14, color: C.body, textAlign: 'center', maxWidth: 260 }}>
        {phase === 'intro' && 'Appuie dès que le cercle change de couleur.'}
        {phase === 'waiting' && 'Attention…'}
        {phase === 'active' && 'Appuie !'}
        {phase === 'done' && 'Mesure enregistrée.'}
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: N_TRIALS }).map((_, i) => (
          <div key={i} style={{ width: 32, height: 4, borderRadius: 2, background: i < results.length ? C.teal : C.line }} />
        ))}
      </div>

      {/* Target circle */}
      <div
        onClick={handleTap}
        style={{
          width: 140, height: 140, borderRadius: '50%',
          background: phase === 'active' ? color : (phase === 'waiting' ? '#E8F7F4' : C.line),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background .1s',
          animation: phase === 'active' ? 'ringPulse 0.6s ease' : undefined,
        }}
      >
        {phase === 'intro' && <span style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: 12 }}>Appuie pour commencer</span>}
        {phase === 'active' && <span style={{ fontSize: 38 }}>⚡</span>}
        {phase === 'done' && <span style={{ fontSize: 38 }}>✓</span>}
      </div>

      {results.length > 0 && phase !== 'done' && (
        <div style={{ fontSize: 12, color: C.muted }}>
          Dernier : {results[results.length - 1]} ms · {results.length}/{N_TRIALS}
        </div>
      )}
    </div>
  );
}

/* ── CheckIn ── */
export function CheckIn({ onDone }) {
  const [step, setStep] = useState(0); // 0=rt, 1=metrics, 2=done
  const [rt, setRt] = useState(null);
  const [metrics, setMetrics] = useState({ energy: 7, fatigue: 3, heat: 2, sleep: 7 });

  if (checkedInToday()) {
    const c = readCheckin();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 14, color: C.body, textAlign: 'center', padding: '12px 0' }}>
          Déjà enregistré aujourd'hui.
        </div>
        <Btn full label="Voir ma séance" onClick={() => onDone(c.metrics)} />
      </div>
    );
  }

  if (step === 0) {
    return (
      <div className="screen-in">
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Test de temps de réaction</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Mesure objective de ta fatigue neurologique aujourd'hui.</div>
        <ReactionTest onDone={(r) => { setRt(r); setStep(1); }} />
      </div>
    );
  }

  if (step === 1) {
    const rtFeedback = rt ? (rt.delta > 80 ? '🔴 Lent aujourd\'hui' : rt.delta < -40 ? '🟢 Réactif' : '🟡 Normal') : null;
    return (
      <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {rt && (
          <div style={{ background: C.tint, borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: C.body }}>Temps de réaction : <strong>{rt.mean} ms</strong></span>
            <span style={{ fontSize: 12, color: C.muted }}>{rtFeedback}</span>
          </div>
        )}

        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Comment tu te sens ?</div>
          <div style={{ fontSize: 12, color: C.muted }}>Ces infos ajustent ta séance en temps réel.</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: C.body, marginBottom: 8, fontWeight: 500 }}>Niveau d'énergie</div>
            <EnergyGauge value={metrics.energy} onChange={v => setMetrics(m => ({ ...m, energy: v }))} />
          </div>
          <MetricSlider label="Fatigue ressentie" value={metrics.fatigue} min={1} max={10} color={C.orange} onChange={v => setMetrics(m => ({ ...m, fatigue: v }))} />
          <MetricSlider label="Chaleur ressentie" value={metrics.heat} min={1} max={10} color={C.amber} onChange={v => setMetrics(m => ({ ...m, heat: v }))} />
          <MetricSlider label="Qualité du sommeil" value={metrics.sleep} min={1} max={10} color={C.teal} onChange={v => setMetrics(m => ({ ...m, sleep: v }))} />
        </div>

        <Btn full label="Voir ma séance →" onClick={() => { saveCheckin(metrics); onDone(metrics); }} />
      </div>
    );
  }

  return null;
}

/* ── CheckInHybride ── */
export function CheckInHybride({ onDone }) {
  const [step, setStep] = useState(0); // 0=rt, 1=metrics
  const [rt, setRt] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [metrics, setMetrics] = useState({ energy: 7, fatigue: 3, heat: 2, sleep: 7 });

  useEffect(() => {
    if (step !== 1) return;
    setWeatherLoading(true);
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weathercode&timezone=auto`;
          const r = await fetch(url);
          const d = await r.json();
          const temp = d.current?.apparent_temperature;
          const code = d.current?.weathercode;
          const hot = temp >= 28;
          const icon = code >= 95 ? '⛈' : code >= 61 ? '🌧' : code >= 51 ? '🌦' : code >= 3 ? '☁️' : '☀️';
          setWeather({ temp: Math.round(temp), hot, icon });
          if (hot) setMetrics(m => ({ ...m, heat: Math.min(10, m.heat + 2) }));
        } catch (e) { /* silently ignore */ }
        setWeatherLoading(false);
      },
      () => setWeatherLoading(false)
    );
  }, [step]);

  if (checkedInToday()) {
    const c = readCheckin();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>
        <div style={{ fontSize: 14, color: C.body, textAlign: 'center' }}>Déjà enregistré aujourd'hui.</div>
        <Btn full label="Voir ma séance" onClick={() => onDone(c.metrics)} />
      </div>
    );
  }

  if (step === 0) {
    return (
      <div className="screen-in">
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Test de réaction</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>Mesure objective de ta vigilance.</div>
        <ReactionTest onDone={(r) => { setRt(r); setStep(1); }} />
      </div>
    );
  }

  const rtFeedback = rt ? (rt.delta > 80 ? '🔴 Lent' : rt.delta < -40 ? '🟢 Rapide' : '🟡 Normal') : null;

  return (
    <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* RT result */}
      {rt && (
        <div style={{ background: C.tint, borderRadius: 14, padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: C.body }}>Réaction : <strong>{rt.mean} ms</strong></span>
          <span style={{ fontSize: 12, color: C.muted }}>{rtFeedback}</span>
        </div>
      )}

      {/* Weather */}
      {weatherLoading && <div style={{ fontSize: 12, color: C.muted, textAlign: 'center' }}>Météo en cours…</div>}
      {weather && (
        <div style={{ background: weather.hot ? '#FFF3E0' : C.tint, borderRadius: 14, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{weather.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: weather.hot ? C.orange : C.ink }}>{weather.temp}°C ressenti</div>
            {weather.hot && <div style={{ fontSize: 11, color: C.orange }}>Chaleur élevée — j'adapte ta séance</div>}
          </div>
        </div>
      )}

      {/* Metrics */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 12 }}>Comment tu te sens ?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: C.body, marginBottom: 8, fontWeight: 500 }}>Niveau d'énergie</div>
            <EnergyGauge value={metrics.energy} onChange={v => setMetrics(m => ({ ...m, energy: v }))} />
          </div>
          <MetricSlider label="Fatigue ressentie" value={metrics.fatigue} min={1} max={10} color={C.orange} onChange={v => setMetrics(m => ({ ...m, fatigue: v }))} />
          <MetricSlider label="Chaleur ressentie" value={metrics.heat} min={1} max={10} color={C.amber} onChange={v => setMetrics(m => ({ ...m, heat: v }))} />
          <MetricSlider label="Qualité du sommeil" value={metrics.sleep} min={1} max={10} color={C.teal} onChange={v => setMetrics(m => ({ ...m, sleep: v }))} />
        </div>
      </div>

      <Btn full label="Voir ma séance →" onClick={() => { saveCheckin(metrics); onDone(metrics); }} />
    </div>
  );
}
