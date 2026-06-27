export const C = {
  bg: '#F4F8F7', card: '#FFFFFF', tint: '#E8F7F4',
  ink: '#0E514A', body: '#3A5953', muted: '#7F9A94', faint: '#AEC2BD',
  teal: '#2FBFA1', tealDk: '#0B8071', orange: '#F2602E', amber: '#E08A0B',
  line: 'rgba(14,81,74,0.09)', line2: 'rgba(14,81,74,0.16)',
  sh: '0 4px 16px rgba(14,81,74,0.07)', shLg: '0 12px 34px rgba(14,81,74,0.13)',
};

export const AREA_COLORS = {
  upper: '#2FA56B', lower: '#12A38C', balance: '#3A7FCC',
  proprioception: '#6E73CE', core: '#0E8FB0', stretching: '#7BA83E', cardio: '#9E6BC6',
};

export const AREA_LABELS = {
  upper: 'Haut du corps', lower: 'Bas du corps', balance: 'Équilibre',
  proprioception: 'Proprioception', core: 'Gainage', stretching: 'Étirements', cardio: 'Cardio',
};

export const EQUIP = [
  { id: 'bodyweight', label: 'Poids du corps' },
  { id: 'halteres',   label: 'Haltères' },
  { id: 'elastiques', label: 'Élastiques' },
  { id: 'plateau',    label: "Plateau d'équilibre" },
  { id: 'velo',       label: 'Vélo' },
  { id: 'tapis',      label: 'Tapis' },
];

export const TABS = [
  { id: 'today',     label: 'Auj.' },
  { id: 'progress',  label: 'Progrès' },
  { id: 'calendar',  label: 'Agenda' },
  { id: 'stretching',label: 'Étire.' },
];

export const GOAL_OPTIONS = [
  { key: 'lower',         label: 'Force bas du corps' },
  { key: 'upper',         label: 'Force haut du corps' },
  { key: 'proprioception',label: 'Proprioception' },
  { key: 'balance',       label: 'Équilibre' },
  { key: 'core',          label: 'Gainage / tronc' },
  { key: 'cardio',        label: 'Cardio / endurance' },
  { key: 'stretching',    label: 'Mobilité / étirements' },
];

export const ED = {
  user: 'Val',
  today: new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
  monthLabel: new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date()),

  tests: [
    { key: 'sts',     label: 'Chaise contre le mur', short: 'Force des jambes', unit: 's',      sub: 'tenue maximale',       higher: true, color: '#12A38C' },
    { key: 'pushup',  label: 'Pompes',                short: 'Haut du corps',   unit: 'pompes', sub: 'maximum',              higher: true, color: '#2FA56B' },
    { key: 'plank',   label: 'Gainage — planche',     short: 'Tronc',           unit: 's',      sub: 'tenue maximale',       higher: true, color: '#0E8FB0' },
    { key: 'balance', label: 'Tenir sur un pied',     short: 'Équilibre',       unit: 's',      sub: 'meilleure jambe',      higher: true, color: '#3A7FCC' },
    { key: 'reach',   label: 'Flexion avant',         short: 'Souplesse',       unit: 'cm',     sub: 'mains vers les pieds', higher: true, color: '#7BA83E' },
  ],

  bilans: [
    { month: 'Janv.', sts: 24, pushup: 5,  plank: 18, balance: 12, reach: -9 },
    { month: 'Févr.', sts: 31, pushup: 6,  plank: 24, balance: 15, reach: -7 },
    { month: 'Mars',  sts: 38, pushup: 8,  plank: 31, balance: 19, reach: -5 },
    { month: 'Avr.',  sts: 46, pushup: 9,  plank: 38, balance: 23, reach: -3 },
    { month: 'Mai',   sts: 53, pushup: 11, plank: 45, balance: 27, reach: -1 },
  ],

  formeHistory: [52, 58, 49, 61, 57, 64, 55, 70, 62, 68, 73, 66, 72, 78],

  garmin: { sleepScore: 78, sleepHours: '7 h 12', restingHR: 58, bodyBattery: 64, steps: 4820 },

  recentSessions: [
    { date: 'Hier',        title: 'Équilibre & renfo',  duration: 25, forme: 64 },
    { date: 'Avant-hier',  title: 'Séance douce',       duration: 15, forme: 49 },
    { date: 'Dim',         title: 'Séance complète',    duration: 38, forme: 78 },
    { date: 'Sam',         title: 'Équilibre & renfo',  duration: 25, forme: 62 },
  ],

  week: [
    { label: 'L', done: true,  forme: 62 }, { label: 'M', done: true, forme: 55 },
    { label: 'M', done: false, forme: 0  }, { label: 'J', done: true, forme: 70 },
    { label: 'V', done: true,  forme: 66 }, { label: 'S', done: false, forme: 0 },
    { label: 'D', done: null,  forme: null },
  ],

  focusAreas: [
    { key: 'lower', count: 20 }, { key: 'balance', count: 14 }, { key: 'core', count: 12 },
    { key: 'stretching', count: 11 }, { key: 'upper', count: 9 }, { key: 'cardio', count: 7 },
    { key: 'proprioception', count: 6 },
  ],

  focusWeeks: [
    { label: 'S22', balance: 3, lower: 5, upper: 2, core: 3, proprioception: 1, cardio: 2, stretching: 2 },
    { label: 'S23', balance: 4, lower: 5, upper: 2, core: 3, proprioception: 1, cardio: 2, stretching: 3 },
    { label: 'S24', balance: 3, lower: 6, upper: 2, core: 3, proprioception: 2, cardio: 1, stretching: 3 },
    { label: 'S25', balance: 5, lower: 4, upper: 3, core: 3, proprioception: 2, cardio: 2, stretching: 3 },
  ],

  badges: [
    { id: 'streak',   label: 'Régularité',    sub: '5 jours de suite',        earned: true,  color: '#F2602E', icon: 'flame' },
    { id: 'allround', label: 'Tout-terrain',  sub: '7 zones cette semaine',   earned: true,  color: '#2FBFA1', icon: 'compass' },
    { id: 'balance',  label: 'Équilibriste',  sub: '15 séances équilibre',    earned: false, progress: 14, total: 15, color: '#3A7FCC', icon: 'activity' },
  ],

  gymSeed: (() => {
    const day = 86400000;
    const d = n => new Date(Date.now() - n * day).toISOString().slice(0, 10);
    const days = [21, 14, 7];
    const S = {
      'gym1-0': { reps: 8, w: [20, 22.5, 25] }, 'gym1-1': { reps: 8, w: [25, 27.5, 30] },
      'gym1-2': { reps: 8, w: [12, 14, 15] },   'gym1-3': { reps: 10, w: [8, 9, 10] },
      'gym2-0': { reps: 8, w: [40, 45, 50] },   'gym2-1': { reps: 8, w: [20, 22.5, 25] },
      'gym2-2': { reps: 10, w: [25, 27.5, 30] },'gym2-3': { reps: 20, w: [30, 35, 40] },
    };
    const seed = {};
    Object.keys(S).forEach(id => {
      seed[id] = S[id].w.map((w, i) => ({ date: d(days[i]), weight: w, reps: S[id].reps }));
    });
    return seed;
  })(),
};
