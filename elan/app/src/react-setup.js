/* Expose React & ReactDOM en globaux AVANT l'exécution du prototype (app.jsx),
   qui référence `React.useState`, `ReactDOM.createRoot`, etc. comme dans le HTML d'origine. */
import React from 'react';
import * as ReactDOMClient from 'react-dom/client';

window.React = React;
window.ReactDOM = ReactDOMClient;
