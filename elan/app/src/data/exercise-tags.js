/* ───────────────────────────────────────────────────────────────────────────
   BROUILLON de tags enrichis — À RELIRE / CORRIGER (Phase 1).
   Voir docs/VOCABULAIRE_TAGS.md pour le vocabulaire.

   ⚠️ Ce fichier n'est PAS encore importé par main.jsx : il n'a aucun effet sur
      l'app tant que le câblage (Phase 2) n'est pas fait. C'est volontaire — il
      sert de support de relecture. Une fois les tags validés, on les fusionne
      sur les exercices à l'amorçage (normalize) et le moteur s'en sert.

   `region` peut corriger la zone actuelle (ex. assis-debout : core → lower).
   Champs : region, targets[], muscles[], pattern, difficulty(1-5), load,
            position, side, flags[].
   ─────────────────────────────────────────────────────────────────────────── */
window.ED_TAGS = {
  /* ── Bas du corps / force ── */
  's0-1':  { region:'lower', targets:['force-bas'],              muscles:['quadriceps','fessiers'],            pattern:'squat',    difficulty:1, load:'moyen',  position:'assis',        side:'bilateral',          flags:[] }, // assis-debout (était core)
  's0-2':  { region:'lower', targets:['force-bas','force-tronc'],muscles:['fessiers','ischios','lombaires'],   pattern:'charniere',difficulty:2, load:'moyen',  position:'allonge',      side:'bilateral',          flags:['floorTransition'] }, // pont au sol
  's0-3':  { region:'lower', targets:['force-bas'],              muscles:['quadriceps'],                       pattern:'squat',    difficulty:1, load:'faible', position:'assis',        side:'unilateral-alterne', flags:[] }, // extension jambe assis
  's0-4':  { region:'lower', targets:['force-bas','equilibre'],  muscles:['mollets'],                          pattern:'mollet',   difficulty:2, load:'faible', position:'debout-appui', side:'bilateral',          flags:[] }, // mollets debout appui
  's1-3':  { region:'lower', targets:['force-bas','equilibre'],  muscles:['fessiers','abducteurs','hanches'],  pattern:'abduction',difficulty:2, load:'moyen',  position:'debout-appui', side:'unilateral-alterne', flags:[] }, // pas latéraux appui
  's2-0':  { region:'lower', targets:['endurance','coordination'],muscles:['hanches','quadriceps'],            pattern:'marche',   difficulty:1, load:'faible', position:'assis',        side:'bilateral',          flags:[] }, // marche assise
  's2-2':  { region:'lower', targets:['mobilite','force-bas'],   muscles:['hanches','fessiers','abducteurs'],  pattern:'abduction',difficulty:1, load:'faible', position:'assis',        side:'unilateral-alterne', flags:[] }, // ouverture hanche assis
  's2-3':  { region:'lower', targets:['force-bas'],              muscles:['mollets'],                          pattern:'mollet',   difficulty:1, load:'faible', position:'assis',        side:'bilateral',          flags:[] }, // mollets assis
  's3-1':  { region:'lower', targets:['force-bas','equilibre'],  muscles:['fessiers','abducteurs','hanches'],  pattern:'abduction',difficulty:3, load:'moyen',  position:'debout-appui', side:'unilateral-alterne', flags:[] }, // pas latéraux élastique
  's3-2':  { region:'lower', targets:['force-bas','force-tronc'],muscles:['fessiers','ischios','abducteurs'],  pattern:'charniere',difficulty:3, load:'moyen',  position:'allonge',      side:'bilateral',          flags:['floorTransition'] }, // pont élastique
  's3-3':  { region:'lower', targets:['force-bas'],              muscles:['quadriceps','fessiers'],            pattern:'squat',    difficulty:2, load:'moyen',  position:'debout-libre', side:'bilateral',          flags:[] }, // squat vers chaise
  'xecc-1':{ region:'lower', targets:['force-bas'],              muscles:['quadriceps','fessiers'],            pattern:'squat',    difficulty:3, load:'moyen',  position:'assis',        side:'bilateral',          flags:[] }, // assis-debout descente lente (excentrique)
  'xecc-2':{ region:'lower', targets:['force-bas','equilibre'],  muscles:['quadriceps','fessiers'],            pattern:'fente',    difficulty:4, load:'moyen',  position:'debout-libre', side:'unilateral-chaque',  flags:['fallRisk'] }, // step-down
  'xecc-3':{ region:'lower', targets:['force-bas'],              muscles:['mollets'],                          pattern:'mollet',   difficulty:3, load:'faible', position:'debout-appui', side:'bilateral',          flags:[] }, // mollets montée rapide/descente lente
  'xecc-4':{ region:'lower', targets:['force-bas'],              muscles:['quadriceps'],                       pattern:'squat',    difficulty:3, load:'moyen',  position:'debout-appui', side:'bilateral',          flags:[] }, // chaise contre mur (était core)

  /* ── Équilibre ── */
  's1-1':  { region:'balance', targets:['equilibre','proprioception'],         muscles:['hanches','mollets'],               pattern:'equilibre-dynamique',difficulty:1, load:'faible', position:'debout-appui', side:'bilateral',         flags:[] }, // transfert de poids D/G
  's1-2':  { region:'balance', targets:['equilibre','force-bas'],              muscles:['mollets'],                         pattern:'mollet',             difficulty:2, load:'faible', position:'debout-appui', side:'bilateral',         flags:[] }, // montée pointe (balance)
  's1-4':  { region:'balance', targets:['equilibre','proprioception'],         muscles:['mollets','fessiers','abducteurs'], pattern:'equilibre-statique', difficulty:2, load:'faible', position:'debout-appui', side:'unilateral-chaque', flags:['fallRisk'] }, // équilibre 1 pied assisté
  's3-4':  { region:'balance', targets:['force-bas','equilibre'],              muscles:['fessiers','abducteurs','hanches'], pattern:'abduction',          difficulty:2, load:'faible', position:'debout-appui', side:'unilateral-chaque', flags:['fallRisk'] }, // abduction jambe debout appui
  'xdual-2':{region:'balance', targets:['equilibre','coordination'],           muscles:['hanches','mollets'],               pattern:'equilibre-dynamique',difficulty:3, load:'faible', position:'debout-appui', side:'bilateral',         flags:['dualTask'] }, // transferts + tâche verbale
  'xdual-3':{region:'balance', targets:['equilibre','coordination','proprioception'],muscles:['mollets','abducteurs'],      pattern:'equilibre-dynamique',difficulty:4, load:'moyen',  position:'debout-libre', side:'bilateral',         flags:['dualTask','fallRisk'] }, // talon-pointe + lettres
  'xbrd-1':{ region:'balance', targets:['equilibre','proprioception'],         muscles:['mollets','abducteurs'],            pattern:'equilibre-statique', difficulty:3, load:'faible', position:'debout-libre', side:'bilateral',         flags:['fallRisk'] }, // bipodal plateau
  'xbrd-3':{ region:'balance', targets:['force-bas','equilibre','proprioception'],muscles:['quadriceps','fessiers','mollets'],pattern:'squat',           difficulty:4, load:'moyen',  position:'debout-libre', side:'bilateral',         flags:['fallRisk'] }, // mini-squats plateau
  'xbrd-4':{ region:'balance', targets:['equilibre','proprioception'],         muscles:['mollets','abducteurs'],            pattern:'equilibre-statique', difficulty:5, load:'moyen',  position:'debout-libre', side:'unilateral-chaque', flags:['fallRisk'] }, // unipodal plateau

  /* ── Proprioception / contrôle ── */
  's6-0':  { region:'proprioception', targets:['proprioception','force-bas'],         muscles:['fessiers','abducteurs','hanches'], pattern:'abduction',          difficulty:2, load:'faible', position:'allonge',      side:'unilateral-chaque', flags:['floorTransition'] }, // clamshell
  's6-1':  { region:'proprioception', targets:['force-bas','proprioception'],         muscles:['fessiers','abducteurs'],           pattern:'abduction',          difficulty:2, load:'faible', position:'allonge',      side:'unilateral-chaque', flags:['floorTransition'] }, // abduction couché
  's6-2':  { region:'proprioception', targets:['force-bas','equilibre','proprioception'],muscles:['fessiers','abducteurs','hanches'],pattern:'abduction',        difficulty:3, load:'moyen',  position:'debout-appui', side:'unilateral-alterne',flags:[] }, // pas latéraux mini-élastique
  's6-3':  { region:'proprioception', targets:['force-bas','proprioception','force-tronc'],muscles:['fessiers','ischios','abducteurs'],pattern:'charniere',      difficulty:3, load:'moyen',  position:'allonge',      side:'bilateral',         flags:['floorTransition'] }, // pont ouverture genoux
  's6-4':  { region:'proprioception', targets:['pied-tombant','proprioception'],      muscles:['tibial-anterieur'],                pattern:'mobilite',           difficulty:1, load:'faible', position:'assis',        side:'bilateral',         flags:[] }, // relevé pointe pied assis
  's7-1':  { region:'proprioception', targets:['coordination','endurance'],           muscles:['hanches'],                         pattern:'marche',             difficulty:1, load:'faible', position:'assis',        side:'bilateral',         flags:[] }, // marche assise lente B1
  's7-2':  { region:'proprioception', targets:['equilibre','coordination'],           muscles:['hanches'],                         pattern:'marche',             difficulty:2, load:'faible', position:'debout-appui', side:'unilateral-alterne',flags:['fallRisk'] }, // lever genou debout B1
  's7-3':  { region:'proprioception', targets:['coordination','equilibre'],           muscles:['hanches'],                         pattern:'marche',             difficulty:2, load:'faible', position:'debout-appui', side:'unilateral-alterne',flags:['fallRisk'] }, // step tap bas B1
  's7-4':  { region:'proprioception', targets:['force-bas','proprioception'],         muscles:['ischios'],                         pattern:'charniere',          difficulty:1, load:'faible', position:'assis',        side:'unilateral-alterne',flags:[] }, // flexion genou serviette B2
  's7-5':  { region:'proprioception', targets:['force-bas','equilibre'],              muscles:['ischios'],                         pattern:'charniere',          difficulty:2, load:'faible', position:'debout-appui', side:'unilateral-alterne',flags:['fallRisk'] }, // talon-fesse debout B2
  's7-6':  { region:'proprioception', targets:['force-bas'],                          muscles:['ischios'],                         pattern:'charniere',          difficulty:2, load:'faible', position:'assis',        side:'bilateral',         flags:[] }, // heel dig isométrique B2
  /* s7-7 (Clamshell), s7-8 (Pont fessier), s7-9 (Relevé pointe) : doublons fusionnés
     après suppression des « (Bloc N) » — gérés par s6-0 / s0-2 / s6-4. */
  'xdual-1':{region:'proprioception', targets:['coordination','endurance'],           muscles:['hanches'],                         pattern:'marche',             difficulty:2, load:'faible', position:'debout-appui', side:'bilateral',         flags:['dualTask'] }, // marche sur place + compte à rebours
  'xdual-4':{region:'proprioception', targets:['coordination','equilibre','proprioception'],muscles:['hanches','abducteurs'],      pattern:'equilibre-dynamique',difficulty:3, load:'moyen',  position:'debout-libre', side:'bilateral',         flags:['dualTask','fallRisk'] }, // pas multidirectionnels
  'xbrd-2':{ region:'proprioception', targets:['proprioception','equilibre'],         muscles:['mollets','abducteurs'],            pattern:'equilibre-dynamique',difficulty:3, load:'faible', position:'debout-libre', side:'bilateral',         flags:['fallRisk'] }, // transferts plateau

  /* ── Gainage / tronc ── */
  's7-11': { region:'core', targets:['force-tronc','coordination'], muscles:['abdominaux'],            pattern:'gainage', difficulty:2, load:'faible', position:'allonge',      side:'unilateral-alterne', flags:['floorTransition'] }, // dead bug simplifié B4
  's7-12': { region:'core', targets:['force-tronc'],                muscles:['abdominaux','epaules'],  pattern:'gainage', difficulty:2, load:'moyen',  position:'debout-appui', side:'bilateral',          flags:[] }, // gainage incliné B4
  'xcore-1':{region:'core', targets:['force-tronc','coordination'], muscles:['abdominaux'],            pattern:'gainage', difficulty:3, load:'faible', position:'allonge',      side:'unilateral-alterne', flags:['floorTransition'] }, // dead bug anti-bascule
  'xcore-2':{region:'core', targets:['force-tronc'],                muscles:['abdominaux','epaules'],  pattern:'gainage', difficulty:3, load:'moyen',  position:'quadrupedie',  side:'bilateral',          flags:['floorTransition'] }, // planche genoux
  'xcore-3':{region:'core', targets:['force-tronc'],                muscles:['abdominaux'],            pattern:'gainage', difficulty:3, load:'moyen',  position:'allonge',      side:'unilateral-chaque',  flags:['floorTransition'] }, // gainage latéral genoux
  'xcore-4':{region:'core', targets:['force-tronc','force-bas'],    muscles:['fessiers','ischios','abdominaux'],pattern:'charniere',difficulty:2,load:'moyen', position:'allonge',     side:'bilateral',          flags:['floorTransition'] }, // pont fessier avec maintien

  /* ── Haut du corps ── */
  'xup-1': { region:'upper', targets:['force-haut'],              muscles:['pectoraux','bras','epaules'], pattern:'poussee', difficulty:2, load:'moyen',  position:'debout-appui', side:'bilateral', flags:[] }, // pompes inclinées
  'xup-2': { region:'upper', targets:['force-haut','force-tronc'],muscles:['dorsaux','lombaires','epaules'],pattern:'tirage',difficulty:2, load:'moyen',  position:'allonge',      side:'bilateral', flags:['floorTransition'] }, // superman
  'xup-3': { region:'upper', targets:['force-haut'],              muscles:['bras','epaules'],             pattern:'poussee', difficulty:3, load:'moyen',  position:'assis',        side:'bilateral', flags:[] }, // dips chaise
  'xup-4': { region:'upper', targets:['force-haut'],              muscles:['epaules'],                    pattern:'poussee', difficulty:1, load:'faible', position:'debout-libre', side:'bilateral', flags:[] }, // élévations latérales

  /* ── Cardio (blocs vélo — tous heatSensitive) ──
     impairs = Bloc facile (difficulty 2 / load faible) ; pairs = Bloc modéré (3 / moyen) */
  's5-1': { region:'cardio', targets:['endurance'], muscles:['quadriceps','mollets'], pattern:'marche', difficulty:2, load:'faible', position:'assis', side:'bilateral', flags:['heatSensitive'] },
  's5-3': { region:'cardio', targets:['endurance'], muscles:['quadriceps','mollets'], pattern:'marche', difficulty:2, load:'faible', position:'assis', side:'bilateral', flags:['heatSensitive'] },
  's5-5': { region:'cardio', targets:['endurance'], muscles:['quadriceps','mollets'], pattern:'marche', difficulty:2, load:'faible', position:'assis', side:'bilateral', flags:['heatSensitive'] },
  's5-7': { region:'cardio', targets:['endurance'], muscles:['quadriceps','mollets'], pattern:'marche', difficulty:2, load:'faible', position:'assis', side:'bilateral', flags:['heatSensitive'] },
  's5-9': { region:'cardio', targets:['endurance'], muscles:['quadriceps','mollets'], pattern:'marche', difficulty:2, load:'faible', position:'assis', side:'bilateral', flags:['heatSensitive'] },
  's5-2': { region:'cardio', targets:['endurance'], muscles:['quadriceps','mollets'], pattern:'marche', difficulty:3, load:'moyen',  position:'assis', side:'bilateral', flags:['heatSensitive'] },
  's5-4': { region:'cardio', targets:['endurance'], muscles:['quadriceps','mollets'], pattern:'marche', difficulty:3, load:'moyen',  position:'assis', side:'bilateral', flags:['heatSensitive'] },
  's5-6': { region:'cardio', targets:['endurance'], muscles:['quadriceps','mollets'], pattern:'marche', difficulty:3, load:'moyen',  position:'assis', side:'bilateral', flags:['heatSensitive'] },
  's5-8': { region:'cardio', targets:['endurance'], muscles:['quadriceps','mollets'], pattern:'marche', difficulty:3, load:'moyen',  position:'assis', side:'bilateral', flags:['heatSensitive'] },
  's5-10':{ region:'cardio', targets:['endurance'], muscles:['quadriceps','mollets'], pattern:'marche', difficulty:3, load:'moyen',  position:'assis', side:'bilateral', flags:['heatSensitive'] },

  /* ── Releveur du pied (dorsi) ── */
  'dorsi-1':{ region:'proprioception', targets:['pied-tombant'], muscles:['tibial-anterieur'], pattern:'mobilite', difficulty:1, load:'faible', position:'assis',        side:'bilateral', flags:[] },
  'dorsi-2':{ region:'proprioception', targets:['pied-tombant'], muscles:['tibial-anterieur'], pattern:'mobilite', difficulty:2, load:'faible', position:'debout-appui', side:'bilateral', flags:['fallRisk'] },
};

/* ── Séances SALLE (méta au niveau séance — load élevé, ~60 h de récup) ──
   Sert à : compter dans les planchers + déposer une dette de récup par muscle. */
window.ED_GYM_TAGS = {
  '1': { region:'upper', targets:['force-haut','force-tronc'], muscles:['pectoraux','dorsaux','epaules','bras','abdominaux'],        load:'eleve' }, // Salle — Haut du corps
  '2': { region:'lower', targets:['force-bas','force-tronc'],  muscles:['quadriceps','ischios','fessiers','mollets','abdominaux'],   load:'eleve' }, // Salle — Bas du corps
};
