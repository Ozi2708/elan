/* Point d'entrée Vite — ordre d'exécution important :
   1. react-setup : window.React / window.ReactDOM
   2. styles
   3. données (window.ED_SESSIONS, ED_STRETCH, ED_GYM, ED_WEEK)
   4. app : normalisation + moteur IA + composants + App + render */
import './react-setup.js';
import './index.css';
import './data/exercises-data.js';
import './data/exercises-extra.js';
import './data/exercise-tags.js';
import './app.jsx';
