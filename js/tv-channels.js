/* SerieA 9000 SIM — Canali TV parodia (V111)
   Prima ogni schermata "in diretta" mostrava sempre lo stesso badge
   "S9 90 LIVE". Ora ogni volta viene scelto a caso un nome di canale
   finto (parodia dei canali sportivi/generalisti italiani anni '90-2000),
   cosi' varia: il tabellino della partita, l'ingresso in campo e
   l'invasione di campo possono mostrare canali diversi tra loro e da una
   partita all'altra. Va caricato PRIMA di match-3d.js, match-intro.js e
   pitch-invasion.js (che lo usano), quindi resta vicino all'inizio del
   blocco di script del motore 3D in index.html. */
(function(){
'use strict';
const CHANNELS=['VAI 1','VAI 2','VAI 3','VAI SPORT','RETE 44','CANALE 55','ITALIA 1','STREAM','TELE 2','TELE+'];
window.S9Channel=function(){return CHANNELS[Math.floor(Math.random()*CHANNELS.length)];};
})();
