import { useState } from 'react';
import { C, AREA_COLORS, AREA_LABELS } from '../constants.js';
import { Card } from '../components.jsx';
import { sessHistory } from '../engine.js';

/* ── YearHeatmap ── */
function YearHeatmap({ sessions }) {
  const byDate = {};
  sessions.forEach(s => { byDate[s.date] = (byDate[s.date] || []).concat(s); });

  const today = new Date();
  const weeks = [];
  // Start from 52 weeks ago
  const start = new Date(today);
  start.setDate(start.getDate() - (today.getDay()) - 7 * 51);

  for (let w = 0; w < 53; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const key = date.toISOString().slice(0, 10);
      const sessArr = byDate[key] || [];
      week.push({ date: key, count: sessArr.length, region: sessArr[0]?.region });
    }
    weeks.push(week);
  }

  const cellSize = 10, gap = 2;

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: gap }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap }}>
            {week.map((day, di) => {
              const color = day.count === 0 ? C.line : (AREA_COLORS[day.region] || C.teal);
              const isPast = day.date <= today.toISOString().slice(0, 10);
              return (
                <div
                  key={di}
                  title={`${day.date}${day.count ? ` · ${day.count} séance${day.count > 1 ? 's' : ''}` : ''}`}
                  style={{
                    width: cellSize, height: cellSize, borderRadius: 2,
                    background: isPast ? color : 'transparent',
                    opacity: day.date > today.toISOString().slice(0, 10) ? 0 : (day.count > 0 ? 1 : 0.3),
                    transition: 'background .2s',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MonthCalendar ── */
function MonthCalendar({ year, month, sessions }) {
  const byDate = {};
  sessions.forEach(s => { byDate[s.date] = (byDate[s.date] || []).concat(s); });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const today = new Date().toISOString().slice(0, 10);

  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date, d, sessions: byDate[date] || [] });
  }
  while (days.length % 7 !== 0) days.push(null);

  const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 10, textTransform: 'capitalize' }}>{MONTH_NAMES[month]} {year}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAY_LABELS.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, color: C.muted, fontWeight: 600 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const isToday = day.date === today;
          const hasSess = day.sessions.length > 0;
          const color = hasSess ? (AREA_COLORS[day.sessions[0]?.region] || C.teal) : undefined;
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, fontSize: 12, fontWeight: isToday ? 700 : (hasSess ? 600 : 400),
                background: hasSess ? color + '22' : (isToday ? C.tint : 'transparent'),
                color: hasSess ? color : (isToday ? C.teal : C.ink),
                border: isToday ? `1.5px solid ${C.teal}` : 'none',
                position: 'relative',
              }}
            >
              {day.d}
              {hasSess && day.sessions.length > 1 && (
                <div style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, borderRadius: '50%', background: color }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── CalendarScreen ── */
export function CalendarScreen() {
  const sessions = sessHistory();
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Recent sessions list
  const recent = [...sessions].reverse().slice(0, 20);

  // Region stats
  const regionCount = {};
  sessions.forEach(s => { if (s.region) regionCount[s.region] = (regionCount[s.region] || 0) + 1; });
  const topRegions = Object.entries(regionCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 14 }}>Agenda</div>
      </div>

      <div className="scroll" style={{ flex: 1, padding: '0 16px 90px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Heatmap */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 10 }}>Activité — 12 derniers mois</div>
          <YearHeatmap sessions={sessions} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {Object.entries(AREA_COLORS).slice(0, 5).map(([k, c]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.muted }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                {AREA_LABELS[k]}
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly calendar */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button onClick={prevMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: C.muted, padding: 0 }}>‹</button>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Calendrier mensuel</div>
            <button onClick={nextMonth} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: C.muted, padding: 0 }}>›</button>
          </div>
          <MonthCalendar year={viewYear} month={viewMonth} sessions={sessions} />
        </Card>

        {/* Stats */}
        {topRegions.length > 0 && (
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 10 }}>Zones les plus travaillées</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topRegions.map(([region, count]) => {
                const color = AREA_COLORS[region] || C.teal;
                const max = topRegions[0][1];
                return (
                  <div key={region}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: C.body }}>{AREA_LABELS[region] || region}</span>
                      <span style={{ color: C.muted }}>{count} séances</span>
                    </div>
                    <div style={{ height: 5, background: C.line, borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Recent list */}
        {recent.length > 0 && (
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 10 }}>Séances récentes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recent.map((s, i) => {
                const color = AREA_COLORS[s.region] || C.teal;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.ink }}>{s.id}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{s.date}</div>
                    </div>
                    <div style={{ fontSize: 10, color: color, background: color + '15', padding: '2px 7px', borderRadius: 99 }}>
                      {AREA_LABELS[s.region] || s.region}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {sessions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted, fontSize: 14 }}>
            Aucune séance enregistrée encore.<br />
            <span style={{ fontSize: 12 }}>Complète ta première séance pour voir ton historique ici.</span>
          </div>
        )}
      </div>
    </div>
  );
}
