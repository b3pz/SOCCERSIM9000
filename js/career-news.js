/* SerieA 9000 SIM — Notizie di giornata (V111)
   Piccola rassegna stampa ironica per la schermata carriera/stagione:
   prende gli ultimi risultati (career.results, tutti i campionati, non
   solo le partite dell'utente) e ci scrive sopra un titolo finto-giornale.
   Tono misto, come richiesto: a volte nostalgico/scioccato "ai miei tempi",
   a volte solo ironico/esagerato da titolo sportivo, a volte gossip
   leggero da retroscena. Non sempre la stessa vena. Pura lettura, non
   tocca risultati/classifica/salvataggio: si rigenera ogni volta che si
   apre la scheda, quindi le battute possono cambiare a ogni visita. */
(function(){
'use strict';

const NOSTALGIC=[
 "Ai miei tempi si vinceva 1-0 e bastava: oggi {h} {hg}-{ag} {a} e nessuno si accontenta più.",
 "Una volta il calcio si giocava con gli scarpini di cuoio. Oggi {h} {hg}-{ag} {a} e la gente si lamenta lo stesso.",
 "\"Ai miei tempi correvamo il doppio\", dice il solito nonno al bar guardando {h} {hg}-{ag} {a}.",
 "Altri tempi, altro calcio: {h} {hg}-{ag} {a}. Ma insomma, mica male neanche questo.",
 "Il vecchio del bar è scioccato: \"{h} {hg}-{ag} {a}? Ai miei tempi si giocava con la palla di stracci!\"",
 "Si scandalizza il solito nostalgico davanti a {h} {hg}-{ag} {a}: \"Non è più calcio, questo\".",
 "\"Una volta bastava un pallone e un prato\", sospira qualcuno commentando {h} {hg}-{ag} {a}."
];
const IRONIC=[
 "TERREMOTO IN CAMPIONATO: {h} demolisce {a} {hg}-{ag}, tifosi già in fila per l'abbonamento.",
 "CLAMOROSO: {h} {hg}-{ag} {a}. Al bar sotto casa se ne parlerà per settimane.",
 "PAZZESCO: {h} {hg}-{ag} {a}, il countdown per il processo in tv è già partito.",
 "UFFICIALE: {h} {hg}-{ag} {a}. I social già in fermento, come sempre del resto.",
 "BOMBA DI GIORNATA: {h} {hg}-{ag} {a}, e c'è già chi grida al complotto arbitrale.",
 "SHOCK TOTALE: {h} {hg}-{ag} {a}. Il countdown per gli esami di riparazione è iniziato.",
 "SENSAZIONALE: {h} {hg}-{ag} {a}, la moviola già scaldata prima ancora del fischio finale.",
 "FLASH: {h} {hg}-{ag} {a}. Qualcuno sta già cambiando l'formazione del fantacalcio."
];
const GOSSIP=[
 "Retroscena di giornata: pare che dopo {h} {hg}-{ag} {a} lo spogliatoio abbia ordinato la pizza.",
 "Si vocifera che dopo {h} {hg}-{ag} {a} qualcuno abbia già cambiato il numero di telefono al procuratore.",
 "Indiscrezione non confermata: dopo {h} {hg}-{ag} {a}, il pullman è rimasto in autogrill un'ora in più del previsto.",
 "Pare che il masseggiatore di {h} sia diventato la persona più richiesta dello spogliatoio, dopo il {hg}-{ag} con {a}.",
 "Non confermato ma neanche troppo smentito: {h} {hg}-{ag} {a}, e qualcuno già parla di mercato."
];

const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
const fill=(tpl,vars)=>tpl.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'');

function headlineFor(r){
 const h=T(r.h)?.name||r.h,a=T(r.a)?.name||r.a;
 const vars={h,a,hg:r.hg,ag:r.ag};
 const roll=Math.random();
 const bank=roll<.4?NOSTALGIC:roll<.8?IRONIC:GOSSIP;
 return fill(pick(bank),vars);
}

/* results: array (career.results) piu' recenti prima; limit quante
   notizie mostrare. Ogni chiamata rigenera le battute (non e' salvato
   nulla): e' voluto, la rassegna stampa cambia umore ad ogni visita. */
function renderNews(results,limit){
 const items=(results||[]).slice(-1*(limit||10)).reverse();
 if(!items.length)return '<p class="muted">Nessuna notizia: gioca qualche giornata.</p>';
 return items.map(r=>`<div class="card">📰 ${headlineFor(r)} <span class="muted">G${r.round}</span></div>`).join('');
}

window.S9CareerNews={renderNews,headlineFor};
})();
