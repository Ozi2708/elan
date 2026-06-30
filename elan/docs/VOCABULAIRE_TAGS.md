# Vocabulaire des tags — Élan (référence figée)

But : un **vocabulaire partagé** entre les exercices (« ce que je travaille ») et
l'utilisateur (« ce dont j'ai besoin »). Tout en **clés** (minuscules, sans accent).

Principe directeur :

```
Séance = SOCLE SEP garanti  ×  accent personnel (borné)  −  exclusions sécurité
         (planchers hebdo)      (priorités, léger biais)    (flags, contextuels)
```

On n'exclut JAMAIS une famille de travail : la SEP s'améliore globalement, tout est lié.
Les symptômes/objectifs ne sont qu'un **accent borné**, pas un filtre.

---

## A. Zones (`region`)
`lower` · `upper` · `core` · `balance` · `proprioception` · `cardio` · `mobility`

## B. Axes thérapeutiques (`targets[]`) — partagé exo ↔ utilisateur
| Clé | Sens |
|---|---|
| `force-bas` | force membres inférieurs |
| `force-haut` | force membres supérieurs |
| `force-tronc` | gainage / stabilité centrale |
| `equilibre` | équilibre debout |
| `proprioception` | sens de la position |
| `pied-tombant` | releveur du pied (tibial antérieur) |
| `coordination` | double-tâche, motricité |
| `endurance` | cardio / résistance à la fatigue |
| `mobilite` | amplitude articulaire |
| `spasticite` | relâchement / anti-raideur |

## C. Pattern moteur (`pattern`, un seul) — anti-répétition
`squat` (genou-dominant) · `charniere` (hanche-dominant) · `fente` · `mollet` ·
`abduction` · `poussee` · `tirage` · `gainage` · `equilibre-statique` ·
`equilibre-dynamique` · `marche` · `mobilite`

## D. Muscles (`muscles[]`) — remplace le texte libre
`quadriceps` · `ischios` · `fessiers` · `mollets` · `tibial-anterieur` ·
`adducteurs` · `abducteurs` · `abdominaux` · `lombaires` · `dorsaux` ·
`pectoraux` · `epaules` · `bras` · `hanches`

## E. Difficulté intrinsèque (`difficulty` 1–5) — indépendante du niveau acquis
`1` très accessible (assis/appui) · `2` accessible · `3` modéré · `4` exigeant · `5` avancé

## F. Charge systémique (`load`) — pilote la récupération
`faible` (~24 h récup) · `moyen` (~36 h) · `eleve` (~60 h — salle, excentrique lourd)

## G. Position (`position`)
`allonge` · `assis` · `quadrupedie` · `debout-appui` · `debout-libre`

## H. Côté (`side`)
`bilateral` · `unilateral-alterne` · `unilateral-chaque`

## I. Flags de sécurité (`flags[]`) — servent à EXCLURE (contextuel), pas à scorer
`fallRisk` (appui nécessaire) · `heatSensitive` (élève la température) ·
`floorTransition` (passage au sol) · `dualTask` (charge cognitive)

## J. Matériel (`equip[]`, au niveau exercice)
`aucun` · `chaise` · `mur` · `elastique` · `haltere` · `tapis` · `plateau` · `velo`

---

## Planchers du socle (fréquence hebdo minimale garantie)
| Axe | Plancher |
|---|---|
| `force-bas` | ~2×/sem |
| `equilibre` + `proprioception` | ~2×/sem |
| `pied-tombant` | 2×/sem (déjà en place) |
| `force-tronc` / `force-haut` | ~1×/sem |
| `mobilite` / `spasticite` | ~1–2×/sem |
| `endurance` | ~1×/sem |

Le moteur comble en priorité l'axe le plus en déficit sur la fenêtre glissante.
Les symptômes déclarés **relèvent** un plancher (ex. « spasticité » → `mobilite`/`spasticite`),
ils ne suppriment jamais les autres.

## Passerelle utilisateur → axes (priorités, en clés)
| Symptôme déclaré | axes priorisés |
|---|---|
| fatigue | `endurance` + `load:faible` |
| equilibre | `equilibre`, `proprioception` |
| spasticite | `mobilite`, `spasticite` |
| sensitif | `proprioception`, `coordination` |
| force | `force-bas`, `force-tronc` |

| Objectif déclaré | axes priorisés |
|---|---|
| marcher-plus | `endurance`, `pied-tombant`, `equilibre` |
| equilibre | `equilibre`, `proprioception` |
| renforcement | `force-bas`, `force-haut`, `force-tronc` |
| moins-fatigue | `endurance`, `load:faible` |
| souplesse | `mobilite`, `spasticite` |

## Modèle de charge & récupération (cross-séances, par muscle)
- Chaque séance dépose une dette de récup sur ses `muscles[]`, durée = fenêtre du `load`.
- Sélection : pas de **force** sur un muscle encore en récup ; on oriente vers les axes
  complémentaires peu coûteux (équilibre, mobilité, proprio) ; `restMult` et volume du
  lendemain tiennent compte de la charge récente.
- La salle (`load:eleve`) compte dans les planchers ET met ses muscles ~60 h en récup.
