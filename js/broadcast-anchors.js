/* SerieA 9000 SIM — Telecronisti in studio (V111)
   Due "giornalisti" fissi (ritratto busto, sempre lo stesso sprite base: cambia
   solo il colore della cravatta ed il nome, per emittente — "l'importante è
   la cravatta") che aprono ogni partita con due battute mentre le squadre
   entrano in campo, commentano durante l'inno (MAI per le nazionali, solo
   club), poi lasciano la linea al sorteggio della monetina gia' gestito da
   match-intro.js, e ricompaiono a fine partita per un riepilogo scherzoso.
   Barra fissa in fondo allo schermo, indipendente dall'overlay attivo, cosi'
   funziona sia durante l'intro (sopra #s9MatchIntro) sia da sola a fine
   partita (quando l'intro e' gia' chiusa). Puramente atmosferico: non tocca
   mai risultato o eventi, gia' decisi altrove. */
(function(){
'use strict';

const TIE_COLORS=['#c0392b','#2980b9','#f1c40f','#27ae60','#8e44ad','#e67e22','#16a085','#2c3e50','#d35400','#c2185b'];
const ANCHOR_PAIRS=[
 ['Piero Malaspina','Furio Stracci'],
 ['Learco Vantaggi','Osvaldo Retroscena'],
 ['Ubaldo Fuorigioco','Learco Bombardi'],
 ['Italo Traversoni','Learco Fischietti'],
 ['Massimo Catenaccio','Renzo Sventola'],
 ['Learco Dribbling','Achille Tabellino'],
 ['Corrado Moviola','Sisto Palombaro'],
 ['Learco Sagoma','Ottavio Recupero']
];

function hashStr(s){let h=0;for(let i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))|0}return Math.abs(h)}

const ENTRANCE=[
 "{a1}: Eccoli, {h} e {a}, entrano in campo — e per una volta non è per litigare col semaforo del parcheggio.",
 "{a2}: Squadre schierate! {a1}, secondo te chi ha vinto lo spareggio del pullman più lento oggi?",
 "{a1}: {h} contro {a} stasera, {a2}, altro che la partitella del giovedì al campetto.",
 "{a2}: Guarda che ingresso solenne, {a1}... peccato manchi solo la musica giusta, ma tant'è.",
 "{a1}: {h} e {a} si affrontano — {a2}, tu su chi punti, o meglio, su chi hai scommesso il caffè?",
 "{a2}: Che atmosfera stasera, {a1}! Altro che il bar sotto casa con la tele appesa storta."
];
const ANTHEM=[
 "{a1}: E ora un momento di raccoglimento, {a2}... o almeno ci si prova.",
 "{a2}: Bella intensità, {a1}. Anni fa qui si sentiva meno, ma va detto: anni fa si sentiva anche meno tutto.",
 "{a1}: {a2}, dai un'occhiata alle facce dei giocatori: c'è chi canta e chi conta i minuti al fischio.",
 "{a2}: Un classico prima del fischio d'inizio, {a1}. Ai miei tempi era tutta un'altra cosa, dicono.",
 "{a1}: Emozione palpabile, {a2}. O forse è solo il freddo, sinceramente non si capisce mai bene."
];
const FULLTIME=[
 "{a1}: Finisce {h} {sh} - {sa} {a}, {a2}: che ne pensi?",
 "{a2}: {a1}, dico solo che al bar stasera se ne parlerà fino a tardi, come sempre.",
 "{a1}: {h} {sh} - {sa} {a}: risultato che farà discutere, {a2}, come minimo fino a domattina.",
 "{a2}: Si chiude qui, {a1}. Quelli di prima erano altri tempi, dicono sempre tutti, ma va bene così.",
 "{a1}: {h} {sh} - {sa} {a} il finale, {a2}. Buonanotte a tutti, e alla prossima puntata."
];

const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
const fill=(tpl,vars)=>tpl.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'');

let bar,line1,line2,hideTimer=null;
let ctx={a1:'Piero Malaspina',a2:'Furio Stracci',tie1:'#c0392b',tie2:'#2980b9',h:'',a:''};

function ensureBar(){
 if(bar)return;
 bar=document.createElement('div');
 bar.id='s9BroadcastAnchors';bar.hidden=true;
 bar.innerHTML=`<div class="s9-anchor" data-side="1"><div class="s9-anchor-bust"><span class="s9-anchor-tie"></span></div><div class="s9-anchor-name"></div></div>
  <div class="s9-anchor-speech"></div>
  <div class="s9-anchor" data-side="2"><div class="s9-anchor-bust"><span class="s9-anchor-tie"></span></div><div class="s9-anchor-name"></div></div>`;
 document.body.appendChild(bar);
 line1=bar.querySelector('[data-side="1"] .s9-anchor-name');
 line2=bar.querySelector('[data-side="2"] .s9-anchor-name');
 bar.addEventListener('click',hide);
}

function setup(options){
 ensureBar();
 const channel=options?.channel||'S9 90';
 const seed=hashStr(channel);
 const pair=ANCHOR_PAIRS[seed%ANCHOR_PAIRS.length];
 const tie1=TIE_COLORS[seed%TIE_COLORS.length],tie2=TIE_COLORS[(seed+3)%TIE_COLORS.length];
 ctx={a1:pair[0],a2:pair[1],tie1,tie2,h:options?.h||'',a:options?.a||''};
 line1.textContent=ctx.a1;line2.textContent=ctx.a2;
 bar.querySelector('[data-side="1"] .s9-anchor-tie').style.background=tie1;
 bar.querySelector('[data-side="2"] .s9-anchor-tie').style.background=tie2;
}

function say(line){
 if(clearTimeout)clearTimeout(hideTimer);
 ensureBar();
 bar.hidden=false;
 bar.querySelector('.s9-anchor-speech').textContent=line;
 const speaker=line.startsWith(ctx.a2+':')?'2':'1';
 bar.querySelectorAll('.s9-anchor').forEach(el=>el.classList.toggle('talking',el.dataset.side===speaker));
}

function entrance(){
 say(fill(pick(ENTRANCE),ctx));
}
function anthem(isNational){
 // FIX 2026-09: mai durante l'inno delle nazionali, solo club (richiesta utente).
 if(isNational){hide();return}
 say(fill(pick(ANTHEM),ctx));
}
function hide(){
 if(!bar)return;
 bar.hidden=true;
 bar.querySelectorAll('.s9-anchor').forEach(el=>el.classList.remove('talking'));
}
function recap(options){
 ensureBar();
 setup(options);
 say(fill(pick(FULLTIME),{...ctx,h:options?.h||ctx.h,a:options?.a||ctx.a,sh:options?.scoreH,sa:options?.scoreA}));
 return new Promise(resolve=>{
  const done=()=>{hide();bar.removeEventListener('click',done);clearTimeout(hideTimer);resolve()};
  hideTimer=setTimeout(done,3600);
  bar.addEventListener('click',done,{once:true});
 });
}

window.S9Anchors={setup,entrance,anthem,hide,recap};
})();
