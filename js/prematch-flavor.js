/* SerieA 9000 SIM — battute e aneddoti da spogliatoio per la schermata pre-partita.
   Un tocco d'atmosfera in più, richiesto dai tester: niente di meccanico, solo
   colore. Il testo è scelto in modo deterministico dalla partita corrente, così
   resta uguale se si torna sulla schermata ma cambia da match a match. */
(function(){
'use strict';
const LINES=[
"Il magazziniere ha già sudato le sette maglie di scorta, e non è nemmeno sceso in campo.",
"Il preparatore atletico consiglia le scale al posto dell’ascensore. Nessuno lo ascolta.",
"Qualcuno in panchina sta ancora cercando il tesserino per il terzo tempo.",
"Il vice allenatore giura che stavolta il modulo funzionerà. Lo giura sempre.",
"Il massaggiatore ha finito il ghiaccio già durante il riscaldamento.",
"In tribuna stampa qualcuno chiede chi ha vinto l’ultimo Pallone d’Oro. Nessuno risponde.",
"Il capitano ha stretto la mano all’arbitro con più convinzione del solito. Buon segno, forse.",
"Il magazziniere conta i palloni prima e dopo l’allenamento. Sempre uno in meno.",
"Qualcuno crede ancora nel colpo di tacco a effetto. Oggi si vedrà.",
"Il pullman è arrivato in perfetto orario. Sulla tattica, un po’ meno.",
"Il fisioterapista ha già preparato lo spray al ghiaccio, per scaramanzia.",
"Il tifoso più superstizioso è già seduto nello stesso posto di sempre.",
"La lavagna tattica ha più frecce di una gara di tiro con l’arco.",
"Il terzino sinistro giura di aver smesso di fumare. Per la terza volta questo mese.",
"Il preparatore dei portieri ha urlato «ancora uno» per la decima volta di fila.",
"Il pallone è stato gonfiato con cura maniacale. I sogni, un po’ meno.",
"Il presidente osserva dalla tribuna a braccia conserte, con la fede che gira nervosamente.",
"Il fantasista di turno ha chiesto la maglia numero 10, anche se gioca terzino.",
"Il magazziniere ha etichettato ogni scarpino. Non si sa mai.",
"Lo speaker dello stadio prova il microfono tre volte. Il pubblico non se ne accorge.",
"Il difensore centrale ha promesso «zero gol subiti». Lo promette sempre.",
"Qualcuno ha portato il calendario delle partite... di tre stagioni fa.",
"Il preparatore atletico chiama «scatti» quello che tutti chiamano «passeggiata veloce».",
"La bandierina del guardalinee sventola già, prima ancora del fischio d’inizio.",
"Il saggio della curva dice che oggi «si sente» la partita giusta. Lo dice ogni settimana.",
"Il centrocampista ha chiesto scarpini nuovi. Gli hanno dato gli stessi di sempre, puliti.",
"Il magazziniere ha nascosto la maglia fortunata. Nessuno sa dove.",
"Il preparatore ha contato le flessioni ad alta voce. Tutti hanno perso il conto dopo la ventesima.",
"Qualcuno crede che la voce del mister si senta fino in tribuna. Forse ha ragione.",
"Il portiere ha baciato i pali prima di entrare. Rituale, non superstizione, giura lui.",
"Il team manager ha già pronto un comunicato per ogni possibile risultato.",
"Il raccattapalle più veloce del campionato è pronto, cronometro alla mano.",
"Qualcuno in panchina si è portato il giornale di ieri. Per sicurezza, dice.",
"Il vice allenatore ha memorizzato tre cambi diversi. Ne farà uno solo, probabilmente.",
"Il capitano ha chiesto lui il pallone per il calcio d’inizio. Tradizione, non fortuna, dice sempre.",
"In tribuna d’onore qualcuno controlla l’orologio, come se lì il tempo scorresse diverso.",
"Il magazziniere giura che oggi le maglie porteranno fortuna. Lo giura sempre, a dire il vero.",
"Qualcuno crede che il campo sia più corto oggi. Il regolamento dice di no.",
"Il preparatore ha spiegato il piano gara tre volte. La squadra ha annuito tre volte, stessa espressione.",
"Il vecchio dirigente ricorda «ai miei tempi» prima ancora del fischio d’inizio.",
"Il fotografo di bordocampo ha già scelto il posto migliore per l’esultanza che (forse) arriverà."
];
function pick(seedStr,count){
 let h=0;for(const c of String(seedStr))h=(h*31+c.charCodeAt(0))>>>0;
 const n=count||1,chosen=[],used=new Set();
 let x=h||1;
 while(chosen.length<n&&used.size<LINES.length){
  const idx=x%LINES.length;
  if(!used.has(idx)){used.add(idx);chosen.push(LINES[idx]);}
  x=(x*2654435761+2654435761)>>>0; // varia il seed ad ogni battuta successiva
 }
 return chosen;
}
/* FIX 2026-09: questo file inseriva la battuta dentro '.v107-prematch-hero', ma
   quell'elemento viene nascosto da tactical-workspace.js (che sostituisce tutta la
   schermata pre-partita col nuovo editor titolari) — la battuta veniva scritta in un
   punto che non si vede più. Esposta qui come funzione globale: è tactical-workspace.js
   a chiamarla e mostrarla nella sua intestazione, dove è davvero visibile.
   Ritorna un array di `count` battute distinte (richiesta: 2-3 insieme per partita). */
window.pickMatchFlavor=function(seed,count){return pick(seed||Math.random(),count||3);};
})();
