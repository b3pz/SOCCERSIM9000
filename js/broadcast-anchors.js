/* SerieA 9000 SIM — Telecronisti in studio (V112)
   Vero stacco in studio (non un adesivo sul campo): due presentatori "in
   carne ed ossa" — stessi modelli 3D usati per i giocatori/arbitri, seduti
   dietro un bancone che nasconde le gambe, giacca scura e cravatta colorata
   diversa per emittente ("l'importante e' la cravatta") — che aprono la
   partita, tornano in studio durante l'inno (MAI per le nazionali, solo
   club) e chiudono con un riepilogo a fine gara prima dell'eventuale
   cinematica della coppa. Un solo interlocutore alla volta per battuta,
   cosi' il testo resta leggibile (prima le due battute erano incollate in
   una riga sola ed era incomprensibile chi dicesse cosa). Puramente
   atmosferico: non tocca mai risultato o eventi. */
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
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
const fill=(tpl,vars)=>tpl.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'');
/* FIX 2026-09 (2): un tester ha segnalato due problemi legati: le battute
   erano lunghe/contorte e usavano SEMPRE il nome e cognome completo dei
   telecronisti, sia come etichetta di chi parla sia dentro la frase stessa
   quando si rivolgevano l'un l'altro ("Ubaldo Fuorigioco: ... Learco
   Bombardi" seguito da "Learco Bombardi: ... Ubaldo Fuorigioco") - doppio
   nome lungo ripetuto ad ogni battuta, difficile da leggere al volo. Il
   nome/cognome completo resta visibile sulla targhetta 3D sul bancone (li'
   basta guardare, non serve rileggerlo nel testo): nel testo ora si usa
   solo il nome di battesimo, e le frasi sono state accorciate/semplificate. */
const firstName=n=>(n||'').split(' ')[0];

// Ogni voce e' uno scambio a 2 battute (una per anchor): si mostra prima
// l'una poi l'altra, mai insieme nella stessa riga.
const ENTRANCE=[
 ['{a1}: Eccoci, campo pronto per {h}-{a}.','{a2}: Si comincia sul serio, {a1}.'],
 ['{a1}: {h} contro {a}, si parte.','{a2}: Vediamo come va, {a1}.'],
 ['{a1}: Squadre in campo, tutto pronto.','{a2}: Io un\'idea ce l\'ho, ma non la dico.'],
 ['{a1}: Bell\'ingresso stasera, eh {a2}?','{a2}: Aspettiamo il fischio, {a1}.'],
 ['{a1}: Pronti per {h}-{a}?','{a2}: Pronti come sempre.']
];
const ANTHEM=[
 ['{a1}: Un attimo di silenzio, {a2}.','{a2}: Si prova, si prova.'],
 ['{a1}: Bell\'atmosfera stasera.','{a2}: Meglio di altre volte, devo dire.'],
 ['{a1}: Guarda le facce dei giocatori.','{a2}: C\'e\' chi canta e chi pensa gia\' alla partita.'],
 ['{a1}: Un classico prima del fischio.','{a2}: Sempre bello vederlo, {a1}.']
];
const TROPHY=[
 ['{a1}: La coppa va a {h}!','{a2}: Meritata, {a1}.'],
 ['{a1}: Che serata per {h}.','{a2}: Se la ricorderanno a lungo.'],
 ['{a1}: Applausi per {h}.','{a2}: Se lo sono guadagnato.']
];
const pick2=bank=>pick(bank);

let overlay,canvas,ctx;
const state={a1:'Piero Malaspina',a2:'Furio Stracci',tie1:'#c0392b',tie2:'#2980b9',h:'',a:'',channel:'S9 90',entranceLines:null,anthemLines:null,fulltimeLines:null,trophyLines:null,halftimeLines:null};

function setup(options){
 const channel=options?.channel||'S9 90',seed=hashStr(channel);
 const pair=ANCHOR_PAIRS[seed%ANCHOR_PAIRS.length];
 state.channel=channel;
 state.a1=pair[0];state.a2=pair[1];
 state.tie1=TIE_COLORS[seed%TIE_COLORS.length];state.tie2=TIE_COLORS[(seed+3)%TIE_COLORS.length];
 state.h=options?.h||state.h;state.a=options?.a||state.a;
 const vars={a1:firstName(state.a1),a2:firstName(state.a2),h:state.h,a:state.a};
 state.entranceLines=pick2(ENTRANCE).map(l=>fill(l,vars));
 state.anthemLines=pick2(ANTHEM).map(l=>fill(l,vars));
}
function setResult(options){
 const {scoreH,scoreA}=options||{};
 const vars={a1:firstName(state.a1),a2:firstName(state.a2),h:state.h,a:state.a,sh:scoreH,sa:scoreA};
 let bank;
 if(scoreH>scoreA)bank=[
  ['{a1}: Vince {h}, finisce {sh} a {sa}.','{a2}: Partitona. Se ne parlera\'.'],
  ['{a1}: Tre punti per {h}.','{a2}: {a} ci riprovera\', come sempre.']
 ];
 else if(scoreA>scoreH)bank=[
  ['{a1}: Vince {a}, {sa} a {sh}.','{a2}: Serata storta per {h}.'],
  ['{a1}: {a} porta a casa i tre punti.','{a2}: {h} qualche domanda se la fa.']
 ];
 else bank=[
  ['{a1}: Finisce pari, {sh} a {sa}.','{a2}: Un punto a testa, {a1}.'],
  ['{a1}: Pareggio tra {h} e {a}.','{a2}: Giusto cosi\', quasi.']
 ];
 state.fulltimeLines=pick2(bank).map(l=>fill(l,vars));
}
/* FIX 2026-09: stacco in studio anche all'intervallo (richiesta di un
   tester: "il commento dei presentatori anche all'intervallo"), con testi
   dedicati al "per ora" invece del riepilogo finale - stesso schema a 3
   esiti (avanti/sotto/pari) del fine partita. */
function setHalftime(options){
 const {scoreH,scoreA}=options||{};
 const vars={a1:firstName(state.a1),a2:firstName(state.a2),h:state.h,a:state.a,sh:scoreH,sa:scoreA};
 let bank;
 if(scoreH>scoreA)bank=[
  ['{a1}: All\'intervallo avanti {h}, {sh} a {sa}.','{a2}: {a} deve reagire nella ripresa.'],
  ['{a1}: Si va al riposo con {h} avanti.','{a2}: Vedremo la ripresa, {a1}.']
 ];
 else if(scoreA>scoreH)bank=[
  ['{a1}: Al riposo avanti {a}, {sa} a {sh}.','{a2}: {h} ha 15 minuti per rimediare.'],
  ['{a1}: {a} negli spogliatoi in vantaggio.','{a2}: Ripresa tutta da vivere per {h}.']
 ];
 else bank=[
  ['{a1}: Si va al riposo in parita\', {sh} a {sa}.','{a2}: Tutto aperto, {a1}.'],
  ['{a1}: Primo tempo equilibrato.','{a2}: Vedremo cosa dice la ripresa.']
 ];
 state.halftimeLines=pick2(bank).map(l=>fill(l,vars));
}
function setChampion(championLabel){
 const vars={a1:firstName(state.a1),a2:firstName(state.a2),h:championLabel||state.h};
 state.trophyLines=pick2(TROPHY).map(l=>fill(l,vars));
}

/* Disegna la scena "studio" (bancone + due presentatori 3D) direttamente sul
   canvas passato dal chiamante — usato sia dall'overlay dedicato (intro e
   riepilogo finale) sia, mid-cinematica, dal canvas gia' aperto da
   match-intro.js durante l'inno (nessun secondo overlay sovrapposto).
   Ritorna la battuta corrente (stringa) da mostrare nella didascalia del
   chiamante. */
function drawStudio(ctx,w,h,progress,phase){
 const g=window.S9Football3D;
 if(g){
  const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#050e1c');bg.addColorStop(1,'#0d2038');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  const p=g.camera([0,2.35,6.6],[0,1.5,0],w,h,42),scene=g.scene(ctx,p);
  // Parete di fondo dello studio, con una striscia dorata come identita' grafica.
  scene.box([0,2.7,-2.8],[9.4,5.2,.3],'#0b2036');
  scene.box([0,2.55,-2.63],[9.4,.16,.1],'#d5b35f');
  scene.box([-3.1,2.55,-2.62],[1.5,.16,.1],'#8fffe9');scene.box([3.1,2.55,-2.62],[1.5,.16,.1],'#8fffe9');
  const suit={shirt:'#20293a',shorts:'#151b26',socks:'#151b26'};
  g.player(scene,-1.75,0,suit,0,.18,1.08,'',false,0);
  g.player(scene,1.75,0,suit,0,-.18,1.08,'',false,0);
  scene.box([-1.75,1.34,.2],[.17,.44,.06],state.tie1);
  scene.box([1.75,1.34,.2],[.17,.44,.06],state.tie2);
  /* FIX 2026-09: prima il bancone finiva appena sopra il bacino e ai bordi
     dell'inquadratura si vedevano i calzoncini - alzato un poco (fino a
     poco sopra la vita, ~1.15) e reso piu' profondo, cosi' resta un margine
     di sicurezza. Il pannello frontale porta il nome del canale, come una
     vera scrivania da studio televisivo. */
  scene.box([0,.575,2.5],[7.6,1.15,1.3],'#142943');
  scene.box([0,1.15,1.86],[7.6,.07,.06],'#d5b35f');
  scene.flush();
  // Nome del canale sul pannello frontale del bancone.
  {
   const deskPos=p([0,.75,1.86]);
   ctx.font='900 clamp(11px,1.6vw,15px) Arial';ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillStyle='#d5b35f';ctx.fillText((state.channel||'S9 90')+' STUDIO',deskPos.x,deskPos.y);
  }
  // Targhette coi nomi appoggiate sul bordo del bancone, appena sopra il
  // piano - non piu' sulle facce dei presentatori.
  ctx.font='900 clamp(9px,1.3vw,12px) Arial';ctx.textAlign='center';ctx.textBaseline='middle';
  [[-1.75,state.a1],[1.75,state.a2]].forEach(([x,name])=>{
   const pos=p([x,1.28,1.7]);
   ctx.fillStyle='#020914e6';ctx.fillRect(pos.x-50,pos.y-9,100,18);
   ctx.strokeStyle='#d5b35f66';ctx.strokeRect(pos.x-50,pos.y-9,100,18);
   ctx.fillStyle='#f4e5b5';ctx.fillText(name,pos.x,pos.y+1);
  });
 }else{
  ctx.fillStyle='#0d2038';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#f4e5b5';ctx.font='900 16px Arial';ctx.textAlign='center';ctx.fillText('STUDIO',w/2,h/2);
 }
 const lines=phase==='entrance'?state.entranceLines:phase==='anthem'?state.anthemLines:phase==='trophy'?state.trophyLines:phase==='halftime'?state.halftimeLines:state.fulltimeLines;
 if(!lines)return '';
 return lines[progress<.5?0:1]||lines[0]||'';
}

function ensureOverlay(){
 if(overlay)return;
 overlay=document.createElement('div');
 overlay.id='s9AnchorStudio';overlay.hidden=true;
 overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
 overlay.innerHTML=`<div class="s9-intro-shell">
  <div class="s9-intro-kicker">STUDIO</div>
  <div class="s9-intro-stage"><canvas></canvas><div class="s9-intro-live"></div><div class="s9-intro-caption"></div></div>
  <button type="button" class="s9-intro-skip">SALTA ▶</button>
 </div>`;
 document.body.appendChild(overlay);
 canvas=overlay.querySelector('canvas');ctx=canvas.getContext('2d');
}

function runOverlay(phase,duration){
 ensureOverlay();
 overlay.querySelector('.s9-intro-live').innerHTML=`${state.h&&state.a?`${state.h} - ${state.a}`:'S9 90'} <b>LIVE</b>`;
 const caption=overlay.querySelector('.s9-intro-caption'),skipBtn=overlay.querySelector('.s9-intro-skip');
 overlay.hidden=false;window.scrollTo(0,0);
 const started=performance.now();let raf=0;
 return new Promise(resolve=>{
  function finish(){cancelAnimationFrame(raf);overlay.hidden=true;skipBtn.onclick=null;resolve()}
  skipBtn.onclick=finish;
  function frame(now){
   const t=Math.min(1,(now-started)/duration);
   const w=canvas.clientWidth||900,h=canvas.clientHeight||420,ratio=Math.min(devicePixelRatio||1,1.5);
   if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}
   ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
   const line=drawStudio(ctx,w,h,t,phase);
   if(caption.textContent!==line)caption.textContent=line;
   if(t>=1){finish();return}
   raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
 });
}

function studioIntro(options){
 setup(options);
 return runOverlay('entrance',4200);
}
function recap(options){
 setup(options);
 setResult(options);
 return runOverlay('fulltime',4200);
}
function halftime(options){
 // setup() rigenera la STESSA coppia/cravatte (hash deterministico sul
 // nome del canale, gia' scelto a inizio partita), quindi richiamarlo qui
 // e' sicuro: i presentatori restano coerenti dall'ingresso al recap finale.
 setup(options);
 setHalftime(options);
 return runOverlay('halftime',3600);
}

window.S9Anchors={setup,setResult,setChampion,drawStudio,studioIntro,recap,halftime};
})();
