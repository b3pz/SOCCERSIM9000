/* SerieA 9000 SIM — battute e aneddoti da spogliatoio per la schermata pre-partita.
   Un tocco d'atmosfera in più, richiesto dai tester: niente di meccanico, solo
   colore. Il testo è scelto in modo deterministico dalla partita corrente, così
   resta uguale se si torna sulla schermata ma cambia da match a match. */
(function(){
'use strict';
/* FIX 2026-09: prima versione giudicata dai tester "non fa ridere ed è un
   po' fuori posto" - troppi bozzetti generici da spogliatoio senza vera
   battuta finale. Riscritte con una struttura chiara: fatto + stoccata
   ironica, nello stesso tono da bar sport già usato nella telecronaca
   (js/match-commentary.js), non un tono diverso a caso. */
const LINES=[
"Il mister ha preparato un piano tattico infallibile. Lo cambierà al 12’, come sempre.",
"Il vice allenatore giura che stavolta il modulo funzionerà. Lo giura ogni settimana, e ogni settimana perde la scommessa col magazziniere.",
"Il capitano ha stretto la mano all’arbitro con più convinzione del solito: di solito significa guai.",
"Il preparatore atletico ha fatto fare gli scatti. Il centravanti li ha fatti in differita.",
"Il presidente è in tribuna a braccia conserte. Quando le apre, di solito è già 0-2.",
"Il magazziniere conta i palloni prima e dopo l’allenamento. Sempre uno in meno: qualcuno se lo porta a casa da anni.",
"Il fantasista ha chiesto la maglia numero 10. Gioca terzino, ma il numero fa curriculum.",
"Il difensore centrale ha promesso «zero gol subiti». Lo promette da sette partite, con lo stesso risultato.",
"Il fisioterapista ha già preparato lo spray al ghiaccio per scaramanzia: statisticamente, funziona quanto tenere le dita incrociate.",
"Lo speaker prova il microfono tre volte. Il pubblico non se ne accorge: è distratto dal tabellone che segna ancora la partita di ieri.",
"Il vecchio dirigente ricorda «ai miei tempi» prima ancora del fischio d’inizio. Ai suoi tempi, va detto, si perdeva uguale.",
"Il terzino sinistro giura di aver smesso di fumare. Per la terza volta questo mese, e si vede tutto al 70’.",
"Il portiere bacia i pali prima di entrare. Rituale, dice lui. Statistica alla mano, non aiuta i pali.",
"Il saggio della curva dice che oggi «si sente» la partita giusta. La sente ogni settimana, e ogni settimana si sbaglia con dedizione.",
"Il team manager ha già pronto un comunicato per ogni risultato possibile, sconfitta compresa: efficienza, se non altro.",
"Il centrocampista ha chiesto scarpini nuovi. Gli hanno dato gli stessi di sempre, solo lucidati: il budget non mente.",
"Il pullman è arrivato in perfetto orario. Peccato che sulla tattica la puntualità non sia mai arrivata.",
"Il raccattapalle più veloce del campionato è pronto, cronometro alla mano: sarà probabilmente l’MVP di giornata.",
"Il preparatore dei portieri ha urlato «ancora uno» per la decima volta. Il portiere ha smesso di crederci alla settima.",
"Il massaggiatore ha finito il ghiaccio già durante il riscaldamento: brutto segno, o forse solo una giornata calda.",
"Il vice allenatore ha memorizzato tre cambi diversi. Ne farà uno, tardi, e sbagliato.",
"Il capitano vuole lui il pallone per il calcio d’inizio. Tradizione, dice. Scaramanzia, dicono tutti gli altri.",
"Qualcuno in tribuna stampa chiede chi ha vinto l’ultimo Pallone d’Oro. Nessuno risponde: c’è chi lavora e chi guarda il telefono.",
"Il magazziniere ha nascosto la maglia fortunata. Da tre stagioni non la trova nessuno, risultati alla mano forse è meglio così.",
"La lavagna tattica ha più frecce di una gara di tiro con l’arco. Il piano, alla fine, resta sempre lo stesso: palla lunga e pedalare.",
"Il fotografo di bordocampo ha già scelto il posto migliore per l’esultanza che, forse, arriverà. Ottimista, il fotografo.",
"Qualcuno giura che il campo sembra più corto oggi. Il regolamento dice di no, l’arbitro pure, ma la fede è fede.",
"Il preparatore atletico chiama «scatti» quello che la squadra chiama, con più onestà, «passeggiata veloce».",
"Il vecchio tifoso superstizioso è già seduto nello stesso posto di sempre. La squadra non lo sa, ma gli deve almeno tre punti.",
"Il fisico del difensore centrale è al top. Quello dei suoi riflessi, un po’ meno, come si vedrà al primo cross."
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
