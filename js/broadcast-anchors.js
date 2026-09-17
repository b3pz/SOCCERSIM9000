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

// Ogni voce e' uno scambio a 2 battute (una per anchor): si mostra prima
// l'una poi l'altra, mai insieme nella stessa riga.
const ENTRANCE=[
 ['{a1}: Eccoli, {h} e {a} entrano in campo.','{a2}: Squadre schierate: si parte davvero, {a1}.'],
 ['{a1}: Stasera {h} contro {a}, atmosfera niente male.','{a2}: Vediamo se regge fino al triplice fischio, {a1}.'],
 ['{a1}: {h} e {a} si affrontano stasera.','{a2}: Io un pronostico ce l\'ho, {a1}, ma me lo tengo.'],
 ['{a1}: Che ingresso solenne, eh {a2}?','{a2}: Solenne finche\' non parte la partita vera, {a1}.'],
 ['{a1}: Squadre pronte per {h} - {a}.','{a2}: E noi pronti a dire la nostra, come sempre, {a1}.']
];
const ANTHEM=[
 ['{a1}: E ora un momento di raccoglimento, {a2}.','{a2}: Ci si prova, {a1}, ci si prova.'],
 ['{a1}: Bella intensita\' stasera, {a2}.','{a2}: Anni fa si sentiva meno, dicono sempre tutti, {a1}.'],
 ['{a1}: Guarda le facce dei giocatori, {a2}.','{a2}: C\'e\' chi canta e chi conta i minuti, {a1}.'],
 ['{a1}: Un classico prima del fischio d\'inizio.','{a2}: Ai miei tempi era tutta un\'altra cosa, dicono.']
];
const pick2=bank=>pick(bank);

let overlay,canvas,ctx;
const state={a1:'Piero Malaspina',a2:'Furio Stracci',tie1:'#c0392b',tie2:'#2980b9',h:'',a:'',entranceLines:null,anthemLines:null,fulltimeLines:null};

function setup(options){
 const channel=options?.channel||'S9 90',seed=hashStr(channel);
 const pair=ANCHOR_PAIRS[seed%ANCHOR_PAIRS.length];
 state.a1=pair[0];state.a2=pair[1];
 state.tie1=TIE_COLORS[seed%TIE_COLORS.length];state.tie2=TIE_COLORS[(seed+3)%TIE_COLORS.length];
 state.h=options?.h||state.h;state.a=options?.a||state.a;
 const vars={a1:state.a1,a2:state.a2,h:state.h,a:state.a};
 state.entranceLines=pick2(ENTRANCE).map(l=>fill(l,vars));
 state.anthemLines=pick2(ANTHEM).map(l=>fill(l,vars));
}
function setResult(options){
 const {scoreH,scoreA}=options||{};
 const vars={a1:state.a1,a2:state.a2,h:state.h,a:state.a,sh:scoreH,sa:scoreA};
 let bank;
 if(scoreH>scoreA)bank=[
  ['{a1}: Vittoria per {h}! Finisce {sh} a {sa} su {a}.','{a2}: Che partita, {a1}. Al bar se ne parlera\' fino a tardi.'],
  ['{a1}: {h} porta a casa i tre punti, {sh} a {sa}.','{a2}: {a} ci riprovera\', {a1}, come sempre.']
 ];
 else if(scoreA>scoreH)bank=[
  ['{a1}: Vittoria per {a}! Finisce {sa} a {sh} su {h}.','{a2}: Serata da dimenticare per {h}, {a1}.'],
  ['{a1}: {a} vince {sa} a {sh}, altro che pronostico.','{a2}: {h} torna a casa con qualche domanda, {a1}.']
 ];
 else bank=[
  ['{a1}: Finisce pari, {sh} a {sa} tra {h} e {a}.','{a2}: Punticino a testa, {a1}, non scontenta nessuno... o forse si\'.'],
  ['{a1}: Pareggio tra {h} e {a}, {sh} a {sa}.','{a2}: Giusto cosi\', {a1}, o quasi.']
 ];
 state.fulltimeLines=pick2(bank).map(l=>fill(l,vars));
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
  // Bancone: davanti ai due presentatori, nasconde gambe/busto basso.
  scene.box([0,.52,2.35],[7.6,1.04,1.05],'#142943');
  scene.box([0,1.03,1.82],[7.6,.07,.06],'#d5b35f');
  scene.flush();
  ctx.font='900 clamp(10px,1.4vw,13px) Arial';ctx.textAlign='center';ctx.textBaseline='top';
  [[-1.75,state.a1],[1.75,state.a2]].forEach(([x,name])=>{
   const pos=p([x,2.05,0]);
   ctx.fillStyle='#020914cc';ctx.fillRect(pos.x-52,pos.y+2,104,17);
   ctx.fillStyle='#f4e5b5';ctx.fillText(name,pos.x,pos.y+4);
  });
 }else{
  ctx.fillStyle='#0d2038';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#f4e5b5';ctx.font='900 16px Arial';ctx.textAlign='center';ctx.fillText('STUDIO',w/2,h/2);
 }
 const lines=phase==='entrance'?state.entranceLines:phase==='anthem'?state.anthemLines:state.fulltimeLines;
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

window.S9Anchors={setup,setResult,drawStudio,studioIntro,recap};
})();
