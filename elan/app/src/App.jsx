import { useState, useEffect } from 'react';
import { C, ED, TABS } from './constants.js';
import { BrandMark, BottomNav, Card, Btn, ToastHost } from './components.jsx';
import { CheckInHybride, StreakBanner } from './screens/CheckIn.jsx';
import { ProgramScreen } from './screens/Program.jsx';
import { FocusScreen } from './screens/Focus.jsx';
import { ProgressScreen } from './screens/Progress.jsx';
import { BilanMensuel } from './screens/BilanMensuel.jsx';
import { BilanInitial } from './screens/BilanInitial.jsx';
import { CalendarScreen } from './screens/Calendar.jsx';
import { StretchingScreen } from './screens/Stretching.jsx';
import {
  checkedInToday, sessionDoneToday, readCheckin, hasBaseline,
  bilanReminderDue, recapDue, markRecapSeen, streak, weekDoneCount,
  resumableSession, longTermGoals,
} from './engine.js';
import { unlockAudio } from './utils/audio.js';

/* ── RecapOverlay ── */
function RecapOverlay({ recap, onClose }) {
  const isWeek = recap.kind === 'week';
  const s = streak(), w = weekDoneCount();
  const goals = longTermGoals();
  const improving = goals.filter(g => g.pct > 0 && !g.done);
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(14,81,74,.55)', zIndex: 300,
      display: 'flex', alignItems: 'flex-end', padding: '0 0 8px',
      animation: 'sheetUp .35s cubic-bezier(.22,1,.36,1)',
    }}>
      <div style={{ width: '100%', background: C.card, borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: C.line, margin: '0 auto 8px' }} />

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36 }}>{isWeek ? '📊' : '🎯'}</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: C.ink, marginTop: 8 }}>
            {isWeek ? 'Récap de la semaine' : 'Récap du mois'}
          </div>
        </div>

        {isWeek ? (
          <div style={{ display: 'flex', gap: 12 }}>
            <Card style={{ flex: 1, textAlign: 'center', background: C.tint }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.teal }}>{w}</div>
              <div style={{ fontSize: 11, color: C.muted }}>séances cette semaine</div>
            </Card>
            <Card style={{ flex: 1, textAlign: 'center', background: C.tint }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.ink }}>{s}</div>
              <div style={{ fontSize: 11, color: C.muted }}>jours de suite</div>
            </Card>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {improving.slice(0, 3).map(g => (
              <div key={g.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.tint, borderRadius: 12, padding: '10px 14px' }}>
                <span style={{ fontSize: 13, color: C.body }}>{g.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60, height: 4, background: C.line, borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${g.pct}%`, background: g.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 12, color: g.color, fontWeight: 600 }}>{g.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Btn full label="C'est noté !" onClick={onClose} />
      </div>
    </div>
  );
}

/* ── ReminderBanner ── */
function ReminderBanner({ onCheckin }) {
  if (checkedInToday()) return null;
  return (
    <div style={{ background: '#FFF8E6', borderTop: `1px solid #F0D060`, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 13, color: '#A06B00' }}>Check-in non fait aujourd'hui</div>
      <Btn small label="Check-in" color={C.amber} onClick={onCheckin} />
    </div>
  );
}

/* ── BilanReminderBanner ── */
function BilanReminderBanner({ onBilan }) {
  if (!bilanReminderDue()) return null;
  return (
    <div style={{ background: '#EFF5FF', borderTop: `1px solid #C5D8FF`, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 13, color: '#3A5FC0' }}>Bilan mensuel disponible</div>
      <Btn small label="Commencer" color="#3A5FC0" onClick={onBilan} />
    </div>
  );
}

/* ── TodayScreen ── */
function TodayScreen({ onStartCheckin, onStartSession, onOpenBilanInitial }) {
  const checkedIn = checkedInToday();
  const sessionDone = sessionDoneToday();
  const checkin = readCheckin();
  const metrics = checkin?.metrics;
  const resume = resumableSession();
  const needsBaseline = !hasBaseline();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <BrandMark />
        <div style={{ marginTop: 16, marginBottom: 4 }}>
          <div style={{ fontSize: 13, color: C.muted, textTransform: 'capitalize' }}>{ED.today}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.ink }}>Bonjour, {ED.user} 👋</div>
        </div>
      </div>

      <div className="scroll" style={{ flex: 1, padding: '16px 16px 90px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Baseline prompt */}
        {needsBaseline && (
          <Card style={{ background: 'linear-gradient(135deg, #2FBFA1, #0B8071)' }}>
            <div style={{ color: '#fff' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Bienvenue dans Élan !</div>
              <div style={{ fontSize: 13, opacity: .85, marginBottom: 14, lineHeight: 1.5 }}>
                Complète le bilan initial pour que l'application adapte les séances à ta situation.
              </div>
              <Btn label="Commencer le bilan" style={{ background: '#fff', color: C.teal }} onClick={onOpenBilanInitial} />
            </div>
          </Card>
        )}

        {/* Streak */}
        <StreakBanner onTap={() => {}} />

        {/* Resume card */}
        {resume && (
          <Card style={{ background: '#FFF8E6', borderLeft: `3px solid ${C.amber}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.amber }}>Séance en cours</div>
                <div style={{ fontSize: 12, color: C.muted }}>Reprendre là où tu t'étais arrêté</div>
              </div>
              <Btn small label="Reprendre" color={C.amber} onClick={() => onStartSession(null, resume)} />
            </div>
          </Card>
        )}

        {/* Check-in card */}
        {!checkedIn ? (
          <Card>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Check-in du jour</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
              2 min pour adapter ta séance à ton énergie et ta fatigue d'aujourd'hui.
            </div>
            <Btn full label="Commencer le check-in" onClick={onStartCheckin} />
          </Card>
        ) : (
          <Card style={{ background: C.tint }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.teal }}>✓ Check-in fait</div>
                {metrics && (
                  <div style={{ fontSize: 12, color: C.muted }}>Énergie {metrics.energy}/10 · Fatigue {metrics.fatigue}/10</div>
                )}
              </div>
              {!sessionDone && (
                <Btn small label="Ma séance →" onClick={() => onStartSession()} />
              )}
            </div>
          </Card>
        )}

        {/* Session done card */}
        {sessionDone && (
          <Card style={{ background: 'linear-gradient(135deg, #0B8071, #2FBFA1)' }}>
            <div style={{ color: '#fff', textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 36 }}>🎉</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>Séance du jour terminée !</div>
              <div style={{ fontSize: 12, opacity: .8, marginTop: 4 }}>Bravo — repose-toi bien.</div>
            </div>
          </Card>
        )}

        {/* Garmin-like stats */}
        {ED.garmin && (
          <Card>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>Données Garmin</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Sommeil', val: ED.garmin.sleepHours, sub: `score ${ED.garmin.sleepScore}`, icon: '😴' },
                { label: 'FC repos', val: `${ED.garmin.restingHR} bpm`, sub: 'ce matin', icon: '❤️' },
                { label: 'Body Battery', val: `${ED.garmin.bodyBattery}%`, sub: 'énergie restante', icon: '⚡' },
                { label: 'Pas', val: ED.garmin.steps.toLocaleString('fr'), sub: "aujourd'hui", icon: '🦶' },
              ].map(s => (
                <div key={s.label} style={{ background: C.tint, borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ fontSize: 20 }}>{s.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginTop: 4 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{s.label}<br />{s.sub}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent sessions */}
        {(ED.recentSessions || []).length > 0 && (
          <Card>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>Séances récentes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ED.recentSessions.slice(0, 3).map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 2 ? `1px solid ${C.line}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{s.date} · {s.duration} min</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.teal, fontWeight: 600 }}>{s.forme}/100</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ── App ── */
export default function App() {
  const [tab, setTab] = useState('today');
  const [screen, setScreen] = useState('today'); // today | checkin | program | focus | bilanMensuel | bilanInitial
  const [metrics, setMetrics] = useState(null);
  const [activeProgram, setActiveProgram] = useState(null);
  const [recap, setRecap] = useState(null);

  useEffect(() => {
    unlockAudio();
    // Check for recap due
    const r = recapDue();
    if (r) setRecap(r);
    // Load metrics from saved checkin
    const saved = readCheckin();
    if (saved?.metrics) setMetrics(saved.metrics);
  }, []);

  const handleTabSelect = (t) => {
    setTab(t);
    if (screen !== 'focus' && screen !== 'bilanMensuel' && screen !== 'bilanInitial') {
      setScreen(t);
    }
  };

  const handleCheckinDone = (m) => {
    setMetrics(m);
    setScreen('program');
    setTab('today');
  };

  const handleStartSession = (program, resume) => {
    if (program) setActiveProgram(program);
    else if (resume) {
      // Resume means we need to load the program - generate fresh and set resumeIdx
      const c = readCheckin();
      const m = c?.metrics || metrics;
      // For resume we pass the resume state through activeProgram
      setActiveProgram({ ...resume, resumeIdx: resume.resumeIdx });
    } else {
      // Start fresh from current metrics
    }
    setScreen('focus');
  };

  const handleFocusDone = () => {
    setScreen('today');
    setTab('today');
    setActiveProgram(null);
  };

  const showNav = screen !== 'focus' && screen !== 'checkin' && screen !== 'bilanMensuel' && screen !== 'bilanInitial';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {screen === 'today' && tab === 'today' && (
          <TodayScreen
            onStartCheckin={() => setScreen('checkin')}
            onStartSession={(prog, resume) => {
              if (prog || resume) { handleStartSession(prog, resume); }
              else { setScreen('program'); }
            }}
            onOpenBilanInitial={() => setScreen('bilanInitial')}
          />
        )}

        {screen === 'checkin' && (
          <div className="screen-in" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setScreen('today')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: C.muted, padding: 0, lineHeight: 1 }}>‹</button>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>Check-in du jour</div>
            </div>
            <div className="scroll" style={{ flex: 1, padding: '16px 20px 32px' }}>
              <CheckInHybride onDone={handleCheckinDone} />
            </div>
          </div>
        )}

        {screen === 'program' && (
          <ProgramScreen
            metrics={metrics || { energy: 7, fatigue: 3, heat: 2, sleep: 7 }}
            onStart={(prog, resume) => handleStartSession(prog, resume)}
            onBack={() => setScreen('today')}
          />
        )}

        {screen === 'focus' && activeProgram && (
          <FocusScreen
            program={activeProgram}
            onDone={handleFocusDone}
            onBack={() => {
              setScreen('program');
              setActiveProgram(null);
            }}
          />
        )}

        {(screen === 'progress' || tab === 'progress') && screen !== 'focus' && screen !== 'checkin' && screen !== 'bilanMensuel' && screen !== 'bilanInitial' && screen !== 'program' && (
          <ProgressScreen
            onOpenBilan={() => setScreen('bilanMensuel')}
          />
        )}

        {(screen === 'calendar' || tab === 'calendar') && screen !== 'focus' && screen !== 'checkin' && screen !== 'bilanMensuel' && screen !== 'bilanInitial' && screen !== 'program' && (
          <CalendarScreen />
        )}

        {(screen === 'stretching' || tab === 'stretching') && screen !== 'focus' && screen !== 'checkin' && screen !== 'bilanMensuel' && screen !== 'bilanInitial' && screen !== 'program' && (
          <StretchingScreen />
        )}

        {screen === 'bilanMensuel' && (
          <div className="screen-in" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => { setScreen(tab); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: C.muted, padding: 0, lineHeight: 1 }}>‹</button>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>Bilan mensuel</div>
            </div>
            <div className="scroll" style={{ flex: 1 }}>
              <BilanMensuel onDone={() => setScreen(tab)} />
            </div>
          </div>
        )}

        {screen === 'bilanInitial' && (
          <div className="screen-in" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setScreen('today')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: C.muted, padding: 0, lineHeight: 1 }}>‹</button>
            </div>
            <div className="scroll" style={{ flex: 1 }}>
              <BilanInitial onDone={() => setScreen('today')} />
            </div>
          </div>
        )}
      </div>

      {/* Banners */}
      {showNav && tab === 'today' && screen === 'today' && (
        <div style={{ position: 'absolute', bottom: 56, left: 0, right: 0, zIndex: 100 }}>
          <BilanReminderBanner onBilan={() => setScreen('bilanMensuel')} />
          {!checkedInToday() && <ReminderBanner onCheckin={() => setScreen('checkin')} />}
        </div>
      )}

      {/* Toast host */}
      <ToastHost />

      {/* Recap overlay */}
      {recap && (
        <RecapOverlay recap={recap} onClose={() => { markRecapSeen(recap.kind, recap.key); setRecap(null); }} />
      )}

      {/* Bottom nav */}
      {showNav && (
        <BottomNav tabs={TABS} active={tab} onSelect={handleTabSelect} />
      )}
    </div>
  );
}
