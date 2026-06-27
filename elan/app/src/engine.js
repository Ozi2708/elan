import { ED, GOAL_OPTIONS } from './constants.js';
import { ED_SESSIONS, ED_STRETCH, ED_GYM } from './data/exercises.js';

const ELAN_KEYS = [
  'elan_difficulties', 'elan_strength', 'elan_sts_log', 'elan_progress', 'elan_baseline',
  'elan_sessHistory', 'elan_checkin', 'elan_session_state', 'elan_walk6', 'elan_bilan_done',
  'elan_bilan_hidden', 'elan_rt_base', 'elan_recap_week', 'elan_recap_month',
];

function ls(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function lsSet(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
function lsRemove(key) { try { localStorage.removeItem(key); } catch (e) {} }

export function readDiff() { try { return JSON.parse(ls('elan_difficulties') || '{}'); } catch (e) { return {}; } }
export function elanDaySeed() { const d = new Date(); return d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate(); }

export function readiness(m) {
  const { energy = 5, fatigue = 4, heat = 4, sleep = 6 } = m || {};
  const r = Math.max(8, Math.min(100, Math.round(energy * 7 + sleep * 4.5 - fatigue * 4 - heat * 2.5 + 20)));
  const tier = r < 42 ? 'low' : r < 70 ? 'moderate' : 'high';
  return { readiness: r, tier };
}

export function suggestIntensity(m) {
  return ({ low: 'legere', moderate: 'moderee', high: 'soutenue' })[readiness(m).tier];
}

const round = (v, step = 1) => Math.max(step, Math.round(v / step) * step);
const rotate = (arr, seed) => {
  if (!arr.length) return arr;
  const k = ((seed % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
};
const avail = (context) => {
  const { location = 'maison', equipment = ['bodyweight'] } = context || {};
  return location === 'salle' ? ['bodyweight', 'halteres', 'elastiques', 'velo', 'tapis']
    : (equipment.length ? equipment : ['bodyweight']);
};

/* Musculation salle */
export function readStrength() { try { return JSON.parse(ls('elan_strength') || '{}'); } catch (e) { return {}; } }
export function logStrength(exId, name, sets, weight, reps) {
  const all = readStrength();
  const rec = all[exId] || (all[exId] = { name, sets, log: [] });
  rec.name = name; rec.sets = sets;
  const today = new Date().toISOString().slice(0, 10);
  rec.log = (rec.log || []).filter(e => e.date !== today);
  rec.log.push({ date: today, weight, reps });
  rec.log.sort((a, b) => a.date < b.date ? -1 : 1);
  lsSet('elan_strength', JSON.stringify(all));
  return all;
}
export function mergedStrength(exId) {
  const all = readStrength();
  const seed = (ED.gymSeed && ED.gymSeed[exId]) || [];
  const userLog = (all[exId] && all[exId].log) || [];
  const byDate = {};
  seed.forEach(e => byDate[e.date] = e);
  userLog.forEach(e => byDate[e.date] = e);
  return Object.keys(byDate).sort().map(d => byDate[d]);
}
export function lastStrength(exId) { const m = mergedStrength(exId); return m.length ? m[m.length - 1] : null; }

/* Sit-to-Stand log */
export function stsLog() { try { return JSON.parse(ls('elan_sts_log') || '[]'); } catch (e) { return []; } }
export function stsPush(reps) {
  const log = stsLog();
  const today = new Date().toISOString().slice(0, 10);
  const f = log.filter(e => e.date !== today);
  f.push({ date: today, reps });
  f.sort((a, b) => a.date < b.date ? -1 : 1);
  lsSet('elan_sts_log', JSON.stringify(f));
  return f;
}
export function sts7(excludeToday) {
  const log = stsLog();
  const today = new Date().toISOString().slice(0, 10);
  const cut = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const xs = log.filter(e => e.date > cut && (!excludeToday || e.date !== today));
  if (!xs.length) return null;
  return { mean: Math.round(xs.reduce((s, e) => s + e.reps, 0) / xs.length * 10) / 10, n: xs.length };
}

/* Progression */
export const EX_MAX = 6;
export function readProg() { try { return JSON.parse(ls('elan_progress') || '{}'); } catch (e) { return {}; } }

/* Bilan initial */
export function readBaseline() { try { return JSON.parse(ls('elan_baseline') || 'null'); } catch (e) { return null; } }
export function hasBaseline() { const b = readBaseline(); return !!(b && b.done); }

function band(v, ups) { for (let i = 0; i < ups.length; i++) { if (v <= ups[i]) return i; } return ups.length; }

export function deriveBaseline(t, profile) {
  t = t || {}; profile = profile || {};
  const L = {};
  L.lower = Math.round((band(t.squat || 0, [5, 9, 14, 20, 28, 39]) + band(t.wallSit || 0, [14, 29, 44, 59, 89, 119])) / 2);
  L.upper = band(t.pushup || 0, [1, 4, 8, 14, 22, 34]);
  L.core = band(t.plank || 0, [9, 19, 34, 49, 69, 99]);
  L.balance = band(Math.max(t.balanceL || 0, t.balanceR || 0), [4, 9, 19, 29, 44, 59]);
  L.proprioception = Math.max(0, L.balance - 1);
  L.stretching = band(t.reach != null ? t.reach : -10, [-15, -8, -3, 2, 7, 12]);
  L.cardio = profile.activity === 'actif' ? 2 : profile.activity === 'sedentaire' ? 0 : 1;
  const sym = profile.symptoms || [];
  if (sym.includes('equilibre')) { L.balance = Math.min(L.balance, 2); L.proprioception = Math.min(L.proprioception, 1); }
  if (sym.includes('fatigue')) { Object.keys(L).forEach(k => { L[k] = Math.min(L[k], 4); }); }
  if (sym.includes('spasticite')) { L.lower = Math.min(L.lower, 4); }
  return L;
}

export function saveBaseline(data) {
  const levels = deriveBaseline(data.tests, data.profile);
  const rec = { done: true, date: new Date().toISOString().slice(0, 10), profile: data.profile || {}, neuro: data.neuro || {}, tests: data.tests || {}, levels };
  lsSet('elan_baseline', JSON.stringify(rec));
  return rec;
}

export function baselineLevel(area) { const b = readBaseline(); if (!b || !b.levels) return 0; return b.levels[area] != null ? b.levels[area] : 1; }
export function clearBaseline() { lsRemove('elan_baseline'); }

export function idlePenalty(lastDate) {
  if (!lastDate) return 0;
  const days = Math.round((Date.now() - new Date(lastDate).getTime()) / 86400000);
  return days >= 42 ? 2 : days >= 21 ? 1 : 0;
}

export function exLevel(exId, area) {
  const p = readProg()[exId];
  if (p && p.level != null) { const pen = idlePenalty(p.lastDate); return Math.max(0, (p.level || 0) - pen); }
  if (area && hasBaseline()) return baselineLevel(area);
  return 0;
}

export function exReentry(exId) { const p = readProg()[exId]; return !!(p && (p.level || 0) > 0 && idlePenalty(p.lastDate) > 0); }

export function logSession(exId, outcome, area, tier) {
  const all = readProg(); let r = all[exId];
  if (!r) { const base = (area && hasBaseline()) ? baselineLevel(area) : 0; r = all[exId] = { level: base, success: 0 }; }
  if (outcome === 'hard') { r.level = Math.max(0, (r.level || 0) - 1); r.success = 0; r.lastChange = 'down'; }
  else if (outcome === 'easy') { r.level = Math.min(EX_MAX, (r.level || 0) + 1); r.success = 0; r.lastChange = 'up'; }
  else { r.success = (r.success || 0) + 1; if (r.success >= 2 && tier !== 'low') { r.level = Math.min(EX_MAX, (r.level || 0) + 1); r.success = 0; r.lastChange = 'up'; } else r.lastChange = 'kept'; }
  r.lastDate = new Date().toISOString().slice(0, 10);
  lsSet('elan_progress', JSON.stringify(all));
  return r;
}

function stepStrength(level, Sb, Rb) {
  const cap = 15, S = Math.min(Sb || 2, 3);
  const steps = [
    { sets: S, reps: Rb, note: '' },
    { sets: S, reps: Math.min(Rb + 2, cap), note: '+ répétitions' },
    { sets: S, reps: Math.min(Rb + 4, cap), note: '+ répétitions' },
    { sets: Math.min(S + 1, 3), reps: Rb, note: '+1 série' },
    { sets: Math.min(S + 1, 3), reps: Math.min(Rb + 2, cap), note: '+1 série, + répétitions' },
    { sets: Math.min(S + 1, 3), reps: Math.min(Rb + 3, cap), tempo: 'descente lente 3 s', note: 'tempo lent' },
    { sets: Math.min(S + 1, 3), reps: Rb, tempo: 'descente 4 s + pause 2 s en bas', note: 'tempo lent + pause' },
  ];
  return steps[Math.max(0, Math.min(level, steps.length - 1))];
}

function stepTime(level, Sb, secB) {
  const cap = 90, S = Sb || 2;
  const steps = [
    { sets: S, sec: secB, note: '' },
    { sets: S, sec: Math.min(secB + 15, cap), note: '+ durée' },
    { sets: S, sec: Math.min(secB + 30, cap), note: '+ durée' },
    { sets: S, sec: Math.min(secB + 30, cap), mod: 'appui des mains réduit', note: 'appui réduit' },
    { sets: S, sec: Math.min(secB + 30, cap), mod: 'yeux fermés par moments', note: 'yeux fermés' },
    { sets: S, sec: Math.min(secB + 30, cap), mod: '+ tâche cognitive (compte à rebours)', note: 'double tâche' },
    { sets: S, sec: Math.min(secB + 30, cap), mod: 'sur surface instable (coussin)', note: 'surface instable' },
  ];
  return steps[Math.max(0, Math.min(level, steps.length - 1))];
}

function stepAero(level, Mb) {
  const steps = [
    { min: Mb, note: '' },
    { min: Math.min(Mb + 3, 30), note: '+ durée' },
    { min: Math.min(Mb + 6, 30), note: '+ durée' },
    { min: Math.min(Mb + 6, 30), mod: 'intervalles : 30 s soutenu / 1 min calme', note: 'intervalles' },
    { min: Math.min(Mb + 8, 35), mod: 'résistance légèrement augmentée', note: 'résistance +' },
  ];
  return steps[Math.max(0, Math.min(level, steps.length - 1))];
}

function nextNote(ex, level) {
  if (ex.unit === 'reps') return stepStrength(level + 1, ex.sets || 2, ex.reps || 10).note;
  if (ex.unit === 'time') return stepTime(level + 1, ex.sets || 2, ex.sec || 30).note;
  if (ex.unit === 'min') return stepAero(level + 1, ex.min || 10).note;
  return '';
}

/* Historique de séances */
export function sessHistory() { try { return JSON.parse(ls('elan_sessHistory') || '[]'); } catch (e) { return []; } }
export function logSessionDone(info) {
  if (!info || !info.id) return;
  const all = sessHistory();
  const today = new Date().toISOString().slice(0, 10);
  const f = all.filter(e => !(e.date === today && e.id === info.id));
  f.push({ date: today, id: info.id, region: info.region || '', intent: info.intent || '' });
  const cut = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const trimmed = f.filter(e => e.date > cut).sort((a, b) => a.date < b.date ? -1 : 1);
  lsSet('elan_sessHistory', JSON.stringify(trimmed));
  return trimmed;
}

export function streak() {
  const days = [...new Set(sessHistory().map(e => e.date))].sort();
  if (!days.length) return 0;
  const has = new Set(days);
  const oneDay = 86400000;
  let d = new Date(); let cur = d.toISOString().slice(0, 10);
  if (!has.has(cur)) { d = new Date(Date.now() - oneDay); cur = d.toISOString().slice(0, 10); if (!has.has(cur)) return 0; }
  let n = 0;
  while (has.has(d.toISOString().slice(0, 10))) { n++; d = new Date(d.getTime() - oneDay); }
  return n;
}

export function weekDoneCount() {
  const cut = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  return [...new Set(sessHistory().filter(e => e.date > cut).map(e => e.date))].length;
}

export function bestStreak() {
  const days = [...new Set(sessHistory().map(e => e.date))].sort();
  if (!days.length) return 0;
  let best = 1, run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]).getTime(), cur = new Date(days[i]).getTime();
    if (Math.round((cur - prev) / 86400000) === 1) { run++; best = Math.max(best, run); } else run = 1;
  }
  return Math.max(best, streak());
}

/* Check-in état du jour */
export function today() { return new Date().toISOString().slice(0, 10); }
export function readCheckin() { try { return JSON.parse(ls('elan_checkin') || 'null'); } catch (e) { return null; } }
export function saveCheckin(metrics) { const rec = { date: today(), metrics: metrics || {} }; lsSet('elan_checkin', JSON.stringify(rec)); return rec; }
export function checkedInToday() { const c = readCheckin(); return !!(c && c.date === today()); }
export function sessionDoneToday() { return sessHistory().some(e => e.date === today()); }

/* Session state (reprise) */
export function readSessionState() { try { return JSON.parse(ls('elan_session_state') || 'null'); } catch (e) { return null; } }
export function resumableSession() { const s = readSessionState(); return (s && s.date === today()) ? s : null; }
export function saveSessionState(s) { lsSet('elan_session_state', JSON.stringify(Object.assign({ date: today() }, s))); }
export function clearSessionState() { lsRemove('elan_session_state'); }

/* Objectifs long terme */
function goalMargin(key, v) {
  v = Math.max(0, v);
  if (key === 'reach') return 8;
  let lo, hi;
  if (key === 'wall') { lo = 15; hi = 45; }
  else if (key === 'plank') { lo = 12; hi = 40; }
  else if (key === 'balance') { lo = 10; hi = 30; }
  else { lo = 4; hi = 15; }
  return Math.max(lo, Math.min(hi, Math.round(v * 0.5)));
}

function nextRung(key, v) {
  let nx = v + goalMargin(key, v);
  if (key === 'wall' || key === 'plank' || key === 'balance') nx = Math.ceil(nx / 5) * 5;
  return nx;
}

export function activeGoal(key, entryStart, current) {
  let base = entryStart, target = nextRung(key, base), palier = 1;
  while (current >= target && palier < 12) { base = target; target = nextRung(key, base); palier++; }
  return { base, target, palier };
}

export function longTermGoals() {
  const b = readBaseline();
  const bil = ED.bilans || []; const last = bil[bil.length - 1] || {}; const first = bil[0] || {};
  const t = (b && b.tests) || {};
  const startWall = t.wallSit != null ? t.wallSit : (first.sts != null ? first.sts : 20);
  const startBal = (t.balanceL != null || t.balanceR != null) ? Math.max(t.balanceL || 0, t.balanceR || 0) : (first.balance != null ? first.balance : 10);
  const startReach = t.reach != null ? t.reach : (first.reach != null ? first.reach : -10);
  const startPush = t.pushup != null ? t.pushup : (first.pushup != null ? first.pushup : 4);
  const startPlank = t.plank != null ? t.plank : (first.plank != null ? first.plank : 18);
  const ZC = { upper: '#2FA56B', lower: '#12A38C', balance: '#3A7FCC', core: '#0E8FB0', stretching: '#7BA83E' };
  const meta = [
    ['wall',   'lower',     'Chaise au mur',     'force des jambes', 's',  ZC.lower,     startWall,  last.sts != null ? last.sts : startWall],
    ['pushup', 'upper',     'Pompes',             'haut du corps',    '',   ZC.upper,     startPush,  last.pushup != null ? last.pushup : startPush],
    ['plank',  'core',      'Gainage',            'tronc',            's',  ZC.core,      startPlank, last.plank != null ? last.plank : startPlank],
    ['balance','balance',   'Tenir sur un pied',  'équilibre',        's',  ZC.balance,   startBal,   last.balance != null ? last.balance : startBal],
    ['reach',  'stretching','Flexion avant',      'souplesse',        'cm', ZC.stretching,startReach, last.reach != null ? last.reach : startReach],
  ];
  return meta.map(m => {
    const key = m[0], entry = m[6], current = m[7];
    const a = activeGoal(key, entry, current);
    const span = (a.target - a.base) || 1;
    const pct = Math.max(0, Math.min(100, Math.round(((current - a.base) / span) * 100)));
    return { key, area: m[1], label: m[2], sub: m[3], unit: m[4], color: m[5], entry, start: a.base, current, target: a.target, palier: a.palier, pct, done: current >= a.target };
  });
}

/* Marche 6 min */
const WALK6_SEED = [
  { date: '2025-09-14', m: 358 }, { date: '2025-11-09', m: 381 },
  { date: '2026-01-25', m: 402 }, { date: '2026-04-05', m: 430 },
];

export function readWalk6() {
  try { const r = JSON.parse(ls('elan_walk6') || 'null'); if (r && r.length != null) return r; } catch (e) {}
  return WALK6_SEED.slice();
}
export function addWalk6(meters, dateStr) {
  const list = readWalk6().slice();
  const d = dateStr || new Date().toISOString().slice(0, 10);
  const m = Math.max(0, Math.round(meters));
  const ix = list.findIndex(e => e.date === d);
  if (ix >= 0) list[ix] = { date: d, m }; else list.push({ date: d, m });
  list.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  lsSet('elan_walk6', JSON.stringify(list));
  return list;
}
export function removeWalk6(date) {
  const list = readWalk6().filter(e => e.date !== date);
  lsSet('elan_walk6', JSON.stringify(list));
  return list;
}

/* Bilan mensuel caché/supprimé */
export function readBilanHidden() { try { return JSON.parse(ls('elan_bilan_hidden') || '[]'); } catch (e) { return []; } }
export function bilanHiddenHas(month, key) { return readBilanHidden().indexOf(month + '|' + key) >= 0; }
export function toggleBilanHidden(month, key, hide) {
  const set = readBilanHidden(); const id = month + '|' + key; const has = set.indexOf(id) >= 0;
  const next = (hide === undefined ? !has : !!hide) ? (has ? set : set.concat([id])) : set.filter(x => x !== id);
  lsSet('elan_bilan_hidden', JSON.stringify(next));
  return next;
}

/* Récap périodique */
export function recapSeen(kind, key) { try { return ls('elan_recap_' + kind) === key; } catch (e) { return false; } }
export function markRecapSeen(kind, key) { lsSet('elan_recap_' + kind, key); }
export function recapDue() {
  const now = new Date(); const day = now.getDay(), date = now.getDate(), hour = now.getHours();
  const mKey = now.getFullYear() + '-' + (now.getMonth() + 1);
  if (date === 1 && !recapSeen('month', mKey)) return { kind: 'month', key: mKey };
  if (day === 0 && hour >= 18) { const wk = now.getFullYear() + '-' + now.getMonth() + '-W' + Math.ceil(date / 7); if (!recapSeen('week', wk)) return { kind: 'week', key: wk }; }
  return null;
}

/* Bilan mensuel */
export function bilanMonthKey() { const n = new Date(); return n.getFullYear() + '-' + (n.getMonth() + 1); }
export function bilanDoneThisMonth() { try { return ls('elan_bilan_done') === bilanMonthKey(); } catch (e) { return false; } }
export function markBilanDone() { lsSet('elan_bilan_done', bilanMonthKey()); }
export function bilanReminderDue() { return !bilanDoneThisMonth(); }

/* Data reset */
export function resetAllData() { ELAN_KEYS.forEach(k => lsRemove(k)); }

/* Exercise mapping */
export function mapExercise(ex, diff, ctx) {
  ctx = ctx || {}; diff = diff || {};
  const tier = ctx.tier || 'moderate'; const m = ctx.metrics || {};
  const fatigue = m.fatigue != null ? m.fatigue : 4; const heat = m.heat != null ? m.heat : 4;
  const flagged = diff[ex.id];
  const o = {
    id: ex.id, name: ex.name, area: ex.region || ex.area || 'lower', phase: ex.phase || 'main',
    type: ex.type || '', desc: ex.desc, equip: ex.equip || [],
    side: ex.side || 'both', sideLabel: ex.sideLabel || 'côté',
    muscles: ex.muscles || '', position: ex.position || '', conseil: ex.conseil || '',
    alternative: ex.alternative || '', restSec: ex.rest || 0, workSec: ex.workSec || 0,
    doseText: ex.doseText || '', sets: ex.sets || 1, tempo: '', mod: '',
    flagged: flagged ? flagged.reason : null, prog: flagged ? 'down' : '=',
    weighted: !!ex.weighted, level: 0, levelNote: '', nextCue: '', regressed: false,
  };
  const isMain = (ex.phase || 'main') === 'main' && !ex.weighted;
  if (!isMain) {
    if (ex.unit === 'reps') { o.reps = ex.reps; }
    else if (ex.unit === 'time') { o.sec = ex.sec; o.workSec = ex.sec || 0; o.duration = `${ex.sec} s`; }
    else { o.min = ex.min; o.sets = 1; o.workSec = (ex.min || 0) * 60; o.duration = `${ex.min} min`; }
    return o;
  }
  const level = exLevel(ex.id, o.area);
  let vol = tier === 'low' ? 0.78 : tier === 'high' ? 1.0 : 0.92;
  if (fatigue >= 7) vol *= 0.88; if (heat >= 7) vol *= 0.9; vol = Math.max(0.6, vol);
  const dropSets = (tier === 'low' ? 1 : 0) + (fatigue >= 8 ? 1 : 0);
  const restMult = (tier === 'low' || fatigue >= 7 || heat >= 7) ? 1.35 : 1.0;
  o.level = level;
  const sideSuffix = o.side === 'each' ? ` par ${o.sideLabel}` : o.side === 'alt' ? ' (en alternant)' : '';
  if (ex.unit === 'reps') {
    const st = stepStrength(level, ex.sets || 2, ex.reps || 10);
    const sets = Math.max(1, Math.min(3, st.sets - dropSets));
    const reps = Math.max(6, Math.min(15, Math.round(st.reps * vol)));
    o.sets = sets; o.reps = reps; o.tempo = st.tempo || '';
    o.restSec = Math.round((ex.rest || 60) * restMult);
    o.doseText = `${sets} série${sets > 1 ? 's' : ''} de ${reps} répétitions${sideSuffix}${st.tempo ? ` · ${st.tempo}` : ''}`;
    const bv = (ex.sets || 2) * (ex.reps || 10), tv = sets * reps;
    o.prog = flagged ? 'down' : (tv > bv ? 'up' : tv < bv ? 'down' : '=');
    o.levelNote = level > 0 ? ('Niveau ' + level + (st.note ? ' · ' + st.note : '')) : '';
  } else if (ex.unit === 'time') {
    const st = stepTime(level, ex.sets || 2, ex.sec || 30);
    const sets = Math.max(1, Math.min(5, st.sets - dropSets));
    const sec = Math.max(20, Math.min(120, Math.round(st.sec * vol / 5) * 5));
    o.sets = sets; o.sec = sec; o.workSec = sec; o.duration = `${sec} s`; o.mod = st.mod || '';
    o.restSec = Math.round((ex.rest || 0) * restMult);
    o.doseText = `${sets} × ${sec} secondes${sideSuffix}${st.mod ? ` · ${st.mod}` : ''}`;
    const bv = (ex.sets || 2) * (ex.sec || 30), tv = sets * sec;
    o.prog = flagged ? 'down' : (tv > bv ? 'up' : tv < bv ? 'down' : '=');
    o.levelNote = level > 0 ? ('Niveau ' + level + (st.note ? ' · ' + st.note : '')) : '';
  } else {
    const st = stepAero(level, ex.min || 10);
    const min = Math.max(5, Math.min(35, Math.round(st.min * vol)));
    o.min = min; o.sets = 1; o.workSec = min * 60; o.duration = `${min} min`; o.mod = st.mod || '';
    o.doseText = `${min} min${st.mod ? ` · ${st.mod}` : ''}`;
    o.prog = flagged ? 'down' : (min > (ex.min || 10) ? 'up' : min < (ex.min || 10) ? 'down' : '=');
    o.levelNote = level > 0 ? ('Niveau ' + level + (st.note ? ' · ' + st.note : '')) : '';
  }
  o.regressed = !!flagged || tier === 'low' || dropSets > 0;
  if (exReentry(ex.id)) { o.regressed = true; o.levelNote = (o.levelNote ? o.levelNote + ' · ' : '') + 'reprise en douceur'; }
  o.nextCue = level < EX_MAX ? nextNote(ex, level) : '';
  return o;
}

function estSec(ex) {
  if (ex.unit === 'reps') return (ex.sets || 1) * ((ex.reps || 10) * 3 + (ex.rest || 0));
  if (ex.unit === 'time') return (ex.sets || 1) * ((ex.sec || 0) + (ex.rest || 0));
  return (ex.workSec || 0) + (ex.rest || 0);
}
function sessionDuration(exs) { return Math.max(5, Math.round(exs.reduce((s, e) => s + estSec(e), 0) / 60)); }

const PHASE = { warmup: 0, main: 1, cooldown: 2 };
function ordered(exs) { return exs.map((e, i) => [e, i]).sort((a, b) => (PHASE[a[0].phase] - PHASE[b[0].phase]) || (a[1] - b[1])).map(x => x[0]); }

/* Programme IA */
export function generateProgram(metrics, context) {
  const { energy = 5, fatigue = 4, heat = 4, sleep = 6 } = metrics || {};
  const { readiness: r, tier } = readiness(metrics);
  const av = avail(context);
  const seed = elanDaySeed();
  const candidates = ED_SESSIONS.filter(s => s.equip.every(e => av.includes(e)));
  const hist = sessHistory();
  const dayAgo = d => Math.round((Date.now() - new Date(d).getTime()) / 86400000);
  const lastById = {}, regionDays = {}, weekRegions = new Set();
  hist.forEach(h => {
    const ago = dayAgo(h.date);
    if (lastById[h.id] == null || ago < lastById[h.id]) lastById[h.id] = ago;
    if (h.region && (regionDays[h.region] == null || ago < regionDays[h.region])) regionDays[h.region] = ago;
    if (ago < 7 && h.region) weekRegions.add(h.region);
  });
  const idGentle = {}; ED_SESSIONS.forEach(x => { idGentle[x.id] = !!x.gentle; });
  const intenseYesterday = hist.some(h => dayAgo(h.date) === 1 && idGentle[h.id] === false);
  function score(s) {
    let sc = 0;
    if (energy >= s.minEnergy && energy <= s.maxEnergy) sc += 30;
    else sc -= Math.min(34, Math.abs(energy - (energy < s.minEnergy ? s.minEnergy : s.maxEnergy)) * 9);
    if (fatigue >= 7) sc += s.gentle ? 30 : -26;
    else if (fatigue <= 3) sc += s.gentle ? -10 : 14;
    if (heat >= 7 && s.heatSensitive) sc -= 50;
    if (sleep <= 4 && s.gentle) sc += 10;
    if (intenseYesterday) sc += s.gentle ? 16 : -8;
    if (tier === 'high' && (s.intent === 'force' || s.intent === 'cardio')) sc += 10;
    if (tier === 'low' && (s.intent === 'fatigue' || s.intent === 'mobilite')) sc += 16;
    const lastSame = lastById[s.id];
    if (lastSame === 0) sc -= 60; else if (lastSame === 1) sc -= 24; else if (lastSame === 2) sc -= 10;
    const lastReg = regionDays[s.region];
    if (lastReg === 0) sc -= 20; else if (lastReg === 1) sc -= 8;
    if (s.region && !weekRegions.has(s.region)) sc += 18;
    return sc;
  }
  const ranked = candidates.map(s => ({ s, sc: score(s) })).sort((a, b) => b.sc - a.sc);
  const best = ranked.length ? ranked[0].sc : 0;
  const top = ranked.filter(r => r.sc >= best - 6).map(r => r.s);
  const chosen = (rotate(top, seed)[0]) || (ranked[0] && ranked[0].s) || ED_SESSIONS[0];
  const diff = readDiff();
  const exercises = ordered(chosen.exercises).map(ex => mapExercise(ex, diff, { tier, metrics }));
  const duration = sessionDuration(chosen.exercises);
  const intensity = chosen.gentle ? 'Douce' : (tier === 'high' ? 'Soutenue' : 'Modérée');
  const intentTxt = { force: 'un renforcement en douceur', equilibre: "l'équilibre et la stabilité", mobilite: 'la mobilité, pour des jambes plus légères', fatigue: 'de la récupération active, pensée pour les jours fatigués', cardio: "de l'endurance contrôlée au vélo", controle: 'le contrôle moteur et le gainage profond' };
  const regionTxt = { lower: 'le bas du corps', upper: 'le haut du corps', core: 'le gainage et le tronc', balance: "l'équilibre", proprioception: 'la proprioception', cardio: 'le cardio', stretching: 'la mobilité' };
  const reasons = [];
  reasons.push({ t: 'Séance choisie pour toi', d: `aujourd'hui je te propose de travailler ${intentTxt[chosen.intent] || chosen.title.toLowerCase()}.` });
  if (fatigue >= 7) reasons.push({ t: `Fatigue élevée (${fatigue}/10)`, d: 'je reste sur du doux : on entretient sans puiser dans tes réserves.' });
  else if (fatigue <= 3) reasons.push({ t: `Peu de fatigue (${fatigue}/10)`, d: "tu peux travailler un peu plus franchement aujourd'hui." });
  if (heat >= 7) reasons.push({ t: `Chaleur ressentie forte (${heat}/10)`, d: "pas de vélo ni de cardio — la chaleur majore les symptômes SEP." });
  if (sleep >= 7) reasons.push({ t: `Bonne nuit (${sleep}/10)`, d: 'ta récupération suit, on peut maintenir le cap.' });
  else if (sleep <= 4) reasons.push({ t: `Nuit courte (${sleep}/10)`, d: 'je garde une marge de sécurité.' });
  reasons.push({ t: 'Structure respectée', d: 'échauffement, travail, puis retour au calme — comme avec ton kiné.' });
  if (intenseYesterday && chosen.gentle) reasons.push({ t: 'Récupération active', d: "hier était une séance plus engagée — aujourd'hui on récupère en douceur pour laisser le corps assimiler." });
  const fl = exercises.filter(e => e.flagged);
  if (fl.length) reasons.unshift({ t: 'Difficulté prise en compte', d: `j'allège ${fl.map(e => e.name.toLowerCase()).join(', ')} suite à ton retour.` });
  const recentRegions = [...weekRegions];
  if (!weekRegions.has(chosen.region) && recentRegions.length) { reasons.push({ t: 'Pour varier', d: `ces jours-ci tu as surtout travaillé ${recentRegions.map(r2 => regionTxt[r2] || r2).join(', ')} — aujourd'hui on cible ${regionTxt[chosen.region] || chosen.title.toLowerCase()} pour équilibrer le corps.` }); }
  else if (lastById[chosen.id] != null && lastById[chosen.id] >= 2) { reasons.push({ t: 'Séance renouvelée', d: 'différente de tes dernières séances, pour éviter la routine.' }); }
  return { title: chosen.title, intensity, duration, readiness: r, tier, exercises, reasons, sessionId: chosen.id, region: chosen.region, intent: chosen.intent, modules: null, moduleEndIdx: null };
}

/* Programme sur mesure */
export function generateCustomProgram(goals, intensity, metrics, context) {
  goals = goals && goals.length ? goals : ['lower', 'balance'];
  const meta = { legere: { n: 4, label: 'Légère', rank: 1 }, moderee: { n: 5, label: 'Modérée', rank: 2 }, soutenue: { n: 6, label: 'Soutenue', rank: 3 } }[intensity || 'moderee'];
  const { readiness: r, tier } = readiness(metrics);
  const av = avail(context);
  const seed = elanDaySeed();
  const diff = readDiff();
  const usable = ED_SESSIONS.filter(s => s.equip.every(e => av.includes(e)));
  const allEx = usable.flatMap(s => s.exercises);
  const warmups = allEx.filter(e => e.phase === 'warmup');
  const mains = allEx.filter(e => e.phase === 'main');
  const cooldowns = ED_STRETCH.concat(allEx.filter(e => e.phase === 'cooldown'));
  const usedNames = new Set();
  const lists = goals.map((g, gi) => rotate(mains.filter(e => e.region === g), seed + gi));
  const chosen = []; let added = true;
  while (chosen.length < meta.n && added) { added = false; for (const lst of lists) { if (chosen.length >= meta.n) break; const ex = lst.find(e => !usedNames.has(e.name)); if (ex) { chosen.push(ex); usedNames.add(ex.name); added = true; } } }
  for (const ex of rotate(mains, seed)) { if (chosen.length >= meta.n) break; if (!usedNames.has(ex.name)) { chosen.push(ex); usedNames.add(ex.name); } }
  const warm = rotate(warmups, seed)[0];
  const cool = rotate(cooldowns, seed + 3)[0];
  const seq = []; if (warm) seq.push(warm); seq.push(...chosen); if (cool) seq.push(cool);
  const exercises = seq.map(ex => mapExercise(ex, diff, { tier, metrics }));
  const labels = Object.fromEntries(GOAL_OPTIONS.map(o => [o.key, o.label.toLowerCase()]));
  const goalTxt = goals.map(g => labels[g] || g).join(', ');
  const reasons = [{ t: 'Séance sur mesure', d: `tu as choisi de travailler : ${goalTxt}.` }, { t: 'Structure respectée', d: 'échauffement, travail ciblé, puis retour au calme.' }];
  const formeRank = { low: 1, moderate: 2, high: 3 }[tier];
  if (meta.rank > formeRank) reasons.push({ t: 'Intensité au-dessus de ta forme', d: `ta forme du jour est ${tier === 'low' ? 'basse' : 'moyenne'} (${r}/100) — j'ai gardé ton choix « ${meta.label.toLowerCase()} », mais reste à l'écoute de tes sensations.` });
  else if (meta.rank < formeRank) reasons.push({ t: 'Marge sous ta forme', d: `tu es en forme aujourd'hui (${r}/100) ; tu peux pousser un peu plus si tu le sens.` });
  const fl = exercises.filter(e => e.flagged);
  if (fl.length) reasons.push({ t: 'Difficulté conservée', d: `j'allège ${fl.map(e => e.name.toLowerCase()).join(', ')} comme sur ta séance Élan.` });
  reasons.push({ t: 'Réglages repris', d: 'matériel et adaptations de difficulté de ton profil sont conservés.' });
  return { title: 'Séance sur mesure', intensity: meta.label, duration: sessionDuration(seq), readiness: r, tier, exercises, reasons, modules: null, moduleEndIdx: null, custom: true, goals };
}

/* Séance salle */
export function buildGymProgram(id, context, metrics) {
  const s = ED_GYM.find(x => x.id === id); if (!s) return null;
  const diff = readDiff();
  const { readiness: r, tier } = readiness(metrics);
  const exercises = s.exercises.map(ex => mapExercise(ex, diff, { tier, metrics }));
  const reasons = [{ t: s.title, d: s.subtitle }];
  const fl = exercises.filter(e => e.flagged);
  if (fl.length) reasons.push({ t: 'Difficulté conservée', d: `j'allège ${fl.map(e => e.name.toLowerCase()).join(', ')}.` });
  reasons.push({ t: 'Séance salle dédiée', d: 'enchaînement et doses conçus pour la salle.' });
  return { title: s.title, intensity: 'Salle', duration: sessionDuration(s.exercises), readiness: r, tier, exercises, reasons, modules: null, moduleEndIdx: null, gym: true, gymId: id };
}
