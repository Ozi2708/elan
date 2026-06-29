/* ===== Élan — transcription du prototype Claude Design (Élan App clair.html) ===== */
/* normalize */
/* ── Normalisation des exercices ──────────────────────────────────────────────
   Source unique de cohérence pour que l'agent IA adapte correctement :
   • side : 'both' (bilatéral) | 'each' (chaque côté, gauche+droite) | 'alt' (alterné)
   • sideLabel : jambe | côté | pied | bras | main  (vocabulaire de la consigne)
   • resynchronise le nombre de séries (sets) sur la consigne quand elles divergeaient
   • corrige quelques catégories (region) mal étiquetées                         */
(function(){
  if(!window.ED_SESSIONS) return;

  // Catégories corrigées (region) — cas clairement mal classés
  const REGION_FIX = {
    's0-1':'lower',   // Assis-debout depuis une chaise = quadriceps/fessiers, pas 'core'
  };

  function sideLabelFrom(hay){
    if(/\bpar pied\b|\bpied (gauche|droit)\b/.test(hay)) return 'pied';
    if(/\bpar bras\b|\bbras (gauche|droit)\b/.test(hay)) return 'bras';
    if(/\bpar main\b/.test(hay)) return 'main';
    if(/\bpar jambe\b|\bjambe (gauche|droite)\b|unipodal|sur (un|1) pied/.test(hay)) return 'jambe';
    return 'côté';
  }

  function deriveSide(ex){
    const dose=(ex.doseText||'').toLowerCase();
    const name=(ex.name||'').toLowerCase();
    const desc=(ex.desc||'').toLowerCase();
    const blob=dose+' '+name+' '+desc;
    // alternance d'un côté à l'autre dans la même série → un seul bloc
    if(/altern/.test(dose+' '+name)) return {side:'alt'};
    // consigne explicitement « par jambe / par côté / de chaque côté » → chaque côté
    if(/par (jambe|c[oô]t[eé]|pied|bras|main)|de chaque c[oô]t[eé]/.test(dose)) {
      return {side:'each', sideLabel:sideLabelFrom(blob)};
    }
    // exercice unipodal décrit sans suffixe dans la dose (« sur un pied », « change de jambe »)
    if(/unipodal|sur (un|1) pied|change de (jambe|pied|c[oô]t[eé])|puis (passer|change)/.test(name+' '+desc) && !/transfert|bascul|chass/.test(name)) {
      return {side:'each', sideLabel:sideLabelFrom(name+' '+desc)};
    }
    return {side:'both'};
  }

  // Nb de séries fiable = 1er entier devant « série(s) » ou « ×/x »
  function syncSets(ex){
    const m=(ex.doseText||'').match(/^\s*(\d+)\s*(?:s[ée]ries?|[x×])/i);
    if(m) ex.sets=+m[1];
  }

  function normalize(ex){
    if(!ex||!ex.id) return;
    if(REGION_FIX[ex.id]) ex.region=REGION_FIX[ex.id];
    syncSets(ex);
    const s=deriveSide(ex);
    ex.side=s.side;
    if(s.sideLabel) ex.sideLabel=s.sideLabel;
  }

  (window.ED_SESSIONS||[]).forEach(s=>(s.exercises||[]).forEach(normalize));
  (window.ED_GYM||[]).forEach(s=>(s.exercises||[]).forEach(normalize));
  (window.ED_WEEK||[]).forEach(s=>(s.exercises||[]).forEach(normalize));
  (window.ED_STRETCH||[]).forEach(normalize);
})();

/* engine */
window.ES = {};
window.EC = {};
window.EQUIP = [
  {id:'bodyweight', label:'Poids du corps'},
  {id:'halteres',   label:'Haltères'},
  {id:'elastiques', label:'Élastiques'},
  {id:'plateau',    label:'Plateau d\u2019équilibre'},
  {id:'velo',       label:'Vélo'},
  {id:'tapis',      label:'Tapis'},
];

window.ED = {
  user: 'Val',
  today: new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long'}).format(new Date()),
  monthLabel: new Intl.DateTimeFormat('fr-FR',{month:'long'}).format(new Date()),

  sessions: window.ED_SESSIONS, /* séances kiné structurées — exercices-data.js (depuis exercices_autres.xlsx) */
  stretchLib: window.ED_STRETCH,
  _unusedLibrary: [
    {id:'equilibre-uni', name:'Équilibre unipodal',          area:'balance',        type:'Équilibre', equip:['bodyweight'],            unit:'time', base:{sets:2,sec:30}, last:{sets:2,sec:25}, rest:20,
      desc:'Tiens-toi sur une jambe, l\u2019autre légèrement décollée. Fixe un point devant toi pour stabiliser. Garde une main près d\u2019un appui.'},
    {id:'talon-pointe',  name:'Marche talon-pointe',         area:'proprioception', type:'Équilibre', equip:['bodyweight'],            unit:'reps', base:{sets:2,reps:12}, last:{sets:2,reps:10}, rest:20,
      desc:'Avance en posant le talon juste devant la pointe du pied précédent, comme sur une ligne. Sans te presser, le long d\u2019un mur.'},
    {id:'squat',         name:'Squat gobelet',               area:'lower',          type:'Renfo',     equip:['bodyweight','halteres'], unit:'reps', base:{sets:3,reps:12}, last:{sets:3,reps:10}, rest:45,
      desc:'Pieds écartés largeur d\u2019épaules. Descends comme pour t\u2019asseoir en gardant le dos droit et les talons au sol.'},
    {id:'fentes',        name:'Fentes alternées',            area:'lower',          type:'Renfo',     equip:['bodyweight'],            unit:'reps', base:{sets:3,reps:10}, last:{sets:2,reps:10}, rest:45,
      desc:'Grand pas en avant, plie les deux genoux vers 90°, puis reviens. Alterne les jambes. Appui possible sur une chaise.'},
    {id:'pont',          name:'Pont fessier',                area:'core',           type:'Renfo',     equip:['bodyweight','elastiques'],unit:'reps',base:{sets:3,reps:14}, last:{sets:3,reps:14}, rest:35,
      desc:'Allongée sur le dos, genoux pliés. Soulève le bassin en serrant les fessiers, marque 1 s en haut, redescends lentement.'},
    {id:'gainage',       name:'Gainage frontal',             area:'core',           type:'Renfo',     equip:['bodyweight','tapis'],    unit:'time', base:{sets:3,sec:25}, last:{sets:3,sec:20}, rest:30,
      desc:'En appui sur les avant-bras et les pieds, corps bien aligné, ventre gainé. Sur les genoux si besoin.'},
    {id:'tirage',        name:'Tirage élastique',            area:'upper',          type:'Renfo',     equip:['elastiques'],            unit:'reps', base:{sets:3,reps:14}, last:{sets:3,reps:12}, rest:40,
      desc:'Élastique ancré devant toi. Tire les coudes vers l\u2019arrière en serrant les omoplates, relâche en contrôlant.'},
    {id:'elevation',     name:'Élévation latérale',          area:'upper',          type:'Renfo',     equip:['halteres','elastiques'], unit:'reps', base:{sets:2,reps:12}, last:{sets:2,reps:12}, rest:35,
      desc:'Bras le long du corps, charge légère. Monte-les sur les côtés jusqu\u2019à l\u2019horizontale, sans à-coups, puis redescends.'},
    {id:'velo-doux',     name:'Vélo — endurance douce',      area:'cardio',         type:'Cardio',    equip:['velo'],                  unit:'min',  base:{min:12}, last:{min:10}, rest:0,
      desc:'Pédale à une allure régulière où tu peux encore parler. On vise l\u2019endurance, pas la vitesse.'},
    {id:'etirement-post',name:'Étirement chaîne postérieure',area:'stretching',     type:'Mobilité',  equip:['bodyweight','tapis'],    unit:'time', base:{sets:2,sec:40}, last:{sets:2,sec:40}, rest:10,
      desc:'Assise jambes tendues, penche-toi doucement vers tes pieds sans forcer ni rebondir. Respire profondément dans l\u2019étirement.'},
  ],

  formeHistory: [],   /* réel : window.__formeHistory() (journal de check-in) */
  /* Tests fonctionnels mensuels — validés dans la SEP (lever de chaise 30 s, appui unipodal, flexion avant) */
  tests: [
    {key:'sts',     label:'Chaise contre le mur', short:'Force des jambes', unit:'s', sub:'tenue maximale',       higher:true, color:'#12A38C'},
    {key:'pushup',  label:'Pompes',              short:'Haut du corps',   unit:'pompes', sub:'maximum',          higher:true, color:'#2FA56B'},
    {key:'plank',   label:'Gainage — planche',     short:'Tronc',           unit:'s', sub:'tenue maximale',       higher:true, color:'#0E8FB0'},
    {key:'balance', label:'Tenir sur un pied',   short:'Équilibre',        unit:'s',      sub:'meilleure jambe',      higher:true, color:'#3A7FCC'},
    {key:'reach',   label:'Flexion avant',       short:'Souplesse',        unit:'cm',     sub:'mains vers les pieds', higher:true, color:'#7BA83E'},
  ],
  bilans: [],   /* réel : window.__readBilans() (bilans mensuels enregistrés) */
  garmin: { sleepScore:78, sleepHours:'7 h 12', restingHR:58, bodyBattery:64, steps:4820 },
  recentSessions:[],   /* réel : window.__recentSessions() (historique de séances) */
  week:[
    {label:'L',done:true,forme:62},{label:'M',done:true,forme:55},{label:'M',done:false,forme:0},
    {label:'J',done:true,forme:70},{label:'V',done:true,forme:66},{label:'S',done:false,forme:0},{label:'D',done:null,forme:null},
  ],
  stretching:[
    {id:1,name:'Étirement ischio-jambiers',duration:'45 s',area:'lower'},
    {id:2,name:'Rotation du cou',sets:2,reps:5,area:'upper'},
    {id:3,name:'Étirement du piriforme',duration:'45 s',area:'lower'},
    {id:4,name:'Flexion latérale du tronc',duration:'30 s',area:'core'},
    {id:5,name:'Étirement du psoas',duration:'45 s',area:'lower'},
    {id:6,name:'Rotation thoracique',sets:2,reps:8,area:'core'},
  ],

  /* Répartition des efforts — réel : window.__focusAreas() / window.__focusWeeks() */
  focusAreas:[],
  focusWeeks:[],
  /* Trophées / gamification */
  badges:[
    {id:'streak',label:'Régularité',sub:'5 jours de suite',earned:true,color:'#F2602E',icon:'flame'},
    {id:'allround',label:'Tout-terrain',sub:'7 zones cette semaine',earned:true,color:'#2FBFA1',icon:'compass'},
    {id:'balance',label:'Équilibriste',sub:'15 séances équilibre',earned:false,progress:14,total:15,color:'#3A7FCC',icon:'activity'},
  ],
  /* Séances salle + programme hebdo — exercices-data.js (depuis exercices_salle.xlsx) */
  gymSessions: window.ED_GYM,
  weeklyProgram: window.ED_WEEK,
};

/* ═══ MOTEUR DE PROGRAMME ═══ */
/* Helpers partagés (difficulté, rotation quotidienne, matériel) */
window.__readDiff = function(){ try{ return JSON.parse((window.localStorage&&localStorage.getItem('elan_difficulties'))||'{}'); }catch(e){ return {}; } };
window.__elanDaySeed = function(){ const d=new Date(); return d.getFullYear()*400 + d.getMonth()*31 + d.getDate(); };
/* Forme du jour — dépend UNIQUEMENT du check-in, pas de la séance choisie */
window.__readiness = function(m){ const {energy=5,fatigue=4,heat=4,sleep=6}=m||{}; const readiness=Math.max(8,Math.min(100,Math.round(energy*7+sleep*4.5-fatigue*4-heat*2.5+20))); const tier=readiness<42?'low':readiness<70?'moderate':'high'; return {readiness,tier}; };
window.__suggestIntensity = function(m){ return ({low:'legere',moderate:'moderee',high:'soutenue'})[window.__readiness(m).tier]; };
const __round=(v,step=1)=>Math.max(step, Math.round(v/step)*step);
const __rotate=(arr,seed)=>{ if(!arr.length) return arr; const k=((seed%arr.length)+arr.length)%arr.length; return arr.slice(k).concat(arr.slice(0,k)); };
const __avail=(context)=>{ const { location='maison', equipment=['bodyweight'] } = context||{}; return location==='salle' ? ['bodyweight','halteres','elastiques','velo','tapis'] : (equipment.length?equipment:['bodyweight']); };
/* ─── Suivi de charges (musculation salle) ─── */
window.__readStrength=function(){ try{ return JSON.parse((window.localStorage&&localStorage.getItem('elan_strength'))||'{}'); }catch(e){ return {}; } };
window.__logStrength=function(exId,name,sets,weight,reps){
  const all=window.__readStrength();
  const rec=all[exId]||(all[exId]={name,sets,log:[]});
  rec.name=name; rec.sets=sets;
  const today=new Date().toISOString().slice(0,10);
  rec.log=(rec.log||[]).filter(e=>e.date!==today); rec.log.push({date:today,weight,reps}); rec.log.sort((a,b)=>a.date<b.date?-1:1);
  try{ if(window.localStorage) localStorage.setItem('elan_strength',JSON.stringify(all)); }catch(e){}
  return all;
};
window.__mergedStrength=function(exId){
  const all=window.__readStrength();
  const seed=(window.ED.gymSeed&&window.ED.gymSeed[exId])||[];
  const userLog=(all[exId]&&all[exId].log)||[];
  const byDate={}; seed.forEach(e=>byDate[e.date]=e); userLog.forEach(e=>byDate[e.date]=e);
  return Object.keys(byDate).sort().map(d=>byDate[d]);
};
window.__lastStrength=function(exId){ const m=window.__mergedStrength(exId); return m.length?m[m.length-1]:null; };

/* ─── Lever de chaise : journal daté + moyenne glissante 7 jours ─── */
window.__stsLog=function(){ try{ return JSON.parse((window.localStorage&&localStorage.getItem('elan_sts_log'))||'[]'); }catch(e){ return []; } };
window.__stsPush=function(reps){ const log=window.__stsLog(); const today=new Date().toISOString().slice(0,10); const f=log.filter(e=>e.date!==today); f.push({date:today,reps}); f.sort((a,b)=>a.date<b.date?-1:1); try{ if(window.localStorage) localStorage.setItem('elan_sts_log',JSON.stringify(f)); }catch(e){} return f; };
window.__sts7=function(excludeToday){ const log=window.__stsLog(); const today=new Date().toISOString().slice(0,10); const cut=new Date(Date.now()-7*86400000).toISOString().slice(0,10); const xs=log.filter(e=>e.date>cut && (!excludeToday||e.date!==today)); if(!xs.length) return null; return {mean:Math.round(xs.reduce((s,e)=>s+e.reps,0)/xs.length*10)/10, n:xs.length}; };

/* ─── Progression hebdomadaire : niveau acquis par exercice (staircase clinique SEP) ─── */
window.__exMax=6;
window.__readProg=function(){ try{ return JSON.parse((window.localStorage&&localStorage.getItem('elan_progress'))||'{}'); }catch(e){ return {}; } };

/* ─── Bilan initial : évaluation de référence (une seule fois, au premier lancement) ─── */
window.__readBaseline=function(){ try{ return JSON.parse((window.localStorage&&localStorage.getItem('elan_baseline'))||'null'); }catch(e){ return null; } };
window.__hasBaseline=function(){ const b=window.__readBaseline(); return !!(b&&b.done); };
function __band(v,ups){ for(let i=0;i<ups.length;i++){ if(v<=ups[i]) return i; } return ups.length; }
window.__deriveBaseline=function(t,profile){
  t=t||{}; profile=profile||{};
  const L={};
  L.lower=Math.round((__band(t.squat||0,[5,9,14,20,28,39])+__band(t.wallSit||0,[14,29,44,59,89,119]))/2);
  L.upper=__band(t.pushup||0,[1,4,8,14,22,34]);
  L.core=__band(t.plank||0,[9,19,34,49,69,99]);
  L.balance=__band(Math.max(t.balanceL||0,t.balanceR||0),[4,9,19,29,44,59]);
  L.proprioception=Math.max(0,L.balance-1);
  L.stretching=__band(t.reach!=null?t.reach:-10,[-15,-8,-3,2,7,12]);
  L.cardio=profile.activity==='actif'?2:profile.activity==='sedentaire'?0:1;
  const sym=profile.symptoms||[];
  if(sym.includes('equilibre')){ L.balance=Math.min(L.balance,2); L.proprioception=Math.min(L.proprioception,1); }
  if(sym.includes('fatigue')){ Object.keys(L).forEach(function(k){ L[k]=Math.min(L[k],4); }); }
  if(sym.includes('spasticite')){ L.lower=Math.min(L.lower,4); }
  return L;
};
window.__saveBaseline=function(data){
  const levels=window.__deriveBaseline(data.tests,data.profile);
  const rec={done:true,date:new Date().toISOString().slice(0,10),profile:data.profile||{},neuro:data.neuro||{},tests:data.tests||{},levels};
  try{ if(window.localStorage) localStorage.setItem('elan_baseline',JSON.stringify(rec)); }catch(e){}
  return rec;
};
window.__baselineLevel=function(area){ const b=window.__readBaseline(); if(!b||!b.levels) return 0; return b.levels[area]!=null?b.levels[area]:1; };

window.__exLevel=function(exId,area){ const p=window.__readProg()[exId];
  if(p&&p.level!=null){ const pen=window.__idlePenalty(p.lastDate); return Math.max(0,(p.level||0)-pen); }
  if(area&&window.__hasBaseline()) return window.__baselineLevel(area); return 0; };
/* Désentraînement : après une longue interruption (poussée, fatigue), on rouvre plus doux
   puis on remonte — sans effacer le niveau acquis. */
window.__idlePenalty=function(lastDate){ if(!lastDate) return 0; const days=Math.round((Date.now()-new Date(lastDate).getTime())/86400000); return days>=42?2:days>=21?1:0; };
window.__exReentry=function(exId){ const p=window.__readProg()[exId]; return !!(p&&(p.level||0)>0 && window.__idlePenalty(p.lastDate)>0); };
window.__logSession=function(exId,outcome,area,tier){
  const all=window.__readProg(); let r=all[exId];
  if(!r){ const base=(area&&window.__hasBaseline())?window.__baselineLevel(area):0; r=all[exId]={level:base,success:0}; }
  if(outcome==='hard'){ r.level=Math.max(0,(r.level||0)-1); r.success=0; r.lastChange='down'; }
  else if(outcome==='easy'){ r.level=Math.min(window.__exMax,(r.level||0)+1); r.success=0; r.lastChange='up'; }
  /* progression auto : 2 séances réussies → +1 niveau, mais on ne capitalise PAS une
     progression sur un jour de forme basse (séance volontairement allégée). */
  else { r.success=(r.success||0)+1; if(r.success>=2 && tier!=='low'){ r.level=Math.min(window.__exMax,(r.level||0)+1); r.success=0; r.lastChange='up'; } else r.lastChange='kept'; }
  r.lastDate=new Date().toISOString().slice(0,10);
  try{ if(window.localStorage) localStorage.setItem('elan_progress',JSON.stringify(all)); }catch(e){}
  return r;
};
/* Échelles de progression — volume d'abord, puis séries, puis tempo / complexité (yeux, double tâche, instabilité) */
function __stepStrength(level,Sb,Rb){ const cap=15,S=Math.min(Sb||2,3); const steps=[
  {sets:S,reps:Rb,note:''},
  {sets:S,reps:Math.min(Rb+2,cap),note:'+ répétitions'},
  {sets:S,reps:Math.min(Rb+4,cap),note:'+ répétitions'},
  {sets:Math.min(S+1,3),reps:Rb,note:'+1 série'},
  {sets:Math.min(S+1,3),reps:Math.min(Rb+2,cap),note:'+1 série, + répétitions'},
  {sets:Math.min(S+1,3),reps:Math.min(Rb+3,cap),tempo:'descente lente 3 s',note:'tempo lent'},
  {sets:Math.min(S+1,3),reps:Rb,tempo:'descente 4 s + pause 2 s en bas',note:'tempo lent + pause'},
]; return steps[Math.max(0,Math.min(level,steps.length-1))]; }
function __stepTime(level,Sb,secB){ const cap=90,S=Sb||2; const steps=[
  {sets:S,sec:secB,note:''},
  {sets:S,sec:Math.min(secB+15,cap),note:'+ durée'},
  {sets:S,sec:Math.min(secB+30,cap),note:'+ durée'},
  {sets:S,sec:Math.min(secB+30,cap),mod:'appui des mains réduit',note:'appui réduit'},
  {sets:S,sec:Math.min(secB+30,cap),mod:'yeux fermés par moments',note:'yeux fermés'},
  {sets:S,sec:Math.min(secB+30,cap),mod:'+ tâche cognitive (compte à rebours)',note:'double tâche'},
  {sets:S,sec:Math.min(secB+30,cap),mod:'sur surface instable (coussin)',note:'surface instable'},
]; return steps[Math.max(0,Math.min(level,steps.length-1))]; }
function __stepAero(level,Mb){ const steps=[
  {min:Mb,note:''},
  {min:Math.min(Mb+3,30),note:'+ durée'},
  {min:Math.min(Mb+6,30),note:'+ durée'},
  {min:Math.min(Mb+6,30),mod:'intervalles : 30 s soutenu / 1 min calme',note:'intervalles'},
  {min:Math.min(Mb+8,35),mod:'résistance légèrement augmentée',note:'résistance +'},
]; return steps[Math.max(0,Math.min(level,steps.length-1))]; }
function __nextNote(ex,level){
  if(ex.unit==='reps') return __stepStrength(level+1,ex.sets||2,ex.reps||10).note;
  if(ex.unit==='time') return __stepTime(level+1,ex.sets||2,ex.sec||30).note;
  if(ex.unit==='min') return __stepAero(level+1,ex.min||10).note;
  return '';
}

/* ─── Historique des séances réalisées (variété + couverture du corps + streak) ─── */
window.__sessHistory=function(){ try{ return JSON.parse((window.localStorage&&localStorage.getItem('elan_sessHistory'))||'[]'); }catch(e){ return []; } };
window.__logSessionDone=function(info){
  if(!info||!info.id) return;
  const all=window.__sessHistory();
  const today=new Date().toISOString().slice(0,10);
  const f=all.filter(e=>!(e.date===today && e.id===info.id));
  f.push({date:today,id:info.id,region:info.region||'',intent:info.intent||'',dorsi:!!info.dorsi,
          title:info.title||'',duration:info.duration||0,areas:info.areas||[],forme:info.forme!=null?info.forme:null});
  const cut=new Date(Date.now()-60*86400000).toISOString().slice(0,10);
  const trimmed=f.filter(e=>e.date>cut).sort((a,b)=>a.date<b.date?-1:1);
  try{ if(window.localStorage) localStorage.setItem('elan_sessHistory',JSON.stringify(trimmed)); }catch(e){}
  return trimmed;
};
/* streak = nb de jours consécutifs (aujourd'hui ou hier inclus) avec au moins une séance */
window.__streak=function(){
  const days=[...new Set(window.__sessHistory().map(e=>e.date))].sort();
  if(!days.length) return 0;
  const has=new Set(days);
  const oneDay=86400000;
  let d=new Date(); let cur=d.toISOString().slice(0,10);
  if(!has.has(cur)){ d=new Date(Date.now()-oneDay); cur=d.toISOString().slice(0,10); if(!has.has(cur)) return 0; }
  let n=0;
  while(has.has(d.toISOString().slice(0,10))){ n++; d=new Date(d.getTime()-oneDay); }
  return n;
};
window.__weekDoneCount=function(){
  const cut=new Date(Date.now()-7*86400000).toISOString().slice(0,10);
  return [...new Set(window.__sessHistory().filter(e=>e.date>cut).map(e=>e.date))].length;
};
/* ─── Releveur du pied (tibial antérieur) : garantir ≥ 2 séances / semaine ISO ─── */
window.__isoWeekKey=function(dt){ const d=dt?new Date(dt):new Date(); const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); const day=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-day); const ys=new Date(Date.UTC(t.getUTCFullYear(),0,1)); const wk=Math.ceil((((t-ys)/86400000)+1)/7); return t.getUTCFullYear()+'-W'+wk; };
window.__dorsiWeekCount=function(){ const wk=window.__isoWeekKey(); return window.__sessHistory().filter(e=>e.dorsi && window.__isoWeekKey(e.date)===wk).length; };
window.__DORSI_PER_WEEK=2;
/* Faut-il travailler le releveur du pied aujourd'hui ? Cible 2×/semaine, RÉPARTIES :
   - 1re séance dorsi de la semaine : dès que possible ;
   - 2e : on espace d'au moins 2 jours pour récupérer, mais on la force en fin de semaine
     (à partir de vendredi) pour ne jamais rater le minimum hebdo. */
window.__dorsiDueToday=function(){
  const wk=window.__isoWeekKey(); const hist=window.__sessHistory();
  const thisWeek=hist.filter(e=>e.dorsi && window.__isoWeekKey(e.date)===wk);
  if(thisWeek.length>=window.__DORSI_PER_WEEK) return false;
  if(thisWeek.length===0) return true;
  const dates=hist.filter(e=>e.dorsi).map(e=>e.date).sort();
  const last=dates[dates.length-1];
  const gap=last?Math.round((Date.now()-new Date(last).getTime())/86400000):99;
  const isoDow=(new Date().getUTCDay()||7);   // 1=lundi … 7=dimanche
  return gap>=2 || isoDow>=5;                  // espacé OU forcé en fin de semaine
};
window.__bestStreak=function(){
  const days=[...new Set(window.__sessHistory().map(e=>e.date))].sort();
  if(!days.length) return 0;
  let best=1,run=1;
  for(let i=1;i<days.length;i++){ const prev=new Date(days[i-1]).getTime(), cur=new Date(days[i]).getTime();
    if(Math.round((cur-prev)/86400000)===1){ run++; best=Math.max(best,run); } else run=1; }
  return Math.max(best, window.__streak());
};

/* ─── État du jour : check-in fait ? séance faite ? (1re ouverture = check-in, ensuite = programme) ─── */
window.__today=function(){ return new Date().toISOString().slice(0,10); };
window.__readCheckin=function(){ try{ return JSON.parse((window.localStorage&&localStorage.getItem('elan_checkin'))||'null'); }catch(e){ return null; } };
window.__saveCheckin=function(metrics){ const rec={date:window.__today(),metrics:metrics||{}}; try{ if(window.localStorage) localStorage.setItem('elan_checkin',JSON.stringify(rec)); }catch(e){} try{ window.__pushForme(window.__readiness(metrics).readiness); }catch(e){} return rec; };
window.__checkedInToday=function(){ const c=window.__readCheckin(); return !!(c&&c.date===window.__today()); };
window.__sessionDoneToday=function(){ return window.__sessHistory().some(e=>e.date===window.__today()); };

/* ─── Reprise de séance : faire sa séance en plusieurs fois dans la journée ─── */
window.__readSessionState=function(){ try{ return JSON.parse((window.localStorage&&localStorage.getItem('elan_session_state'))||'null'); }catch(e){ return null; } };
window.__resumableSession=function(){ const s=window.__readSessionState(); return (s&&s.date===window.__today())?s:null; };
window.__saveSessionState=function(s){ try{ if(window.localStorage) localStorage.setItem('elan_session_state',JSON.stringify(Object.assign({date:window.__today()},s))); }catch(e){} };
window.__clearSessionState=function(){ try{ if(window.localStorage) localStorage.removeItem('elan_session_state'); }catch(e){} };

/* ─── Objectifs long terme : 100% dérivés du test d'entrée, propres à chacun ───
   Cible = niveau de départ + marge PROPORTIONNELLE (~+50%), bornée par un gain
   mini garanti et un gain maxi réaliste — jamais un plancher absolu identique
   pour tous. Quelqu'un qui démarre à 20 pompes vise plus haut que quelqu'un à 3. */
window.__goalMargin=function(key,v){
  v=Math.max(0,v);
  if(key==='reach') return 8;                 // souplesse (cm) : gain additif modéré
  var lo,hi;
  if(key==='wall'){ lo=15; hi=45; }           // chaise au mur (s)
  else if(key==='plank'){ lo=12; hi=40; }      // gainage (s)
  else if(key==='balance'){ lo=10; hi=30; }    // équilibre (s)
  else { lo=4; hi=15; }                        // pompes (reps)
  return Math.max(lo, Math.min(hi, Math.round(v*0.5)));
};
function __nextRung(key,v){
  var nx=v+window.__goalMargin(key,v);
  if(key==='wall'||key==='plank'||key==='balance') nx=Math.ceil(nx/5)*5; // secondes : arrondi propre
  return nx;
}
/* Échelle de paliers : test d'entrée → palier 1 → palier 2 … La cible active est
   toujours le palier juste au-dessus du niveau actuel ; une fois atteinte, le
   palier suivant se débloque tout seul (le départ devient l'ancienne cible). */
window.__activeGoal=function(key,entryStart,current){
  var base=entryStart, target=__nextRung(key,base), palier=1;
  while(current>=target && palier<12){ base=target; target=__nextRung(key,base); palier++; }
  return {base:base, target:target, palier:palier};
};
/* ─── Test de marche 6 min (6MWT) — test LIBRE, hors bilan complet.
   L'utilisateur saisit sa distance quand il le fait ; l'app trace l'évolution. ─── */
window.__WALK6_SEED=[];
window.__readWalk6=function(){
  try{ const r=JSON.parse((window.localStorage&&localStorage.getItem('elan_walk6'))||'null'); if(r&&r.length!=null) return r; }catch(e){}
  return (window.__WALK6_SEED||[]).slice();
};
window.__addWalk6=function(meters,dateStr){
  const list=window.__readWalk6().slice();
  const d=dateStr||new Date().toISOString().slice(0,10);
  const m=Math.max(0,Math.round(meters));
  const ix=list.findIndex(function(e){return e.date===d;});
  if(ix>=0) list[ix]={date:d,m:m}; else list.push({date:d,m:m});
  list.sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
  try{ if(window.localStorage) localStorage.setItem('elan_walk6',JSON.stringify(list)); }catch(e){}
  return list;
};
window.__removeWalk6=function(date){
  const list=window.__readWalk6().filter(function(e){return e.date!==date;});
  try{ if(window.localStorage) localStorage.setItem('elan_walk6',JSON.stringify(list)); }catch(e){}
  return list;
};
/* ─── Mesures mensuelles masquées : permet de supprimer une mesure erronée
   sans toucher aux données de démo. Identifiant "moisLabel|clé". ─── */
window.__readBilanHidden=function(){ try{ return JSON.parse((window.localStorage&&localStorage.getItem('elan_bilan_hidden'))||'[]'); }catch(e){ return []; } };
window.__bilanHiddenHas=function(month,key){ return window.__readBilanHidden().indexOf(month+'|'+key)>=0; };
window.__toggleBilanHidden=function(month,key,hide){
  const set=window.__readBilanHidden(); const id=month+'|'+key; const has=set.indexOf(id)>=0;
  const next=(hide===undefined? !has : !!hide) ? (has?set:set.concat([id])) : set.filter(function(x){return x!==id;});
  try{ if(window.localStorage) localStorage.setItem('elan_bilan_hidden',JSON.stringify(next)); }catch(e){}
  return next;
};
/* ─── Test d'entrée : effacement (pour le refaire) ─── */
window.__clearBaseline=function(){ try{ if(window.localStorage) localStorage.removeItem('elan_baseline'); }catch(e){} };
/* ─── Test d'entrée : « plus tard » mémorisé (sinon il se relance à chaque ouverture) ─── */
window.__baselineSkipped=function(){ try{ return (window.localStorage&&localStorage.getItem('elan_baseline_skip'))==='1'; }catch(e){ return false; } };
window.__markBaselineSkipped=function(){ try{ if(window.localStorage) localStorage.setItem('elan_baseline_skip','1'); }catch(e){} };
window.__clearBaselineSkip=function(){ try{ if(window.localStorage) localStorage.removeItem('elan_baseline_skip'); }catch(e){} };
/* ─── Réinitialisation totale : toutes les données locales d'Élan ─── */
window.__elanKeys=['elan_difficulties','elan_strength','elan_sts_log','elan_progress','elan_baseline','elan_baseline_skip','elan_sessHistory','elan_checkin','elan_session_state','elan_walk6','elan_bilan_done','elan_bilan_hidden','elan_rt_base','elan_recap_week','elan_recap_month','elan_forme_log','elan_bilans'];
window.__resetAllData=function(){ try{ if(window.localStorage){ window.__elanKeys.forEach(function(k){ localStorage.removeItem(k); }); /* filet de sécurité : supprime toute clé résiduelle « elan_* » (ré-initialisation 100% propre) */ for(var i=localStorage.length-1;i>=0;i--){ var k=localStorage.key(i); if(k&&k.indexOf('elan_')===0) localStorage.removeItem(k); } } }catch(e){} };
window.__longTermGoals=function(){
  const b=window.__readBaseline();
  if(!b||!b.done) return [];   // pas d'objectifs tant que le test d'entrée n'est pas fait
  const bil=window.__readBilans(); const last=bil[bil.length-1]||{}; const first=bil[0]||{};
  const t=(b&&b.tests)||{};
  const startWall=t.wallSit!=null?t.wallSit:(first.sts!=null?first.sts:20);
  const startBal=(t.balanceL!=null||t.balanceR!=null)?Math.max(t.balanceL||0,t.balanceR||0):(first.balance!=null?first.balance:10);
  const startReach=t.reach!=null?t.reach:(first.reach!=null?first.reach:-10);
  const startPush=t.pushup!=null?t.pushup:(first.pushup!=null?first.pushup:4);
  const startPlank=t.plank!=null?t.plank:(first.plank!=null?first.plank:18);
  const ZC=(window.EC&&window.EC.AREA_COLORS)||{};
  const meta=[
    ['wall',   'lower',      'Chaise au mur',     'force des jambes','s', ZC.lower||'#12A38C',      startWall,  last.sts!=null?last.sts:startWall],
    ['pushup', 'upper',      'Pompes',            'haut du corps',   '',  ZC.upper||'#2FA56B',      startPush,  last.pushup!=null?last.pushup:startPush],
    ['plank',  'core',       'Gainage',           'tronc',           's', ZC.core||'#0E8FB0',       startPlank, last.plank!=null?last.plank:startPlank],
    ['balance','balance',    'Tenir sur un pied', 'équilibre',       's', ZC.balance||'#3A7FCC',    startBal,   last.balance!=null?last.balance:startBal],
    ['reach',  'stretching', 'Flexion avant',     'souplesse',       'cm',ZC.stretching||'#7BA83E', startReach, last.reach!=null?last.reach:startReach],
  ];
  const goals=meta.map(function(m){
    const key=m[0], entry=m[6], current=m[7];
    const a=window.__activeGoal(key,entry,current);
    const span=(a.target-a.base)||1;
    const pct=Math.max(0,Math.min(100,Math.round(((current-a.base)/span)*100)));
    return {key:key, area:m[1], label:m[2], sub:m[3], unit:m[4], color:m[5],
            entry:entry, start:a.base, current:current, target:a.target,
            palier:a.palier, pct:pct, done:current>=a.target};
  });
  return goals;
};

/* ═══ DONNÉES RÉELLES POUR LES STATS (remplacent les données de démo) ═══ */
/* Journal de forme quotidienne — alimente la courbe « Forme du jour · 14 j ». */
window.__readFormeLog=function(){ try{ return JSON.parse((window.localStorage&&localStorage.getItem('elan_forme_log'))||'[]'); }catch(e){ return []; } };
window.__pushForme=function(forme){ const log=window.__readFormeLog(); const today=window.__today(); const f=log.filter(function(e){return e.date!==today;}); f.push({date:today,forme:Math.round(forme)}); const cut=new Date(Date.now()-180*86400000).toISOString().slice(0,10); const trimmed=f.filter(function(e){return e.date>cut;}).sort(function(a,b){return a.date<b.date?-1:1;}); try{ if(window.localStorage) localStorage.setItem('elan_forme_log',JSON.stringify(trimmed)); }catch(e){} return trimmed; };
window.__formeHistory=function(n){ const v=window.__readFormeLog().map(function(e){return e.forme;}); return n?v.slice(-n):v; };

/* Bilans mensuels enregistrés (tests fonctionnels). */
window.__readBilans=function(){ try{ return JSON.parse((window.localStorage&&localStorage.getItem('elan_bilans'))||'[]'); }catch(e){ return []; } };
window.__saveBilan=function(entry){ const arr=window.__readBilans(); if(arr.length && arr[arr.length-1].month===entry.month) arr[arr.length-1]=entry; else arr.push(entry); try{ if(window.localStorage) localStorage.setItem('elan_bilans',JSON.stringify(arr)); }catch(e){} return arr; };

/* Séances récentes — dérivées de l'historique réel (pour la liste « Récentes »). */
window.__FR_DOW=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
window.__recentSessions=function(n){ n=n||6; const hist=window.__sessHistory().slice().sort(function(a,b){return a.date<b.date?1:-1;}); const today=window.__today(); const yday=new Date(Date.now()-86400000).toISOString().slice(0,10); return hist.slice(0,n).map(function(e){ var label; if(e.date===today) label='Aujourd’hui'; else if(e.date===yday) label='Hier'; else { var d=new Date(e.date+'T00:00'); label=window.__FR_DOW[d.getDay()]+' '+d.getDate(); } return {date:label, title:e.title||'Séance', duration:e.duration||0, forme:e.forme!=null?e.forme:0}; }); };

/* Répartition par zone — comptée sur l'historique réel (zones de chaque séance). */
window.__sessAreas=function(e){ if(e.areas&&e.areas.length) return e.areas; return e.region?[e.region]:[]; };
window.__focusAreas=function(days){ days=days||30; const cut=new Date(Date.now()-days*86400000).toISOString().slice(0,10); const hist=window.__sessHistory().filter(function(e){return e.date>cut;}); const counts={}; hist.forEach(function(e){ window.__sessAreas(e).forEach(function(a){ counts[a]=(counts[a]||0)+1; }); }); return Object.keys(counts).map(function(k){return {key:k,count:counts[k]};}).sort(function(a,b){return b.count-a.count;}); };
window.__focusWeeks=function(){ const hist=window.__sessHistory(); if(!hist.length) return []; const map={}; hist.forEach(function(e){ const k=window.__isoWeekKey(e.date); if(!map[k]) map[k]={key:k}; window.__sessAreas(e).forEach(function(a){ map[k][a]=(map[k][a]||0)+1; }); }); const keys=Object.keys(map).sort(); const last4=keys.slice(-4); return last4.map(function(k){ const o=Object.assign({},map[k]); o.label='S'+(k.split('W')[1]||''); return o; }); };
/* Trophées calculés sur les données réelles. */
window.__focusBadges=function(){ const streak=window.__streak(); const wkCut=new Date(Date.now()-7*86400000).toISOString().slice(0,10); const wkZones=new Set(); window.__sessHistory().filter(function(e){return e.date>wkCut;}).forEach(function(e){ window.__sessAreas(e).forEach(function(a){wkZones.add(a);}); }); const balCount=window.__sessHistory().filter(function(e){return window.__sessAreas(e).indexOf('balance')>=0;}).length; return [ {id:'streak',label:'Régularité',sub:streak+' jour'+(streak>1?'s':'')+' de suite',earned:streak>=3,progress:streak,total:3,color:'#F2602E',icon:'flame'}, {id:'allround',label:'Tout-terrain',sub:wkZones.size+' zones cette semaine',earned:wkZones.size>=5,progress:wkZones.size,total:5,color:'#2FBFA1',icon:'compass'}, {id:'balance',label:'Équilibriste',sub:balCount+' séances équilibre',earned:balCount>=15,progress:balCount,total:15,color:'#3A7FCC',icon:'activity'} ]; };

/* ─── Récap périodique : hebdo (dimanche soir) + mensuel (1er du mois) ─── */
window.__recapSeen=function(kind,key){ try{ return (window.localStorage&&localStorage.getItem('elan_recap_'+kind))===key; }catch(e){ return false; } };
window.__markRecapSeen=function(kind,key){ try{ if(window.localStorage) localStorage.setItem('elan_recap_'+kind,key); }catch(e){} };
window.__recapDue=function(){
  if(window.__formeHistory().length<3) return null;   // pas de récap tant qu'il n'y a pas d'historique réel
  const now=new Date(); const day=now.getDay(), date=now.getDate(), hour=now.getHours();
  const mKey=now.getFullYear()+'-'+(now.getMonth()+1);
  if(date===1 && !window.__recapSeen('month',mKey)) return {kind:'month',key:mKey};
  if(day===0 && hour>=18){ const wk=now.getFullYear()+'-'+now.getMonth()+'-W'+Math.ceil(date/7); if(!window.__recapSeen('week',wk)) return {kind:'week',key:wk}; }
  return null;
};
/* ─── Rappel du bilan mensuel : dès le 1er, puis chaque jour jusqu'à ce qu'il soit fait ─── */
window.__bilanMonthKey=function(){ const n=new Date(); return n.getFullYear()+'-'+(n.getMonth()+1); };
window.__bilanDoneThisMonth=function(){ try{ return (window.localStorage&&localStorage.getItem('elan_bilan_done'))===window.__bilanMonthKey(); }catch(e){ return false; } };
window.__markBilanDone=function(){ try{ if(window.localStorage) localStorage.setItem('elan_bilan_done',window.__bilanMonthKey()); }catch(e){} };
window.__bilanReminderDue=function(){ return !window.__bilanDoneThisMonth(); };
/* Pas de données d'exemple : l'app démarre vierge et se remplit à l'usage réel. */
window.ED.gymSeed={};
window.__mapExercise = function(ex, diff, ctx){
  ctx=ctx||{}; diff=diff||{};
  const tier=ctx.tier||'moderate'; const m=ctx.metrics||{};
  const fatigue=m.fatigue!=null?m.fatigue:4; const heat=m.heat!=null?m.heat:4;
  const flagged=diff[ex.id];
  const o={id:ex.id,name:ex.name,area:ex.region||ex.area||'lower',phase:ex.phase||'main',type:ex.type||'',desc:ex.desc,equip:ex.equip||[],
    side:ex.side||'both',sideLabel:ex.sideLabel||'côté',
    muscles:ex.muscles||'',position:ex.position||'',conseil:ex.conseil||'',alternative:ex.alternative||'',
    restSec:ex.rest||0,workSec:ex.workSec||0,doseText:ex.doseText||'',sets:ex.sets||1,tempo:'',mod:'',
    flagged:flagged?flagged.reason:null,prog:flagged?'down':'=',weighted:!!ex.weighted,level:0,levelNote:'',nextCue:'',regressed:false};
  const isMain=(ex.phase||'main')==='main' && !ex.weighted;
  if(!isMain){
    if(ex.unit==='reps'){ o.reps=ex.reps; }
    else if(ex.unit==='time'){ o.sec=ex.sec; o.workSec=ex.sec||0; o.duration=`${ex.sec} s`; }
    else { o.min=ex.min; o.sets=1; o.workSec=(ex.min||0)*60; o.duration=`${ex.min} min`; }
    return o;
  }
  const level=window.__exLevel(ex.id, o.area);
  /* autorégulation du jour (énergie envelope SEP) : la forme module le VOLUME, pas le niveau acquis */
  let vol = tier==='low'?0.78 : tier==='high'?1.0 : 0.92;
  if(fatigue>=7) vol*=0.88; if(heat>=7) vol*=0.9; vol=Math.max(0.6,vol);
  const dropSets=(tier==='low'?1:0)+(fatigue>=8?1:0);
  const restMult=(tier==='low'||fatigue>=7||heat>=7)?1.35:1.0;
  o.level=level;
  const sideSuffix = o.side==='each' ? ` par ${o.sideLabel}` : o.side==='alt' ? ' (en alternant)' : '';
  if(ex.unit==='reps'){
    const st=__stepStrength(level, ex.sets||2, ex.reps||10);
    const sets=Math.max(1,Math.min(3, st.sets-dropSets));
    const reps=Math.max(6,Math.min(15, Math.round(st.reps*vol)));
    o.sets=sets; o.reps=reps; o.tempo=st.tempo||'';
    o.restSec=Math.round((ex.rest||60)*restMult);
    o.doseText=`${sets} série${sets>1?'s':''} de ${reps} répétitions`+sideSuffix+(st.tempo?` · ${st.tempo}`:'');
    const bv=(ex.sets||2)*(ex.reps||10), tv=sets*reps;
    o.prog=flagged?'down':(tv>bv?'up':tv<bv?'down':'=');
    o.levelNote=level>0?('Niveau '+level+(st.note?' · '+st.note:'')):'';
  } else if(ex.unit==='time'){
    const st=__stepTime(level, ex.sets||2, ex.sec||30);
    const sets=Math.max(1,Math.min(5, st.sets-dropSets));
    const sec=Math.max(20,Math.min(120, Math.round(st.sec*vol/5)*5));
    o.sets=sets; o.sec=sec; o.workSec=sec; o.duration=`${sec} s`; o.mod=st.mod||'';
    o.restSec=Math.round((ex.rest||0)*restMult);
    o.doseText=`${sets} × ${sec} secondes`+sideSuffix+(st.mod?` · ${st.mod}`:'');
    const bv=(ex.sets||2)*(ex.sec||30), tv=sets*sec;
    o.prog=flagged?'down':(tv>bv?'up':tv<bv?'down':'=');
    o.levelNote=level>0?('Niveau '+level+(st.note?' · '+st.note:'')):'';
  } else {
    const st=__stepAero(level, ex.min||10);
    const min=Math.max(5,Math.min(35, Math.round(st.min*vol)));
    o.min=min; o.sets=1; o.workSec=min*60; o.duration=`${min} min`; o.mod=st.mod||'';
    o.doseText=`${min} min`+(st.mod?` · ${st.mod}`:'');
    o.prog=flagged?'down':(min>(ex.min||10)?'up':min<(ex.min||10)?'down':'=');
    o.levelNote=level>0?('Niveau '+level+(st.note?' · '+st.note:'')):'';
  }
  o.regressed=!!flagged||tier==='low'||dropSets>0;
  if(window.__exReentry && window.__exReentry(ex.id)){ o.regressed=true; o.levelNote=(o.levelNote?o.levelNote+' · ':'')+'reprise en douceur'; }
  o.nextCue=level<window.__exMax?__nextNote(ex,level):'';
  return o;
};
function __estSec(ex){ if(ex.unit==='reps') return (ex.sets||1)*((ex.reps||10)*3 + (ex.rest||0)); if(ex.unit==='time') return (ex.sets||1)*((ex.sec||0)+(ex.rest||0)); return (ex.workSec||0)+(ex.rest||0); }
function __sessionDuration(exs){ return Math.max(5, Math.round(exs.reduce((s,e)=>s+__estSec(e),0)/60)); }
/* trie échauffement → travail → retour au calme tout en gardant l'ordre du kiné à l'intérieur */
const __PHASE={warmup:0,main:1,cooldown:2};
function __ordered(exs){ return exs.map((e,i)=>[e,i]).sort((a,b)=>(__PHASE[a[0].phase]-__PHASE[b[0].phase])||(a[1]-b[1])).map(x=>x[0]); }

/* ═══ SÉANCE DU JOUR — l'IA raisonne comme un kiné spécialiste SEP ═══
   Priorité aux membres inférieurs (zone la plus touchée par la SEP). Séances cohérentes par
   "archétype" (force bas + proprio en ALTERNANCE pour reposer le muscle, équilibre, contrôle /
   double-tâche, excentrique, récup / mobilité, haut + gainage pour reposer les jambes), choisies
   selon la forme du jour, la récence et l'alternance effort/repos. Composition exercice par
   exercice, progression conservée (__mapExercise / __exLevel). */
const __ZONE_LABEL={lower:'Bas du corps',upper:'Haut du corps',core:'Gainage & tronc',balance:'Équilibre',proprioception:'Proprioception',cardio:'Cardio',stretching:'Mobilité'};
const __ZONE_INTENT={lower:'force',upper:'force',core:'controle',balance:'equilibre',proprioception:'controle',cardio:'cardio',stretching:'mobilite'};
/* Archétypes : zones=[dominante, secondaire]. order:'alt' = alterne effort/repos (le muscle
   récupère pendant la proprio/équilibre). leg=true → membres inférieurs (prioritaires en SEP). */
const __ARCHES=[
  {id:'force_bas_proprio',label:'Bas du corps & proprioception',zones:['lower','proprioception'],order:'alt',intent:'force',leg:true,
   why:'force des jambes en alternance avec de la proprioception — pendant que tu travailles la stabilité, tes muscles récupèrent entre les séries.'},
  {id:'renfo_bas',label:'Renforcement bas du corps',zones:['lower','balance'],order:'alt',intent:'force',leg:true,
   why:'renforcement des jambes, entrecoupé d’équilibre pour laisser les muscles souffler entre les efforts.'},
  {id:'excentrique',label:'Force excentrique — contrôle du freinage',zones:['lower','core'],order:'block',intent:'force',leg:true,hard:true,
   why:'travail du freinage (excentrique), très efficace en SEP pour la force utile à la marche — réservé aux jours où l’énergie suit.'},
  {id:'equilibre',label:'Équilibre & stabilité',zones:['balance','proprioception'],order:'block',intent:'equilibre',leg:true,
   why:'équilibre et stabilité de cheville — central quand la SEP touche les jambes.'},
  {id:'controle',label:'Contrôle moteur & coordination',zones:['proprioception','balance'],order:'block',intent:'controle',leg:true,
   why:'contrôle moteur et coordination (double-tâche) — pour une marche plus sûre au quotidien.'},
  {id:'haut_core',label:'Haut du corps & gainage',zones:['upper','core'],order:'block',intent:'force',leg:false,
   why:'haut du corps et gainage — on laisse les jambes récupérer tout en gardant le tronc solide.'},
  {id:'recup',label:'Récupération & mobilité',zones:['lower','stretching'],order:'block',intent:'mobilite',leg:true,gentle:true,
   why:'journée plus fatiguée : on entretient en douceur (mobilité des jambes, étirements) sans puiser dans tes réserves.'},
];
window.generateProgram = function(metrics, context){
  const { energy=5, fatigue=4, heat=4, sleep=6 } = metrics || {};
  const { readiness, tier } = window.__readiness(metrics);
  const avail = __avail(context);
  const seed = window.__elanDaySeed();
  const diff = window.__readDiff();
  const prog = window.__readProg();
  const dnum = s => { if(!s) return 999; const a=new Date(s); if(isNaN(a)) return 999; const n=new Date();
    return Math.round((Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate())-Date.UTC(a.getUTCFullYear(),a.getUTCMonth(),a.getUTCDate()))/86400000); };
  const exAge = id => { const p=prog[id]; return p&&p.lastDate?dnum(p.lastDate):999; };

  /* POOL disponible (selon matériel), exercices de travail dédupliqués par nom */
  const usable = (window.ED_SESSIONS||[]).filter(s=>s.equip.every(e=>avail.includes(e)));
  const seen=new Set(); const mainsAll=[]; const warmups=[]; const cooldowns=[];
  usable.forEach(s=>s.exercises.forEach(ex=>{
    if(ex.phase==='warmup'){ warmups.push(ex); return; }
    if(ex.phase==='cooldown'){ cooldowns.push(ex); return; }
    if(seen.has(ex.name)) return; seen.add(ex.name); mainsAll.push(ex);
  }));
  (window.ED_STRETCH||[]).forEach(e=>cooldowns.push(e));
  const byZone = z => mainsAll.filter(e=>e.region===z);
  const zoneHas = z => byZone(z).length>0;

  /* historique : récence par zone + dernier archétype + jambes sollicitées récemment */
  const hist = window.__sessHistory();
  const regionAge={}; const archeAge={};
  hist.forEach(h=>{ const a=dnum(h.date);
    if(h.region && (regionAge[h.region]==null||a<regionAge[h.region])) regionAge[h.region]=a;
    if(h.id && /^ia-/.test(h.id) && (archeAge[h.id]==null||a<archeAge[h.id])) archeAge[h.id]=a; });
  const ageOf = z => (regionAge[z]==null?999:regionAge[z]);
  const legHardRecent = hist.some(h=>dnum(h.date)<=1 && h.intent==='force' && h.region==='lower');
  const upperStale = ageOf('upper')>=6;

  /* ── SCORE des archétypes (raisonnement kiné, biais membres inférieurs) ── */
  function scoreArche(a){
    if(!zoneHas(a.zones[0])) return -1e9;
    let sc=0;
    if(a.leg) sc+=16;                                   // SEP → priorité aux jambes
    if(a.gentle){ sc += (tier==='low'?40 : fatigue>=7?34 : heat>=7?22 : -22); }
    else if(a.hard){ sc += (tier==='high'?24 : tier==='moderate'?-8 : -50) + (energy>=8?8:0); } // excentrique = avancé, plus rare
    else if(a.intent==='force'){ sc += (tier==='high'?24 : tier==='moderate'?15 : -28); }       // force bas + proprio : pilier
    else { sc += (tier==='low'?4 : 12); }               // équilibre / contrôle : ok à toute forme
    if(a.id==='force_bas_proprio') sc+=4;               // séance phare (force + proprio en alternance)
    if(legHardRecent){ if(a.intent==='force'&&a.leg) sc-=22; if(!a.leg) sc+=20; if(a.intent==='equilibre'||a.intent==='controle') sc+=10; if(a.gentle) sc+=8; }
    if(!a.leg && upperStale) sc+=18;                    // haut du corps ~1×/semaine malgré le biais jambes
    const aa=archeAge['ia-'+a.id];                      // variété : éviter de répéter un archétype récent
    if(aa!=null) sc-= (aa<=0?44 : aa===1?26 : aa===2?12 : aa<=4?5:0);
    sc += Math.min(12, ageOf(a.zones[0]));              // favorise les zones peu vues
    return sc;
  }
  const ranked = __ARCHES.map(a=>({a,sc:scoreArche(a)})).filter(r=>r.sc>-1e8).sort((x,y)=>y.sc-x.sc);
  const bestSc = ranked.length?ranked[0].sc:0;
  const topTies = ranked.filter(r=>r.sc>=bestSc-5).map(r=>r.a);
  const arche = __rotate(topTies, seed)[0] || (ranked[0]&&ranked[0].a) || __ARCHES[3];

  /* ── COMPOSITION selon l'archétype ── */
  let N = tier==='low'?3 : tier==='high'?5 : 4;
  if(fatigue>=8) N=Math.max(3,N-1);
  if(energy>=9 && fatigue<=3 && !arche.gentle) N=Math.min(6,N+1);
  if(arche.gentle) N=Math.min(N,3);

  const used=new Set();
  const pick = (zone, count) => { const list=__rotate(byZone(zone).filter(e=>!used.has(e.name)), seed).sort((p,q)=>exAge(q.id)-exAge(p.id));
    const out=[]; for(const ex of list){ if(out.length>=count) break; out.push(ex); used.add(ex.name); } return out; };

  const zoneA=arche.zones[0]; const zoneB=(arche.zones[1] && zoneHas(arche.zones[1])) ? arche.zones[1] : null;
  let blocks=[];
  if(zoneB){
    const nA = arche.order==='alt' ? Math.ceil(N/2) : Math.ceil(N*0.6);   // alt = split équilibré → vraie alternance
    const nB = N - nA;
    const A=pick(zoneA,nA), B=pick(zoneB,nB);
    if(arche.order==='alt'){ const out=[]; const m=Math.max(A.length,B.length); for(let i=0;i<m;i++){ if(A[i])out.push(A[i]); if(B[i])out.push(B[i]); } blocks=out; }
    else blocks=A.concat(B);
  } else { blocks=pick(zoneA,N); }
  if(blocks.length<N){ for(const ex of pick('lower', N-blocks.length)) blocks.push(ex); }      // biais jambes
  if(blocks.length<N){ for(const ex of __rotate(mainsAll,seed).sort((p,q)=>exAge(q.id)-exAge(p.id))){ if(blocks.length>=N) break; if(!used.has(ex.name)){ blocks.push(ex); used.add(ex.name); } } }

  /* Releveur du pied (réparti 2×/semaine) */
  if(window.ED_DORSI && window.ED_DORSI.length && window.__dorsiDueToday && window.__dorsiDueToday()){
    const dx=__rotate(window.ED_DORSI, seed).sort((p,q)=>exAge(q.id)-exAge(p.id))[0]; if(dx) blocks.push(dx);
  }
  const hasDorsi = blocks.some(e=>/^dorsi/.test(e.id||''));

  /* Échauffement (zone dominante) + retour au calme (1, ou 2 si récup/mobilité) */
  const warm = __rotate(warmups.filter(w=>w.region===zoneA), seed)[0] || __rotate(warmups, seed)[0];
  const cools = __rotate(cooldowns, seed+3);
  const seq=[]; if(warm) seq.push(warm); seq.push(...blocks); if(cools[0]) seq.push(cools[0]); if(arche.gentle && cools[1]) seq.push(cools[1]);

  const exercises = __ordered(seq).map(ex=>window.__mapExercise(ex, diff, {tier, metrics}));
  const duration = __sessionDuration(seq);
  const intensity = (arche.gentle||tier==='low'||fatigue>=7) ? 'Douce' : ((arche.hard||tier==='high') ? 'Soutenue' : 'Modérée');

  /* Explications "Pourquoi cette séance" */
  const reasons=[];
  reasons.push({t:'Séance pensée comme un kiné', d:arche.why});
  reasons.push({t:'Priorité aux jambes', d:'ta SEP touche surtout les membres inférieurs — je leur donne plus de place dans la semaine qu’au haut du corps.'});
  if(arche.order==='alt') reasons.push({t:'Alternance effort / repos', d:'j’alterne renforcement et stabilité : tes muscles récupèrent pendant les exercices de proprioception.'});
  if(legHardRecent && !arche.leg) reasons.push({t:'Repos des jambes', d:'tu as sollicité tes jambes récemment — aujourd’hui on les laisse récupérer.'});
  if(arche.hard) reasons.push({t:`Bonne énergie (${energy}/10)`, d:'ta forme le permet : on passe sur de la vraie force.'});
  if(fatigue>=7) reasons.push({t:`Fatigue élevée (${fatigue}/10)`, d:'volume réduit, on entretient sans puiser dans tes réserves.'});
  else if(fatigue<=3) reasons.push({t:`Peu de fatigue (${fatigue}/10)`, d:'tu peux travailler un peu plus franchement aujourd’hui.'});
  if(heat>=7) reasons.push({t:`Chaleur forte (${heat}/10)`, d:'on reste prudent — la chaleur majore les symptômes SEP.'});
  if(sleep<=4) reasons.push({t:`Nuit courte (${sleep}/10)`, d:'je garde une marge de sécurité.'});
  reasons.push({t:'Structure respectée', d:arche.order==='alt'?'échauffement, travail en alternance, puis retour au calme.':'échauffement, travail ciblé, puis retour au calme.'});
  if(hasDorsi) reasons.push({t:'Releveur du pied', d:'tibial antérieur — le muscle qui relève le pied, clé contre le pied tombant en SEP. Programmé 2× par semaine, espacé.'});
  const fl=exercises.filter(e=>e.flagged);
  if(fl.length) reasons.unshift({t:'Difficulté prise en compte', d:`j'allège ${fl.map(e=>e.name.toLowerCase()).join(', ')} suite à ton retour.`});

  return { title:arche.label, intensity, duration, readiness, tier, exercises, reasons, sessionId:'ia-'+arche.id, region:zoneA, intent:arche.intent, hasDorsi, modules:null, moduleEndIdx:null };
};

/* ═══ SÉANCE SUR MESURE (par objectifs) — échauffement + travail ciblé + retour au calme ═══ */
window.GOAL_OPTIONS = [
  {key:'lower', label:'Force bas du corps'},
  {key:'upper', label:'Force haut du corps'},
  {key:'proprioception', label:'Proprioception'},
  {key:'balance', label:'Équilibre'},
  {key:'core', label:'Gainage / tronc'},
  {key:'cardio', label:'Cardio / endurance'},
  {key:'stretching', label:'Mobilité / étirements'},
];
window.generateCustomProgram = function(goals, intensity, metrics, context){
  goals = goals && goals.length ? goals : ['lower','balance'];
  const meta = { legere:{n:4,label:'Légère',rank:1}, moderee:{n:5,label:'Modérée',rank:2}, soutenue:{n:6,label:'Soutenue',rank:3} }[intensity||'moderee'];
  const { readiness, tier } = window.__readiness(metrics);
  const avail = __avail(context);
  const seed = window.__elanDaySeed();
  const diff = window.__readDiff();
  const usable = (window.ED_SESSIONS||[]).filter(s=>s.equip.every(e=>avail.includes(e)));
  const allEx = usable.flatMap(s=>s.exercises);
  const warmups = allEx.filter(e=>e.phase==='warmup');
  const mains = allEx.filter(e=>e.phase==='main');
  const cooldowns = (window.ED_STRETCH||[]).concat(allEx.filter(e=>e.phase==='cooldown'));
  const usedNames=new Set();
  const lists = goals.map((g,gi)=>__rotate(mains.filter(e=>e.region===g), seed+gi));
  const chosen=[]; let added=true;
  while(chosen.length<meta.n && added){ added=false; for(const lst of lists){ if(chosen.length>=meta.n) break; const ex=lst.find(e=>!usedNames.has(e.name)); if(ex){ chosen.push(ex); usedNames.add(ex.name); added=true; } } }
  for(const ex of __rotate(mains,seed)){ if(chosen.length>=meta.n) break; if(!usedNames.has(ex.name)){ chosen.push(ex); usedNames.add(ex.name); } }
  const warm = __rotate(warmups,seed)[0];
  const cool = __rotate(cooldowns,seed+3)[0];
  const seq=[]; if(warm) seq.push(warm); seq.push(...chosen); if(cool) seq.push(cool);
  const exercises = seq.map(ex=>window.__mapExercise(ex, diff, {tier, metrics}));
  const labels = Object.fromEntries(window.GOAL_OPTIONS.map(o=>[o.key,o.label.toLowerCase()]));
  const goalTxt = goals.map(g=>labels[g]||g).join(', ');
  const reasons = [{t:'Séance sur mesure', d:`tu as choisi de travailler : ${goalTxt}.`}, {t:'Structure respectée', d:'échauffement, travail ciblé, puis retour au calme.'}];
  /* cohérence forme ↔ difficulté : alerte si l'intensité choisie dépasse la forme du jour */
  const formeRank = {low:1,moderate:2,high:3}[tier];
  if(meta.rank > formeRank+0) reasons.push({t:'Intensité au-dessus de ta forme', d:`ta forme du jour est ${tier==='low'?'basse':'moyenne'} (${readiness}/100) — j'ai gardé ton choix « ${meta.label.toLowerCase()} », mais reste à l'écoute de tes sensations.`});
  else if(meta.rank < formeRank) reasons.push({t:'Marge sous ta forme', d:`tu es en forme aujourd'hui (${readiness}/100) ; tu peux pousser un peu plus si tu le sens.`});
  const fl=exercises.filter(e=>e.flagged);
  if(fl.length) reasons.push({t:'Difficulté conservée', d:`j'allège ${fl.map(e=>e.name.toLowerCase()).join(', ')} comme sur ta séance Élan.`});
  reasons.push({t:'Réglages repris', d:'matériel et adaptations de difficulté de ton profil sont conservés.'});
  return { title:'Séance sur mesure', intensity:meta.label, duration:__sessionDuration(seq), readiness, tier, exercises, reasons, modules:null, moduleEndIdx:null, custom:true, goals };
};

/* ═══ SÉANCES SALLE (depuis exercices_salle — ordre du kiné conservé) ═══ */
window.buildGymProgram = function(id, context, metrics){
  const s = window.ED.gymSessions.find(x=>x.id===id); if(!s) return null;
  const diff = window.__readDiff();
  const { readiness, tier } = window.__readiness(metrics);
  const exercises = s.exercises.map(ex=>window.__mapExercise(ex, diff, {tier, metrics}));
  const reasons=[{t:s.title, d:s.subtitle}];
  const fl=exercises.filter(e=>e.flagged);
  if(fl.length) reasons.push({t:'Difficulté conservée', d:`j'allège ${fl.map(e=>e.name.toLowerCase()).join(', ')}.`});
  reasons.push({t:'Séance salle dédiée', d:'enchaînement et doses conçus pour la salle.'});
  return { title:s.title, intensity:'Salle', duration:__sessionDuration(s.exercises), readiness, tier, exercises, reasons, modules:null, moduleEndIdx:null, gym:true, gymId:id };
};

/* components block 1 */
(function(){
const C = {
  bg:'#F4F8F7', card:'#FFFFFF', tint:'#E8F7F4',
  ink:'#0E514A', body:'#3A5953', muted:'#7F9A94', faint:'#AEC2BD',
  teal:'#2FBFA1', tealDk:'#0B8071', orange:'#F2602E', amber:'#E08A0B',
  line:'rgba(14,81,74,0.09)', line2:'rgba(14,81,74,0.16)',
  sh:'0 4px 16px rgba(14,81,74,0.07)', shLg:'0 12px 34px rgba(14,81,74,0.13)',
};
window.EC.C = C;
const AREA_LABELS = {upper:'Haut du corps',lower:'Bas du corps',balance:'Équilibre',proprioception:'Proprioception',core:'Gainage',stretching:'Étirements',cardio:'Cardio'};
/* Couleurs par ZONE du corps — palette froide, stable, distincte, et SURTOUT
   sans orange/ambre (réservés aux statuts : intensité, fatigue, chaleur, vigilance). */
const AREA_COLORS = {upper:'#2FA56B',lower:'#12A38C',balance:'#3A7FCC',proprioception:'#6E73CE',core:'#0E8FB0',stretching:'#7BA83E',cardio:'#9E6BC6'};

/* ── Audio (bips des 3 dernières s + ding) ── */
let _ac=null;
function beep(freq=880,dur=0.12,gain=0.16){
  try{
    _ac = _ac || new (window.AudioContext||window.webkitAudioContext)();
    if(_ac.state==='suspended') _ac.resume();
    const o=_ac.createOscillator(), g=_ac.createGain();
    o.type='sine'; o.frequency.value=freq; o.connect(g); g.connect(_ac.destination);
    const t=_ac.currentTime; g.gain.setValueAtTime(gain,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.start(t); o.stop(t+dur);
  }catch(e){}
}
function unlockAudio(){ try{ _ac=_ac||new (window.AudioContext||window.webkitAudioContext)(); if(_ac.state==='suspended')_ac.resume(); }catch(e){} }

/* ── Button ── */
function Btn({ variant='primary', size='md', fullWidth, disabled, onClick, children }) {
  const [p,setP]=React.useState(false);
  const V={
    primary:{background:`linear-gradient(135deg,${C.teal},${C.tealDk})`,color:'#fff',boxShadow:'0 6px 18px rgba(47,191,161,0.32)'},
    energy:{background:'linear-gradient(135deg,#F97848,#F2602E)',color:'#fff',boxShadow:'0 6px 18px rgba(242,96,46,0.32)'},
    ghost:{background:'rgba(47,191,161,0.10)',color:C.tealDk,border:'1px solid rgba(47,191,161,0.28)'},
    soft:{background:C.tint,color:C.tealDk,border:`1px solid ${C.line}`},
  };
  const S={sm:{fontSize:13,padding:'8px 18px',minHeight:38,borderRadius:12},md:{fontSize:15,padding:'13px 28px',minHeight:50,borderRadius:16},lg:{fontSize:17,padding:'16px 36px',minHeight:56,borderRadius:9999}};
  const v=V[variant]||V.primary, s=S[size]||S.md;
  return (
    <button disabled={disabled} onClick={onClick}
      onMouseDown={()=>!disabled&&setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)} onTouchStart={()=>!disabled&&setP(true)} onTouchEnd={()=>setP(false)}
      style={{display:'inline-flex',alignItems:'center',justifyContent:'center',border:'none',fontFamily:"'DM Sans',sans-serif",fontWeight:600,letterSpacing:'0.01em',cursor:disabled?'not-allowed':'pointer',width:fullWidth?'100%':undefined,opacity:disabled?0.4:1,transform:p&&!disabled?'scale(0.97)':'scale(1)',transition:'all 150ms cubic-bezier(.22,1,.36,1)',...v,...s}}>
      {children}
    </button>
  );
}

/* ── EnergyGauge ── */
function EnergyGauge({ value, onChange }) {
  const [hov,setHov]=React.useState(null);
  const d=hov??value;
  const zone=d?(d<=3?'low':d<=7?'moderate':'high'):null;
  const zc=zone==='high'?C.orange:zone==='moderate'?C.tealDk:'#9DB0AB';
  const zt=zone==='high'?'En pleine forme !':zone==='moderate'?'Bonne énergie':'En douceur';
  const dc=n=>n<=3?'#9DB0AB':n<=7?C.teal:C.orange;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:18,userSelect:'none'}}>
      <div style={{display:'flex',gap:6,alignItems:'flex-end',justifyContent:'center'}}>
        {[1,2,3,4,5,6,7,8,9,10].map(n=>{
          const a=d>=n,cur=d===n,size=cur?44:a?28:22;
          return (<div key={n} onClick={()=>onChange&&onChange(n)} onMouseEnter={()=>setHov(n)} onMouseLeave={()=>setHov(null)}
            style={{width:size,height:size,borderRadius:'50%',flexShrink:0,background:a?dc(n):'rgba(14,81,74,0.06)',border:a?'none':`1px solid ${C.line2}`,boxShadow:a&&n>3?`0 2px 10px ${dc(n)}66`:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 220ms cubic-bezier(.34,1.56,.64,1)'}}>
            {cur&&<span style={{color:'#fff',fontSize:14,fontFamily:"'DM Mono',monospace",fontWeight:500,lineHeight:1}}>{n===10?'✦':n}</span>}
          </div>);
        })}
      </div>
      <div style={{textAlign:'center'}}><span style={{fontSize:14,fontWeight:500,color:zone?zc:C.faint,transition:'color 250ms ease'}}>{zone?zt:'Comment est ton énergie ?'}</span></div>
    </div>
  );
}

/* ── MetricSlider ── */
function MetricSlider({ label, value, min=1, max=10, onChange, color, words }) {
  const ref=React.useRef(null);
  color=color||C.teal;
  const pct=((value-min)/(max-min))*100;
  const fromX=cx=>{const r=ref.current.getBoundingClientRect();let p=(cx-r.left)/r.width;p=Math.max(0,Math.min(1,p));onChange(Math.round(min+p*(max-min)));};
  const down=e=>{const move=ev=>fromX(ev.touches?ev.touches[0].clientX:ev.clientX);move(e);const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);document.removeEventListener('touchmove',move);document.removeEventListener('touchend',up);};document.addEventListener('mousemove',move);document.addEventListener('mouseup',up);document.addEventListener('touchmove',move,{passive:false});document.addEventListener('touchend',up);};
  const word=words?words(value):null;
  return (
    <div style={{userSelect:'none'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
        <span style={{fontSize:14,fontWeight:500,color:C.ink}}>{label}</span>
        <span style={{display:'flex',alignItems:'baseline',gap:8}}>{word&&<span style={{fontSize:12,color,fontWeight:600}}>{word}</span>}<span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:C.muted}}>{value}/{max}</span></span>
      </div>
      <div ref={ref} onMouseDown={down} onTouchStart={down} style={{position:'relative',height:30,display:'flex',alignItems:'center',cursor:'pointer'}}>
        <div style={{position:'absolute',left:0,right:0,height:6,borderRadius:99,background:'rgba(14,81,74,0.10)'}}/>
        <div style={{position:'absolute',left:0,width:`${pct}%`,height:6,borderRadius:99,background:color,transition:'width 80ms linear'}}/>
        <div style={{position:'absolute',left:`calc(${pct}% - 11px)`,width:22,height:22,borderRadius:'50%',background:'#fff',boxShadow:`0 2px 7px rgba(14,81,74,0.28),0 0 0 4px ${color}26`,transition:'left 80ms linear'}}/>
      </div>
    </div>
  );
}

/* ── LineChart ── */
function LineChart({ data, color, height=92, fill=true, dotsEvery=1 }) {
  color=color||C.teal;
  const W=300,H=height,pad=10,min=Math.min(...data),max=Math.max(...data),rng=(max-min)||1;
  const pts=data.map((v,i)=>[pad+(i/(data.length-1))*(W-2*pad), pad+(1-(v-min)/rng)*(H-2*pad)]);
  const line=pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area=`${line} L${pts[pts.length-1][0].toFixed(1)} ${H-pad} L${pts[0][0].toFixed(1)} ${H-pad} Z`;
  const gid='lg'+color.replace(/[^a-z0-9]/gi,'');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{display:'block'}}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} stopOpacity="0.22"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      {fill&&<path d={area} fill={`url(#${gid})`}/>}
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=>(i===pts.length-1)?<circle key={i} cx={p[0]} cy={p[1]} r="5" fill={color} stroke="#fff" strokeWidth="2.5"/>:(i%dotsEvery===0)?<circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={color} opacity="0.55"/>:null)}
    </svg>
  );
}

/* ── RingChart ── */
function RingChart({ value=4, max=7, size=124 }) {
  const r=48,cx=size/2,cy=size/2,circ=2*Math.PI*r,dash=(value/max)*circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(14,81,74,0.08)" strokeWidth="10"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#rg)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={circ*0.25} style={{transition:'stroke-dasharray 800ms cubic-bezier(.22,1,.36,1)'}}/>
      <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%"><stop stopColor={C.teal}/><stop offset="1" stopColor="#63D8BC"/></linearGradient></defs>
      <text x={cx} y={cy-6} textAnchor="middle" fontSize="26" fontWeight="500" fill={C.ink} fontFamily="DM Mono,monospace">{value}/{max}</text>
      <text x={cx} y={cy+14} textAnchor="middle" fontSize="11" fill={C.muted} fontFamily="DM Sans,sans-serif">jours</text>
    </svg>
  );
}

/* ── CircleTimer — « Marée » (remplissage liquide, fluide) ──
   fill=false : le disque se vide (travail / compte à rebours)
   fill=true  : le disque se remplit comme une jauge d'énergie (repos) */
function CircleTimer({ total, remaining, color, size=192, running, label, fill }) {
  color=color||C.teal;
  const r=82,cx=size/2,cy=size/2;
  const remFrac = total>0 ? Math.max(0,Math.min(1,remaining/total)) : 0;
  const waterFrac = fill ? (1-remFrac) : remFrac;     // part remplie de liquide
  const m=Math.floor(remaining/60), s=remaining%60;
  const txt= total>=60 ? `${m}:${String(s).padStart(2,'0')}` : `${remaining}`;

  const [uid]=React.useState(()=>'tm'+Math.random().toString(36).slice(2,8));
  const [,tick]=React.useState(0);
  const phaseRef=React.useRef(0);
  const dispRef=React.useRef(waterFrac);              // niveau affiché
  const targetRef=React.useRef(waterFrac);
  const segFromRef=React.useRef(waterFrac);           // niveau au début du segment
  const segStartRef=React.useRef(0);
  const seenRef=React.useRef(waterFrac);
  targetRef.current=waterFrac;
  React.useEffect(()=>{
    let t0,raf;
    const loop=(t)=>{
      if(t0==null)t0=t;
      phaseRef.current=(t-t0)/1000;
      // À chaque changement de seconde, on glisse linéairement vers la nouvelle
      // cible sur exactement 1 s → vitesse constante, aucun à-coup.
      if(targetRef.current!==seenRef.current){
        segFromRef.current=dispRef.current;
        segStartRef.current=t;
        seenRef.current=targetRef.current;
      }
      const p=Math.min(1,(t-segStartRef.current)/1000);
      dispRef.current = segFromRef.current + (targetRef.current - segFromRef.current)*p;
      tick(n=>(n+1)%1000000);
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(raf);
  },[]);

  const lvlFrac=dispRef.current, ph=phaseRef.current;
  const top=cy-r, h=2*r, level=top + h*(1-lvlFrac);
  const amp = running ? 4.5 : 1.5;
  const wave=(p,a,k)=>{
    let d=`M ${cx-r-6} ${level} `;
    const steps=48;
    for(let i=0;i<=steps;i++){
      const x=cx-r-6 + (2*r+12)*(i/steps);
      const y=level + Math.sin((i/steps)*Math.PI*k + p)*a;
      d+=`L ${x.toFixed(2)} ${y.toFixed(2)} `;
    }
    d+=`L ${cx+r+6} ${cy+r+8} L ${cx-r-6} ${cy+r+8} Z`;
    return d;
  };
  const flash = remaining<=3 && running;
  return (
    <div style={{position:'relative',width:size,height:size,margin:'0 auto'}}>
      {running&&<div style={{position:'absolute',inset:6,borderRadius:'50%',background:`radial-gradient(circle,${color}22,transparent 70%)`,animation:'ringPulse 1.8s ease-in-out infinite'}}/>}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{position:'relative',zIndex:1}}>
        <defs>
          <clipPath id={`clip-${uid}`}><circle cx={cx} cy={cy} r={r}/></clipPath>
          <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.32)"/><stop offset="0.5" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill={C.tint}/>
        <g clipPath={`url(#clip-${uid})`}>
          <path d={wave(ph*0.9, amp, 2)} fill={color} opacity="0.26"/>
          <path d={wave(ph*1.25+1.6, amp*0.85, 2.4)} fill={color} opacity="0.95"/>
          <rect x={cx-r} y={level} width={2*r} height={2*r} fill={`url(#sheen-${uid})`}/>
        </g>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={flash?color:'rgba(14,81,74,0.12)'} strokeWidth={flash?4:3} style={{transition:'stroke 200ms'}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:2,pointerEvents:'none'}}>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:total>=60?44:54,fontWeight:500,color:C.ink,lineHeight:1}}>{txt}</span>
        {label&&<span style={{fontSize:12,fontWeight:500,color:C.ink,opacity:0.62,marginTop:6,letterSpacing:'0.04em'}}>{label}</span>}
      </div>
    </div>
  );
}

/* ── Bottom nav ── */
const TABS=[
  {id:'today',label:"Auj.",icon:(a,s)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={a?C.teal:C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>},
  {id:'progress',label:"Progrès",icon:(a,s)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={a?C.teal:C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>},
  {id:'calendar',label:"Agenda",icon:(a,s)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={a?C.teal:C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>},
  {id:'stretching',label:"Étire.",icon:(a,s)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={a?C.teal:C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>},
];
function BottomNav({ activeTab, onTabChange }) {
  const ai=TABS.findIndex(t=>t.id===activeTab);
  return (
    <div style={{position:'absolute',bottom:'calc(14px + max(env(safe-area-inset-bottom, 0px), 22px))',left:'50%',transform:'translateX(-50%)',zIndex:100,width:318}}>
      <nav style={{display:'flex',alignItems:'center',background:'rgba(255,255,255,0.92)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderRadius:9999,border:`1px solid ${C.line}`,boxShadow:'0 10px 34px rgba(14,81,74,0.16)',height:58,padding:'0 6px',position:'relative'}}>
        <div style={{position:'absolute',top:6,left:`calc(${ai} * (100% - 12px) / 4 + 10px)`,width:'calc((100% - 12px) / 4 - 8px)',height:'calc(100% - 12px)',background:'rgba(47,191,161,0.13)',borderRadius:9999,border:'1px solid rgba(47,191,161,0.30)',transition:'left 360ms cubic-bezier(0.34,1.56,0.64,1)',pointerEvents:'none'}}/>
        {TABS.map(t=>{const a=activeTab===t.id;return(
          <button key={t.id} onClick={()=>onTabChange&&onTabChange(t.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:a?3:0,background:'transparent',border:'none',cursor:'pointer',height:'100%',position:'relative',zIndex:1,padding:'4px 2px'}}>
            <div style={{transform:a?'scale(1.12)':'scale(1)',transition:'all 280ms cubic-bezier(0.34,1.56,0.64,1)'}}>{t.icon(a,20)}</div>
            <div style={{overflow:'hidden',maxHeight:a?14:0,opacity:a?1:0,transition:'max-height 300ms ease,opacity 220ms ease'}}><span style={{display:'block',fontFamily:"'DM Sans',sans-serif",fontSize:9,fontWeight:700,color:C.teal,letterSpacing:'0.07em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{t.label}</span></div>
          </button>);})}
      </nav>
    </div>
  );
}

/* ── LogoMark (tuile logo Élan réutilisable) ── */
function LogoMark({size=44}){
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{display:'block',flexShrink:0}}>
      <defs>
        <linearGradient id="lmBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2FBFA1"/><stop offset="1" stopColor="#0B8071"/></linearGradient>
        <radialGradient id="lmSpark" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFD9C7"/><stop offset="1" stopColor="#F2602E"/></radialGradient>
      </defs>
      <rect x="0" y="0" width="120" height="120" rx="30" fill="url(#lmBg)"/>
      <path d="M30 86 L54 64 L78 44" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
      <circle cx="30" cy="86" r="7.5" fill="#fff" opacity="0.92"/>
      <circle cx="54" cy="64" r="8.5" fill="#fff"/>
      <circle cx="84" cy="38" r="13" fill="url(#lmSpark)"/>
      <circle cx="84" cy="38" r="13" fill="none" stroke="#fff" strokeWidth="3.5"/>
    </svg>
  );
}

/* ── BrandMark (logo + nom élan) ── */
function BrandMark(){
  const b=window.EC.brand||{show:true,mode:'Logo + nom'};
  if(!b.show) return null;
  const showMark=b.mode!=='Nom seul';
  const showWord=b.mode!=='Logo seul';
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
      {showMark&&(
        <svg width="28" height="28" viewBox="0 0 120 120" style={{display:'block',flexShrink:0}}>
          <defs>
            <linearGradient id="bmBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2FBFA1"/><stop offset="1" stopColor="#0B8071"/></linearGradient>
            <radialGradient id="bmSpark" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFD9C7"/><stop offset="1" stopColor="#F2602E"/></radialGradient>
          </defs>
          <rect x="0" y="0" width="120" height="120" rx="30" fill="url(#bmBg)"/>
          <path d="M30 86 L54 64 L78 44" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.95"/>
          <circle cx="30" cy="86" r="7.5" fill="#fff" opacity="0.92"/>
          <circle cx="54" cy="64" r="8.5" fill="#fff"/>
          <circle cx="84" cy="38" r="13" fill="url(#bmSpark)"/>
          <circle cx="84" cy="38" r="13" fill="none" stroke="#fff" strokeWidth="3.5"/>
        </svg>
      )}
      {showWord&&<span style={{fontFamily:'Georgia,serif',fontSize:19,fontWeight:600,letterSpacing:'-0.02em',color:C.ink,lineHeight:1}}>él<span style={{color:'#12A189'}}>a</span>n</span>}
    </div>
  );
}

Object.assign(window.EC,{ Btn, EnergyGauge, MetricSlider, LineChart, RingChart, CircleTimer, BottomNav, BrandMark, LogoMark, AREA_LABELS, AREA_COLORS, beep, unlockAudio });
})();
/* components block 2 */
(function(){
  const { EnergyGauge, MetricSlider, Btn, BrandMark, C } = window.EC;
  const EQUIP=window.EQUIP;
  function StreakBanner(){
    const streak=window.__streak?window.__streak():0;
    const week=window.__weekDoneCount?window.__weekDoneCount():0;
    const goal=4;
    const did=window.__sessHistory?window.__sessHistory().some(e=>e.date===new Date().toISOString().slice(0,10)):false;
    const msg = streak>=2 ? `${streak} jours d’affilée — ne casse pas la chaîne !`
      : did ? 'Séance du jour faite — bravo !'
      : streak===1 ? 'Tu as commencé hier — encore une aujourd’hui ?'
      : 'Reprends en douceur aujourd’hui.';
    return (
      <div style={{display:'flex',alignItems:'center',gap:12,background:'linear-gradient(120deg, rgba(47,191,161,0.12), rgba(242,96,46,0.08))',border:`1px solid ${C.line}`,borderRadius:16,padding:'12px 14px',marginBottom:18}}>
        <div style={{position:'relative',width:46,height:46,flexShrink:0,borderRadius:'50%',background:'conic-gradient('+C.teal+' '+Math.min(100,streak/7*100)+'%, rgba(47,191,161,0.14) 0)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{width:37,height:37,borderRadius:'50%',background:C.card,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={streak>0?C.orange:C.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-3 .5 2 2 2 2 2 1-2-1-4 1-8z"/></svg>
          </div>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13.5,fontWeight:600,color:C.ink,lineHeight:1.2}}>{msg}</div>
          <div style={{display:'flex',alignItems:'center',gap:7,marginTop:6}}>
            <div style={{flex:1,height:6,borderRadius:99,background:'rgba(14,81,74,0.08)',overflow:'hidden'}}><div style={{width:`${Math.min(100,week/goal*100)}%`,height:'100%',borderRadius:99,background:week>=goal?C.teal:C.tealDk,transition:'width 500ms ease'}}/></div>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.muted,flexShrink:0}}>{week}/{goal} sem.</span>
          </div>
        </div>
      </div>
    );
  }
  function CheckIn({ metrics, setMetrics, context, setContext, onConfirm, onClose }) {
    const set=(k,v)=>setMetrics(m=>({...m,[k]:v}));
    const toggle=id=>setContext(c=>{let eq=c.equipment.includes(id)?c.equipment.filter(x=>x!==id):[...c.equipment,id];if(!eq.length)eq=['bodyweight'];return{...c,equipment:eq};});
    const ready=!!metrics.energy;
    const cardBase={background:C.card,border:`1px solid ${C.line}`,borderRadius:22,boxShadow:C.sh};
    return (
      <div style={{minHeight:'100%',padding:'0 24px 40px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 0 0',marginBottom:22}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.muted}}>{new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>
          {onClose?<button onClick={onClose} aria-label="Fermer" style={{background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,borderRadius:99,width:34,height:34,cursor:'pointer',color:C.body,fontSize:19,lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif"}}>×</button>:<BrandMark/>}
        </div>
        <div style={{marginBottom:24}}>
          <p style={{fontSize:11,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:6}}>Check-in du jour</p>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:30,fontWeight:600,color:C.ink,letterSpacing:'-0.025em',lineHeight:1.1,marginBottom:6}}>Bonjour, {window.ED.user}</h1>
          <p style={{fontSize:13,color:C.muted,textTransform:'capitalize'}}>{window.ED.today}</p>
        </div>
        <StreakBanner/>
        <div style={{...cardBase,padding:'22px 18px',marginBottom:14}}><EnergyGauge value={metrics.energy} onChange={n=>set('energy',n)}/></div>
        <div style={{...cardBase,padding:'22px 20px',display:'flex',flexDirection:'column',gap:22,marginBottom:14}}>
          <MetricSlider label="Fatigue" value={metrics.fatigue} color={C.orange} words={v=>v<=3?'Légère':v<=6?'Présente':'Forte'} onChange={v=>set('fatigue',v)}/>
          <MetricSlider label="Chaleur ressentie" value={metrics.heat} color={C.amber} words={v=>v<=3?'Fraîche':v<=6?'Tempérée':'Forte'} onChange={v=>set('heat',v)}/>
          <MetricSlider label="Qualité du sommeil" value={metrics.sleep} color={C.teal} words={v=>v<=3?'Difficile':v<=6?'Moyenne':v<=8?'Bonne':'Excellente'} onChange={v=>set('sleep',v)}/>
        </div>
        <div style={{...cardBase,padding:'20px',marginBottom:26}}>
          <p style={{fontSize:13,fontWeight:500,color:C.ink,marginBottom:12}}>Où t'entraînes-tu ?</p>
          <div style={{display:'flex',gap:8,marginBottom:20}}>
            {[{id:'maison',label:'À la maison'},{id:'salle',label:'À la salle'}].map(o=>{const a=context.location===o.id;return(
              <button key={o.id} onClick={()=>setContext(c=>({...c,location:o.id}))} style={{flex:1,padding:'11px',borderRadius:14,cursor:'pointer',fontSize:14,fontWeight:500,fontFamily:"'DM Sans',sans-serif",background:a?'rgba(47,191,161,0.12)':C.bg,border:`1px solid ${a?'rgba(47,191,161,0.45)':C.line}`,color:a?C.tealDk:C.muted,transition:'all 180ms ease'}}>{o.label}</button>);})}
          </div>
          <p style={{fontSize:13,fontWeight:500,color:C.ink,marginBottom:4}}>Matériel disponible</p>
          <p style={{fontSize:11,color:C.muted,marginBottom:12,fontStyle:'italic'}}>{context.location==='salle'?'En salle, tout est disponible — sélection optionnelle.':'Sélectionne ce que tu as sous la main.'}</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {EQUIP.map(e=>{const a=context.equipment.includes(e.id);return(
              <button key={e.id} onClick={()=>toggle(e.id)} style={{padding:'8px 14px',borderRadius:99,cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:"'DM Sans',sans-serif",background:a?'rgba(47,191,161,0.12)':C.bg,border:`1px solid ${a?'rgba(47,191,161,0.4)':C.line}`,color:a?C.tealDk:C.muted,transition:'all 160ms ease'}}>{a?'✓ ':''}{e.label}</button>);})}
          </div>
        </div>
        <Btn variant={metrics.energy>=8?'energy':'primary'} size="lg" fullWidth disabled={!ready} onClick={ready?onConfirm:undefined}>{ready?(onClose?'Mettre à jour ma forme →':'Générer mon programme →'):'Choisis ton énergie'}</Btn>
        <p style={{textAlign:'center',marginTop:14,fontSize:12,color:C.faint,lineHeight:1.5}}>{onClose?'Tu peux refaire ton check-in si ta forme a changé depuis ce matin.':'Élan adapte ta séance à ta forme et à ton matériel.'}</p>
      </div>
    );
  }
  window.ES.CheckIn=CheckIn;

  /* ═══ CHECK-IN HYBRIDE — objectif (wearable + météo + test fonctionnel) + ressenti ═══ */
  function Ring({v,size=60,sw=6,color}){const r=(size-sw)/2,c=2*Math.PI*r,o=c*(1-v/100);return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(14,81,74,0.08)" strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={o} style={{transition:'stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)'}}/>
    </svg>);}
  function Measured({children}){return(
    <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:600,color:C.tealDk,background:'rgba(47,191,161,0.12)',border:'1px solid rgba(47,191,161,0.28)',borderRadius:99,padding:'2px 7px'}}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{children}</span>);}
  function WeatherIcon({icon,color}){const p={width:30,height:30,viewBox:'0 0 24 24',fill:'none',stroke:color,strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round',style:{flexShrink:0}};
    if(icon==='sun')return <svg {...p}><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>;
    if(icon==='cloudsun')return <svg {...p}><path d="M8 5V3M4.2 7.2L3 6M14 7a4 4 0 0 0-7.6 1.7"/><path d="M16 18H7a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.4A3.5 3.5 0 0 1 16 18z"/></svg>;
    if(icon==='rain')return <svg {...p}><path d="M16 13a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.4A3.5 3.5 0 0 0 7 13h9z"/><path d="M8 17v2M12 17v3M16 17v2"/></svg>;
    if(icon==='snow')return <svg {...p}><path d="M16 13a4 4 0 0 0 0-8 5 5 0 0 0-9.6 1.4A3.5 3.5 0 0 0 7 13h9z"/><path d="M9 18h.01M13 18h.01M11 21h.01"/></svg>;
    return <svg {...p}><path d="M17.5 17H7a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.4A3.5 3.5 0 0 1 17.5 17z"/></svg>;}

  /* Base de référence personnelle : calibration sur les 3 premières mesures, puis moyenne glissante */
  function readBase(key){ try{ return JSON.parse((window.localStorage&&localStorage.getItem(key)))||{avg:null,n:0}; }catch(e){ return {avg:null,n:0}; } }
  function pushBase(key,val,calibN){ calibN=calibN||3; const b=readBase(key); const prevAvg=b.avg, prevN=b.n||0; const n=prevN+1;
    let avg; if(prevAvg==null) avg=val; else if(n<=calibN) avg=Math.round((prevAvg*prevN+val)/n); else avg=Math.round(prevAvg*0.8+val*0.2);
    try{ if(window.localStorage) localStorage.setItem(key,JSON.stringify({avg,n})); }catch(e){}
    return {prevAvg,prevN,calibN}; }

  /* Test d'éveil — temps de réaction (capte la fatigue nerveuse / le stress du jour, instant T) */
  function ReactionTest({onResult}){
    const TRIALS=4;
    const [st,setSt]=React.useState({phase:'idle',times:[],signal:'wait',early:false,avg:null,prevAvg:null,prevN:0,calibN:3});
    const startRef=React.useRef(0), toRef=React.useRef(null);
    React.useEffect(()=>{
      if(st.phase!=='run'||st.signal!=='wait')return;
      toRef.current=setTimeout(()=>{startRef.current=performance.now();setSt(s=>({...s,signal:'go'}));},1200+Math.random()*1700);
      return()=>clearTimeout(toRef.current);
    },[st.phase,st.signal,st.times.length]);
    function tap(){
      if(st.phase!=='run')return;
      if(st.signal==='wait'){clearTimeout(toRef.current);setSt(s=>({...s,early:true}));setTimeout(()=>setSt(s=>({...s,early:false})),750);return;}
      const ms=Math.round(performance.now()-startRef.current); const times=[...st.times,ms];
      if(times.length>=TRIALS){
        const avg=Math.round(times.reduce((a,b)=>a+b,0)/times.length);
        const res=pushBase('elan_rt_base',avg,3);
        setSt({phase:'done',times,signal:'wait',early:false,avg,prevAvg:res.prevAvg,prevN:res.prevN,calibN:res.calibN}); onResult&&onResult(avg,res);
      } else setSt(s=>({...s,times,signal:'wait'}));
    }
    if(st.phase==='idle')return(<>
      <p style={{fontSize:12.5,color:C.body,lineHeight:1.5,marginBottom:14}}>Touche l'écran dès qu'il passe au <b style={{color:'#15A34A'}}>vert</b>, le plus vite possible (4 essais). Tes réflexes révèlent ta fatigue nerveuse — l'effet du stress et de ta journée, au-delà du sommeil.</p>
      <Btn variant="primary" size="md" fullWidth onClick={()=>setSt({phase:'run',times:[],signal:'wait',early:false,avg:null,prevAvg:null,prevN:0,calibN:3})}>Commencer →</Btn>
    </>);
    if(st.phase==='run'){const go=st.signal==='go';return(
      <div onClick={tap} style={{cursor:'pointer',userSelect:'none',borderRadius:16,background:st.early?C.amber:go?'#16A34A':C.ink,border:`2px solid ${st.early?C.amber:go?'#16A34A':C.ink}`,padding:'40px 16px',textAlign:'center',transition:'background 80ms ease',boxShadow:go?'0 8px 28px rgba(22,163,74,0.4)':'none'}}>
        <div style={{fontSize:go?34:19,fontWeight:700,color:go?'#fff':st.early?'#fff':'rgba(255,255,255,0.82)',letterSpacing:go?'0.04em':'0',lineHeight:1.1,marginBottom:8}}>{st.early?'Trop tôt !':go?'TAPE !':'Attends le vert…'}</div>
        <div style={{fontSize:11.5,color:go?'rgba(255,255,255,0.85)':'rgba(255,255,255,0.6)',fontFamily:"'DM Mono',monospace"}}>essai {Math.min(st.times.length+1,TRIALS)} / {TRIALS}</div>
      </div>
    );}
    const calibrating=st.prevN<st.calibN;
    const delta=st.prevAvg!=null?st.prevAvg-st.avg:0;
    return(
      <div style={{display:'flex',alignItems:'center',gap:14}}>
        <div style={{textAlign:'center',flexShrink:0}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:30,fontWeight:500,color:C.ink,lineHeight:1}}>{st.avg}</span><div style={{fontSize:10,color:C.muted,marginTop:2}}>ms (réflexe)</div></div>
        <div style={{flex:1}}>
          {calibrating
            ? (<><div style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,fontWeight:600,color:C.tealDk,background:'rgba(47,191,161,0.12)',borderRadius:99,padding:'3px 9px',marginBottom:6}}>Calibration {st.prevN+1}/{st.calibN}</div><p style={{fontSize:12,color:C.body,lineHeight:1.45,margin:0}}>On établit ta base de référence — encore {st.calibN-st.prevN-1} mesure{st.calibN-st.prevN-1>1?'s':''} pour comparer tes prochains tests.</p></>)
            : (<><div style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,fontWeight:600,color:delta>=0?C.tealDk:C.amber,background:delta>=0?'rgba(47,191,161,0.12)':'rgba(224,138,11,0.12)',borderRadius:99,padding:'3px 9px',marginBottom:6}}>{delta>=0?'+':''}{delta} ms vs ta base ({st.prevAvg})</div><p style={{fontSize:12,color:C.body,lineHeight:1.45,margin:0}}>{delta>=-10?'Bonne vivacité — système nerveux dispos.':'Réflexes ralentis — signe de fatigue nerveuse, je reste prudent.'}</p></>)}
        </div>
      </div>
    );
  }

  function CheckInHybride({ metrics, setMetrics, context, setContext, onConfirm, onClose }) {
    const set=(k,v)=>setMetrics(m=>({...m,[k]:v}));
    const toggle=id=>setContext(c=>{let eq=c.equipment.includes(id)?c.equipment.filter(x=>x!==id):[...c.equipment,id];if(!eq.length)eq=['bodyweight'];return{...c,equipment:eq};});
    const [weather,setWeather]=React.useState({status:'load'});
    const [rtRes,setRtRes]=React.useState(null);
    const [test,setTest]=React.useState({phase:'idle',reps:12,chrono:null,prevAvg:null,prevN:0,calibN:3,energy:null});
    const [adjust,setAdjust]=React.useState(false);
    const cardBase={background:C.card,border:`1px solid ${C.line}`,borderRadius:22,boxShadow:C.sh};

    /* Météo locale réelle (Open-Meteo, sans clé) → chaleur ressentie objectivée */
    React.useEffect(()=>{
      let cancelled=false;
      const heatFromApparent=at=>at>=32?9:at>=29?8:at>=26?7:at>=23?6:at>=19?5:at>=14?4:at>=8?3:2;
      const condFromCode=c=>{if(c===0)return{label:'Ciel dégagé',icon:'sun'};if(c<=3)return{label:'Partiellement nuageux',icon:'cloudsun'};if(c<=48)return{label:'Brouillard',icon:'cloud'};if(c<=67)return{label:'Pluie',icon:'rain'};if(c<=77)return{label:'Neige',icon:'snow'};if(c<=82)return{label:'Averses',icon:'rain'};if(c<=86)return{label:'Neige',icon:'snow'};return{label:'Orage',icon:'rain'};};
      async function load(lat,lon,approx){
        try{
          const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code`);
          const j=await r.json(); const cur=j.current||{};
          const at=Math.round(cur.apparent_temperature); const h=Math.min(10,Math.max(1,heatFromApparent(at)));
          let city='Ta position';
          try{const g=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`);const gj=await g.json();city=gj.city||gj.locality||gj.principalSubdivision||city;}catch(e){}
          if(cancelled)return; const cc=condFromCode(cur.weather_code);
          setWeather({status:'done',city:approx?city+' (approx.)':city,temp:Math.round(cur.temperature_2m),apparent:at,humidity:Math.round(cur.relative_humidity_2m),cond:cc.label,icon:cc.icon,heat:h});
          setMetrics(m=>({...m,heat:h}));
        }catch(e){ if(!cancelled) setWeather({status:'error'}); }
      }
      if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
          p=>load(p.coords.latitude,p.coords.longitude,false),
          ()=>load(45.764,4.8357,true),
          {timeout:6000,maximumAge:600000}
        );
      } else { load(45.764,4.8357,true); }
      return()=>{cancelled=true;};
    },[]);
    /* Test express 30 s — Lever de chaise (Sit-to-Stand, validé en clinique SEP) */
    /* Lever de chaise — pré-remplir la valeur depuis ta base + chrono optionnel de 30 s */
    React.useEffect(()=>{ const s=window.__sts7(false); if(s) setTest(t=>({...t,reps:Math.round(s.mean)})); },[]);
    React.useEffect(()=>{
      if(test.chrono==null||test.chrono<=0)return;
      const id=setTimeout(()=>setTest(t=>({...t,chrono:t.chrono-1})),1000);
      return()=>clearTimeout(id);
    },[test.chrono]);
    function validateSts(){
      const reps=test.reps; const prior=window.__sts7(true);
      window.__stsPush(reps);
      const energy=Math.max(1,Math.min(10,Math.round((reps-2)/1.25)));
      setTest(t=>({...t,phase:'done',chrono:null,prior:prior,energy}));
      setMetrics(m=>({...m,energy}));
    }

    const ready=!!metrics.energy;
    const stsCalib=!test.prior||test.prior.n<2;
    const stsDelta=test.prior?+(test.reps-test.prior.mean).toFixed(1):0;
    return (
      <div style={{minHeight:'100%',padding:'0 24px 40px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 0 0',marginBottom:22}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.muted}}>{new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>
          {onClose?<button onClick={onClose} aria-label="Fermer" style={{background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,borderRadius:99,width:34,height:34,cursor:'pointer',color:C.body,fontSize:19,lineHeight:1,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif"}}>×</button>:<BrandMark/>}
        </div>
        <div style={{marginBottom:22}}>
          <p style={{fontSize:11,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:6}}>Check-in du jour</p>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:30,fontWeight:600,color:C.ink,letterSpacing:'-0.025em',lineHeight:1.1,marginBottom:6}}>Bonjour, {window.ED.user}</h1>
          <p style={{fontSize:13,color:C.muted,textTransform:'capitalize'}}>{window.ED.today}</p>
        </div>
        <StreakBanner/>

        {/* Test d'éveil — réflexes (fatigue nerveuse / stress) */}
        <div style={{...cardBase,padding:'16px 18px',marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span style={{fontSize:13,fontWeight:600,color:C.ink}}>Test d'éveil · réflexes</span>
            </div>
            {rtRes && <Measured>Fatigue nerveuse</Measured>}
          </div>
          <ReactionTest onResult={(avg,res)=>{ setRtRes({avg}); setMetrics(m=>({...m,fatigue:Math.max(1,Math.min(10,Math.round((avg-200)/35)))})); }}/>
        </div>

        {/* Météo */}
        <div style={{...cardBase,padding:'14px 18px',marginBottom:12,display:'flex',alignItems:'center',gap:14}}>
          {weather.status==='load'
            ? <span style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:12,color:C.muted}}><span style={{width:11,height:11,border:`2px solid ${C.line2}`,borderTopColor:C.amber,borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/>Météo locale…</span>
            : weather.status==='error'
            ? (<><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M17.5 17H7a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.4A3.5 3.5 0 0 1 17.5 17z"/></svg><span style={{flex:1,fontSize:12.5,color:C.muted,lineHeight:1.4}}>Météo indisponible — ajuste la chaleur dans « Ton ressenti ».</span></>)
            : (<>
              <WeatherIcon icon={weather.icon} color={weather.heat>=7?C.orange:C.amber}/>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'baseline',gap:8,flexWrap:'wrap'}}><span style={{fontSize:15,fontWeight:600,color:C.ink}}>{weather.temp}°C</span><span style={{fontSize:12,color:C.muted}}>{weather.city} · ressenti {weather.apparent}° · {weather.humidity}%</span></div>
                <div style={{fontSize:12,color:C.body,marginTop:2}}>{weather.heat>=7?'Chaleur élevée — j’écarte le cardio et j’allège.':weather.heat>=5?'Chaleur modérée — je tempère l’intensité.':'Conditions fraîches — rien ne freine ta séance.'}</div>
              </div>
              <Measured>Chaleur</Measured>
            </>)}
        </div>

        {/* Lever de chaise — saisie manuelle du nombre */}
        <div style={{...cardBase,padding:'16px 18px',marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v6M5 8h14l-1.5 4.5a6 6 0 0 1-11 0L5 8zM8 22h8M12 16v6"/></svg>
              <span style={{fontSize:13,fontWeight:600,color:C.ink}}>Lever de chaise · 30 s</span>
            </div>
            {test.phase==='done' && <Measured>Énergie</Measured>}
          </div>
          {test.phase!=='done' ? (<>
            <p style={{fontSize:12.5,color:C.body,lineHeight:1.5,marginBottom:14}}>En 30 s, fais un maximum d'assis-debout sur une chaise, puis indique ton total. Mesure objective de ta forme motrice, comparée à ta base.</p>
            <div style={{display:'flex',alignItems:'stretch',gap:10,marginBottom:10}}>
              <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'space-between',background:C.bg,border:`1px solid ${C.line}`,borderRadius:14,padding:'6px 10px'}}>
                <button onClick={()=>setTest(t=>({...t,reps:Math.max(1,t.reps-1)}))} style={{width:34,height:34,borderRadius:11,border:`1px solid ${C.line}`,background:C.card,color:C.tealDk,fontSize:20,cursor:'pointer',flexShrink:0,padding:0,lineHeight:1}}>−</button>
                <div style={{textAlign:'center'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:500,color:C.ink}}>{test.reps}</span><div style={{fontSize:9.5,color:C.muted}}>levers</div></div>
                <button onClick={()=>setTest(t=>({...t,reps:t.reps+1}))} style={{width:34,height:34,borderRadius:11,border:`1px solid ${C.line}`,background:C.card,color:C.tealDk,fontSize:20,cursor:'pointer',flexShrink:0,padding:0,lineHeight:1}}>+</button>
              </div>
              <Btn variant="primary" size="md" onClick={validateSts}>Valider</Btn>
            </div>
            <button onClick={()=>setTest(t=>({...t,chrono:t.chrono==null||t.chrono<=0?30:null}))} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,width:'100%',background:'none',border:`1px dashed ${C.line2}`,borderRadius:12,padding:'9px',cursor:'pointer',color:test.chrono>0?C.orange:C.muted,fontSize:12.5,fontWeight:500,fontFamily:"'DM Sans',sans-serif"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4M9 2h6"/></svg>
              {test.chrono==null?'Démarrer le chrono 30 s (optionnel)':test.chrono>0?`${test.chrono} s — compte tes levers…`:'Temps écoulé — saisis ton total'}
            </button>
          </>) : (
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{textAlign:'center',flexShrink:0}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:34,fontWeight:500,color:C.ink,lineHeight:1}}>{test.reps}</span><div style={{fontSize:10,color:C.muted,marginTop:2}}>levers / 30 s</div></div>
              <div style={{flex:1}}>
                {stsCalib
                  ? (<><div style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,fontWeight:600,color:C.tealDk,background:'rgba(47,191,161,0.12)',borderRadius:99,padding:'3px 9px',marginBottom:6}}>Moyenne 7 j en cours</div><p style={{fontSize:12,color:C.body,lineHeight:1.45,margin:0}}>J'établis ta moyenne des 7 derniers jours — encore 1-2 mesures et je comparerai chaque test à cette référence glissante.</p></>)
                  : (<><div style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,fontWeight:600,color:stsDelta>=0?C.tealDk:C.amber,background:stsDelta>=0?'rgba(47,191,161,0.12)':'rgba(224,138,11,0.12)',borderRadius:99,padding:'3px 9px',marginBottom:6}}>{stsDelta>=0?'+':''}{stsDelta} vs ta moyenne 7 j ({test.prior.mean})</div><p style={{fontSize:12,color:C.body,lineHeight:1.45,margin:0}}>{stsDelta>=0?'Au-dessus de ta moyenne — belle forme motrice.':'Sous ta moyenne 7 j — je reste prudent sur l’intensité.'}</p></>)}
                <button onClick={()=>setTest(t=>({...t,phase:'idle'}))} style={{background:'none',border:'none',padding:0,marginTop:6,cursor:'pointer',color:C.faint,fontSize:11.5,fontFamily:"'DM Sans',sans-serif"}}>Modifier</button>
              </div>
            </div>
          )}
        </div>

        {/* Ressenti */}
        <div style={{...cardBase,padding:'18px',marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <span style={{fontSize:13,fontWeight:600,color:C.ink}}>Ton ressenti</span>
            <span style={{fontSize:11,color:C.faint}}>complète la mesure</span>
          </div>
          <EnergyGauge value={metrics.energy} onChange={n=>set('energy',n)}/>
          <div style={{marginTop:20,paddingTop:18,borderTop:`1px solid ${C.line}`}}>
            <MetricSlider label="Qualité du sommeil" value={metrics.sleep} color={C.teal} words={v=>v<=3?'Difficile':v<=6?'Moyenne':v<=8?'Bonne':'Excellente'} onChange={v=>set('sleep',v)}/>
          </div>
          <button onClick={()=>setAdjust(a=>!a)} style={{display:'flex',alignItems:'center',gap:6,margin:'16px auto 0',background:'none',border:'none',cursor:'pointer',color:C.tealDk,fontSize:12.5,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
            {adjust?'Masquer':'Ajuster les valeurs mesurées'}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{transform:adjust?'rotate(180deg)':'none',transition:'transform 240ms ease'}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div style={{maxHeight:adjust?220:0,overflow:'hidden',transition:'max-height 340ms cubic-bezier(.22,1,.36,1)'}}>
            <div style={{display:'flex',flexDirection:'column',gap:20,paddingTop:18}}>
              <MetricSlider label="Fatigue (test d'éveil)" value={metrics.fatigue} color={C.orange} words={v=>v<=3?'Légère':v<=6?'Présente':'Forte'} onChange={v=>set('fatigue',v)}/>
              <MetricSlider label="Chaleur ressentie (météo)" value={metrics.heat} color={C.amber} words={v=>v<=3?'Fraîche':v<=6?'Tempérée':'Forte'} onChange={v=>set('heat',v)}/>
            </div>
          </div>
        </div>

        {/* Lieu + matériel */}
        <div style={{...cardBase,padding:'20px',marginBottom:26}}>
          <p style={{fontSize:13,fontWeight:500,color:C.ink,marginBottom:12}}>Où t'entraînes-tu ?</p>
          <div style={{display:'flex',gap:8,marginBottom:20}}>
            {[{id:'maison',label:'À la maison'},{id:'salle',label:'À la salle'}].map(o=>{const a=context.location===o.id;return(
              <button key={o.id} onClick={()=>setContext(c=>({...c,location:o.id}))} style={{flex:1,padding:'11px',borderRadius:14,cursor:'pointer',fontSize:14,fontWeight:500,fontFamily:"'DM Sans',sans-serif",background:a?'rgba(47,191,161,0.12)':C.bg,border:`1px solid ${a?'rgba(47,191,161,0.45)':C.line}`,color:a?C.tealDk:C.muted,transition:'all 180ms ease'}}>{o.label}</button>);})}
          </div>
          <p style={{fontSize:13,fontWeight:500,color:C.ink,marginBottom:4}}>Matériel disponible</p>
          <p style={{fontSize:11,color:C.muted,marginBottom:12,fontStyle:'italic'}}>{context.location==='salle'?'En salle, tout est disponible — sélection optionnelle.':'Sélectionne ce que tu as sous la main.'}</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {EQUIP.map(e=>{const a=context.equipment.includes(e.id);return(
              <button key={e.id} onClick={()=>toggle(e.id)} style={{padding:'8px 14px',borderRadius:99,cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:"'DM Sans',sans-serif",background:a?'rgba(47,191,161,0.12)':C.bg,border:`1px solid ${a?'rgba(47,191,161,0.4)':C.line}`,color:a?C.tealDk:C.muted,transition:'all 160ms ease'}}>{a?'✓ ':''}{e.label}</button>);})}
          </div>
        </div>
        <Btn variant={metrics.energy>=8?'energy':'primary'} size="lg" fullWidth disabled={!ready} onClick={ready?onConfirm:undefined}>{ready?(onClose?'Mettre à jour ma forme →':'Générer mon programme →'):'Fais le test ou indique ton énergie'}</Btn>
        <p style={{textAlign:'center',marginTop:14,fontSize:12,color:C.faint,lineHeight:1.5}}>{onClose?'Refais le test si ta forme a changé depuis ce matin.':'Ta forme du jour combine mesures (réflexes, météo, lever de chaise) et ressenti.'}</p>
      </div>
    );
  }
  window.ES.CheckInHybride=CheckInHybride;
})();
/* components block 3 */
(function(){
  const { Btn, BrandMark, AREA_LABELS, AREA_COLORS, C } = window.EC;
  const ProgIcon=({p})=> p==='up' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 14 12 8 18 14"/></svg>
    : p==='down' ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 10 12 16 18 10"/></svg>
    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2.5" strokeLinecap="round"><line x1="6" y1="12" x2="18" y2="12"/></svg>;
  function GoalPicker({ session, setSession, onDone }){
    const [sel,setSel]=React.useState(session.goals&&session.goals.length?session.goals:['lower','balance']);
    const [intensity,setIntensity]=React.useState(session.intensity||'moderee');
    const toggle=k=>setSel(s=>s.includes(k)?s.filter(x=>x!==k):[...s,k]);
    return (
      <div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:22}}>
          {window.GOAL_OPTIONS.map(o=>{const a=sel.includes(o.key);return(
            <button key={o.key} onClick={()=>toggle(o.key)} style={{padding:'10px 14px',borderRadius:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:13.5,fontWeight:500,background:a?'rgba(47,191,161,0.13)':C.bg,border:`1px solid ${a?'rgba(47,191,161,0.45)':C.line}`,color:a?C.tealDk:C.body,transition:'all 150ms ease'}}>{a?'\u2713 ':''}{o.label}</button>);})}
        </div>
        <p style={{fontSize:13,fontWeight:500,color:C.ink,marginBottom:10}}>Intensité souhaitée</p>
        <div style={{display:'flex',gap:8,marginBottom:24}}>
          {[{k:'legere',l:'Légère'},{k:'moderee',l:'Modérée'},{k:'soutenue',l:'Soutenue'}].map(o=>{const a=intensity===o.k;return(
            <button key={o.k} onClick={()=>setIntensity(o.k)} style={{flex:1,padding:'11px',borderRadius:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,background:a?'rgba(47,191,161,0.12)':C.bg,border:`1px solid ${a?'rgba(47,191,161,0.4)':C.line}`,color:a?C.tealDk:C.muted}}>{o.l}</button>);})}
        </div>
        <Btn variant="primary" size="lg" fullWidth disabled={!sel.length} onClick={()=>{ setSession.setGoals(sel); setSession.setIntensity(intensity); setSession.setMode('custom'); onDone(); }}>{sel.length?'Générer ma séance →':'Choisis au moins une zone'}</Btn>
      </div>
    );
  }
  function ExRow({ ex, i, isOpen, onToggle }) {
    const c=AREA_COLORS[ex.area]||C.teal;
    const innerRef=React.useRef(null);
    const [h,setH]=React.useState(0);
    React.useLayoutEffect(()=>{ if(innerRef.current) setH(innerRef.current.scrollHeight); },[isOpen,ex]);
    return (
            <div style={{background:C.card,border:`1px solid ${isOpen?'rgba(47,191,161,0.32)':C.line}`,borderRadius:14,boxShadow:C.sh,animation:`riseIn 320ms cubic-bezier(.22,1,.36,1) ${i*40}ms both`,transition:'border-color 200ms ease'}}>
              <div onClick={onToggle} style={{padding:'13px 14px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:C.faint,width:18,flexShrink:0}}>{String(i+1).padStart(2,'0')}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:500,color:C.ink,display:'flex',alignItems:'center',gap:8}}>{ex.name}{ex.flagged&&<span style={{fontSize:10,fontWeight:600,color:C.amber,background:'rgba(224,138,11,0.12)',border:'1px solid rgba(224,138,11,0.3)',borderRadius:99,padding:'1px 7px'}}>allégé</span>}</div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4,flexWrap:'wrap'}}><span style={{width:5,height:5,borderRadius:'50%',background:ex.phase==='warmup'?C.amber:ex.phase==='cooldown'?C.tealDk:c}}/><span style={{fontSize:12,color:C.muted}}>{ex.phase==='warmup'?'Échauffement':ex.phase==='cooldown'?'Retour au calme':AREA_LABELS[ex.area]}</span><span style={{fontSize:11.5,color:C.faint,fontFamily:"'DM Mono',monospace"}}>{ex.doseText}</span></div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,transform:isOpen?'rotate(180deg)':'rotate(0)',transition:'transform 240ms ease'}}><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div style={{maxHeight:isOpen?h:0,overflow:'hidden',transition:'max-height 360ms cubic-bezier(.22,1,.36,1)'}}>
                <div ref={innerRef} style={{padding:'0 14px 16px 44px'}}>
                  <p style={{fontSize:13,color:C.body,lineHeight:1.55,marginBottom:12}}>{ex.desc}</p>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:(ex.position||ex.conseil||ex.alternative)?12:0}}>
                    <span style={{fontSize:11.5,color:C.body,background:C.bg,border:`1px solid ${C.line}`,borderRadius:10,padding:'6px 10px'}}>Dose <b style={{color:C.ink}}>{ex.doseText}</b></span>
                    {ex.restSec>0&&<span style={{fontSize:11.5,color:C.body,background:C.bg,border:`1px solid ${C.line}`,borderRadius:10,padding:'6px 10px'}}>Repos <b style={{fontFamily:"'DM Mono',monospace",color:C.ink}}>{ex.restSec} s</b></span>}
                    {ex.muscles&&<span style={{fontSize:11.5,color:C.body,background:C.bg,border:`1px solid ${C.line}`,borderRadius:10,padding:'6px 10px'}}>{ex.muscles}</span>}
                  </div>
                  {(ex.levelNote||ex.nextCue)&&<div style={{display:'flex',gap:8,alignItems:'flex-start',background:'rgba(47,191,161,0.07)',border:'1px solid rgba(47,191,161,0.2)',borderRadius:12,padding:'10px 12px',marginBottom:(ex.position||ex.conseil||ex.alternative)?10:0}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg><span style={{fontSize:12.5,color:C.body,lineHeight:1.45}}><b style={{color:C.tealDk}}>{ex.levelNote||'Niveau de départ'}</b>{ex.nextCue?` — prochaine étape : ${ex.nextCue.toLowerCase()}`:''}</span></div>}
                  {ex.position&&<p style={{fontSize:12.5,color:C.muted,lineHeight:1.5,marginBottom:(ex.conseil||ex.alternative)?10:0}}><b style={{color:C.body}}>Mise en place — </b>{ex.position}</p>}
                  {ex.conseil&&<div style={{display:'flex',gap:8,alignItems:'flex-start',background:C.tint,border:'1px solid rgba(47,191,161,0.22)',borderRadius:12,padding:'10px 12px',marginBottom:ex.alternative?8:0}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg><span style={{fontSize:12.5,color:C.body,lineHeight:1.45}}><b style={{color:C.tealDk}}>Conseil SEP — </b>{ex.conseil}</span></div>}
                  {ex.alternative&&<div style={{display:'flex',gap:8,alignItems:'flex-start',background:ex.flagged?'rgba(224,138,11,0.08)':C.bg,border:`1px solid ${ex.flagged?'rgba(224,138,11,0.25)':C.line}`,borderRadius:12,padding:'10px 12px'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ex.flagged?C.amber:C.muted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg><span style={{fontSize:12.5,color:C.body,lineHeight:1.45}}><b style={{color:ex.flagged?C.amber:C.body}}>{ex.flagged?'Alternative proposée — ':'Plus facile — '}</b>{ex.alternative}</span></div>}
                </div>
              </div>
            </div>);
  }
  function ProgramScreen({ program, onStart, session, setSession, onReviewCheckin }) {
    const spec=ex=>ex.doseText||ex.duration||'';
    const resume=window.__resumableSession();
    const [open,setOpen]=React.useState(null);
    const [sheet,setSheet]=React.useState(null);
    const r=program.readiness, rc=r>=70?C.orange:r>=42?C.teal:'#9DB0AB';
    const meta={background:C.card,border:`1px solid ${C.line}`,borderRadius:12,padding:'8px 10px',boxShadow:C.sh};
    return (
      <div style={{minHeight:'100%',padding:'18px 24px 24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
          <p style={{fontSize:11,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase',margin:0,paddingTop:4}}>Programme généré pour toi</p>
          <BrandMark/>
        </div>
        <h2 style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:600,color:C.ink,letterSpacing:'-0.02em',marginBottom:14}}>{program.title}</h2>
        <div style={{display:'flex',gap:5,background:C.card,border:`1px solid ${C.line}`,borderRadius:14,padding:4,marginBottom:session.mode==='ia'?18:8,boxShadow:C.sh}}>
          {[{k:'ia',label:'Élan IA'},{k:'custom',label:'Sur mesure'},{k:'gym',label:'Salle'}].map(o=>{const a=session.mode===o.k;return(
            <button key={o.k} onClick={()=>{ o.k==='ia' ? setSession.setMode('ia') : o.k==='custom' ? setSheet('goals') : setSheet('gym'); }} style={{flex:1,padding:'9px 6px',borderRadius:11,border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,background:a?'rgba(47,191,161,0.14)':'transparent',color:a?C.tealDk:C.muted,transition:'all 160ms ease'}}>{o.label}</button>);})}
        </div>
        {session.mode!=='ia' && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <span style={{fontSize:12,color:C.muted}}>Remplace la séance Élan du jour</span>
            <button onClick={()=>session.mode==='custom'?setSheet('goals'):setSheet('gym')} style={{background:'none',border:'none',cursor:'pointer',color:C.tealDk,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Modifier</button>
          </div>
        )}
        <div style={{display:'flex',gap:12,marginBottom:18}}>
          <button onClick={onReviewCheckin} aria-label="Revoir le check-in du jour" style={{flex:'0 0 auto',width:96,background:C.card,border:`1px solid ${rc}44`,borderRadius:18,padding:'12px 10px 10px',textAlign:'center',boxShadow:C.sh,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",display:'block'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:30,fontWeight:500,color:rc,lineHeight:1}}>{r}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:4,letterSpacing:'0.04em'}}>FORME / 100</div>
            <div style={{fontSize:9.5,color:C.tealDk,marginTop:5,fontWeight:600,letterSpacing:'0.02em'}}>Revoir ›</div>
          </button>
          <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:8}}>
            <div style={{display:'flex',gap:8}}>
              <span style={{...meta,flex:1}}><span style={{display:'block',fontSize:10,color:C.muted,marginBottom:2}}>Durée</span><span style={{fontFamily:"'DM Mono',monospace",fontSize:15,color:C.ink}}>{program.duration} min</span></span>
              <span style={{...meta,flex:1}}><span style={{display:'block',fontSize:10,color:C.muted,marginBottom:2}}>Intensité</span><span style={{fontSize:14,fontWeight:500,color:C.ink}}>{program.intensity}</span></span>
            </div>
            <span style={{...meta}}><span style={{fontSize:10,color:C.muted}}>Exercices </span><span style={{fontFamily:"'DM Mono',monospace",fontSize:14,color:C.ink}}>{program.exercises.length}</span></span>
          </div>
        </div>
        <div style={{background:C.tint,border:'1px solid rgba(47,191,161,0.22)',borderRadius:18,padding:'16px 16px 14px',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/></svg>
            <span style={{fontSize:12,fontWeight:600,color:C.tealDk,letterSpacing:'0.04em'}}>Pourquoi cette séance</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:9}}>
            {program.reasons.map((rs,i)=>(<div key={i} style={{display:'flex',gap:9,alignItems:'flex-start'}}><span style={{marginTop:6,width:5,height:5,borderRadius:'50%',background:C.teal,flexShrink:0}}/><span style={{fontSize:13,lineHeight:1.45,color:C.body}}><b style={{color:C.ink,fontWeight:600}}>{rs.t}</b> — {rs.d}</span></div>))}
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:12}}>
          <p style={{fontSize:11,color:C.muted,letterSpacing:'0.07em',textTransform:'uppercase',margin:0}}>Ton programme</p>
          <span style={{fontSize:11,color:C.faint}}>Touche pour les détails</span>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
          {program.exercises.map((ex,i)=>(<ExRow key={ex.id} ex={ex} i={i} isOpen={open===i} onToggle={()=>setOpen(open===i?null:i)}/>))}
        </div>
        {resume&&(
          <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:10,background:'rgba(47,191,161,0.1)',border:'1px solid rgba(47,191,161,0.28)',borderRadius:14,padding:'11px 14px'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="13 19 22 12 13 5"/><polyline points="2 19 11 12 2 5"/></svg>
            <span style={{flex:1,fontSize:12.5,color:C.body}}>Séance en cours — exercice {Math.min((resume.exIdx||0)+1,program.exercises.length)}/{program.exercises.length}.</span>
            <button onClick={()=>{window.__clearSessionState();onStart();}} style={{background:'none',border:'none',color:C.muted,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",textDecoration:'underline',flexShrink:0}}>Recommencer</button>
          </div>
        )}
        <Btn variant={program.tier==='high'?'energy':'primary'} size="lg" fullWidth onClick={onStart}>{resume?'Reprendre ma séance →':'Commencer la séance →'}</Btn>

        {sheet==='goals' && (
          <div onClick={()=>setSheet(null)} style={{position:'absolute',inset:0,zIndex:260,background:'rgba(14,81,74,0.34)',backdropFilter:'blur(3px)',WebkitBackdropFilter:'blur(3px)',display:'flex',alignItems:'flex-end'}}>
            <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxHeight:'90%',overflowY:'auto',background:C.card,borderRadius:'26px 26px 0 0',padding:'10px 22px 28px',boxShadow:'0 -10px 40px rgba(14,81,74,0.2)',animation:'sheetUp 340ms cubic-bezier(.22,1,.36,1)'}}>
              <div style={{width:40,height:4,borderRadius:2,background:C.line2,margin:'0 auto 18px'}}/>
              <h3 style={{fontFamily:'Georgia,serif',fontSize:22,fontWeight:600,color:C.ink,marginBottom:6}}>Que veux-tu travailler ?</h3>
              <p style={{fontSize:13.5,color:C.body,lineHeight:1.5,marginBottom:20}}>Choisis une ou plusieurs zones. Je construis une séance dédiée qui remplace celle du jour — tes adaptations de difficulté restent prises en compte.</p>
              <GoalPicker session={session} setSession={setSession} onDone={()=>setSheet(null)}/>
            </div>
          </div>
        )}
        {sheet==='gym' && (
          <div onClick={()=>setSheet(null)} style={{position:'absolute',inset:0,zIndex:260,background:'rgba(14,81,74,0.34)',backdropFilter:'blur(3px)',WebkitBackdropFilter:'blur(3px)',display:'flex',alignItems:'flex-end'}}>
            <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxHeight:'90%',overflowY:'auto',background:C.card,borderRadius:'26px 26px 0 0',padding:'10px 22px 28px',boxShadow:'0 -10px 40px rgba(14,81,74,0.2)',animation:'sheetUp 340ms cubic-bezier(.22,1,.36,1)'}}>
              <div style={{width:40,height:4,borderRadius:2,background:C.line2,margin:'0 auto 18px'}}/>
              <h3 style={{fontFamily:'Georgia,serif',fontSize:22,fontWeight:600,color:C.ink,marginBottom:6}}>Séances salle</h3>
              <p style={{fontSize:13.5,color:C.body,lineHeight:1.5,marginBottom:18}}>Choisis une séance musculation prédéfinie. Elle remplace la séance du jour et conserve tes adaptations de difficulté.</p>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {window.ED.gymSessions.map(s=>{const a=session.mode==='gym'&&session.gymId===s.id;return(
                  <button key={s.id} onClick={()=>{ setSession.setGymId(s.id); setSession.setMode('gym'); setSheet(null); }} style={{textAlign:'left',background:a?'rgba(47,191,161,0.10)':C.bg,border:`1px solid ${a?'rgba(47,191,161,0.4)':C.line}`,borderRadius:16,padding:'15px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:42,height:42,borderRadius:12,background:'rgba(47,191,161,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5l11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M6.5 17.5l-2 2M19.5 6.5l-2 2"/></svg></div>
                    <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:C.ink}}>{s.title}</div><div style={{fontSize:12.5,color:C.muted,marginTop:2}}>{s.subtitle}</div></div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>);})}
              </div>
              <p style={{fontSize:11.5,color:C.faint,textAlign:'center',marginTop:16,fontStyle:'italic'}}>Contenu provisoire — tes 2 séances salle seront précisées à l'étape 2.</p>
              <button onClick={()=>setSheet(null)} style={{display:'block',margin:'14px auto 0',background:'none',border:'none',color:C.muted,fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Annuler</button>
            </div>
          </div>
        )}
      </div>
    );
  }
  window.ES.ProgramScreen=ProgramScreen;
})();
/* components block 4 */
(function(){
  const { Btn, CircleTimer, AREA_LABELS, AREA_COLORS, beep, unlockAudio, C } = window.EC;

  function Stepper({label,value,step,min,unit,onChange}){
    const bs={width:50,height:50,borderRadius:14,border:`1px solid ${C.line}`,background:C.card,color:C.tealDk,fontSize:26,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",lineHeight:1,flexShrink:0,padding:0,touchAction:'manipulation'};
    return (
      <div style={{flex:1,minWidth:0,background:C.bg,border:`1px solid ${C.line}`,borderRadius:16,padding:'10px 10px 12px',textAlign:'center'}}>
        <div style={{fontSize:11,color:C.muted,marginBottom:8,letterSpacing:'0.03em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{label}</div>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <button onClick={()=>onChange(Math.max(min!=null?min:0,+(value-step).toFixed(2)))} aria-label="Diminuer" style={bs}>−</button>
          <span style={{flex:1,minWidth:0,fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:500,color:C.ink,whiteSpace:'nowrap',overflow:'hidden'}}>{value}{unit?<span style={{fontSize:12,color:C.muted}}> {unit}</span>:null}</span>
          <button onClick={()=>onChange(+(value+step).toFixed(2))} aria-label="Augmenter" style={bs}>+</button>
        </div>
      </div>
    );
  }

  function FocusScreen({ program, onBack }) {
    const exs=program.exercises;
    const __r0=window.__resumableSession();
    const [exIdx,setExIdx]=React.useState(__r0&&__r0.exIdx!=null?__r0.exIdx:0);
    const [setNum,setSetNum]=React.useState(__r0&&__r0.setNum!=null?__r0.setNum:1);
    const [phase,setPhase]=React.useState('work');   // 'work' | 'rest'
    const [done,setDone]=React.useState(()=>new Set(__r0&&__r0.done?__r0.done:[]));
    const [allDone,setAllDone]=React.useState(false);
    const [running,setRunning]=React.useState(false);
    const [remaining,setRemaining]=React.useState(0);
    const [side,setSide]=React.useState('left');
    const sideRef=React.useRef('left'); sideRef.current=side;
    React.useEffect(()=>{ if(!allDone) window.__saveSessionState({exIdx,setNum,done:[...done]}); },[exIdx,setNum,done,allDone]);
    const fired=React.useRef(false);
    const restKindRef=React.useRef('set');   // 'set' (entre séries) | 'next' (entre exercices)
    const [flagOpen,setFlagOpen]=React.useState(false);
    const [infoOpen,setInfoOpen]=React.useState(false);
    const [toast,setToast]=React.useState(null);
    const [flagged,setFlagged]=React.useState(()=>{try{return JSON.parse((window.localStorage&&localStorage.getItem('elan_difficulties'))||'{}');}catch(e){return{};}});
    const [loadW,setLoadW]=React.useState(0);
    const [loadR,setLoadR]=React.useState(0);

    const ex=exs[exIdx];
    const sets=ex.sets||1;
    const isEach = !ex.weighted && ex.side==='each';
    const fem = /jambe|main/.test(ex.sideLabel||'');
    const sideCap = ex.sideLabel ? (ex.sideLabel.charAt(0).toUpperCase()+ex.sideLabel.slice(1)) : 'Côté';
    const sideHuman = side==='left' ? 'gauche' : (fem?'droite':'droit');
    const isTimed=ex.workSec>0;
    const restSec=ex.restSec||0;
    const aColor=AREA_COLORS[ex.area]||C.teal;
    const peak=program.tier==='high';
    const accent=peak?C.orange:C.teal;
    const isFlagged=!!flagged[ex.id];
    const outcomeRef=React.useRef({});
    const loggedRef=React.useRef(new Set());
    function markEasy(){
      outcomeRef.current[ex.id]='easy'; window.__logSession(ex.id,'easy',ex.area);
      setToast('Parfait, je corse cet exercice dès la prochaine séance'+(ex.nextCue?' : '+ex.nextCue.toLowerCase():'')+'.');
      setTimeout(()=>setToast(null),4200);
    }
    function flagExercise(reason){
      const next={...flagged,[ex.id]:{reason}};
      setFlagged(next);
      try{ if(window.localStorage) localStorage.setItem('elan_difficulties',JSON.stringify(next)); }catch(e){}
      outcomeRef.current[ex.id]='hard'; window.__logSession(ex.id,'hard',ex.area);
      setFlagOpen(false);
      setToast('C\u2019est noté — Élan allègera « '+ex.name+' » lors de tes prochaines séances.');
      setTimeout(()=>setToast(null),3600);
    }

    // reset au changement d'exercice / série / phase
    React.useEffect(()=>{
      fired.current=false;
      if(phase==='rest'){ const rs=restKindRef.current==='side'?7:restSec; setRemaining(rs); setRunning(true); }
      else { setRemaining(ex.workSec||0); setRunning(false); }
    },[exIdx,setNum,phase]);
    // pré-remplir poids/reps depuis la dernière séance (musculation salle)
    React.useEffect(()=>{ const e=exs[exIdx]; if(e&&e.weighted){ const last=window.__lastStrength(e.id); setLoadW(last?last.weight:10); setLoadR(last?last.reps:(e.reps||8)); } },[exIdx]);

    // tic
    React.useEffect(()=>{
      if(!running || remaining<=0) return undefined;
      const id=setTimeout(()=>setRemaining(r=>r-1),1000);
      return ()=>clearTimeout(id);
    },[running,remaining]);

    // bips 3 dernières s + fin
    React.useEffect(()=>{
      if(!running) return;
      if(remaining<=3 && remaining>=1) beep(phase==='rest'?640:920,0.10);
      if(remaining===0 && !fired.current){
        fired.current=true;
        beep(phase==='rest'?1046:1320,0.30,0.20);
        setRunning(false);
        setTimeout(()=>{ phase==='rest'?endRest():completeSet(); },140);
      }
    },[remaining,running,phase]);

    function completeSet(){
      if(isEach && sideRef.current==='left'){ restKindRef.current='side'; setPhase('rest'); return; }
      if(setNum<sets){ restKindRef.current='set'; setPhase('rest'); }
      else if(exIdx<exs.length-1 && restSec>0){ restKindRef.current='next'; setPhase('rest'); }
      else { advance(); }
    }
    function endRest(){
      if(restKindRef.current==='side'){ setSide('right'); setPhase('work'); }
      else if(restKindRef.current==='next'){ advance(); }
      else { setSide('left'); setPhase('work'); setSetNum(n=>n+1); }
    }
    function advance(){
      if(ex.weighted){ window.__logStrength(ex.id, ex.name, ex.sets, loadW, loadR); }
      if(!ex.weighted && (ex.phase||'main')==='main' && !loggedRef.current.has(ex.id)){
        loggedRef.current.add(ex.id);
        const out=outcomeRef.current[ex.id];
        if(out!=='easy'&&out!=='hard') window.__logSession(ex.id,'ok',ex.area,program.tier);
      }
      setDone(d=>{const n=new Set(d);n.add(exIdx);return n;});
      setSide('left');
      if(exIdx<exs.length-1){ setExIdx(i=>i+1); setSetNum(1); setPhase('work'); }
      else { window.__clearSessionState(); setAllDone(true); }
    }
    function jump(i){ if(i<0||i>exs.length-1) return; setExIdx(i); setSetNum(1); setPhase('work'); setSide('left'); }
    const startWork=()=>{ unlockAudio(); setRunning(true); };

    const specReps=ex.reps;
    const lastLoad = ex.weighted ? window.__lastStrength(ex.id) : null;
    const cardBg = phase==='rest' ? C.tint : C.card;

    const [summary,setSummary]=React.useState(null);
    React.useEffect(()=>{
      if(!allDone||summary) return;
      const before=window.__streak();
      const __ci=window.__readCheckin(); const __forme=(__ci&&__ci.metrics)?window.__readiness(__ci.metrics).readiness:null;
      const __areas=[...new Set((program.exercises||[]).filter(e=>e.phase!=='warmup'&&e.phase!=='cooldown').map(e=>e.area).filter(Boolean))];
      window.__logSessionDone({id:program.sessionId||(program.custom?'custom':program.gym?'gym'+program.gymId:'ia'), region:program.region||'', intent:program.intent||'', dorsi:(program.exercises||[]).some(e=>/^dorsi/.test(e.id||'')), title:program.title||'Séance', duration:program.duration||0, areas:__areas, forme:__forme});
      const streak=window.__streak();
      const week=window.__weekDoneCount();
      const goal=4;
      const gains=exs.filter(e=>e.prog==='up').length;
      const levelUps=Object.keys(outcomeRef.current).filter(id=>outcomeRef.current[id]==='easy').length;
      const milestones=[];
      if(streak>=2) milestones.push({icon:'flame', t:`${streak} jours d'affilée`, d: streak>=before&&before>0?'tu prolonges ta série, continue !':'ta série redémarre, bravo.'});
      if(week>=goal) milestones.push({icon:'target', t:`Objectif semaine atteint`, d:`${week}/${goal} séances cette semaine.`});
      else milestones.push({icon:'target', t:`${week}/${goal} cette semaine`, d:`plus que ${goal-week} pour ton objectif hebdo.`});
      if(gains>0) milestones.push({icon:'trend', t:`${gains} exercice${gains>1?'s':''} en progression`, d:'tu as poussé un cran plus loin.'});
      if(levelUps>0) milestones.push({icon:'star', t:`${levelUps} niveau${levelUps>1?'x':''} gagné${levelUps>1?'s':''}`, d:'« trop facile » → je corse la prochaine fois.'});
      setSummary({streak,week,goal,milestones,grew:streak>before});
    },[allDone]);
    if(allDone){ const s=summary||{streak:1,week:1,goal:4,milestones:[],grew:false};
     const Ico=({k})=>k==='flame'?<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-3 .5 2 2 2 2 2 1-2-1-4 1-8z"/></svg>
       :k==='target'?<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>
       :k==='trend'?<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg>
       :<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 9 22 9 16 14 18 21 12 17 6 21 8 14 2 9 9 9"/></svg>;
     return (
      <div style={{display:'flex',flexDirection:'column',minHeight:'100%',alignItems:'center',justifyContent:'center',padding:'36px 28px',textAlign:'center',overflowY:'auto'}} className="hidescroll">
        <div style={{position:'relative',marginBottom:18}}>
          <div style={{width:96,height:96,borderRadius:'50%',background:'conic-gradient('+C.teal+' '+Math.min(100,s.streak/7*100)+'%, rgba(47,191,161,0.12) 0)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{width:78,height:78,borderRadius:'50%',background:C.card,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',boxShadow:'inset 0 0 0 1px '+C.line}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:30,fontWeight:600,color:C.ink,lineHeight:1}}>{s.streak}</span>
              <span style={{fontSize:9.5,color:C.muted,letterSpacing:'0.06em',marginTop:1}}>JOURS</span>
            </div>
          </div>
          <div style={{position:'absolute',right:-4,bottom:-4,width:32,height:32,borderRadius:'50%',background:C.orange,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 3px 10px rgba(242,96,46,0.4)'}}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-3 .5 2 2 2 2 2 1-2-1-4 1-8z"/></svg>
          </div>
        </div>
        <h2 style={{fontFamily:'Georgia,serif',fontSize:26,fontWeight:600,color:C.ink,marginBottom:6}}>Bravo, {window.ED.user} !</h2>
        <p style={{fontSize:13.5,color:C.muted,marginBottom:20,lineHeight:1.5}}>{program.duration} min · séance enregistrée.{s.grew?' Tu prolonges ta série 🔥':' Chaque séance compte.'}</p>
        <div style={{width:'100%',display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
          {s.milestones.map((m,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:11,background:C.bg,border:`1px solid ${C.line}`,borderRadius:14,padding:'11px 14px',textAlign:'left',animation:`riseIn 360ms cubic-bezier(.22,1,.36,1) ${i*80}ms both`}}>
              <div style={{width:34,height:34,borderRadius:10,background:C.card,border:`1px solid ${C.line}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Ico k={m.icon}/></div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:13.5,fontWeight:600,color:C.ink}}>{m.t}</div><div style={{fontSize:11.5,color:C.muted,marginTop:1}}>{m.d}</div></div>
            </div>
          ))}
        </div>
        <Btn variant="primary" size="lg" fullWidth onClick={onBack}>Retour à l'accueil</Btn>
      </div>
    );}

    return (
      <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',padding:'12px 0 14px'}}>
        {/* top bar */}
        <div style={{padding:'4px 20px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <button onClick={onBack} title="Retour" style={{width:46,height:46,borderRadius:'50%',background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',touchAction:'manipulation'}}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{textAlign:'center'}}>
            <p style={{fontSize:11,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase'}}>{program.title}</p>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.body,marginTop:2}}>Exercice {exIdx+1} / {exs.length}</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5,background:C.card,borderRadius:99,padding:'6px 11px',border:`1px solid ${C.line}`,boxShadow:C.sh}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.body}}>{program.readiness}</span>
          </div>
        </div>

        {/* progress dots */}
        <div style={{display:'flex',gap:4,padding:'8px 20px 0'}}>
          {exs.map((_,i)=>(
            <div key={i} onClick={()=>jump(i)} style={{flex:1,paddingTop:10,paddingBottom:10,cursor:'pointer',touchAction:'manipulation'}}>
              <div style={{height:5,borderRadius:3,background:done.has(i)?C.teal:i===exIdx?C.ink:'rgba(14,81,74,0.12)',transition:'all 250ms ease'}}/>
            </div>
          ))}
        </div>

        {/* main card */}
        <div style={{flex:1,minHeight:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'10px 20px',overflow:'hidden'}}>
          <div className="hidescroll" style={{background:cardBg,border:`1px solid ${phase==='rest'?'rgba(47,191,161,0.25)':C.line}`,borderRadius:28,padding:'14px 20px',boxShadow:C.shLg,transition:'background 300ms ease',maxHeight:'calc(100% - 70px)',overflowY:'auto'}}>

            {phase==='work' ? (<>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <span style={{fontSize:12,fontWeight:600,color:aColor,letterSpacing:'0.07em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:8}}><span style={{width:6,height:6,borderRadius:'50%',background:aColor}}/>{ex.phase==='warmup'?'Échauffement':ex.phase==='cooldown'?'Retour au calme':AREA_LABELS[ex.area]}</span>
                {sets>1&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.muted}}>Série {setNum}/{sets}</span>}
              </div>
              <h2 style={{fontFamily:'Georgia,serif',fontSize:26,fontWeight:600,color:C.ink,letterSpacing:'-0.02em',lineHeight:1.15,marginBottom:6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{ex.name}</h2>
              {(ex.levelNote||ex.tempo||ex.mod)&&(
                <div style={{display:'flex',gap:6,marginBottom:10,overflow:'hidden'}}>
                  {ex.levelNote&&<span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,fontWeight:600,color:C.tealDk,background:'rgba(47,191,161,0.12)',border:'1px solid rgba(47,191,161,0.28)',borderRadius:99,padding:'3px 9px'}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>{ex.levelNote}</span>}
                  {(ex.tempo||ex.mod)&&<span style={{fontSize:11,fontWeight:600,color:C.orange,background:'rgba(224,138,11,0.1)',border:'1px solid rgba(224,138,11,0.26)',borderRadius:99,padding:'3px 9px'}}>{ex.tempo||ex.mod}</span>}
                </div>
              )}
              {/* set dots */}
              {/* set dots + côté sur une seule ligne */}
              {(sets>1||isEach)&&(
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:8}}>
                  <div style={{display:'flex',gap:6}}>{sets>1&&Array.from({length:sets}).map((_,i)=><div key={i} style={{width:9,height:9,borderRadius:'50%',background:i+1<setNum?C.teal:i+1===setNum?accent:'rgba(14,81,74,0.12)',boxShadow:i+1===setNum?`0 0 0 4px ${accent}22`:'none'}}/>)}</div>
                  {isEach && (
                    <span style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(47,191,161,0.10)',border:'1px solid rgba(47,191,161,0.30)',borderRadius:99,padding:'6px 8px 6px 13px',fontSize:13,fontWeight:600,color:C.tealDk,whiteSpace:'nowrap'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                      {sideCap} {sideHuman}
                      <span style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:99,padding:'2px 8px',color:C.muted,fontWeight:500,fontFamily:"'DM Mono',monospace",fontSize:11}}>{side==='left'?'1ᵉʳ':'2ᵉ'}</span>
                    </span>
                  )}
                </div>
              )}

              {isTimed ? (<>
                <div onClick={running?()=>setRunning(false):startWork} role="button" title={running?'Pause':'Démarrer'} style={{cursor:'pointer',touchAction:'manipulation',borderRadius:'50%',width:'fit-content',margin:'0 auto'}}>
                  <CircleTimer total={ex.workSec} remaining={remaining} color={accent} running={running} size={164} label={running?'touchez · pause':(remaining<ex.workSec?'touchez · reprendre':'touchez · démarrer')} />
                </div>
                <button onClick={completeSet} style={{marginTop:14,width:'100%',minHeight:48,borderRadius:16,background:C.card,border:`1.5px solid ${C.line2}`,cursor:'pointer',color:C.body,fontSize:15,fontWeight:600,fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:8,touchAction:'manipulation'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Valider la série</button>
              </>) : ex.weighted ? (<>
                {lastLoad&&<div style={{textAlign:'center',marginBottom:14,fontSize:12.5,color:C.muted}}>Dernière séance : <b style={{color:C.tealDk,fontFamily:"'DM Mono',monospace"}}>{lastLoad.weight} kg × {lastLoad.reps}</b> · vise un peu plus !</div>}
                <div style={{display:'flex',gap:10,marginBottom:14}}>
                  <Stepper label="Poids" value={loadW} step={2.5} unit="kg" onChange={setLoadW}/>
                  <Stepper label="Répétitions" value={loadR} step={1} min={1} onChange={setLoadR}/>
                </div>
                <p style={{textAlign:'center',fontSize:12,color:C.faint,marginBottom:16}}>Cible : {ex.doseText}</p>
                <Btn variant={peak?'energy':'primary'} size="lg" fullWidth onClick={completeSet}>{setNum<sets?`Série ${setNum} faite ✓`:(exIdx===exs.length-1?'Terminer la séance ✦':'Exercice terminé →')}</Btn>
              </>) : (<>
                <div onClick={completeSet} role="button" title="Valider" style={{cursor:'pointer',touchAction:'manipulation',borderRadius:20,padding:'8px 0 4px',transition:'background 160ms'}}>
                  <div style={{textAlign:'center',margin:'4px 0 4px'}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:64,fontWeight:500,color:accent,lineHeight:1}}>{specReps}</span>
                    <span style={{display:'block',fontSize:13,color:C.muted,marginTop:6,letterSpacing:'0.04em'}}>répétitions</span>
                  </div>
                  <p style={{textAlign:'center',fontSize:12,color:C.faint,margin:'6px 0 0',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11.5V6a1.5 1.5 0 0 1 3 0v5"/><path d="M12 11V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M15 11V6.5a1.5 1.5 0 0 1 3 0V13a6 6 0 0 1-6 6h-1.5a4 4 0 0 1-2.8-1.2l-3-3a1.5 1.5 0 0 1 2.1-2.1L9 14.5"/></svg>Touchez pour valider</p>
                </div>
                <Btn variant={peak?'energy':'primary'} size="lg" fullWidth onClick={completeSet}>{setNum<sets?'Série terminée ✓':(exIdx===exs.length-1?'Terminer la séance ✦':'Exercice terminé →')}</Btn>
              </>)}
              {/* utility row: Infos toujours · Facile/Difficile si exo principal */}
              <div style={{display:'flex',gap:8,marginTop:12}}>
                <button onClick={()=>setInfoOpen(true)} style={{flex:1,minHeight:48,display:'flex',alignItems:'center',justifyContent:'center',gap:6,background:C.tint,border:`1px solid rgba(47,191,161,0.28)`,borderRadius:13,cursor:'pointer',color:C.tealDk,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap',touchAction:'manipulation'}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>
                  Infos
                </button>
                {isFlagged ? (
                  <div style={{flex:2,minHeight:48,display:'flex',alignItems:'center',justifyContent:'center',gap:7,fontSize:12.5,color:C.tealDk,fontWeight:600,background:'rgba(47,191,161,0.10)',border:`1px solid rgba(47,191,161,0.28)`,borderRadius:13}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Signalé — j'allège la prochaine fois
                  </div>
                ) : !ex.weighted && (ex.phase||'main')==='main' ? (<>
                  <button onClick={markEasy} style={{flex:1,minHeight:48,display:'flex',alignItems:'center',justifyContent:'center',gap:6,background:C.tint,border:`1px solid rgba(47,191,161,0.30)`,borderRadius:13,cursor:'pointer',color:C.tealDk,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap',touchAction:'manipulation'}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                    Facile
                  </button>
                  <button onClick={()=>setFlagOpen(true)} style={{flex:1,minHeight:48,display:'flex',alignItems:'center',justifyContent:'center',gap:6,background:C.bg,border:`1px solid ${C.line2}`,borderRadius:13,cursor:'pointer',color:C.body,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap',touchAction:'manipulation'}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.body} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    Difficile
                  </button>
                </>) : null}
              </div>
            </>) : (()=>{ const isNextRest=restKindRef.current==='next'; const isSideRest=restKindRef.current==='side'; const nextEx=exs[exIdx+1]; return (<>
              <div style={{margin:'auto 0',width:'100%'}}>
              {/* REST */}
              <div style={{textAlign:'center',marginBottom:18}}>
                <span style={{fontSize:12,fontWeight:600,color:C.tealDk,letterSpacing:'0.08em',textTransform:'uppercase'}}>{isSideRest?'Change de côté':isNextRest?'Transition · récupération':'Repos'}</span>
                {isSideRest ? (<>
                  <p style={{fontSize:13,color:C.muted,marginTop:8}}>Même exercice, autre côté</p>
                  <p style={{fontFamily:'Georgia,serif',fontSize:21,fontWeight:600,color:C.ink,marginTop:2,lineHeight:1.2}}>{sideCap} {fem?'droite':'droit'}</p>
                  <p style={{fontSize:12.5,color:C.muted,marginTop:3}}>installe-toi, ça redémarre tout seul</p>
                </>) : isNextRest&&nextEx ? (<>
                  <p style={{fontSize:13,color:C.muted,marginTop:8}}>Prochain exercice</p>
                  <p style={{fontFamily:'Georgia,serif',fontSize:19,fontWeight:600,color:C.ink,marginTop:2,lineHeight:1.2}}>{nextEx.name}</p>
                  <p style={{fontSize:12.5,color:C.muted,marginTop:3,fontFamily:"'DM Mono',monospace"}}>{nextEx.doseText}</p>
                </>) : (<>
                  <p style={{fontSize:14,color:C.body,marginTop:8}}>Prochaine : <b style={{color:C.ink}}>série {setNum+1} / {sets}</b></p>
                  <p style={{fontSize:13,color:C.muted,marginTop:2}}>{ex.name}</p>
                </>)}
              </div>
              <CircleTimer total={isSideRest?7:restSec} remaining={remaining} color={C.teal} running={running} label={isSideRest?'change de côté':'récupère'} fill />
              <div style={{display:'flex',gap:10,marginTop:24}}>
                <Btn variant="soft" size="lg" fullWidth onClick={()=>setRemaining(r=>r+15)}>+15 s</Btn>
                <Btn variant="primary" size="lg" fullWidth onClick={()=>{setRunning(false);endRest();}}>Passer →</Btn>
              </div>
              </div>
            </>);})()}
          </div>

          {/* exercise nav */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginTop:16,flexShrink:0}}>
            <button onClick={()=>jump(exIdx-1)} disabled={exIdx===0} style={{flex:1,minHeight:48,background:exIdx===0?'transparent':C.card,border:`1px solid ${exIdx===0?'transparent':C.line}`,boxShadow:exIdx===0?'none':C.sh,borderRadius:14,cursor:exIdx===0?'default':'pointer',color:exIdx===0?C.faint:C.body,fontSize:14,fontWeight:600,fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:6,touchAction:'manipulation'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>Préc.</button>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.faint,flexShrink:0}}>{exIdx+1} / {exs.length}</span>
            <button onClick={()=>jump(exIdx+1)} disabled={exIdx===exs.length-1} style={{flex:1,minHeight:48,background:exIdx===exs.length-1?'transparent':C.card,border:`1px solid ${exIdx===exs.length-1?'transparent':C.line}`,boxShadow:exIdx===exs.length-1?'none':C.sh,borderRadius:14,cursor:exIdx===exs.length-1?'default':'pointer',color:exIdx===exs.length-1?C.faint:C.body,fontSize:14,fontWeight:600,fontFamily:"'DM Sans',sans-serif",display:'flex',alignItems:'center',justifyContent:'center',gap:6,touchAction:'manipulation'}}>Suiv.<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>

        {flagOpen && (
          <div onClick={()=>setFlagOpen(false)} style={{position:'absolute',inset:0,zIndex:300,background:'rgba(14,81,74,0.34)',backdropFilter:'blur(3px)',WebkitBackdropFilter:'blur(3px)',display:'flex',alignItems:'flex-end'}}>
            <div onClick={e=>e.stopPropagation()} style={{width:'100%',background:C.card,borderRadius:'26px 26px 0 0',padding:'10px 22px 28px',boxShadow:'0 -10px 40px rgba(14,81,74,0.2)',animation:'sheetUp 340ms cubic-bezier(.22,1,.36,1)'}}>
              <div style={{width:40,height:4,borderRadius:2,background:C.line2,margin:'0 auto 18px'}}/>
              <h3 style={{fontFamily:'Georgia,serif',fontSize:21,fontWeight:600,color:C.ink,marginBottom:6}}>C'était trop dur ?</h3>
              <p style={{fontSize:13.5,color:C.body,lineHeight:1.5,marginBottom:18}}>Dis-moi ce qui n'allait pas sur <b style={{color:C.ink}}>{ex.name}</b>. J'allègerai cet exercice lors de tes prochaines séances.</p>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {[{r:'Trop intense',d:'Je réduis les répétitions et la durée.'},{r:'Douleur ou gêne',d:'Je propose une variante plus douce.'},{r:'Équilibre difficile',d:'Je sécurise avec plus d\u2019appui.'}].map(o=>(
                  <button key={o.r} onClick={()=>flagExercise(o.r)} style={{textAlign:'left',background:C.bg,border:`1px solid ${C.line}`,borderRadius:14,padding:'13px 15px',cursor:'pointer',display:'flex',alignItems:'center',gap:12,fontFamily:"'DM Sans',sans-serif"}}>
                    <div style={{flex:1}}><div style={{fontSize:14.5,fontWeight:600,color:C.ink}}>{o.r}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{o.d}</div></div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
              <button onClick={()=>setFlagOpen(false)} style={{display:'block',margin:'16px auto 0',background:'none',border:'none',color:C.muted,fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Annuler</button>
            </div>
          </div>
        )}
        {infoOpen && (
          <div onClick={()=>setInfoOpen(false)} style={{position:'absolute',inset:0,zIndex:300,background:'rgba(14,81,74,0.34)',backdropFilter:'blur(3px)',WebkitBackdropFilter:'blur(3px)',display:'flex',alignItems:'flex-end'}}>
            <div onClick={e=>e.stopPropagation()} className="hidescroll" style={{width:'100%',maxHeight:'82%',overflowY:'auto',background:C.card,borderRadius:'26px 26px 0 0',padding:'10px 22px 26px',boxShadow:'0 -10px 40px rgba(14,81,74,0.2)',animation:'sheetUp 340ms cubic-bezier(.22,1,.36,1)'}}>
              <div style={{width:40,height:4,borderRadius:2,background:C.line2,margin:'0 auto 18px'}}/>
              <span style={{fontSize:12,fontWeight:600,color:aColor,letterSpacing:'0.06em',textTransform:'uppercase'}}>{ex.phase==='warmup'?'Échauffement':ex.phase==='cooldown'?'Retour au calme':AREA_LABELS[ex.area]}</span>
              <h3 style={{fontFamily:'Georgia,serif',fontSize:23,fontWeight:600,color:C.ink,margin:'4px 0 14px',lineHeight:1.15}}>{ex.name}</h3>
              <p style={{fontSize:14.5,color:C.body,lineHeight:1.6,marginBottom:(ex.conseil||(ex.flagged&&ex.alternative))?16:4}}>{ex.desc}</p>
              {ex.flagged&&ex.alternative && (
                <div style={{display:'flex',gap:10,alignItems:'flex-start',background:'rgba(224,138,11,0.09)',border:'1px solid rgba(224,138,11,0.26)',borderRadius:14,padding:'13px 14px',marginBottom:12}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg><span style={{fontSize:13.5,color:C.body,lineHeight:1.5}}><b style={{color:C.amber}}>Version allégée — </b>{ex.alternative}</span></div>
              )}
              {ex.conseil && (
                <div style={{display:'flex',gap:10,alignItems:'flex-start',background:C.tint,border:'1px solid rgba(47,191,161,0.22)',borderRadius:14,padding:'13px 14px'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg><span style={{fontSize:13.5,color:C.body,lineHeight:1.5}}><b style={{color:C.tealDk}}>Conseil — </b>{ex.conseil}</span></div>
              )}
              <button onClick={()=>setInfoOpen(false)} style={{marginTop:20,width:'100%',minHeight:50,borderRadius:14,background:C.ink,color:'#fff',border:'none',fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",touchAction:'manipulation'}}>J'ai compris</button>
            </div>
          </div>
        )}
        {toast && (
          <div style={{position:'absolute',bottom:26,left:20,right:20,zIndex:320,background:C.ink,color:'#fff',borderRadius:16,padding:'14px 16px',display:'flex',alignItems:'center',gap:11,boxShadow:'0 12px 34px rgba(14,81,74,0.3)',animation:'toastUp 320ms cubic-bezier(.22,1,.36,1)'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{fontSize:13,lineHeight:1.4}}>{toast}</span>
          </div>
        )}
      </div>
    );
  }
  window.ES.FocusScreen=FocusScreen;
})();
/* components block 5 */
(function(){
  const { RingChart, LineChart, BrandMark, AREA_LABELS, AREA_COLORS, C } = window.EC;

  function FocusBalance() {
    const areas=window.__focusAreas(30);
    const order=['lower','balance','core','upper','proprioception','cardio','stretching'];
    const card={background:C.card,border:`1px solid ${C.line}`,borderRadius:20,boxShadow:C.sh};
    if(!areas.length){
      return (
        <div style={{...card,padding:'18px 18px 20px',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            <span style={{fontSize:11,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase'}}>Répartition · 30 j</span>
          </div>
          <h3 style={{fontFamily:'Georgia,serif',fontSize:19,fontWeight:600,color:C.ink,margin:'0 0 8px'}}>Tes zones travaillées</h3>
          <p style={{fontSize:13,color:C.muted,lineHeight:1.5}}>Dès tes premières séances, Élan affichera ici la répartition de ton travail par zone (bas du corps, équilibre, gainage…) et veillera à l'équilibre.</p>
        </div>
      );
    }
    const total=areas.reduce((s,a)=>s+a.count,0);
    const maxC=areas[0].count;
    const ideal=total/areas.length;
    const dev=areas.reduce((s,a)=>s+Math.abs(a.count-ideal),0)/(2*total);
    const balance=Math.round((1-dev)*100);
    const lvl=balance>=85?'Programme complet':balance>=70?'Bel équilibre':balance>=55?'En progression':'À diversifier';
    const top=areas[0], low=areas[areas.length-1];
    const weeks=window.__focusWeeks();
    const badges=window.__focusBadges();
    return (
      <div style={{...card,padding:'18px 18px 20px',marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              <span style={{fontSize:11,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase'}}>Répartition · 30 j</span>
            </div>
            <h3 style={{fontFamily:'Georgia,serif',fontSize:19,fontWeight:600,color:C.ink,margin:0}}>Tes zones travaillées</h3>
          </div>
          <div style={{textAlign:'center',flexShrink:0,background:C.bg,border:`1px solid ${C.line}`,borderRadius:14,padding:'8px 12px'}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:24,fontWeight:500,color:balance>=70?C.teal:C.amber,lineHeight:1}}>{balance}</div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:'0.04em',marginTop:3}}>ÉQUILIBRE</div>
          </div>
        </div>
        <div style={{display:'inline-flex',alignItems:'center',gap:6,background:balance>=70?'rgba(47,191,161,0.12)':'rgba(224,138,11,0.12)',border:`1px solid ${balance>=70?'rgba(47,191,161,0.28)':'rgba(224,138,11,0.3)'}`,borderRadius:99,padding:'5px 12px',marginBottom:18}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={balance>=70?C.tealDk:C.amber} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/></svg>
          <span style={{fontSize:12.5,fontWeight:600,color:balance>=70?C.tealDk:C.amber}}>{lvl}</span>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:11,marginBottom:16}}>
          {areas.map((a,i)=>{const col=AREA_COLORS[a.key]||C.teal;const pct=Math.round(a.count/total*100);return(
            <div key={a.key} style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:12.5,color:C.body,width:98,flexShrink:0}}>{AREA_LABELS[a.key]}</span>
              <div style={{flex:1,height:9,borderRadius:99,background:'rgba(14,81,74,0.06)',overflow:'hidden'}}>
                <div style={{width:`${Math.round(a.count/maxC*100)}%`,height:'100%',borderRadius:99,background:col,transformOrigin:'left',animation:`barGrow 620ms cubic-bezier(.22,1,.36,1) ${i*60}ms both`}}/>
              </div>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.muted,width:30,textAlign:'right',flexShrink:0}}>{pct}%</span>
            </div>);})}
        </div>
        <div style={{display:'flex',gap:10,alignItems:'flex-start',background:C.bg,border:`1px solid ${C.line}`,borderRadius:12,padding:'12px 13px',marginBottom:18}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span style={{fontSize:12.5,color:C.body,lineHeight:1.5}}>Tu travailles surtout le <b style={{color:C.ink}}>{AREA_LABELS[top.key].toLowerCase()}</b>. La <b style={{color:C.ink}}>{AREA_LABELS[low.key].toLowerCase()}</b> reste en retrait — Élan ajoutera des exercices ciblés les prochaines semaines pour rééquilibrer.</span>
        </div>
        {weeks.length>1 && (<>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
          <span style={{fontSize:11,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase'}}>Évolution · {weeks.length} semaines</span>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'flex-end',marginBottom:12}}>
          {weeks.map(w=>{const tot=order.reduce((s,k)=>s+(w[k]||0),0)||1;return(
            <div key={w.label} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
              <div style={{width:'100%',maxWidth:34,height:76,display:'flex',flexDirection:'column-reverse',borderRadius:7,overflow:'hidden',border:`1px solid ${C.line}`}}>
                {order.map(k=>{const h=(w[k]||0)/tot*100;return h>0?<div key={k} style={{height:`${h}%`,background:AREA_COLORS[k]}}/>:null;})}
              </div>
              <span style={{fontSize:10,color:C.faint,fontFamily:"'DM Mono',monospace"}}>{w.label}</span>
            </div>);})}
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'7px 12px',marginBottom:18}}>
          {order.map(k=>(<span key={k} style={{display:'flex',alignItems:'center',gap:5,fontSize:10.5,color:C.muted}}><span style={{width:8,height:8,borderRadius:2,background:AREA_COLORS[k]}}/>{AREA_LABELS[k]}</span>))}
        </div>
        </>)}
        <div style={{display:'flex',gap:8}}>
          {badges.map(b=>(
            <div key={b.id} style={{flex:1,textAlign:'center',background:b.earned?C.bg:'transparent',border:`1px solid ${b.earned?C.line:'rgba(14,81,74,0.07)'}`,borderRadius:14,padding:'12px 6px',opacity:b.earned?1:0.62}}>
              <div style={{width:38,height:38,borderRadius:'50%',margin:'0 auto 7px',display:'flex',alignItems:'center',justifyContent:'center',background:b.earned?b.color+'1f':'rgba(14,81,74,0.05)',border:`1px solid ${b.earned?b.color+'55':C.line}`}}>
                {b.icon==='flame'&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={b.earned?b.color:C.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-3 .5 2 2 2 2 2 1-2-1-4 1-8z"/></svg>}
                {b.icon==='compass'&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={b.earned?b.color:C.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="16 8 11 11 8 16 13 13 16 8"/></svg>}
                {b.icon==='activity'&&<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={b.earned?b.color:C.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
              </div>
              <div style={{fontSize:11.5,fontWeight:600,color:b.earned?C.ink:C.muted,lineHeight:1.2}}>{b.label}</div>
              <div style={{fontSize:9.5,color:C.faint,marginTop:2,lineHeight:1.2}}>{b.earned?b.sub:(b.progress+'/'+b.total)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function StrengthProgress(){
    const sessions=window.ED.gymSessions||[];
    const EXCLUDE=new Set(['gym1-3','gym2-3']); // biceps curl, mollets à la machine — exclus du suivi de charge
    const weighted=sessions.flatMap(s=>s.exercises.filter(e=>e.weighted && !EXCLUDE.has(e.id)));
    const fmt=n=>n.toLocaleString('fr-FR');
    function series(region){
      const exs=weighted.filter(e=>e.region===region);
      const byDate={};
      exs.forEach(e=>{ const m=window.__mergedStrength(e.id); m.forEach(en=>{ byDate[en.date]=(byDate[en.date]||0)+en.weight*en.reps*(e.sets||1); }); });
      const dates=Object.keys(byDate).sort();
      const ton=dates.map(d=>Math.round(byDate[d]));
      const perEx=exs.map(e=>{ const m=window.__mergedStrength(e.id); if(!m.length) return null; const last=m[m.length-1], prev=m.length>1?m[m.length-2]:null; return {name:e.name,sets:e.sets,last,deltaW:prev?+(last.weight-prev.weight).toFixed(1):0}; }).filter(Boolean).sort((a,b)=>(b.last.weight*b.last.reps)-(a.last.weight*a.last.reps));
      return {ton,perEx};
    }
    const groups=[{key:'upper',label:'Haut du corps',color:'#2FA56B'},{key:'lower',label:'Bas du corps',color:'#12A38C'}].map(g=>({...g,...series(g.key)})).filter(g=>g.ton.length);
    if(!groups.length) return null;
    const card={background:C.card,border:`1px solid ${C.line}`,borderRadius:20,boxShadow:C.sh};
    return (
      <div style={{...card,padding:'18px 18px 18px',marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5l11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M6.5 17.5l-2 2M19.5 6.5l-2 2"/></svg>
          <span style={{fontSize:11,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase'}}>Force en salle · tonnage</span>
        </div>
        <h3 style={{fontFamily:'Georgia,serif',fontSize:19,fontWeight:600,color:C.ink,margin:'0 0 16px'}}>Ta progression en charge</h3>
        {groups.map((g,gi)=>{
          const last=g.ton[g.ton.length-1], prev=g.ton.length>1?g.ton[g.ton.length-2]:last, dT=last-prev;
          return (
            <div key={g.key} style={{marginBottom:gi<groups.length-1?18:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:8}}>
                <span style={{display:'flex',alignItems:'center',gap:7,fontSize:13.5,fontWeight:600,color:C.ink}}><span style={{width:9,height:9,borderRadius:3,background:g.color,flexShrink:0}}/>{g.label}</span>
                <span style={{display:'flex',alignItems:'baseline',gap:8,flexShrink:0}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:17,fontWeight:500,color:C.ink}}>{fmt(last)} kg</span>
                  <span style={{fontSize:11,fontWeight:600,color:dT>=0?C.tealDk:C.amber}}>{dT>=0?'+':''}{fmt(dT)}</span>
                </span>
              </div>
              <LineChart data={g.ton} color={g.color} height={62}/>
              <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:10}}>
                {g.perEx.slice(0,4).map(e=>(
                  <div key={e.name} style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{flex:1,minWidth:0,fontSize:12.5,color:C.body,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.name}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:11.5,color:C.muted,flexShrink:0}}>{e.last.weight}kg × {e.last.reps} × {e.sets}</span>
                    {e.deltaW!==0 && <span style={{fontSize:10.5,fontWeight:600,flexShrink:0,color:e.deltaW>0?C.tealDk:C.amber,background:e.deltaW>0?'rgba(47,191,161,0.12)':'rgba(224,138,11,0.12)',borderRadius:99,padding:'2px 7px'}}>{e.deltaW>0?'+':''}{e.deltaW}kg</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        <p style={{fontSize:11.5,color:C.muted,margin:'4px 0 0',lineHeight:1.5}}>Tonnage = poids × répétitions × séries, additionné sur la séance.</p>
      </div>
    );
  }

  /* ── Jauge d'objectif long terme : départ → actuel → cible ── */
  function GoalGauge({g}){
    const card={background:C.card,border:`1px solid ${C.line}`,borderRadius:18,boxShadow:C.sh};
    return (
      <div style={{...card,padding:'15px 16px 17px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:13}}>
          <div><div style={{display:'flex',alignItems:'center',gap:7,fontSize:14.5,fontWeight:600,color:C.ink}}><span style={{width:8,height:8,borderRadius:'50%',background:g.color}}/>{g.label}</div><div style={{fontSize:12,color:C.muted,marginTop:2,marginLeft:15}}>{g.sub}</div></div>
          {g.done
            ? <span style={{fontSize:11,fontWeight:600,color:C.tealDk,background:'rgba(47,191,161,0.14)',border:'1px solid rgba(47,191,161,0.3)',borderRadius:99,padding:'3px 10px'}}>Atteint ✦</span>
            : <span style={{display:'flex',alignItems:'center',gap:6}}>
                {g.palier>1 && <span style={{fontSize:10.5,fontWeight:600,color:C.tealDk,background:'rgba(47,191,161,0.14)',border:'1px solid rgba(47,191,161,0.3)',borderRadius:99,padding:'2px 8px'}}>Palier {g.palier}</span>}
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600,color:g.color}}>{g.pct}%</span>
              </span>}
        </div>
        <div style={{position:'relative',height:10,borderRadius:99,background:'rgba(14,81,74,0.08)',marginBottom:9}}>
          <div style={{position:'absolute',inset:0,width:`${g.pct}%`,borderRadius:99,background:`linear-gradient(90deg,${g.color}99,${g.color})`,transition:'width 700ms cubic-bezier(.22,1,.36,1)'}}/>
          <div style={{position:'absolute',top:'50%',left:`calc(${g.pct}% - 7px)`,transform:'translateY(-50%)',width:14,height:14,borderRadius:'50%',background:'#fff',boxShadow:`0 1px 4px rgba(14,81,74,0.3),0 0 0 3px ${g.color}`}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.faint}}>
          <span>Départ <b style={{color:C.muted,fontFamily:"'DM Mono',monospace"}}>{g.start}{g.unit}</b></span>
          <span style={{color:g.color,fontWeight:600}}>Actuel <b style={{fontFamily:"'DM Mono',monospace"}}>{g.current}{g.unit}</b></span>
          <span>Cible <b style={{color:C.muted,fontFamily:"'DM Mono',monospace"}}>{g.target}{g.unit}</b></span>
        </div>
      </div>
    );
  }

  /* ── Test de marche 6 min : graphe daté ── */
  function Walk6Chart({ list, color }){
    const n=list.length; if(!n) return null;
    const data=list.map(e=>e.m);
    const W=320,H=158,padX=24,topY=30,botY=110,dateY=140;
    const min=Math.min(...data), max=Math.max(...data), rng=(max-min)||1;
    const xs=list.map((e,i)=> n===1 ? W/2 : padX+(i/(n-1))*(W-2*padX));
    const ys=data.map(v=> topY+(1-(v-min)/rng)*(botY-topY));
    const line=xs.map((x,i)=>`${i?'L':'M'}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
    const area=`${line} L${xs[n-1].toFixed(1)} ${botY} L${xs[0].toFixed(1)} ${botY} Z`;
    const fmt=(s)=>{ const d=new Date(s+'T00:00'); return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'}).replace('.',''); };
    const gid='w6'+color.replace(/[^a-z0-9]/gi,'');
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block',overflow:'visible'}}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} stopOpacity="0.20"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        {n>1 && <path d={area} fill={`url(#${gid})`}/>}
        {n>1 && <path d={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>}
        {list.map((e,i)=>{ const last=i===n-1; return (
          <g key={i}>
            <circle cx={xs[i]} cy={ys[i]} r={last?5.5:4} fill={last?color:'#fff'} stroke={color} strokeWidth={last?0:2.4}/>
            <text x={xs[i]} y={ys[i]-11} textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="12.5" fontWeight="500" fill={C.ink}>{e.m}</text>
            <text x={xs[i]} y={dateY} textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontSize="11" fill={C.faint}>{fmt(e.date)}</text>
          </g>
        );})}
      </svg>
    );
  }

  function Walk6Card(){
    const color='#0B8071';
    const [list,setList]=React.useState(()=>window.__readWalk6());
    const [adding,setAdding]=React.useState(false);
    const [manage,setManage]=React.useState(false);
    const fmtLong=(s)=>{ const d=new Date(s+'T00:00'); return d.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}); };
    function remove(date){ const nl=window.__removeWalk6(date); setList(nl); if(nl.length===0) setManage(false); }
    const last=list[list.length-1], prev=list[list.length-2];
    const delta = last&&prev ? last.m-prev.m : null;
    const today=new Date().toISOString().slice(0,10);
    const [m,setM]=React.useState(()=> last?last.m:300 );
    const [date,setDate]=React.useState(today);
    function open(){ setM(last?last.m:300); setDate(new Date().toISOString().slice(0,10)); setAdding(true); }
    function save(){ const nl=window.__addWalk6(m,date); setList(nl); setAdding(false); }
    const card={background:C.card,border:`1px solid rgba(11,128,113,0.25)`,borderRadius:20,boxShadow:C.sh};
    const stepBtn={width:46,height:46,borderRadius:13,border:`1px solid ${C.line}`,background:C.card,color:C.tealDk,fontSize:24,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",flexShrink:0,userSelect:'none'};
    return (
      <div style={{...card,padding:'18px 16px 16px',marginBottom:22}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:13,background:'rgba(11,128,113,0.10)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><path d="M6.5 17.5C9 15 9.5 12 11 11s3.5-1.5 6-6" strokeDasharray="0.1 3.4"/></svg>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <span style={{fontSize:15.5,fontWeight:600,color:C.ink}}>Test de marche · 6 min</span>
              <span style={{fontSize:10,fontWeight:600,color:color,background:'rgba(11,128,113,0.10)',border:`1px solid rgba(11,128,113,0.28)`,borderRadius:99,padding:'2px 8px',letterSpacing:'0.03em'}}>TEST LIBRE</span>
            </div>
            <div style={{fontSize:12,color:C.muted,marginTop:3,lineHeight:1.45}}>Distance parcourue en 6 min. Énergivore — à faire quand tu te sens en forme, en dehors du bilan.</div>
          </div>
        </div>

        {list.length>0 ? (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:10,marginBottom:4,padding:'0 2px'}}>
            <div style={{display:'flex',alignItems:'baseline',gap:10}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:30,fontWeight:500,color:C.ink,lineHeight:1}}>{last.m}<span style={{fontSize:14,color:C.muted,marginLeft:3}}>m</span></span>
              {delta!=null && <span style={{fontSize:12.5,fontWeight:600,color:delta>0?C.tealDk:delta<0?C.amber:C.faint}}>{delta>0?`▲ +${delta} m`:delta<0?`▼ ${delta} m`:'= stable'} <span style={{color:C.faint,fontWeight:400}}>vs préc.</span></span>}
            </div>
            <button onClick={()=>setManage(v=>!v)} style={{background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:12.5,fontWeight:600,color:manage?C.tealDk:C.muted,padding:'2px 4px'}}>{manage?'Terminé':'Gérer'}</button>
          </div>
        ) : (
          <div style={{fontSize:13,color:C.muted,textAlign:'center',padding:'18px 8px'}}>Aucun résultat pour l'instant — ajoute ta première distance ci-dessous.</div>
        )}

        {list.length>0 && !manage && <Walk6Chart list={list} color={color}/>}

        {list.length>0 && manage && (
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:6,marginBottom:2}}>
            {list.slice().reverse().map(function(e){ return (
              <div key={e.date} style={{display:'flex',alignItems:'center',gap:12,background:C.bg,border:`1px solid ${C.line}`,borderRadius:12,padding:'10px 12px'}}>
                <span style={{flex:1,fontSize:13,color:C.body}}>{fmtLong(e.date)}</span>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:500,color:C.ink}}>{e.m} m</span>
                <button onClick={()=>remove(e.date)} aria-label="Supprimer" style={{width:34,height:34,borderRadius:10,border:`1px solid rgba(224,138,11,0.3)`,background:'rgba(224,138,11,0.08)',color:C.amber,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            );})}
          </div>
        )}

        {!adding ? (
          <button onClick={open} style={{marginTop:12,width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:'rgba(11,128,113,0.08)',border:`1px solid rgba(11,128,113,0.26)`,color:color,borderRadius:13,padding:'12px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter un résultat
          </button>
        ) : (
          <div style={{marginTop:14,background:C.bg,border:`1px solid ${C.line}`,borderRadius:16,padding:'16px 14px'}}>
            <div style={{fontSize:11,fontWeight:600,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase',textAlign:'center',marginBottom:14}}>Distance parcourue</div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:16,marginBottom:16}}>
              <button onClick={()=>setM(v=>Math.max(0,v-10))} style={stepBtn}>−</button>
              <div style={{minWidth:120,textAlign:'center'}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:44,fontWeight:500,color:color,lineHeight:1}}>{m}</span>
                <span style={{display:'block',fontSize:12,color:C.muted,marginTop:3}}>mètres</span>
              </div>
              <button onClick={()=>setM(v=>v+10)} style={stepBtn}>+</button>
            </div>
            <label style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,background:C.card,border:`1px solid ${C.line}`,borderRadius:12,padding:'10px 14px',marginBottom:14}}>
              <span style={{fontSize:13,color:C.body,fontWeight:500}}>Date du test</span>
              <input type="date" value={date} max={today} onChange={e=>setDate(e.target.value)} style={{border:'none',background:'none',fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.ink,textAlign:'right'}}/>
            </label>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setAdding(false)} style={{flex:1,background:C.card,border:`1px solid ${C.line}`,color:C.muted,borderRadius:12,padding:'12px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Annuler</button>
              <button onClick={save} style={{flex:2,background:`linear-gradient(135deg,#17A98C,${color})`,border:'none',color:'#fff',borderRadius:12,padding:'12px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 6px 16px rgba(11,128,113,0.3)'}}>Enregistrer</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function DataSettings({ onClose, onRedoBaseline, onResetAll }){
    const [confirm,setConfirm]=React.useState(null);
    const hasBaseline=window.__hasBaseline();
    const sec={fontSize:11,color:C.muted,letterSpacing:'0.07em',textTransform:'uppercase',fontWeight:600,margin:'22px 2px 10px'};
    const card={background:C.card,border:`1px solid ${C.line}`,borderRadius:16,boxShadow:C.sh,padding:'16px'};
    return (
      <div className="scroll" style={{position:'absolute',inset:0,zIndex:240,background:C.bg}}>
        <div style={{minHeight:'100%',padding:'22px 22px 40px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <span style={{fontSize:11,color:C.muted,letterSpacing:'0.09em',textTransform:'uppercase',fontWeight:600}}>Réglages</span>
            <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,borderRadius:99,width:34,height:34,cursor:'pointer',color:C.body,fontSize:17,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
          </div>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:30,fontWeight:600,color:C.ink,letterSpacing:'-0.02em',margin:'0 0 6px'}}>Tes données</h2>
          <p style={{fontSize:13,color:C.muted,lineHeight:1.5}}>Tes données restent sur cet appareil. Tu peux refaire ton test d'entrée ou tout effacer ici.</p>

          <div style={sec}>Test d'entrée</div>
          <div style={card}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div style={{width:40,height:40,borderRadius:11,background:C.tint,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
              <div style={{flex:1}}>
                <div style={{fontSize:14.5,fontWeight:600,color:C.ink}}>Refaire le test d'entrée</div>
                <div style={{fontSize:12.5,color:C.muted,lineHeight:1.45,marginTop:2}}>{hasBaseline?'Recalcule ton niveau de référence et tes objectifs. Ton historique de séances est conservé.':"Tu n'as pas encore fait de test d'entrée."}</div>
              </div>
            </div>
            {confirm==='baseline'
              ? <div style={{marginTop:14,background:'rgba(224,138,11,0.07)',border:'1px solid rgba(224,138,11,0.28)',borderRadius:12,padding:'12px 13px'}}>
                  <div style={{fontSize:13,color:C.body,lineHeight:1.45,marginBottom:12}}>Ton test d'entrée et les objectifs qui en découlent seront <b>recalculés</b>. Continuer ?</div>
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>setConfirm(null)} style={{flex:1,background:C.card,border:`1px solid ${C.line}`,color:C.muted,borderRadius:11,padding:'11px',fontSize:13.5,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Annuler</button>
                    <button onClick={()=>{onClose&&onClose();onRedoBaseline&&onRedoBaseline();}} style={{flex:1,background:C.amber,border:'none',color:'#fff',borderRadius:11,padding:'11px',fontSize:13.5,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Refaire</button>
                  </div>
                </div>
              : <button onClick={()=>setConfirm('baseline')} style={{marginTop:14,width:'100%',background:C.tint,border:`1px solid ${C.line}`,color:C.tealDk,borderRadius:11,padding:'11px',fontSize:13.5,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Refaire le test d'entrée</button>}
          </div>

          <div style={sec}>Zone de danger</div>
          <div style={{...card,borderColor:'rgba(194,65,12,0.25)'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div style={{width:40,height:40,borderRadius:11,background:'rgba(194,65,12,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
              <div style={{flex:1}}>
                <div style={{fontSize:14.5,fontWeight:600,color:'#C2410C'}}>Réinitialiser toutes les données</div>
                <div style={{fontSize:12.5,color:C.muted,lineHeight:1.45,marginTop:2}}>Efface le test d'entrée, l'historique des séances, les tests mensuels, le 6 min, les charges et la progression. Irréversible.</div>
              </div>
            </div>
            {confirm==='reset'
              ? <div style={{marginTop:14,background:'rgba(194,65,12,0.06)',border:'1px solid rgba(194,65,12,0.28)',borderRadius:12,padding:'12px 13px'}}>
                  <div style={{fontSize:13,color:C.body,lineHeight:1.45,marginBottom:12}}>Cette action <b style={{color:'#C2410C'}}>supprime définitivement</b> toutes tes données et redémarre l'app comme au premier lancement. Es-tu sûr ?</div>
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>setConfirm(null)} style={{flex:1,background:C.card,border:`1px solid ${C.line}`,color:C.muted,borderRadius:11,padding:'11px',fontSize:13.5,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Annuler</button>
                    <button onClick={()=>{onResetAll&&onResetAll();}} style={{flex:1,background:'#C2410C',border:'none',color:'#fff',borderRadius:11,padding:'11px',fontSize:13.5,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Tout effacer</button>
                  </div>
                </div>
              : <button onClick={()=>setConfirm('reset')} style={{marginTop:14,width:'100%',background:'rgba(194,65,12,0.06)',border:'1px solid rgba(194,65,12,0.3)',color:'#C2410C',borderRadius:11,padding:'11px',fontSize:13.5,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Réinitialiser toutes les données</button>}
          </div>
        </div>
      </div>
    );
  }

  function ProgressScreen({ onOpenBilan, bilanDone, onRedoBaseline, onResetAll }) {
    const TESTS=window.ED.tests;
    const [tab,setTab]=React.useState('reg');
    const [showData,setShowData]=React.useState(false);
    const [manageTest,setManageTest]=React.useState(null);
    const [,forceTick]=React.useReducer(x=>x+1,0);
    /* données 100% réelles (localStorage) */
    const bilans=window.__readBilans();
    const formeHistory=window.__formeHistory(14);
    const recentSessions=window.__recentSessions(6);
    const lastB=bilans[bilans.length-1]||{}, prevB=bilans[bilans.length-2]||{};
    const testRows=TESTS.map(function(tt){
      const allPts=bilans.map(b=>({month:b.month,v:b[tt.key]})).filter(p=>p.v!=null);
      const pts=allPts.filter(p=>!window.__bilanHiddenHas(p.month,tt.key));
      const series=pts.map(p=>p.v);
      const now=series.length?series[series.length-1]:null;
      const prev=series.length>1?series[series.length-2]:null;
      return {...tt, allPts, pts, series, now, d:(now??0)-(prev??0)};
    });
    const fhFirst=formeHistory[0], fhLast=formeHistory[formeHistory.length-1];
    const pctForme=(formeHistory.length>1&&fhFirst)?Math.round((fhLast-fhFirst)/fhFirst*100):0;
    const goals=window.__longTermGoals();
    const streak=window.__streak(), record=window.__bestStreak(), weekCount=window.__weekDoneCount();
    const monthKey=(function(){ const n=new Date(); return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0'); })();
    const monthCount=[...new Set(window.__sessHistory().filter(e=>e.date.slice(0,7)===monthKey).map(e=>e.date))].length;
    const isRecord=streak>0&&streak>=record;
    const card={background:C.card,border:`1px solid ${C.line}`,borderRadius:20,boxShadow:C.sh};
    const emptyCard={...card,padding:'22px 18px',textAlign:'center',color:C.muted,fontSize:13,lineHeight:1.5};
    const TABS=[['reg','Régularité'],['force','Force & objectifs'],['tests','Tests']];
    return (
      <div style={{minHeight:'100%',padding:'24px 24px'}}>
        {showData && <DataSettings onClose={()=>setShowData(false)} onRedoBaseline={onRedoBaseline} onResetAll={onResetAll}/>}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
          <p style={{fontSize:11,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase',margin:0,paddingTop:4}}>Tes progrès</p>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button onClick={()=>setShowData(true)} aria-label="Réglages des données" style={{width:34,height:34,borderRadius:'50%',background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:C.body}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            <BrandMark/>
          </div>
        </div>
        <h2 style={{fontFamily:'Georgia,serif',fontSize:32,fontWeight:600,color:C.ink,letterSpacing:'-0.02em',marginBottom:18}}>Bilan</h2>

        {/* sous-onglets */}
        <div style={{display:'flex',gap:6,background:'rgba(14,81,74,0.05)',borderRadius:14,padding:4,marginBottom:22}}>
          {TABS.map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:12.5,fontWeight:600,padding:'9px 4px',borderRadius:10,border:'none',cursor:'pointer',background:tab===id?C.card:'transparent',color:tab===id?C.ink:C.muted,boxShadow:tab===id?C.sh:'none',transition:'all 180ms ease'}}>{label}</button>
          ))}
        </div>

        {tab==='reg'&&(<>
          <div style={{display:'flex',alignItems:'center',gap:18,marginBottom:20}}>
            <RingChart value={weekCount} max={Math.max(4,weekCount)} size={124}/>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:12}}>
              <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:28,fontWeight:500,color:C.orange,lineHeight:1}}>{streak}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>jours de suite</div></div>
              <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:28,fontWeight:500,color:C.teal,lineHeight:1}}>{monthCount}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>séances ce mois</div></div>
            </div>
          </div>
          {/* record — seulement quand il y a une vraie série à montrer */}
          {record>=2 && (
          <div style={{...card,padding:'14px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:13,background:isRecord?'linear-gradient(135deg,#FFE9E0,#FFF4EF)':C.card,border:isRecord?'1px solid rgba(242,96,46,0.3)':`1px solid ${C.line}`}}>
            <div style={{width:42,height:42,borderRadius:12,background:isRecord?'rgba(242,96,46,0.16)':'rgba(224,138,11,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isRecord?C.orange:C.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M5 9H3a2 2 0 0 1 0-4h2M19 9h2a2 2 0 0 0 0-4h-2"/></svg></div>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.ink}}>{isRecord?'Nouveau record de régularité !':'Record de régularité'}</div><div style={{fontSize:12.5,color:C.body,marginTop:1}}>{isRecord?`${streak} jours d'affilée — ton meilleur enchaînement.`:`Ta meilleure série : ${record} jours. Plus que ${record-streak} pour l'égaler !`}</div></div>
          </div>)}
          {/* Analyse IA — seulement avec assez de check-in réels */}
          {formeHistory.length>=2 && (
          <div style={{background:'linear-gradient(135deg,rgba(47,191,161,0.12),rgba(47,191,161,0.04))',border:'1px solid rgba(47,191,161,0.25)',borderRadius:18,padding:'16px',marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/></svg>
              <span style={{fontSize:12,fontWeight:600,color:C.tealDk,letterSpacing:'0.04em'}}>Analyse Élan · IA</span>
            </div>
            <p style={{fontSize:13.5,color:C.body,lineHeight:1.55}}>Sur tes <b style={{color:C.ink}}>{formeHistory.length}</b> derniers check-in, ta forme va de <b style={{color:C.ink}}>{fhFirst} → {fhLast}</b> ({pctForme>0?'+':''}{pctForme}%).{bilans.length>=2&&lastB.sts!=null&&prevB.sts!=null?<> Et sur la chaise au mur, tu passes de <b style={{color:C.ink}}>{prevB.sts} → {lastB.sts} s</b> de tenue en un mois.</>:''} {streak>=2?'Garde ce rythme — la régularité, c\'est ce qui fait progresser dans la SEP.':'Continue à enchaîner les séances pour voir la tendance se dessiner.'}</p>
          </div>)}
          {formeHistory.length>=2
            ? <div style={{...card,padding:'16px 14px 12px',marginBottom:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10,padding:'0 4px'}}><span style={{fontSize:11,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase'}}>Forme du jour · {formeHistory.length} j</span>{pctForme>0&&<span style={{fontSize:12,color:C.tealDk,fontWeight:600}}>↗ en hausse</span>}</div>
                <LineChart data={formeHistory} color={C.teal} height={92} dotsEvery={Math.max(1,Math.round(formeHistory.length/5))}/>
              </div>
            : <div style={{...emptyCard,marginBottom:20}}>Ta courbe de forme apparaîtra ici dès tes premiers check-in du jour.</div>}
          <p style={{fontSize:11,color:C.muted,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:12}}>Récentes</p>
          {recentSessions.length
            ? <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {recentSessions.map((s,i)=>(<div key={i} style={{...card,padding:'12px 14px',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:s.forme>=70?'rgba(242,96,46,0.12)':'rgba(47,191,161,0.10)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:`1px solid ${s.forme>=70?'rgba(242,96,46,0.25)':'rgba(47,191,161,0.22)'}`}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:500,color:s.forme>=70?C.orange:C.tealDk}}>{s.forme||'·'}</span></div>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:500,color:C.ink}}>{s.title}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{s.date}{s.duration?` · ${s.duration} min`:''}</div></div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>))}
          </div>
            : <div style={emptyCard}>Aucune séance pour l'instant. Ta première séance terminée s'affichera ici.</div>}
        </>)}

        {tab==='force'&&(<>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.5" fill={C.orange}/></svg>
            <span style={{fontSize:13,fontWeight:600,color:C.ink}}>Tes objectifs long terme</span>
          </div>
          <p style={{fontSize:12.5,color:C.muted,lineHeight:1.5,marginBottom:16}}>Fixés depuis ton bilan de référence, suivis à chaque bilan mensuel.</p>
          {goals.length
            ? <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24}}>
                {goals.map(g=><GoalGauge key={g.key} g={g}/>)}
              </div>
            : <div style={{...emptyCard,marginBottom:24}}>Tes objectifs apparaîtront ici une fois ton <b style={{color:C.ink}}>test d'entrée</b> réalisé.</div>}
          <FocusBalance/>
          <StrengthProgress/>
        </>)}

        {tab==='tests'&&(<>
          {!bilanDone&&(
            <div onClick={onOpenBilan} style={{cursor:'pointer',background:'linear-gradient(135deg,#FFE9E0,#FFF4EF)',border:'1px solid rgba(242,96,46,0.28)',borderRadius:18,padding:'16px',marginBottom:20,display:'flex',alignItems:'center',gap:12,boxShadow:C.sh}}>
              <div style={{width:42,height:42,borderRadius:12,background:'rgba(242,96,46,0.14)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.ink,textTransform:'capitalize'}}>Bilan de {window.ED.monthLabel}</div><div style={{fontSize:12,color:C.body,marginTop:1}}>À compléter — 1 fois par mois</div></div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          )}
          <Walk6Card/>
          <div style={{display:'flex',alignItems:'center',gap:10,margin:'2px 0 14px'}}>
            <span style={{fontSize:11,fontWeight:600,color:C.muted,letterSpacing:'0.07em',textTransform:'uppercase',whiteSpace:'nowrap'}}>Tests mensuels</span>
            <span style={{flex:1,height:1,background:C.line}}/>
          </div>
          <p style={{fontSize:12.5,color:C.muted,lineHeight:1.5,marginBottom:16}}>Tes tests mensuels, mesurés dans les mêmes conditions chaque mois.</p>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {testRows.map(x=>{const up=x.d>0,flat=x.d===0;const managing=manageTest===x.key;const hasData=x.series.length>0;return(
              <div key={x.key} style={{...card,padding:'16px 14px 12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:10,padding:'0 4px'}}>
                  <div><span style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.muted,letterSpacing:'0.05em',textTransform:'uppercase'}}><span style={{width:7,height:7,borderRadius:'50%',background:x.color}}/>{x.short}</span><span style={{fontSize:12.5,color:C.body}}>{x.label} · {x.sub}</span></div>
                  <div style={{textAlign:'right'}}>
                    {hasData
                      ? <><div style={{fontFamily:"'DM Mono',monospace",fontSize:24,fontWeight:500,color:C.ink}}>{x.now}<span style={{fontSize:12,color:C.muted,marginLeft:3}}>{x.unit}</span></div><span style={{fontSize:12,fontWeight:600,color:up?C.tealDk:flat?C.faint:C.amber}}>{x.series.length>1?(up?`▲ +${x.d}`:flat?'= stable':`▼ ${x.d}`)+(flat?'':' vs mois préc.'):'1 mesure'}</span></>
                      : <span style={{fontSize:12,color:C.faint}}>aucune mesure</span>}
                  </div>
                </div>
                {managing ? (
                  <div style={{display:'flex',flexDirection:'column',gap:7,margin:'4px 0 2px'}}>
                    {x.allPts.length===0 && <div style={{fontSize:12.5,color:C.faint,textAlign:'center',padding:'8px'}}>Aucune mesure enregistrée.</div>}
                    {x.allPts.map(function(p){ const hidden=window.__bilanHiddenHas(p.month,x.key); return (
                      <div key={p.month} style={{display:'flex',alignItems:'center',gap:10,background:C.bg,border:`1px solid ${C.line}`,borderRadius:11,padding:'9px 11px',opacity:hidden?0.55:1}}>
                        <span style={{flex:1,fontSize:12.5,color:C.body}}>{p.month}</span>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:500,color:C.ink,textDecoration:hidden?'line-through':'none'}}>{p.v}{x.unit}</span>
                        <button onClick={()=>{window.__toggleBilanHidden(p.month,x.key);forceTick();}} style={{display:'flex',alignItems:'center',gap:5,height:30,padding:'0 10px',borderRadius:9,border:`1px solid ${hidden?'rgba(47,191,161,0.3)':'rgba(224,138,11,0.3)'}`,background:hidden?'rgba(47,191,161,0.08)':'rgba(224,138,11,0.08)',color:hidden?C.tealDk:C.amber,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,flexShrink:0}}>
                          {hidden
                            ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/></svg>Rétablir</>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>}
                        </button>
                      </div>
                    );})}
                  </div>
                ) : hasData ? (
                  <>
                    {x.series.length>1
                      ? <LineChart data={x.series} color={x.color} height={78}/>
                      : <div style={{height:78,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12.5,color:C.faint}}>Une seule mesure — le graphe apparaît dès la 2ᵉ.</div>}
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:8,padding:'0 4px'}}>{x.pts.map((p,i)=><span key={i} style={{fontSize:10,color:C.faint}}>{p.month}</span>)}</div>
                  </>
                ) : (
                  <div style={{height:60,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12.5,color:C.faint}}>Toutes les mesures ont été supprimées.</div>
                )}
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                  <button onClick={()=>setManageTest(managing?null:x.key)} style={{background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:managing?C.tealDk:C.muted,padding:'2px 4px'}}>{managing?'Terminé':'Gérer les mesures'}</button>
                </div>
              </div>
            );})}
          </div>
        </>)}
      </div>
    );
  }
  window.ES.ProgressScreen=ProgressScreen;
})();
/* components block 6 */
(function(){
  const { CircleTimer, Btn, EnergyGauge, LogoMark, beep, unlockAudio, C } = window.EC;
  const TESTS = window.ED.tests;
  const cardBase={background:C.card,border:`1px solid ${C.line}`,borderRadius:22,boxShadow:C.sh};

  /* ── petit pas-à-pas +/− ── */
  function NumStepper({value,min,max,step,unit,color,onChange}){
    const bs={width:52,height:52,borderRadius:16,border:`1px solid ${C.line}`,background:C.card,color:C.tealDk,fontSize:26,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",boxShadow:C.sh,flexShrink:0,userSelect:'none'};
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:20}}>
        <button onClick={()=>onChange(Math.max(min,value-step))} style={bs}>−</button>
        <div style={{minWidth:110,textAlign:'center'}}>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:52,fontWeight:500,color:color||C.ink,lineHeight:1}}>{value}</span>
          <span style={{display:'block',fontSize:12.5,color:C.muted,marginTop:5}}>{unit}</span>
        </div>
        <button onClick={()=>onChange(Math.min(max,value+step))} style={bs}>+</button>
      </div>
    );
  }

  /* ── bloc « comment faire » ── */
  function How({steps}){
    return (
      <ol style={{margin:'0 0 22px',padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:10}}>
        {steps.map((s,i)=>(
          <li key={i} style={{display:'flex',gap:11,alignItems:'flex-start'}}>
            <span style={{flexShrink:0,width:22,height:22,borderRadius:'50%',background:'rgba(47,191,161,0.12)',border:'1px solid rgba(47,191,161,0.3)',color:C.tealDk,fontFamily:"'DM Mono',monospace",fontSize:11.5,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',marginTop:1}}>{i+1}</span>
            <span style={{fontSize:13.5,color:C.body,lineHeight:1.5}}>{s}</span>
          </li>
        ))}
      </ol>
    );
  }

  function SafetyNote({children}){
    return (
      <div style={{display:'flex',gap:9,alignItems:'flex-start',background:'rgba(224,138,11,0.08)',border:'1px solid rgba(224,138,11,0.24)',borderRadius:13,padding:'11px 13px',marginBottom:22}}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
        <span style={{fontSize:12.5,color:C.body,lineHeight:1.45}}>{children}</span>
      </div>
    );
  }

  /* ── Test 1 · Chaise contre le mur (wall sit) — tenue max ── */
  function WallStep({last,value,setValue}){
    const CAP=180;
    const [t,setT]=React.useState(value!=null?value:0);
    const [running,setRunning]=React.useState(false);
    React.useEffect(()=>{
      if(!running) return undefined;
      if(t>=CAP){ setRunning(false); setValue(CAP); beep(560,0.24); return undefined; }
      const id=setTimeout(()=>setT(x=>x+1),1000);
      return ()=>clearTimeout(id);
    },[running,t]);
    function start(){ unlockAudio(); setT(0); setRunning(true); beep(900,0.12); }
    function stop(){ setRunning(false); beep(560,0.24); setValue(Math.min(CAP,t)); }
    const display = running ? t : (value!=null?value:0);
    return (
      <div>
        <How steps={["Dos plaqué contre un mur, glisse vers le bas jusqu'à ce que tes cuisses soient presque parallèles au sol (genoux vers 90°).","Pieds écartés largeur de hanches, bien à plat, bras relâchés le long du corps.","Démarre le chrono et tiens la position le plus longtemps possible.","Arrête dès que tu remontes ou que tu décolles du mur."]}/>
        <SafetyNote>Garde une chaise ou un appui juste à côté de toi. Ne descends pas plus bas que ce qui reste confortable pour tes genoux.</SafetyNote>
        <div style={{...cardBase,padding:'24px 20px 22px',textAlign:'center'}}>
          <CircleTimer total={CAP} remaining={display} color="#12A38C" running={running} label={running?'tiens la position':(value!=null?'ta tenue':'prêt')}/>
          <div style={{marginTop:22}}>
            {!running
              ? <Btn variant="primary" size="lg" fullWidth onClick={start}>{value!=null?'Refaire le test':'Démarrer le chrono'}</Btn>
              : <Btn variant="soft" size="md" fullWidth onClick={stop}>J'ai lâché — arrêter</Btn>}
          </div>
          {value!=null&&!running&&<p style={{fontSize:12.5,color:C.muted,marginTop:14}}>Tenue : <b style={{color:C.ink}}>{value} s</b>{last!=null&&<span style={{color:C.faint}}> · le mois dernier {last} s</span>}</p>}
          {value==null&&last!=null&&<p style={{fontSize:12,color:C.faint,marginTop:14}}>Le mois dernier : <b style={{color:C.muted}}>{last} s</b></p>}
        </div>
      </div>
    );
  }

  /* ── Test 2 · Tenir sur un pied ── */
  function BalanceStep({last,legs,setLegs}){
    const CAP=60;
    const [active,setActive]=React.useState(legs.g==null?'g':legs.d==null?'d':'g');
    const [t,setT]=React.useState(0);
    const [running,setRunning]=React.useState(false);
    React.useEffect(()=>{
      if(!running) return undefined;
      if(t>=CAP){ stop(); return undefined; }
      const id=setTimeout(()=>setT(x=>x+1),1000);
      return ()=>clearTimeout(id);
    },[running,t]);
    function start(){ unlockAudio(); setT(0); setRunning(true); beep(900,0.1); }
    function stop(){ setRunning(false); const val=Math.min(CAP,t); beep(560,0.22); setLegs(l=>({...l,[active]:val})); if(active==='g'&&legs.d==null) setActive('d'); }
    const legName=active==='g'?'gauche':'droite';
    const best=Math.max(legs.g||0,legs.d||0);
    const Tile=({k,label})=>(
      <button onClick={()=>{ if(!running) setActive(k); }} style={{flex:1,textAlign:'center',background:active===k?'rgba(47,191,161,0.10)':C.bg,border:`1px solid ${active===k?'rgba(47,191,161,0.4)':C.line}`,borderRadius:14,padding:'12px 8px',cursor:running?'default':'pointer'}}>
        <div style={{fontSize:11.5,color:active===k?C.tealDk:C.muted,fontWeight:active===k?600:400,marginBottom:4}}>Jambe {label}</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:500,color:legs[k]!=null?C.ink:C.faint}}>{legs[k]!=null?legs[k]+' s':'—'}</div>
      </button>
    );
    return (
      <div>
        <How steps={["Tiens-toi près d'un mur ou d'un plan de travail, mains sur les hanches.","Lève un pied du sol, sans le poser sur l'autre jambe.","Démarre le chrono et tiens la position le plus longtemps possible.","Arrête dès que tu poses le pied ou attrapes un appui. Teste les deux jambes."]}/>
        <SafetyNote>Garde toujours une main près d'un appui. Le chrono s'arrête seul à 60 s.</SafetyNote>
        <div style={{...cardBase,padding:'22px 20px'}}>
          <div style={{display:'flex',gap:10,marginBottom:18}}><Tile k="g" label="gauche"/><Tile k="d" label="droite"/></div>
          <div style={{textAlign:'center',marginBottom:10}}><span style={{fontSize:12,color:C.muted}}>Chrono — jambe <b style={{color:C.tealDk}}>{legName}</b></span></div>
          <CircleTimer total={CAP} remaining={running?CAP-t:(legs[active]!=null?CAP-legs[active]:CAP)} color="#3A7FCC" running={running} label={running?`${t} s`:'prêt'}/>
          <div style={{textAlign:'center',marginTop:-78,marginBottom:48,pointerEvents:'none'}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:54,fontWeight:500,color:running&&t>=CAP-5?C.teal:C.ink}}>{running?t:(legs[active]!=null?legs[active]:0)}</span></div>
          <div style={{marginTop:8}}>
            {!running
              ? <Btn variant="primary" size="lg" fullWidth onClick={start}>{legs[active]!=null?`Refaire la jambe ${legName}`:`Démarrer · jambe ${legName}`}</Btn>
              : <Btn variant="soft" size="md" fullWidth onClick={stop}>J'ai posé le pied — arrêter</Btn>}
          </div>
          {best>0&&<p style={{fontSize:12,color:C.muted,textAlign:'center',marginTop:14}}>Meilleure jambe : <b style={{color:C.ink}}>{best} s</b>{last!=null&&<span style={{color:C.faint}}> · le mois dernier {last} s</span>}</p>}
        </div>
      </div>
    );
  }

  /* ── Test 3 · Flexion avant ── */
  function ReachStep({last,value,setValue}){
    return (
      <div>
        <How steps={["Assieds-toi au sol, jambes tendues, talons contre un mur ou un meuble bas.","Pose un mètre ruban le long de tes jambes, le 0 au niveau de tes orteils.","Penche-toi lentement vers l'avant, sans à-coups, et tiens 2 s.","Note où arrivent tes doigts : après les orteils = positif, avant = négatif."]}/>
        <div style={{...cardBase,padding:'24px 20px 22px',textAlign:'center'}}>
          <div style={{marginBottom:14}}><NumStepper value={value} min={-25} max={30} step={1} unit="cm (doigts ↔ orteils)" color="#7BA83E" onChange={setValue}/></div>
          {last!=null&&<p style={{fontSize:12,color:C.faint}}>Le mois dernier : <b style={{color:C.muted}}>{last} cm</b></p>}
          <p style={{fontSize:12,color:C.muted,marginTop:14,lineHeight:1.5}}>Pas besoin de forcer — on mesure ta souplesse du jour, pas un record.</p>
        </div>
      </div>
    );
  }

  function BilanMensuel({ onClose, onSave }) {
    const monthShort = new Intl.DateTimeFormat('fr-FR',{month:'short'}).format(new Date()).replace('.','').replace(/^./,c=>c.toUpperCase());
    const prevRef = React.useRef(null);
    if(prevRef.current===null){ const a=window.__readBilans(); let p={}; for(let i=a.length-1;i>=0;i--){ if(a[i].month!==monthShort){ p=a[i]; break; } } prevRef.current=p; }
    const prev = prevRef.current;
    const [step,setStep]=React.useState(0); // 0 intro · 1 sts · 2 pushup · 3 plank · 4 balance · 5 reach · résumé
    const [saved,setSaved]=React.useState(false);
    const [sts,setSts]=React.useState(null);
    const [pushup,setPushup]=React.useState(prev.pushup!=null?prev.pushup:5);
    const [plank,setPlank]=React.useState(null);
    const [legs,setLegs]=React.useState({g:null,d:null});
    const [reach,setReach]=React.useState(-1);
    const balance = Math.max(legs.g||0,legs.d||0);
    const res = {sts, pushup, plank, balance, reach};

    const STEPS=['sts','pushup','plank','balance','reach'];
    const LAST=STEPS.length; // 5
    const monthCap = (window.ED.monthLabel||'').replace(/^./,c=>c.toUpperCase());

    function save(){
      const m = monthShort;
      const entry={month:m, sts:res.sts, pushup:res.pushup, plank:res.plank, balance:res.balance, reach:res.reach};
      window.__saveBilan(entry);
      window.__markBilanDone();
      setSaved(true);
    }

    if(saved){
      const deltas=TESTS.map(tt=>({...tt, now:res[tt.key], was:prev[tt.key], d:(res[tt.key]??0)-(prev[tt.key]??0)}));
      const gained=deltas.filter(x=>x.d>0).length;
      return (
        <div style={{minHeight:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 30px',textAlign:'center'}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:'rgba(47,191,161,0.14)',border:'1px solid rgba(47,191,161,0.3)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:22}}><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:26,fontWeight:600,color:C.ink,marginBottom:8}}>Bilan enregistré</h2>
          <p style={{fontSize:14,color:C.muted,lineHeight:1.5,marginBottom:24}}>{gained>0?`${gained} test${gained>1?'s':''} en progression depuis le mois dernier. `:''}Tes résultats sont ajoutés à tes courbes.</p>
          <div style={{width:'100%',display:'flex',flexDirection:'column',gap:8,marginBottom:26}}>
            {deltas.map((x,i)=>{const up=x.d>0,flat=x.d===0;return(
              <div key={x.key} style={{display:'flex',alignItems:'center',gap:12,background:C.card,border:`1px solid ${C.line}`,borderRadius:14,padding:'12px 14px',textAlign:'left',animation:`riseIn 360ms cubic-bezier(.22,1,.36,1) ${i*80}ms both`}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:x.color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:13.5,fontWeight:600,color:C.ink}}>{x.short}</div><div style={{fontSize:11.5,color:C.muted}}>{x.label}</div></div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:18,fontWeight:500,color:C.ink}}>{x.now} <span style={{fontSize:11,color:C.muted}}>{x.unit}</span></div>
                  {x.was!=null&&<div style={{fontSize:11.5,fontWeight:600,color:up?C.tealDk:flat?C.faint:C.amber}}>{up?'▲ +':flat?'= ':'▼ '}{!flat&&Math.abs(x.d)}{flat?'stable':' vs mois dern.'}</div>}
                </div>
              </div>
            );})}
          </div>
          <Btn variant="primary" size="lg" fullWidth onClick={onSave}>Voir mes progrès →</Btn>
        </div>
      );
    }

    /* ── INTRO ── */
    if(step===0){
      return (
        <div style={{minHeight:'100%',padding:'18px 24px 36px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
            <span style={{fontSize:11,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase'}}>Bilan mensuel · 1×/mois</span>
            <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,borderRadius:99,width:32,height:32,cursor:'pointer',color:C.body,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
          </div>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:600,color:C.ink,letterSpacing:'-0.02em',marginBottom:8}}>Tes tests de {monthCap}</h2>
          <p style={{fontSize:13.5,color:C.body,marginBottom:24,lineHeight:1.55}}>3 petits tests chronométrés, les mêmes chaque mois, pour <b style={{color:C.ink}}>voir noir sur blanc</b> tes progrès en force et en mobilité. Compte ~5 minutes.</p>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
            {TESTS.map((tt,i)=>(
              <div key={tt.key} style={{...cardBase,padding:'14px 16px',display:'flex',alignItems:'center',gap:13}}>
                <div style={{width:38,height:38,borderRadius:11,background:'rgba(14,81,74,0.05)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:600,color:tt.color}}>{i+1}</div>
                <div style={{flex:1}}><div style={{fontSize:14.5,fontWeight:600,color:C.ink}}>{tt.label}</div><div style={{fontSize:12,color:C.muted,marginTop:1}}>{tt.short} · {tt.sub}</div></div>
              </div>
            ))}
          </div>
          <SafetyNote>Fais ces tests reposé·e, près d'un appui. En cas de poussée ou de grande fatigue, reporte-les de quelques jours.</SafetyNote>
          <Btn variant="primary" size="lg" fullWidth onClick={()=>setStep(1)}>Commencer les tests →</Btn>
        </div>
      );
    }

    /* ── ÉTAPES DE TEST ── */
    const ti=step-1; const tmeta=TESTS[ti];
    const stepValid = step===1 ? sts!=null : step===2 ? pushup!=null : step===3 ? plank!=null : step===4 ? (legs.g!=null||legs.d!=null) : true;
    return (
      <div style={{minHeight:'100%',padding:'18px 24px 36px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <button onClick={()=>setStep(s=>s-1)} style={{background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,borderRadius:99,width:32,height:32,cursor:'pointer',color:C.body,display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
          <span style={{fontSize:11,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase'}}>Test {step} / {LAST}</span>
          <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,borderRadius:99,width:32,height:32,cursor:'pointer',color:C.body,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        <div style={{display:'flex',gap:5,marginBottom:18}}>{STEPS.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:2,background:i<ti?C.teal:i===ti?C.ink:'rgba(14,81,74,0.12)',transition:'all 250ms ease'}}/>)}</div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}><span style={{width:8,height:8,borderRadius:'50%',background:tmeta.color}}/><span style={{fontSize:11.5,color:C.muted,letterSpacing:'0.05em',textTransform:'uppercase'}}>{tmeta.short}</span></div>
        <h2 style={{fontFamily:'Georgia,serif',fontSize:26,fontWeight:600,color:C.ink,letterSpacing:'-0.02em',marginBottom:18}}>{tmeta.label}</h2>

        {step===1 && <WallStep last={prev.sts} value={sts} setValue={setSts}/>}
        {step===2 && <CountStep color="#2FA56B" unit="pompes" max={50} value={pushup} setValue={setPushup} hint="Combien de pompes as-tu réussies ?"
          how={["Mains au sol un peu plus larges que les épaules, corps gainé — sur les pieds, ou sur les genoux si besoin.","Descends la poitrine vers le sol en pliant les coudes, puis repousse.","Enchaîne le plus possible en gardant le dos droit, sans creuser.","Note ton total dès que la forme se dégrade."]}
          safety="Même version que d'habitude (pieds ou genoux) pour comparer d'un mois à l'autre."/>}
        {step===3 && <HoldStep color="#0E8FB0" cap={180} value={plank} setValue={setPlank} liveLabel="tiens le gainage" doneLabel="ta tenue"
          how={["En appui sur les avant-bras et les pieds (ou les genoux), corps bien aligné.","Serre le ventre et les fessiers, ne creuse pas le dos.","Démarre le chrono et tiens la position le plus longtemps possible.","Arrête dès que la position se casse."]}
          safety="Sur les genoux si la version pieds est trop dure — garde la même version chaque mois."/>}
        {step===4 && <BalanceStep last={prev.balance} legs={legs} setLegs={setLegs}/>}
        {step===5 && <ReachStep last={prev.reach} value={reach} setValue={setReach}/>}

        <div style={{marginTop:24}}>
          {step<LAST
            ? <Btn variant="primary" size="lg" fullWidth onClick={()=>stepValid&&setStep(step+1)}>{stepValid?'Continuer →':'Fais le test pour continuer'}</Btn>
            : <Btn variant="primary" size="lg" fullWidth onClick={save}>Voir mon bilan ✦</Btn>}
        </div>
      </div>
    );
  }
  /* ════════════════ BILAN INITIAL · évaluation de référence (une seule fois) ════════════════ */
  function ReactionTest({value,onResult}){
    const TRIALS=4;
    const [phase,setPhase]=React.useState(value!=null?'done':'idle'); // idle|wait|go|tooearly|done
    const [results,setResults]=React.useState([]);
    const startRef=React.useRef(0), toRef=React.useRef(null);
    function arm(){ setPhase('wait'); toRef.current=setTimeout(()=>{ startRef.current=performance.now(); setPhase('go'); }, 900+Math.random()*2000); }
    function begin(){ setResults([]); arm(); }
    function tap(){
      if(phase==='wait'){ clearTimeout(toRef.current); beep(300,0.18); setPhase('tooearly'); setTimeout(arm,900); return; }
      if(phase==='go'){ const ms=Math.round(performance.now()-startRef.current); beep(880,0.08); const acc=[...results,ms]; setResults(acc);
        if(acc.length>=TRIALS){ setPhase('done'); onResult(Math.round(acc.reduce((s,x)=>s+x,0)/acc.length)); } else arm(); }
    }
    React.useEffect(()=>()=>clearTimeout(toRef.current),[]);
    const avg=results.length?Math.round(results.reduce((s,x)=>s+x,0)/results.length):value;
    const col={idle:C.muted,wait:C.amber,go:C.teal,tooearly:'#E0584B',done:C.tealDk}[phase];
    const lab={idle:'Touche pour démarrer',wait:'Attends le vert…',go:'VITE — touche !',tooearly:'Trop tôt !',done:'Terminé'}[phase];
    const bg={idle:C.bg,wait:'rgba(224,138,11,0.1)',go:'rgba(47,191,161,0.2)',tooearly:'rgba(224,88,75,0.12)',done:'rgba(47,191,161,0.1)'}[phase];
    return (
      <div style={{...cardBase,padding:'22px 20px',textAlign:'center'}}>
        <div onClick={()=>{ if(phase==='idle'||phase==='done') begin(); else if(phase==='wait'||phase==='go') tap(); }}
          style={{width:172,height:172,borderRadius:'50%',margin:'2px auto 0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',userSelect:'none',background:bg,border:`2px solid ${col}`,transition:'background 100ms ease'}}>
          <span style={{fontSize:15,fontWeight:600,color:col}}>{lab}</span>
          {results.length>0&&phase!=='done'&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.muted,marginTop:6}}>{results.length}/{TRIALS}</span>}
        </div>
        {phase==='done'
          ? <p style={{fontSize:13,color:C.body,marginTop:14}}>Réaction moyenne : <b style={{color:C.ink,fontFamily:"'DM Mono',monospace"}}>{avg} ms</b> · <span style={{color:C.tealDk,cursor:'pointer'}} onClick={begin}>refaire</span></p>
          : <p style={{fontSize:12,color:C.muted,marginTop:14,lineHeight:1.5}}>4 essais. Touche le cercle dès qu'il passe au vert — on mesure ta vivacité nerveuse du jour.</p>}
      </div>
    );
  }
  function CountStep({how,safety,unit,color,value,setValue,max,hint}){
    return (
      <div>
        <How steps={how}/>
        {safety&&<SafetyNote>{safety}</SafetyNote>}
        <div style={{...cardBase,padding:'24px 20px 22px',textAlign:'center'}}>
          {hint&&<p style={{fontSize:13,color:C.muted,marginBottom:14}}>{hint}</p>}
          <NumStepper value={value} min={0} max={max} step={1} unit={unit} color={color} onChange={setValue}/>
        </div>
      </div>
    );
  }
  function HoldStep({how,safety,color,cap,value,setValue,liveLabel,doneLabel}){
    const [t,setT]=React.useState(value!=null?value:0);
    const [running,setRunning]=React.useState(false);
    React.useEffect(()=>{ if(!running) return undefined; if(t>=cap){ setRunning(false); setValue(cap); beep(560,0.24); return undefined; } const id=setTimeout(()=>setT(x=>x+1),1000); return ()=>clearTimeout(id); },[running,t]);
    function start(){ unlockAudio(); setT(0); setRunning(true); beep(900,0.12); }
    function stop(){ setRunning(false); beep(560,0.24); setValue(Math.min(cap,t)); }
    const display=running?t:(value!=null?value:0);
    return (
      <div>
        <How steps={how}/>
        {safety&&<SafetyNote>{safety}</SafetyNote>}
        <div style={{...cardBase,padding:'24px 20px 22px',textAlign:'center'}}>
          <CircleTimer total={cap} remaining={display} color={color} running={running} label={running?liveLabel:(value!=null?doneLabel:'prêt')}/>
          <div style={{marginTop:22}}>
            {!running ? <Btn variant="primary" size="lg" fullWidth onClick={start}>{value!=null?'Refaire le test':'Démarrer le chrono'}</Btn>
                      : <Btn variant="soft" size="md" fullWidth onClick={stop}>J'ai lâché — arrêter</Btn>}
          </div>
          {value!=null&&!running&&<p style={{fontSize:12.5,color:C.muted,marginTop:14}}>Tenue : <b style={{color:C.ink}}>{value} s</b></p>}
        </div>
      </div>
    );
  }
  function Chip({on,onClick,children}){
    return <button onClick={onClick} style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,padding:'9px 14px',borderRadius:99,cursor:'pointer',background:on?'rgba(47,191,161,0.14)':C.card,color:on?C.tealDk:C.body,border:`1px solid ${on?'rgba(47,191,161,0.4)':C.line}`,transition:'all 150ms ease'}}>{children}</button>;
  }

  const PHYS=[
    {key:'squat',  label:'Squats — ton maximum', short:'Force jambes', color:'#12A38C'},
    {key:'wallSit',label:'Chaise contre le mur',  short:'Force jambes', color:'#12A38C'},
    {key:'pushup', label:'Pompes — ton maximum',  short:'Haut du corps',color:'#2FA56B'},
    {key:'plank',  label:'Gainage — planche',     short:'Tronc',        color:'#0E8FB0'},
    {key:'balance',label:'Tenir sur un pied',     short:'Équilibre',    color:'#3A7FCC'},
    {key:'reach',  label:'Flexion avant',         short:'Souplesse',    color:'#7BA83E'},
  ];
  const AREA_NAMES={lower:'Force des jambes',upper:'Haut du corps',core:'Gainage / tronc',balance:'Équilibre',stretching:'Souplesse',cardio:'Cardio / endurance'};
  const LVL_WORDS=['Tout en douceur','Base légère','Niveau modéré','Bon niveau','Niveau soutenu','Niveau avancé','Niveau expert'];

  function BilanInitial({onDone,onSkip}){
    const [step,setStep]=React.useState(-1); // -1 bienvenue · 0 cond · 1 profil · 2 neuro · 3-8 tests · 9 synthèse
    const [saved,setSaved]=React.useState(false);
    const [profile,setProfile]=React.useState({symptoms:[],activity:null,goals:[]});
    const [neuro,setNeuro]=React.useState({reactionMs:null,energy:null});
    const [squat,setSquat]=React.useState(8);
    const [wallSit,setWallSit]=React.useState(null);
    const [pushup,setPushup]=React.useState(4);
    const [plank,setPlank]=React.useState(null);
    const [legs,setLegs]=React.useState({g:null,d:null});
    const [reach,setReach]=React.useState(0);
    const tests={squat,wallSit,pushup,plank,balanceL:legs.g,balanceR:legs.d,reach};
    const toggle=(key,v)=>setProfile(p=>{const a=p[key]||[];return {...p,[key]:a.includes(v)?a.filter(x=>x!==v):[...a,v]};});

    function finish(){ window.__saveBaseline({profile,neuro,tests}); setSaved(true); }

    if(saved){
      const levels=window.__deriveBaseline(tests,profile);
      const rows=Object.keys(AREA_NAMES).map(k=>({k,name:AREA_NAMES[k],lvl:levels[k]||0}));
      return (
        <div style={{minHeight:'100%',display:'flex',flexDirection:'column',padding:'34px 26px',justifyContent:'center'}}>
          <div style={{width:66,height:66,borderRadius:'50%',background:'rgba(47,191,161,0.14)',border:'1px solid rgba(47,191,161,0.3)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:18,alignSelf:'center'}}><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:600,color:C.ink,marginBottom:8,textAlign:'center'}}>Ton profil de départ</h2>
          <p style={{fontSize:13.5,color:C.muted,lineHeight:1.5,marginBottom:22,textAlign:'center'}}>Voilà ta base. Élan calibre tes premières séances dessus, puis l'ajuste à chaque séance selon ta forme et tes retours.</p>
          <div style={{display:'flex',flexDirection:'column',gap:11,marginBottom:24}}>
            {rows.map((r,i)=>(
              <div key={r.k} style={{animation:`riseIn 360ms cubic-bezier(.22,1,.36,1) ${i*70}ms both`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:5}}><span style={{fontSize:13,color:C.body,fontWeight:500}}>{r.name}</span><span style={{fontSize:12,color:C.tealDk,fontWeight:600}}>{LVL_WORDS[r.lvl]}</span></div>
                <div style={{height:7,borderRadius:99,background:'rgba(14,81,74,0.08)',overflow:'hidden'}}><div style={{height:'100%',width:`${(r.lvl/6)*100}%`,borderRadius:99,background:C.teal,transition:'width 600ms ease'}}/></div>
              </div>
            ))}
          </div>
          <Btn variant="primary" size="lg" fullWidth onClick={onDone}>C'est parti →</Btn>
        </div>
      );
    }

    /* étape -1 — bienvenue (toute première ouverture) */
    if(step===-1){
      return (
        <div style={{minHeight:'100%',display:'flex',flexDirection:'column',padding:'40px 28px 32px'}}>
          <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:28}}>
              <LogoMark size={46}/>
              <span style={{fontFamily:'Georgia,serif',fontSize:24,fontWeight:600,color:C.ink,letterSpacing:'-0.01em'}}>él<span style={{color:'#12A189'}}>a</span>n</span>
            </div>
            <h1 style={{fontFamily:'Georgia,serif',fontSize:32,fontWeight:600,color:C.ink,lineHeight:1.15,letterSpacing:'-0.02em',marginBottom:14}}>Bienvenue.<br/>Ton mouvement, à ton rythme.</h1>
            <p style={{fontSize:15,color:C.body,lineHeight:1.55,marginBottom:26}}>Élan conçoit chaque jour une séance adaptée à ta forme du moment et à ta SEP — ni trop, ni trop peu. Pour bien démarrer, faisons d'abord connaissance avec un <b style={{color:C.ink}}>bilan de référence</b>.</p>
            <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:8}}>
              {[
                {t:'On mesure ta vraie capacité de départ', s:'quelques tests simples, une seule fois', ic:<g><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></g>},
                {t:'Élan calibre tes premières séances dessus', s:'le bon niveau dès la première semaine', ic:<g><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></g>},
                {t:'Puis ça s\'ajuste à chaque séance', s:'selon ta forme, ta fatigue, tes progrès', ic:<g><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/></g>},
              ].map((r,i)=>(
                <div key={i} style={{display:'flex',gap:13,alignItems:'flex-start'}}>
                  <span style={{width:36,height:36,borderRadius:10,background:'rgba(47,191,161,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{r.ic}</svg></span>
                  <div><div style={{fontSize:14.5,fontWeight:600,color:C.ink,lineHeight:1.3}}>{r.t}</div><div style={{fontSize:12.5,color:C.muted,marginTop:2}}>{r.s}</div></div>
                </div>
              ))}
            </div>
          </div>
          <Btn variant="primary" size="lg" fullWidth onClick={()=>setStep(0)}>Commencer le bilan →</Btn>
        </div>
      );
    }

    /* étape 0 — conditions */
    if(step===0){
      return (
        <div style={{minHeight:'100%',padding:'18px 24px 36px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
            <span style={{fontSize:11,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase'}}>Bilan de référence · 1 seule fois</span>
            <button onClick={onSkip} style={{background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,borderRadius:99,width:32,height:32,cursor:'pointer',color:C.body,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
          </div>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:27,fontWeight:600,color:C.ink,letterSpacing:'-0.02em',marginBottom:10}}>Évaluons ton potentiel</h2>
          <p style={{fontSize:14,color:C.body,lineHeight:1.55,marginBottom:20}}>Une série de tests, <b style={{color:C.ink}}>une seule fois</b>, pour mesurer ta vraie capacité de départ. Élan s'en sert pour calibrer toutes tes séances — ni trop faciles, ni trop dures — dès la première semaine.</p>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:22}}>
            {[
              {t:'Le matin, à tête reposée', ic:<g><circle cx="12" cy="13" r="4"/><path d="M12 3v3M5 13H3M21 13h-2M6 7 4.5 5.5M18 7l1.5-1.5M3 21h18"/></g>},
              {t:'Un jour sans séance (pas de fatigue accumulée)', ic:<g><circle cx="12" cy="12" r="9"/><path d="M8 14s1.3 1.5 4 1.5S16 14 16 14"/><path d="M9 9h.01M15 9h.01"/></g>},
              {t:"Près d'un mur et d'une chaise stable", ic:<g><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 10h16M4 16h16M10 4v6M15 10v6M9 16v4"/></g>},
              {t:'Environ 15 minutes — prends ton temps, repose-toi entre les tests', ic:<g><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g>},
            ].map((r,i)=>(
              <div key={i} style={{...cardBase,padding:'13px 15px',display:'flex',alignItems:'center',gap:12}}>
                <span style={{width:34,height:34,borderRadius:10,background:'rgba(47,191,161,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{r.ic}</svg></span>
                <span style={{fontSize:13.5,color:C.body,lineHeight:1.4}}>{r.t}</span>
              </div>
            ))}
          </div>
          <SafetyNote>On cherche ton maximum du jour, sans jamais forcer dans la douleur. Tu peux t'arrêter à tout moment — Élan gardera ce que tu as fait.</SafetyNote>
          <Btn variant="primary" size="lg" fullWidth onClick={()=>setStep(1)}>Je suis prêt·e, commencer →</Btn>
          <button onClick={onSkip} style={{display:'block',margin:'14px auto 0',background:'none',border:'none',color:C.muted,fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>Plus tard</button>
        </div>
      );
    }

    /* header commun étapes 1-9 */
    const Header=({label,kicker})=>(
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <button onClick={()=>setStep(s=>s-1)} style={{background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,borderRadius:99,width:32,height:32,cursor:'pointer',color:C.body,display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
          <span style={{fontSize:11,color:C.muted,letterSpacing:'0.07em',textTransform:'uppercase'}}>{kicker}</span>
          <button onClick={onSkip} style={{background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,borderRadius:99,width:32,height:32,cursor:'pointer',color:C.body,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        {label&&<h2 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:600,color:C.ink,letterSpacing:'-0.02em',marginBottom:16}}>{label}</h2>}
      </div>
    );

    /* étape 1 — profil santé */
    if(step===1){
      const SY=[['fatigue','Fatigue'],['equilibre','Équilibre / vertiges'],['spasticite','Raideur / spasticité'],['sensitif','Troubles sensitifs'],['force','Faiblesse musculaire']];
      const ACT=[['sedentaire','Plutôt sédentaire'],['modere','Un peu actif·ve'],['actif','Régulièrement actif·ve']];
      const GO=['Marcher plus longtemps','Garder l\'équilibre','Me renforcer','Réduire la fatigue','Gagner en souplesse'];
      return (
        <div style={{minHeight:'100%',padding:'18px 24px 36px'}}>
          <Header kicker="Profil · 1/3" label="Parle-moi de toi"/>
          <p style={{fontSize:13,color:C.muted,marginBottom:8,fontWeight:600}}>Ce qui te gêne le plus en ce moment</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:22}}>{SY.map(s=><Chip key={s[0]} on={profile.symptoms.includes(s[0])} onClick={()=>toggle('symptoms',s[0])}>{s[1]}</Chip>)}</div>
          <p style={{fontSize:13,color:C.muted,marginBottom:8,fontWeight:600}}>Ton niveau d'activité actuel</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:22}}>{ACT.map(s=><Chip key={s[0]} on={profile.activity===s[0]} onClick={()=>setProfile(p=>({...p,activity:s[0]}))}>{s[1]}</Chip>)}</div>
          <p style={{fontSize:13,color:C.muted,marginBottom:8,fontWeight:600}}>Tes objectifs</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:26}}>{GO.map(g=><Chip key={g} on={profile.goals.includes(g)} onClick={()=>toggle('goals',g)}>{g}</Chip>)}</div>
          <Btn variant="primary" size="lg" fullWidth onClick={()=>profile.activity&&setStep(2)}>{profile.activity?'Continuer →':'Choisis ton niveau d\'activité'}</Btn>
        </div>
      );
    }

    /* étape 2 — neuro + forme */
    if(step===2){
      return (
        <div style={{minHeight:'100%',padding:'18px 24px 36px'}}>
          <Header kicker="Forme · 2/3" label="Vivacité & énergie"/>
          <p style={{fontSize:13.5,color:C.body,lineHeight:1.5,marginBottom:16}}>Un mini test de réflexes, comme le test d'éveil quotidien — il sert de point de repère neurologique.</p>
          <ReactionTest value={neuro.reactionMs} onResult={ms=>setNeuro(s=>({...s,reactionMs:ms}))}/>
          <div style={{marginTop:22,marginBottom:8}}><p style={{fontSize:13,color:C.muted,fontWeight:600,marginBottom:4}}>Et là, tu te sens comment ?</p></div>
          <div style={{...cardBase,padding:'20px 18px'}}><EnergyGauge value={neuro.energy} onChange={n=>setNeuro(s=>({...s,energy:n}))}/></div>
          <div style={{marginTop:24}}><Btn variant="primary" size="lg" fullWidth onClick={()=>neuro.energy!=null&&setStep(3)}>{neuro.energy!=null?'Passer aux tests physiques →':'Indique ton énergie'}</Btn></div>
        </div>
      );
    }

    /* étape 9 — synthèse */
    if(step===9){
      const levels=window.__deriveBaseline(tests,profile);
      const rows=Object.keys(AREA_NAMES).map(k=>({k,name:AREA_NAMES[k],lvl:levels[k]||0}));
      return (
        <div style={{minHeight:'100%',padding:'18px 24px 36px'}}>
          <Header kicker="Synthèse" label="Récapitulatif"/>
          <p style={{fontSize:13.5,color:C.body,lineHeight:1.5,marginBottom:20}}>Voici comment Élan situe ta capacité de départ par zone. Tu pourras tout faire évoluer séance après séance.</p>
          <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24}}>
            {rows.map(r=>(
              <div key={r.k}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:5}}><span style={{fontSize:13.5,color:C.ink,fontWeight:500}}>{r.name}</span><span style={{fontSize:12,color:C.tealDk,fontWeight:600}}>{LVL_WORDS[r.lvl]}</span></div>
                <div style={{height:8,borderRadius:99,background:'rgba(14,81,74,0.08)',overflow:'hidden'}}><div style={{height:'100%',width:`${(r.lvl/6)*100}%`,borderRadius:99,background:C.teal}}/></div>
              </div>
            ))}
          </div>
          <Btn variant="primary" size="lg" fullWidth onClick={finish}>Enregistrer mon bilan de référence ✦</Btn>
        </div>
      );
    }

    /* étapes 3-8 — tests physiques */
    const pi=step-3, meta=PHYS[pi];
    const valid = meta.key==='squat'?squat!=null : meta.key==='wallSit'?wallSit!=null : meta.key==='pushup'?pushup!=null : meta.key==='plank'?plank!=null : meta.key==='balance'?(legs.g!=null||legs.d!=null) : true;
    return (
      <div style={{minHeight:'100%',padding:'18px 24px 36px'}}>
        <Header kicker={`Test ${pi+1}/6`}/>
        <div style={{display:'flex',gap:5,marginBottom:18}}>{PHYS.map((_,i)=><div key={i} style={{flex:1,height:4,borderRadius:2,background:i<pi?C.teal:i===pi?C.ink:'rgba(14,81,74,0.12)',transition:'all 250ms ease'}}/>)}</div>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}><span style={{width:8,height:8,borderRadius:'50%',background:meta.color}}/><span style={{fontSize:11.5,color:C.muted,letterSpacing:'0.05em',textTransform:'uppercase'}}>{meta.short}</span></div>
        <h2 style={{fontFamily:'Georgia,serif',fontSize:25,fontWeight:600,color:C.ink,letterSpacing:'-0.02em',marginBottom:18}}>{meta.label}</h2>

        {meta.key==='squat'&&<CountStep color="#12A38C" unit="squats d'affilée" max={60} value={squat} setValue={setSquat}
          how={["Pieds largeur d'épaules, près d'une chaise ou d'un plan de travail.","Descends comme pour t'asseoir (sans aller plus bas que confortable), puis remonte.","Enchaîne à ton rythme, le plus de fois possible, en gardant une forme correcte.","Arrête dès que la forme se dégrade — note ton total."]}
          safety="Garde un appui à portée. On vise ton maximum confortable, pas l'échec total." hint="Combien de squats as-tu réussis d'affilée ?"/>}
        {meta.key==='wallSit'&&<WallStep last={null} value={wallSit} setValue={setWallSit}/>}
        {meta.key==='pushup'&&<CountStep color="#2FA56B" unit="pompes" max={50} value={pushup} setValue={setPushup}
          how={["Mains au sol un peu plus larges que les épaules, corps gainé — sur les pieds, ou sur les genoux si besoin.","Descends la poitrine vers le sol en pliant les coudes, puis repousse.","Enchaîne le plus possible en gardant le dos droit, sans creuser.","Note ton total dès que la forme se dégrade."]}
          safety="Sur les genoux, c'est tout aussi valable comme repère — choisis la version que tu tiens proprement." hint="Combien de pompes as-tu réussies ?"/>}
        {meta.key==='plank'&&<HoldStep color="#0E8FB0" cap={180} value={plank} setValue={setPlank} liveLabel="tiens le gainage" doneLabel="ta tenue"
          how={["En appui sur les avant-bras et les pieds (ou les genoux), corps bien aligné.","Serre le ventre et les fessiers, ne creuse pas le dos.","Démarre le chrono et tiens la position le plus longtemps possible.","Arrête dès que la position se casse."]}
          safety="Sur les genoux si la version pieds est trop dure — c'est tout aussi valable comme repère."/>}
        {meta.key==='balance'&&<BalanceStep last={null} legs={legs} setLegs={setLegs}/>}
        {meta.key==='reach'&&<ReachStep last={null} value={reach} setValue={setReach}/>}

        <div style={{marginTop:24}}><Btn variant="primary" size="lg" fullWidth onClick={()=>valid&&setStep(step+1)}>{valid?(pi===PHYS.length-1?'Voir ma synthèse ✦':'Continuer →'):'Fais le test pour continuer'}</Btn></div>
      </div>
    );
  }
  window.ES.BilanInitial=BilanInitial;
  window.ES.BilanMensuel=BilanMensuel;
})();
/* components block 7 */
(function(){
  const { BrandMark, AREA_LABELS, AREA_COLORS, C } = window.EC;
  const FULL=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  const MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const WD=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const DOW=['L','M','M','J','V','S','D'];
  const SCHED=new Set([1,2,4,6]);               // jours d'entraînement habituels : lun, mar, jeu, sam (repères)
  function __dkey(dt){ return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0'); }
  /* Cache de l'historique réel (clé = date de séance) + date de démarrage (1er usage). */
  let __smCache=null,__smLen=-1,__smStart=null;
  function __refreshSM(){ const h=window.__sessHistory(); if(__smCache===null||__smLen!==h.length){ __smCache={}; h.forEach(function(e){ __smCache[e.date]=e; }); __smLen=h.length; const b=window.__readBaseline(); let s=(b&&b.date)||null; const ds=h.map(function(e){return e.date;}).sort(); if(ds.length&&(!s||ds[0]<s)) s=ds[0]; __smStart=s; } }
  function sessMap(){ __refreshSM(); return __smCache; }
  function sessStart(){ __refreshSM(); return __smStart; }
  /* Statut RÉEL d'un jour : « fait » = une séance enregistrée ce jour-là. Pas de données inventées. */
  function statusFor(date){
    const dt=new Date(date); dt.setHours(0,0,0,0);
    const today=new Date(); today.setHours(0,0,0,0);
    const d=dt.getDate(),dow=dt.getDay();
    const past=dt<today, isToday=dt.getTime()===today.getTime();
    const e=sessMap()[__dkey(dt)];
    const sched=SCHED.has(dow);
    const start=sessStart(); const beforeStart=start?(__dkey(dt)<start):true;  // avant le 1er usage : neutre, jamais « manqué »
    let status='none', info=null;
    if(e){
      status='done';
      const zones=(e.areas&&e.areas.length)?e.areas.map(function(a){return AREA_LABELS[a]||a;}):[];
      info={title:e.title||'Séance', zones:zones, forme:e.forme!=null?e.forme:0, duration:e.duration||0};
    } else if(isToday){ status=sched?'today':'today-rest'; }
    else if(past){ status=(sched&&!beforeStart)?'missed':'rest'; }
    else { status=sched?'planned':'rest'; }
    return {d,dow,status,info,isToday};
  }
  function buildMonth(y,m){
    const first=new Date(y,m,1), n=new Date(y,m+1,0).getDate(), lead=(first.getDay()+6)%7;
    const cells=[];
    for(let i=0;i<lead;i++) cells.push(null);
    for(let d=1;d<=n;d++) cells.push(statusFor(new Date(y,m,d)));
    return {cells,n};
  }
  function currentStreak(){ return window.__streak(); }
  function weekDone(){ return window.__weekDoneCount(); }
  /* Heatmap 53 semaines — style « contributions » */
  function YearHeatmap(){
    const ref=React.useRef(null);
    const today=new Date(); today.setHours(0,0,0,0);
    const monday=new Date(today); monday.setDate(today.getDate()-((today.getDay()+6)%7));
    const WEEKS=53, cell=11, gap=3, colW=cell+gap;
    const cols=[]; for(let w=WEEKS-1;w>=0;w--){ const s=new Date(monday); s.setDate(monday.getDate()-w*7); cols.push(s); }
    React.useEffect(()=>{ if(ref.current) ref.current.scrollLeft=ref.current.scrollWidth; },[]);
    const dayColor=(st)=>{ if(!st) return 'rgba(14,81,74,0.05)'; if(st.status==='done'){ const f=st.info.forme; return f>=70?C.teal:f>=55?'rgba(47,191,161,0.6)':'rgba(47,191,161,0.32)'; } if(st.status==='missed') return 'rgba(224,138,11,0.3)'; return 'rgba(14,81,74,0.05)'; };
    return (
      <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:20,padding:'18px 14px 16px',boxShadow:C.sh,marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,padding:'0 2px'}}>
          <span style={{fontSize:11,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase'}}>Sur l'année</span>
          <span style={{fontSize:11,color:C.faint}}>← glisse pour remonter</span>
        </div>
        <div ref={ref} style={{overflowX:'auto',paddingBottom:4}}>
          <div style={{display:'inline-flex',flexDirection:'column',gap:5}}>
            <div style={{display:'flex'}}>
              {cols.map((s,i)=>{const prev=i>0?cols[i-1]:null;const show=!prev||s.getMonth()!==prev.getMonth();return <div key={i} style={{width:colW,fontSize:9,color:C.faint,fontFamily:"'DM Mono',monospace",height:12}}>{show?MONTHS[s.getMonth()].slice(0,3):''}</div>;})}
            </div>
            <div style={{display:'flex',gap:gap}}>
              {cols.map((s,ci)=>(
                <div key={ci} style={{display:'flex',flexDirection:'column',gap:gap}}>
                  {Array.from({length:7}).map((_,r)=>{const dt=new Date(s);dt.setDate(s.getDate()+r);dt.setHours(0,0,0,0);const future=dt>today;const st=future?null:statusFor(dt);const isToday=dt.getTime()===today.getTime();return <div key={r} title={dt.toLocaleDateString('fr-FR')} style={{width:cell,height:cell,borderRadius:3,background:future?'transparent':dayColor(st),border:isToday?`1.5px solid ${C.orange}`:future?'none':'1px solid rgba(255,255,255,0.45)'}}/>;})}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:12,padding:'0 2px'}}>
          <span style={{fontSize:10.5,color:C.faint}}>moins</span>
          {['rgba(14,81,74,0.05)','rgba(47,191,161,0.32)','rgba(47,191,161,0.6)',C.teal].map((c,i)=><span key={i} style={{width:11,height:11,borderRadius:3,background:c,border:'1px solid rgba(255,255,255,0.45)'}}/>)}
          <span style={{fontSize:10.5,color:C.faint}}>plus</span>
        </div>
      </div>
    );
  }
  function CalendarScreen() {
    const now=new Date();
    const [cur,setCur]=React.useState({y:now.getFullYear(),m:now.getMonth()});
    const [sel,setSel]=React.useState(now.getDate());
    const {cells}=React.useMemo(()=>buildMonth(cur.y,cur.m),[cur.y,cur.m]);
    const dayCells=cells.filter(Boolean);
    const isCurMonth=cur.y===now.getFullYear()&&cur.m===now.getMonth();
    const doneCount=dayCells.filter(c=>c.status==='done').length;
    const missedCount=dayCells.filter(c=>c.status==='missed').length;
    const minutes=dayCells.reduce((s,c)=>s+(c.info&&c.info.forme!=null?c.info.duration:0),0);
    const selCell=sel!=null?dayCells.find(c=>c.d===sel):null;
    const goal=16;
    const streak=currentStreak(), week=weekDone();
    function shift(delta){ let m=cur.m+delta,y=cur.y; if(m<0){m=11;y--;} if(m>11){m=0;y++;} setCur({y,m}); setSel(null); }

    const cellStyle=(c)=>{
      const base={width:'100%',aspectRatio:'1',borderRadius:'50%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 180ms ease',position:'relative',fontFamily:"'DM Mono',monospace",fontSize:13};
      const isSel=sel===c.d;
      if(c.status==='done')         return {...base,background:'rgba(47,191,161,0.16)',border:isSel?'2px solid '+C.teal:'1px solid rgba(47,191,161,0.3)',color:C.tealDk};
      if(c.status==='today'||c.status==='today-rest') return {...base,background:isSel?'rgba(242,96,46,0.14)':'rgba(242,96,46,0.08)',border:'2px solid '+C.orange,color:C.orange,fontWeight:600};
      if(c.status==='planned')      return {...base,background:isSel?'rgba(47,191,161,0.10)':C.card,border:'1.5px dashed rgba(47,191,161,0.55)',color:C.tealDk};
      if(c.status==='missed')       return {...base,background:isSel?'rgba(224,138,11,0.1)':C.card,border:isSel?'2px solid '+C.amber:`1px solid ${C.line}`,color:C.amber};
      return {...base,background:isSel?'rgba(14,81,74,0.06)':'transparent',border:isSel?`2px solid ${C.line2}`:'1px solid transparent',color:C.faint};
    };

    return (
      <div style={{minHeight:'100%',padding:'24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
          <p style={{fontSize:11,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase',margin:0,paddingTop:4}}>Régularité</p>
          <BrandMark/>
        </div>
        <h2 style={{fontFamily:'Georgia,serif',fontSize:32,fontWeight:600,color:C.ink,letterSpacing:'-0.02em',marginBottom:20}}>Calendrier</h2>

        {/* nav mois */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <button onClick={()=>shift(-1)} style={{width:34,height:34,borderRadius:'50%',background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
          <span style={{fontSize:16,fontWeight:600,color:C.ink,textTransform:'capitalize'}}>{MONTHS[cur.m]} {cur.y}</span>
          <button onClick={()=>shift(1)} style={{width:34,height:34,borderRadius:'50%',background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>

        {/* résumé du mois */}
        <div style={{display:'flex',gap:8,marginBottom:18}}>
          {[{v:doneCount,l:'ce mois',c:C.tealDk},{v:`${week}/4`,l:'cette sem.',c:week>=4?C.tealDk:C.ink},{v:streak,l:"d'affilée",c:C.orange}].map((s,i)=>(
            <div key={i} style={{flex:1,background:C.card,border:`1px solid ${C.line}`,borderRadius:14,boxShadow:C.sh,padding:'11px 8px',textAlign:'center'}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:21,fontWeight:500,color:s.c,lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:10.5,color:C.muted,marginTop:3,letterSpacing:'0.03em'}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* grille */}
        <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:20,padding:'16px 14px',boxShadow:C.sh,marginBottom:14}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6,marginBottom:8}}>
            {DOW.map((d,i)=><div key={i} style={{textAlign:'center',fontSize:10.5,color:C.faint,fontWeight:600,letterSpacing:'0.04em'}}>{d}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:6}}>
            {cells.map((c,i)=> c===null
              ? <div key={i}/>
              : <div key={i} onClick={()=>setSel(c.d)} style={cellStyle(c)}>
                  {c.status==='done'
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <span>{c.d}</span>}
                </div>)}
          </div>
        </div>

        {/* légende */}
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px 14px',marginBottom:20,padding:'0 2px'}}>
          {[['rgba(47,191,161,0.16)','Fait','solid rgba(47,191,161,0.4)'],['#fff','Prévu','dashed rgba(47,191,161,0.6)'],['rgba(242,96,46,0.08)','Aujourd’hui','solid '+C.orange],['#fff','Manqué','solid '+C.amber]].map((l,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:13,height:13,borderRadius:'50%',background:l[0],border:'1.5px '+l[2]}}/><span style={{fontSize:11.5,color:C.muted}}>{l[1]}</span></div>
          ))}
        </div>

        {/* heatmap année */}
        <YearHeatmap/>

        {/* détail jour / récap mois */}
        {selCell ? (
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:20,padding:'20px',boxShadow:C.sh}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:selCell.info?14:0}}>
              <div>
                <h3 style={{fontFamily:'Georgia,serif',fontSize:20,fontWeight:600,color:C.ink,margin:'0 0 4px'}}>{WD[selCell.dow]} {selCell.d}{selCell.isToday&&<span style={{fontSize:13,fontFamily:"'DM Sans',sans-serif",color:C.orange,marginLeft:10,fontWeight:500}}>Aujourd'hui</span>}</h3>
                <p style={{fontSize:13,color:C.muted,margin:0}}>{
                  selCell.status==='done'?`${selCell.info.title} · forme ${selCell.info.forme}/100 · ${selCell.info.duration} min`
                  :selCell.status==='missed'?'Séance manquée — tu peux la rattraper'
                  :selCell.status==='today'?'Séance prévue aujourd’hui'
                  :selCell.status==='planned'?'Séance prévue'
                  :'Jour de repos'
                }</p>
              </div>
              {(selCell.status==='today'||selCell.status==='planned')&&<button style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:C.tealDk,background:'rgba(47,191,161,0.10)',border:'1px solid rgba(47,191,161,0.2)',borderRadius:99,padding:'6px 14px',cursor:'pointer',flexShrink:0}}>Modifier</button>}
              {selCell.status==='missed'&&<button style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:C.amber,background:'rgba(224,138,11,0.1)',border:'1px solid rgba(224,138,11,0.25)',borderRadius:99,padding:'6px 14px',cursor:'pointer',flexShrink:0}}>Rattraper</button>}
            </div>
            {selCell.info&&<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{selCell.info.zones.map(t=>(<span key={t} style={{borderRadius:99,padding:'4px 12px',fontSize:12,fontWeight:500,background:C.bg,color:C.body,border:`1px solid ${C.line}`}}>{t}</span>))}</div>}
          </div>
        ) : (
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:20,padding:'20px',boxShadow:C.sh}}>
            <h3 style={{fontFamily:'Georgia,serif',fontSize:20,fontWeight:600,color:C.ink,margin:'0 0 6px',textTransform:'capitalize'}}>{MONTHS[cur.m]} {cur.y}</h3>
            <p style={{fontSize:13.5,color:C.body,lineHeight:1.5,margin:0}}>{doneCount} séance{doneCount>1?'s':''} {isCurMonth?'jusqu’ici ce mois':'ce mois-là'}{missedCount>0?`, ${missedCount} manquée${missedCount>1?'s':''}`:''}. {doneCount>=goal?'Objectif atteint, bravo !':`Plus que ${Math.max(0,goal-doneCount)} pour ton objectif mensuel.`} Touche un jour pour le détail.</p>
          </div>
        )}
      </div>
    );
  }
  function StretchingScreen() {
    const [done,setDone]=React.useState(new Set());
    const toggle=id=>setDone(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
    return (
      <div style={{minHeight:'100%',padding:'24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
          <p style={{fontSize:11,color:C.muted,letterSpacing:'0.08em',textTransform:'uppercase',margin:0,paddingTop:4}}>Récupération</p>
          <BrandMark/>
        </div>
        <h2 style={{fontFamily:'Georgia,serif',fontSize:32,fontWeight:600,color:C.ink,letterSpacing:'-0.02em',marginBottom:6}}>Étirements</h2>
        <p style={{fontSize:13,color:C.muted,marginBottom:24,fontStyle:'italic'}}>Disponibles chaque jour, indépendamment de ta forme.</p>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {window.ED.stretching.map(ex=>{const isDone=done.has(ex.id),aColor=AREA_COLORS[ex.area]||C.teal;const spec=ex.sets&&ex.reps?`${ex.sets} × ${ex.reps}`:ex.duration||'';return(
            <div key={ex.id} onClick={()=>toggle(ex.id)} style={{background:isDone?'rgba(47,191,161,0.06)':C.card,border:`1px solid ${isDone?'rgba(47,191,161,0.2)':C.line}`,borderRadius:14,padding:'14px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer',boxShadow:isDone?'none':C.sh,transition:'all 200ms ease',opacity:isDone?0.7:1}}>
              <div style={{width:28,height:28,borderRadius:'50%',border:`2px solid ${isDone?C.teal:C.faint}`,background:isDone?'rgba(47,191,161,0.18)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{isDone&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</div>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:500,color:isDone?C.muted:C.ink,textDecoration:isDone?'line-through':'none'}}>{ex.name}</div><div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}><span style={{width:5,height:5,borderRadius:'50%',background:aColor}}/><span style={{fontSize:12,color:C.muted}}>{AREA_LABELS[ex.area]}</span>{spec&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.muted}}>{spec}</span>}</div></div>
            </div>);})}
        </div>
      </div>
    );
  }
  Object.assign(window.ES,{ CalendarScreen, StretchingScreen });
})();
/* App block (TweaksPanel retiré ci-dessous via edits) */
const { BottomNav, Btn, LogoMark, C } = window.EC;
const { CheckIn, CheckInHybride, ProgramScreen, FocusScreen, ProgressScreen, BilanMensuel, BilanInitial, CalendarScreen, StretchingScreen } = window.ES;
/* TweaksPanel retiré (outil Claude Design) — remplacé par un état local simple */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showBranding": true,
  "brandStyle": "Nom seul",
  "checkinMode": "Hybride (objectif)",
  "dailyReminder": true
}/*EDITMODE-END*/;
/* ─── Récap périodique (hebdo dim. soir · mensuel le 1er) — boosté IA, data réelle ─── */
function RecapOverlay({ kind, onClose }) {
  const ED=window.ED, isWeek=kind==='week';
  const span=isWeek?7:14;
  const fh=window.__formeHistory(span), bilans=window.__readBilans();
  const goals=window.__longTermGoals();
  const cut=new Date(Date.now()-span*86400000).toISOString().slice(0,10);
  const hist=window.__sessHistory().filter(e=>e.date>cut);
  const sessions=[...new Set(hist.map(e=>e.date))].length;
  const minutes=hist.reduce((s,e)=>s+(e.duration||0),0);
  const streak=window.__streak();
  const avgForme=fh.length?Math.round(fh.reduce((s,x)=>s+x,0)/fh.length):0;
  const bestForme=fh.length?Math.max(...fh):0;
  const lastB=bilans[bilans.length-1]||{}, prevB=bilans[bilans.length-2]||{};
  const fa=window.__focusAreas(span).slice(0,4);
  const ZC=(window.EC&&window.EC.AREA_COLORS)||{}, ZL=(window.EC&&window.EC.AREA_LABELS)||{};
  const zones=fa.map(a=>[ZL[a.key]||a.key, a.count, ZC[a.key]||'#12A38C']);
  const zMax=zones.length?Math.max(...zones.map(z=>z[1])):1;
  const topZone=fa[0]?(ZL[fa[0].key]||fa[0].key).toLowerCase():'le bas du corps';
  const period=isWeek?'Ta semaine':'Ton mois';
  const dateLabel=isWeek?'Récap hebdo · dimanche soir':`Récap mensuel · ${ED.monthLabel}`;
  const goal0=goals[0];
  const narrative=isWeek
    ? <>Belle semaine, <b style={{color:C.ink}}>{ED.user}</b> — <b style={{color:C.ink}}>{sessions} séance{sessions>1?'s':''}</b> bouclée{sessions>1?'s':''}{fh.length?<> et une forme moyenne de <b style={{color:C.ink}}>{avgForme}/100</b> (pic à {bestForme})</>:''}. {topZone&&<>Tu as surtout travaillé <b style={{color:C.ink}}>{topZone}</b>. </>}Ta série tient à <b style={{color:C.ink}}>{streak} jour{streak>1?'s':''}</b> : garde ce rythme, c'est exactement la régularité qui fait progresser dans la SEP.</>
    : <>Quel mois, <b style={{color:C.ink}}>{ED.user}</b> ! <b style={{color:C.ink}}>{sessions} séance{sessions>1?'s':''}</b> ce mois-ci.{bilans.length>=2&&lastB.sts!=null&&prevB.sts!=null?<> De vrais progrès mesurés : la chaise au mur passe de <b style={{color:C.ink}}>{prevB.sts}→{lastB.sts}s</b>.</>:''}{goal0?<> Tu es à <b style={{color:C.ink}}>{goal0.pct}%</b> de ton objectif « {goal0.label.toLowerCase()} ».</>:''} On continue sur cette lancée.</>;
  return (
    <div className="scroll" style={{position:'absolute',inset:0,zIndex:230,background:isWeek?`linear-gradient(180deg,#D7EEE8,${C.bg} 34%)`:`linear-gradient(180deg,#FBE2D7,${C.bg} 34%)`}}>
      <div style={{minHeight:'100%',padding:'22px 24px 40px'}}>
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:6}}>
          <button onClick={onClose} style={{background:C.card,border:`1px solid ${C.line}`,boxShadow:C.sh,borderRadius:99,width:34,height:34,cursor:'pointer',color:C.body,fontSize:17,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        <span style={{fontSize:11,color:isWeek?C.tealDk:C.orange,letterSpacing:'0.09em',textTransform:'uppercase',fontWeight:600}}>{dateLabel}</span>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:34,fontWeight:600,color:C.ink,letterSpacing:'-0.02em',margin:'8px 0 22px',lineHeight:1.1}}>{period} en mouvement</h1>
        <div style={{display:'flex',gap:10,marginBottom:18}}>
          {[[sessions,'séances',isWeek?C.tealDk:C.orange],[minutes,'minutes','#17A98C'],[avgForme,'forme moy.',C.teal]].map((s,i)=>(
            <div key={i} style={{flex:1,background:C.card,border:`1px solid ${C.line}`,borderRadius:16,boxShadow:C.sh,padding:'15px 8px',textAlign:'center'}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:26,fontWeight:500,color:s[2],lineHeight:1}}>{s[0]}</div>
              <div style={{fontSize:10.5,color:C.muted,marginTop:4}}>{s[1]}</div>
            </div>
          ))}
        </div>
        <div style={{background:'linear-gradient(135deg,rgba(47,191,161,0.12),rgba(47,191,161,0.04))',border:'1px solid rgba(47,191,161,0.25)',borderRadius:18,padding:'16px',marginBottom:18}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/></svg>
            <span style={{fontSize:12,fontWeight:600,color:C.tealDk,letterSpacing:'0.04em'}}>Le mot d'Élan · IA</span>
          </div>
          <p style={{fontSize:14,color:C.body,lineHeight:1.6,margin:0}}>{narrative}</p>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:18,boxShadow:C.sh,padding:'17px 16px',marginBottom:isWeek?18:14}}>
          <p style={{fontSize:11,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase',margin:'0 0 14px'}}>Zones travaillées</p>
          <div style={{display:'flex',flexDirection:'column',gap:11}}>
            {zones.map(z=>(
              <div key={z[0]} style={{display:'flex',alignItems:'center',gap:11}}>
                <span style={{fontSize:12.5,color:C.body,width:92,flexShrink:0}}>{z[0]}</span>
                <div style={{flex:1,height:8,borderRadius:99,background:'rgba(14,81,74,0.07)',overflow:'hidden'}}><div style={{height:'100%',width:`${(z[1]/zMax)*100}%`,borderRadius:99,background:z[2]}}/></div>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.muted,width:18,textAlign:'right'}}>{z[1]}</span>
              </div>
            ))}
          </div>
        </div>
        {!isWeek&&(
          <div style={{background:C.card,border:`1px solid ${C.line}`,borderRadius:18,boxShadow:C.sh,padding:'17px 16px',marginBottom:18}}>
            <p style={{fontSize:11,color:C.muted,letterSpacing:'0.06em',textTransform:'uppercase',margin:'0 0 14px'}}>Vers tes objectifs</p>
            <div style={{display:'flex',flexDirection:'column',gap:13}}>
              {goals.map(g=>(
                <div key={g.key}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:12.5,color:C.body}}>{g.label}</span><span style={{fontSize:12,fontWeight:600,color:g.color}}>{g.pct}%</span></div>
                  <div style={{height:7,borderRadius:99,background:'rgba(14,81,74,0.07)',overflow:'hidden'}}><div style={{height:'100%',width:`${g.pct}%`,borderRadius:99,background:g.color}}/></div>
                </div>
              ))}
            </div>
          </div>
        )}
        <Btn variant="primary" size="lg" fullWidth onClick={onClose}>Continuer →</Btn>
      </div>
    </div>
  );
}

/* ─── Bannière de rappel (jours prévus, séance non faite) ─── */
/* ─── Message de rappel — varié & contextuel (météo, récence, série, jour) ─── */
function reminderMessage() {
  const ci=window.__readCheckin&&window.__readCheckin();
  const heat=(ci&&ci.metrics&&ci.metrics.heat)||0;
  const hist=window.__sessHistory?window.__sessHistory():[];
  let daysSince=1;
  if(hist.length){ const last=hist.map(e=>e.date).sort().pop(); const d=Math.round((Date.now()-new Date(last).getTime())/86400000); if(d>=0&&d<60) daysSince=d; }
  const streak=(window.__streak&&window.__streak())||0;
  const day=new Date().getDay();
  if(heat>=7) return {t:'La fraîcheur revient',b:'La chaleur retombe le soir — c’est le bon moment pour bouger au frais, sans forcer.'};
  if(daysSince>=3) return {t:'On se retrouve ?',b:`${daysSince} jours sans séance — reprends tout en douceur, juste 10 minutes suffisent.`};
  if(streak>=3) return {t:`${streak} jours d’affilée 🔥`,b:'Ne casse pas ta belle série — ta séance du soir t’attend.'};
  const pool=[
    {t:'Ta séance t’attend',b:'Un petit pas aujourd’hui — même 10 min comptent.'},
    {t:'Cap sur ce soir',b:'Le mouvement, c’est ton meilleur allié contre la fatigue. On y va ?'},
    {t:'Quelques minutes pour toi',b:'Pas besoin d’être au top — juste de commencer. Le reste suit.'},
    {t:'Un effort qui compte double',b:'Avec la SEP, chaque séance entretient tes acquis. À toi de jouer.'},
    {t:'Mieux dormir ce soir',b:'Une séance maintenant, et la nuit n’en sera que plus sereine.'},
    {t:'Ton rendez-vous mouvement',b:'15 minutes et tu coches ta journée. Prêt·e ?'},
    {t:'Petit pas, grand effet',b:'Même léger, bouger aujourd’hui te fera du bien demain.'},
  ];
  return pool[day%pool.length];
}

/* ─── Bannière de rappel (jours prévus, séance non faite) ─── */
/* ─── Rappel du bilan mensuel (dès le 1er, jusqu'à ce qu'il soit fait) ─── */
function BilanReminderBanner({ onOpen }) {
  return (
    <div onClick={onOpen} style={{margin:'0 0 14px',cursor:'pointer',display:'flex',alignItems:'center',gap:12,background:'linear-gradient(135deg,#E4F4EF,#F2FAF8)',border:'1px solid rgba(47,191,161,0.32)',borderRadius:16,padding:'13px 15px',boxShadow:C.sh}}>
      <div style={{width:38,height:38,borderRadius:11,background:'rgba(47,191,161,0.14)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.tealDk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
      <div style={{flex:1}}><div style={{fontSize:13.5,fontWeight:600,color:C.ink,textTransform:'capitalize'}}>Bilan mensuel de {window.ED.monthLabel}</div><div style={{fontSize:12,color:C.body,marginTop:1}}>Mesure tes progrès du mois — 5 tests, ~8 min.</div></div>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  );
}

function ReminderBanner() {
  const m=reminderMessage();
  return (
    <div style={{margin:'0 0 14px',display:'flex',alignItems:'center',gap:12,background:'linear-gradient(135deg,#FFE9E0,#FFF4EF)',border:'1px solid rgba(242,96,46,0.28)',borderRadius:16,padding:'13px 15px',boxShadow:C.sh}}>
      <div style={{width:38,height:38,borderRadius:11,background:'rgba(242,96,46,0.14)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></div>
      <div style={{flex:1}}><div style={{fontSize:13.5,fontWeight:600,color:C.ink}}>{m.t}</div><div style={{fontSize:12,color:C.body,marginTop:1}}>{m.b}</div></div>
    </div>
  );
}

/* ─── Aperçu de la notification push (18h) ─── */
function PushPreview() {
  const m=reminderMessage();
  return (
    <div style={{margin:'8px 0 4px',background:'rgba(255,255,255,0.7)',backdropFilter:'blur(8px)',border:'1px solid rgba(14,81,74,0.12)',borderRadius:16,padding:'11px 13px',display:'flex',alignItems:'center',gap:11,boxShadow:'0 4px 14px rgba(14,81,74,0.12)'}}>
      <div style={{flexShrink:0}}><LogoMark size={30}/></div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><span style={{fontSize:12,fontWeight:700,color:C.ink}}>Élan</span><span style={{fontSize:10.5,color:C.muted}}>18:00</span></div>
        <div style={{fontSize:12,color:C.body,marginTop:1,lineHeight:1.35}}>{m.b}</div>
      </div>
    </div>
  );
}

function App() {
  const [t,__setT]=React.useState(TWEAK_DEFAULTS);
  const setTweak=(k,v)=>__setT(p=>({...p,[k]:v}));
  React.useEffect(()=>{ const s=document.getElementById('splash'); if(s){ const id=setTimeout(()=>{ s.classList.add('hide'); setTimeout(()=>{ if(s.parentNode) s.remove(); },550); },400); return ()=>clearTimeout(id); } },[]);
  window.EC.brand={show:t.showBranding, mode:t.brandStyle};
  const [metrics,setMetrics]=React.useState(()=>{ const c=window.__checkedInToday()&&window.__readCheckin(); return (c&&c.metrics)||{energy:null,fatigue:4,heat:4,sleep:6}; });
  const [context,setContext]=React.useState({location:'maison',equipment:['bodyweight','elastiques']});
  const [checkedIn,setCheckedIn]=React.useState(()=>window.__checkedInToday());
  const [started,setStarted]=React.useState(false);
  const [tab,setTab]=React.useState('today');
  const [showBilan,setShowBilan]=React.useState(false);
  const [bilanDone,setBilanDone]=React.useState(()=>window.__bilanDoneThisMonth());
  const [baselineDone,setBaselineDone]=React.useState(()=>window.__hasBaseline());
  const [skipBaseline,setSkipBaseline]=React.useState(()=>window.__baselineSkipped());
  const [recap,setRecap]=React.useState(()=>window.__recapDue());
  const closeRecap=()=>{ if(recap) window.__markRecapSeen(recap.kind,recap.key); setRecap(null); };
  /* Revoir / refaire le check-in du jour depuis l'accueil (clic sur le score de forme).
     Fermer sans valider restaure les valeurs enregistrées le matin. */
  const [reviewCheckin,setReviewCheckin]=React.useState(false);
  const closeReview=()=>{ const c=window.__readCheckin(); if(c&&c.metrics) setMetrics(c.metrics); setReviewCheckin(false); };
  const showReminder=t.dailyReminder&&checkedIn&&!started&&!window.__sessionDoneToday();
  const showBilanReminder=checkedIn&&!started&&window.__bilanReminderDue()&&!bilanDone;
  /* ── Geste « retour » (Android / navigateur) : ferme l'écran courant au lieu de quitter l'app ──
     L'app est en page unique : sans cette intégration, le retour système sort de l'appli. On garde
     une entrée d'historique « sentinelle » tant qu'il y a quelque chose à fermer, et on intercepte
     popstate pour fermer l'overlay/la séance ou revenir à l'accueil. À la racine (accueil, rien
     d'ouvert), on laisse le retour quitter l'app, comme partout ailleurs sur Android. */
  const onboarding=(!baselineDone&&!skipBaseline)||!checkedIn;
  const canGoBack=!!(recap||reviewCheckin||started||showBilan||onboarding||tab!=='today');
  const navRef=React.useRef({});
  navRef.current={ recap, reviewCheckin, started, showBilan, onboarding, tab, closeRecap, closeReview, setStarted, setShowBilan, setTab };
  const armedRef=React.useRef(false);
  const canBackRef=React.useRef(canGoBack); canBackRef.current=canGoBack;
  React.useEffect(()=>{
    if(canGoBack&&!armedRef.current){ try{ window.history.pushState({elan:1},''); }catch(e){} armedRef.current=true; }
    else if(!canGoBack){ armedRef.current=false; }
  },[canGoBack]);
  React.useEffect(()=>{
    const onPop=()=>{
      if(!canBackRef.current) return;          // rien à fermer : on laisse le retour quitter l'app
      const n=navRef.current; armedRef.current=false; // sentinelle consommée par ce retour
      if(n.recap) n.closeRecap();
      else if(n.reviewCheckin) n.closeReview();
      else if(n.started) n.setStarted(false);
      else if(n.showBilan) n.setShowBilan(false);
      else if(n.onboarding){ try{ window.history.pushState({elan:1},''); }catch(e){} armedRef.current=true; } // étape requise : on reste
      else if(n.tab!=='today') n.setTab('today');
    };
    window.addEventListener('popstate',onPop);
    return ()=>window.removeEventListener('popstate',onPop);
  },[]);
  const [sessionMode,setSessionMode]=React.useState('ia');
  const [customGoals,setCustomGoals]=React.useState(['lower','balance']);
  const [customIntensity,setCustomIntensity]=React.useState('moderee');
  /* aligne l'intensité « sur mesure » par défaut sur la forme du jour, une fois le check-in fait */
  React.useEffect(()=>{ if(checkedIn) setCustomIntensity(window.__suggestIntensity(metrics)); },[checkedIn]);
  const [gymId,setGymId]=React.useState(null);
  const baseProgram=React.useMemo(()=>window.generateProgram(metrics,context),[checkedIn,metrics.energy]);
  const program=React.useMemo(()=>{
    if(sessionMode==='custom') return window.generateCustomProgram(customGoals,customIntensity,metrics,context);
    if(sessionMode==='gym'&&gymId) return window.buildGymProgram(gymId,context,metrics);
    return baseProgram;
  },[sessionMode,customGoals,customIntensity,gymId,baseProgram]);
  const sessionProps={ session:{mode:sessionMode,goals:customGoals,intensity:customIntensity,gymId}, setSession:{setMode:setSessionMode,setGoals:setCustomGoals,setIntensity:setCustomIntensity,setGymId} };
  return (
    <>
      {!baselineDone&&!skipBaseline&&(<div className="scroll" style={{position:'absolute',inset:0,zIndex:220,background:`linear-gradient(180deg,${C.tint},${C.bg} 40%)`}}><BilanInitial onDone={()=>setBaselineDone(true)} onSkip={()=>{window.__markBaselineSkipped();setSkipBaseline(true);}}/></div>)}
      {!checkedIn&&(<div className="scroll" style={{position:'absolute',inset:0,zIndex:200,background:`linear-gradient(180deg,${C.tint},${C.bg} 40%)`}}>{t.checkinMode==='Classique (ressenti)'?<CheckIn metrics={metrics} setMetrics={setMetrics} context={context} setContext={setContext} onConfirm={()=>{window.__saveCheckin(metrics);setCheckedIn(true);}}/>:<CheckInHybride metrics={metrics} setMetrics={setMetrics} context={context} setContext={setContext} onConfirm={()=>{window.__saveCheckin(metrics);setCheckedIn(true);}}/>}</div>)}
      {checkedIn&&reviewCheckin&&(<div className="scroll" style={{position:'absolute',inset:0,zIndex:205,background:`linear-gradient(180deg,${C.tint},${C.bg} 40%)`}}>{t.checkinMode==='Classique (ressenti)'?<CheckIn metrics={metrics} setMetrics={setMetrics} context={context} setContext={setContext} onClose={closeReview} onConfirm={()=>{window.__saveCheckin(metrics);setReviewCheckin(false);}}/>:<CheckInHybride metrics={metrics} setMetrics={setMetrics} context={context} setContext={setContext} onClose={closeReview} onConfirm={()=>{window.__saveCheckin(metrics);setReviewCheckin(false);}}/>}</div>)}
      {showBilan&&(<div className="scroll" style={{position:'absolute',inset:0,zIndex:210,background:`linear-gradient(180deg,${C.tint},${C.bg} 40%)`}}><BilanMensuel onClose={()=>setShowBilan(false)} onSave={()=>{setBilanDone(true);setShowBilan(false);setTab('progress');}}/></div>)}
      {recap&&<RecapOverlay kind={recap.kind} onClose={closeRecap}/>}
      {tab==='today'&&started && (<div style={{position:'absolute',inset:0,zIndex:120,background:C.bg,display:'flex',flexDirection:'column',paddingBottom:'max(env(safe-area-inset-bottom, 0px), 22px)'}}><FocusScreen program={program} onBack={()=>setStarted(false)}/></div>)}
      <div className="scroll" style={{paddingBottom: tab==='today'&&started ? 0 : 'calc(92px + max(env(safe-area-inset-bottom, 0px), 22px))'}}>
        <div key={tab+String(started)} className="screen-in">
          {tab==='today'      && (started ? null : <><div style={{padding:(showReminder||showBilanReminder)?'24px 24px 0':0}}>{showBilanReminder&&<BilanReminderBanner onOpen={()=>{setTab('progress');setShowBilan(true);}}/>}{showReminder&&<ReminderBanner/>}</div><ProgramScreen program={program} onStart={()=>setStarted(true)} onReviewCheckin={()=>setReviewCheckin(true)} {...sessionProps}/></>)}
          {tab==='progress'   && <ProgressScreen onOpenBilan={()=>setShowBilan(true)} bilanDone={bilanDone} onRedoBaseline={()=>{window.__clearBaseline();window.__clearBaselineSkip();setSkipBaseline(false);setBaselineDone(false);}} onResetAll={()=>{window.__resetAllData();window.location.reload();}}/>}
          {tab==='calendar'   && <CalendarScreen/>}
          {tab==='stretching' && <StretchingScreen/>}
        </div>
      </div>
      {!(tab==='today'&&started)&&<BottomNav activeTab={tab} onTabChange={setTab}/>}
    </>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
