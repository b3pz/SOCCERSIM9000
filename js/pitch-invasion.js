/* SerieA 9000 SIM — Invasione di campo (V111)
   Cinematica scenica in stile anni '90: ogni tanto un tifoso scavalca la
   balaustra, corre in campo, e la security lo blocca. Puramente
   atmosferico: non tocca mai il risultato della partita (gia' deciso a
   monte da buildMatch()), la chiama semplicemente index.html dentro
   playHalf() quando current.invasion e' vero. Ricalca lo stesso schema di
   overlay+canvas+G.player() gia' usato da js/match-intro.js e
   js/trophy-ceremony.js, cosi' la resa 3D resta coerente col resto del
   gioco. Se il motore 3D (S9Football3D) non e' disponibile o la partita
   e' in modalita' 2D, si usa un fallback testuale con l'overlay classico
   (#overlay/#overlayBox, la stessa funzione ov() dei gol/parate). */
(function(){
'use strict';
const G=window.S9Football3D;
let overlay,canvas,ctx;

const INVADER_KITS=[
 {shirt:'#ff7a1a',shorts:'#111318',socks:'#ff7a1a'},
 {shirt:'#f4e04d',shorts:'#1c1c1c',socks:'#f4e04d'},
 {shirt:'#ff3b6e',shorts:'#101010',socks:'#ff3b6e'},
 {shirt:'#39d98a',shorts:'#0c1a12',socks:'#39d98a'}
];
const SECURITY_KIT={shirt:'#12213a',shorts:'#0a1526',socks:'#12213a'};

const OPENERS=[
 'UN TIFOSO SCAVALCA LA BALAUSTRA!',
 'INVASIONE DI CAMPO!',
 'QUALCUNO E\' SALTATO IN CAMPO!',
 'ALLARME STEWARD: TIFOSO IN CAMPO!'
];
const CHASES=[
 'LA SECURITY GLI DA\' LA CACCIA...',
 'GLI STEWARD SI LANCIANO ALL\'INSEGUIMENTO...',
 'PARTE L\'INSEGUIMENTO A CENTROCAMPO...'
];
const CATCHES=[
 'BLOCCATO A CENTROCAMPO!',
 'PRESO! PLACCAGGIO DA RUGBY!',
 'FERMATO PRIMA DELL\'AREA!'
];
const OUTROS=[
 'PORTATO FUORI TRA GLI APPLAUSI DELLO STADIO.',
 'ACCOMPAGNATO FUORI, IL PUBBLICO SE LA RIDE.',
 'SI RIPRENDE A GIOCARE TRA I FISCHI BONARI.'
];
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];

function ensureOverlay(){
 if(overlay)return;
 overlay=document.createElement('div');
 overlay.id='s9PitchInvasion';overlay.hidden=true;
 overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
 overlay.innerHTML=`<div class="s9-intro-shell s9-invasion-shell">
  <div class="s9-intro-kicker">FUORI PROGRAMMA</div>
  <div class="s9-intro-stage"><canvas></canvas><div class="s9-intro-live">S9 90 <b>LIVE</b></div><div class="s9-intro-caption"></div></div>
  <button type="button" class="s9-intro-skip">SALTA ▶</button>
 </div>`;
 document.body.appendChild(overlay);
 canvas=overlay.querySelector('canvas');ctx=canvas.getContext('2d');
}

function draw3D(t){
 const w=canvas.clientWidth||900,h=canvas.clientHeight||420,ratio=Math.min(devicePixelRatio||1,1.5);
 if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}
 ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
 const p=G.camera([0,9,14],[0,.6,-3],w,h,54),scene=G.scene(ctx,p);
 G.pitchSurface(ctx,p,-13,-14,26,21,1.3);

 // Fase 1 (0-.42): corsa dell'invasore da bordo campo verso il centro.
 // Fase 2 (.42-.62): la security lo raggiunge e lo circonda.
 // Fase 3 (.62-1): gruppo fermo, poi trascinato verso il bordo.
 const run=Math.min(1,t/.42);
 const invX=-12+run*18, invZ=-4.5+Math.sin(run*6)*.6;
 const caught=Math.min(1,Math.max(0,(t-.42)/.2));
 const dragOut=Math.min(1,Math.max(0,(t-.62)/.38));
 const groupX=(dragOut>0)?invX+(-13-invX)*dragOut:invX;
 const groupZ=invZ;

 G.player(scene,groupX,groupZ,invaderKit,caught<1?t*9:0,caught<1?0:Math.PI/2,.74,'',false,0);

 const g1X=-11+run*15.4, g1Z=groupZ-1.1+caught*1.1;
 const g2X=-11.6+run*14.9, g2Z=groupZ+1.1-caught*1.1;
 G.player(scene,caught<1?g1X:groupX-.35,caught<1?g1Z:groupZ-.25,SECURITY_KIT,t*9,0,.74,'',false,0);
 G.player(scene,caught<1?g2X:groupX+.35,caught<1?g2Z:groupZ+.25,SECURITY_KIT,t*9,0,.74,'',false,0);

 scene.flush();
}

function draw2DFallback(){
 // Nessun motore 3D disponibile: cornice semplice col solo testo.
 const w=canvas.clientWidth||900,h=canvas.clientHeight||420,ratio=Math.min(devicePixelRatio||1,1.5);
 if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}
 ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
 const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#0c2a1c');bg.addColorStop(1,'#123d27');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#ffdd8a';ctx.font='900 clamp(20px,3vw,34px) sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillText('🏃 INVASIONE DI CAMPO 🏃',w/2,h/2);
}

let invaderKit=INVADER_KITS[0];

function play(options){
 ensureOverlay();
 invaderKit=pick(INVADER_KITS);
 const captions=[pick(OPENERS),pick(CHASES),pick(CATCHES),pick(OUTROS)];
 const caption=overlay.querySelector('.s9-intro-caption');
 overlay.hidden=false;window.scrollTo(0,0);
 const has3D=!!(G&&window.S9Match3D&&S9Match3D.mode!=='2d');
 const total=4400,started=performance.now();
 let raf=0,lastStage=-1;
 const skipBtn=overlay.querySelector('.s9-intro-skip');
 return new Promise(resolve=>{
  function finish(){
   cancelAnimationFrame(raf);overlay.hidden=true;
   skipBtn.onclick=null;
   resolve();
  }
  skipBtn.onclick=finish;
  function frame(now){
   const t=Math.min(1,(now-started)/total);
   const stage=t<.42?0:t<.62?1:t<.9?2:3;
   if(stage!==lastStage){lastStage=stage;caption.textContent=captions[stage]}
   if(has3D)draw3D(t);else draw2DFallback();
   if(t>=1){finish();return}
   raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
 });
}

window.S9PitchInvasion={play};
})();
