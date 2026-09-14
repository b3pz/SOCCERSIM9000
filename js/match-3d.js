/* Presentation only: the existing match engine remains the source of every event. */
(function(){
'use strict';
const MODES=['2d','3d','highlights'];
let mode='3d';try{const saved=localStorage.getItem('s9-match-view');if(MODES.includes(saved))mode=saved}catch(e){}
let canvas,ctx,frameId=0,trackedMatch=null,kitVersion=0,lastTime=0,eventActive=false;
let uniforms={},playerDots=[],pitchHalf=0,pendingSetup=false;
let visualTime=0,visualLast=0;
let grassTextureCache=null;
let followCamera=newCamera();
function newCamera(){return {x:52.5,z:34,vx:0,vz:0,last:0,blend:0,ballX:52.5,ballZ:34,lead:0}}
let highlightState=null; // camera delle azioni salienti: segue il pallone ma senza orbitare attorno alla scena
let celebrationState=null; // breve cinematica fissa del gol con esultanza di gruppo
function attackInfo(side){
 const secondHalf=current?.half===2;
 const home=side==='home';
 const attacksRight=(home&&!secondHalf)||(!home&&secondHalf);
 return {side,attacksRight,goalX:attacksRight?105:0,dir:attacksRight?-1:1};
}
function beginHighlight(side){highlightState=attackInfo(side)}
// A critically damped translation on one fixed stadium side. No azimuth changes.
function followedCamera(now,ball){
 const c=followCamera,dt=c.last?Math.min(.08,(now-c.last)/1000):.033;c.last=now;
 const active=highlightState?1:0;
 c.blend+=(active-c.blend)*(1-Math.exp(-dt/.65));
 const velocity=clamp((ball.x-c.ballX)/dt,-22,22);
 c.lead+=(velocity*.12-c.lead)*(1-Math.exp(-dt/.5));
 c.ballX=ball.x;c.ballZ=ball.z;
 const desiredX=clamp(ball.x+c.lead,8,97),desiredZ=34+(ball.z-34)*.12;
 const step=(axis,desired,dead)=>{
  const delta=desired-c[axis],goal=Math.abs(delta)<=dead?c[axis]:desired-Math.sign(delta)*dead;
  const v='v'+axis,omega=3.4,decay=Math.exp(-omega*dt),offset=c[axis]-goal;
  const temp=(c[v]+omega*offset)*dt;
  c[axis]=goal+(offset+temp)*decay;c[v]=(c[v]-omega*temp)*decay;
 };
 step('x',desiredX,1.8);step('z',desiredZ,.65);
 const widening=Math.pow(Math.abs(ball.x-52.5)/52.5,3)*4+Math.max(0,1-Math.abs(ball.x-52.5)/16)*2;
 // Nelle azioni salienti (blend->1) la telecamera si stringe molto di piu' di
 // prima: meno campo inquadrato, meno altezza, meno distanza dal pallone.
 const span=35-c.blend*15+widening;
 return {eye:[c.x,38-c.blend*14,c.z+76-c.blend*32],target:[c.x,.7,c.z],fov:43,
  bounds:[[c.x-span,0,-3+c.blend*18],[c.x+span,0,-3+c.blend*18],[c.x-span,3.5,71-c.blend*18],[c.x+span,3.5,71-c.blend*18]],spanX:span};
}
function makeCelebrationState(side,scorerId){
 const info=attackInfo(side),all=playerDots.filter(d=>d.classList.contains(side)&&d.dataset.role!=='GK');
 const leader=all.find(d=>d.dataset.pid===scorerId)||all[all.length-1];if(!leader)return null;
 const others=all.filter(d=>d!==leader).sort((a,b)=>Math.abs(parseFloat(a.style.left)-parseFloat(leader.style.left))-Math.abs(parseFloat(b.style.left)-parseFloat(leader.style.left))).slice(0,4);
 const variant=((current.minute||0)+(current.scoreH||0)+(current.scoreA||0))%4;
 const centerX=info.attacksRight?86:19,centerZ=variant===1?55:34;
 const offsets=[[[0,0],[-2,1.5],[2,1.5],[-1,3],[1,3]],[[0,0],[-2,-2],[2,-2],[-1,-4],[1,-4]],[[0,0],[-3,0],[0,3],[3,0],[0,-3]],[[0,-2],[-3,2],[0,3],[3,2],[5,3]]][variant];
 const targets=new Map();
 [leader,...others].forEach((d,i)=>{
  const off=offsets[i],x=centerX+off[0],z=centerZ+off[1];
  targets.set(d.dataset.pid,{x,z,startX:i===0&&variant!==1?x:variant===1?x-info.dir*2:x+(i%2?4:-4),startZ:variant===1?z-13:z+(i===0?0:5),leader:i===0});
 });
 return {...info,variant,centerX,centerZ,started:visualTime,targets};
}
function celebrationFrame(now){
 const c=celebrationState;if(!c)return null;
 const t=Math.max(0,now-c.started),progress=clamp(t/(c.variant===1?2500:1600),0,1);
 return {...c,eye:[c.centerX,13,c.centerZ+42],target:[c.centerX,1.3,c.centerZ],fov:36,
  bounds:[[c.centerX-10,0,c.centerZ-15],[c.centerX+10,0,c.centerZ-15],[c.centerX-10,4,c.centerZ+7],[c.centerX+10,4,c.centerZ+7]],
  progress:progress*progress*(3-2*progress)};
}
async function waitForCelebration(){
 const state=celebrationState,match=current;if(!state)return;
 await new Promise(resolve=>{
  function tick(){
   if(current!==match||match._finished||mode==='2d'||!celebrationState||visualTime-state.started>=4200){resolve();return;}
   requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
 });
 if(current===match){celebrationState=null;if(pendingSetup){pendingSetup=false;setupPitch();}}
}
async function celebrate(side,scorerId){
 if(mode==='2d')return;
 // The scoreboard/banner has already confirmed the engine's goal before this cut.
 await S9MatchVisual.hold(600);
 document.getElementById('v7EventToast')?.classList.remove('show');
 celebrationState=makeCelebrationState(side,scorerId);
 if(!celebrationState)return;
 document.getElementById('match').dataset.cinematic='goal';
 try{await waitForCelebration()}
 finally{delete document.getElementById('match').dataset.cinematic;followCamera=newCamera();highlightState=null;}
}
const oldAnimAttack=window.animAttack;
window.animAttack=async function(side,outcome){
 if(mode!=='2d')beginHighlight(side);
 return oldAnimAttack.apply(this,arguments);
};
animAttack=window.animAttack;
const positions=new Map(),boards=new Map(),crowds=new Map(),identityBoards=new Map(),crestBoards=new Map();
const api=window.S9Match3D={get mode(){return mode},get eventActive(){return eventActive},get celebrating(){return !!celebrationState},waitCelebration:waitForCelebration,celebrate,setMode,crowdTexture,stadiumIdentityTexture,stadiumCrestTexture};
const graphics=window.S9Football3D;
// Texture "folla": generata una volta per tribuna e messa in cache (stesso
// pattern di `boards` sopra per i cartelloni), cosi' non si ridisegna ogni
// frame. Tre varianti (indice 0/1/2, una per tribuna) cosi' le tre non sono
// fotocopie identiche l'una dell'altra.
function crowdTexture(brand,stadiumStyle,standIndex){
 const variant=((standIndex%3)+3)%3;
 const key=[variant,brand.dark,brand.accent,stadiumStyle.seats].join('|');
 if(crowds.has(key))return crowds.get(key);
 const cv=document.createElement('canvas');cv.width=768;cv.height=64;
 const cx=cv.getContext('2d');
 const bg=[stadiumStyle.seats,brand.dark,'#20304a'][variant]||stadiumStyle.seats;
 cx.fillStyle=bg;cx.fillRect(0,0,cv.width,cv.height);
 const palette=[brand.accent,'#e8d9b0','#d94f4f','#4f7fd9','#e6e6e6','#8a8a8a','#c98a3a'];
 for(let row=0;row<7;row++){
  const y=4+row*8.4;
  for(let i=0;i<110;i++){
   const x=(i*7+row*3.1+variant*2.4)%cv.width;
   cx.fillStyle=palette[(x*13+row*29+variant*11)%palette.length|0];
   cx.fillRect(x,y+(i%3),3,3);
  }
 }
 crowds.set(key,cv);
 return cv;
}
function crestSource(id){
 return window.S9V10_DATA?.crestPath?.(id)||window.CREST_ASSETS?.[id]||T(id)?.crest||'';
}
// Maxischermo dello stadio: usa gli stemmi dei club che appartengono davvero
// all'impianto. Il canvas viene memorizzato e aggiornato solo quando termina il
// caricamento delle immagini, quindi non aggiunge lavoro ai frame della gara.
function stadiumIdentityTexture(identity,stadiumStyle,onReady){
 if(!identity?.clubs?.length)return null;
 const key=identity.venue+'|'+identity.clubs.map(c=>c.id).join('|');
 let entry=identityBoards.get(key);
 if(!entry){
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=224;
  entry={canvas,images:new Map(),pending:0,listeners:new Set()};identityBoards.set(key,entry);
  const redraw=()=>{
   const c=canvas.getContext('2d'),clubs=identity.clubs;
   const bg=c.createLinearGradient(0,0,960,224);bg.addColorStop(0,'#050a12');bg.addColorStop(.55,'#102038');bg.addColorStop(1,'#050a12');c.fillStyle=bg;c.fillRect(0,0,960,224);
   c.strokeStyle=stadiumStyle?.accent||'#d8dde5';c.lineWidth=8;c.strokeRect(4,4,952,216);
   clubs.forEach((club,index)=>{
    const segment=960/clubs.length,x=segment*index,colors=club.colors||['#23344c','#e8edf2'];
    c.fillStyle=colors[0];c.fillRect(x+12,164,segment-24,38);c.fillStyle=colors[1];c.fillRect(x+12,194,segment-24,8);
    const image=entry.images.get(club.id);
    if(image?.complete&&image.naturalWidth){
     const maxW=clubs.length>1?105:180,maxH=clubs.length>1?118:154,ratio=Math.min(maxW/image.naturalWidth,maxH/image.naturalHeight);
     c.drawImage(image,x+(clubs.length>1?42:55)+(maxW-image.naturalWidth*ratio)/2,30+(maxH-image.naturalHeight*ratio)/2,image.naturalWidth*ratio,image.naturalHeight*ratio);
    }
    c.fillStyle='#f5f1e7';c.textAlign='left';c.textBaseline='middle';
    c.font='900 '+(clubs.length>1?32:46)+'px Arial';c.fillText(club.name.toUpperCase(),x+(clubs.length>1?165:280),95,segment-(clubs.length>1?185:315));
    c.fillStyle='#c8d2df';c.font='700 18px Arial';c.fillText(clubs.length>1?'CLUB DI CASA':'SQUADRA DI CASA',x+(clubs.length>1?165:280),132,segment-(clubs.length>1?185:315));
   });
   c.fillStyle='#f0d38a';c.textAlign='center';c.font='800 17px Arial';c.fillText(identity.venue.toUpperCase(),480,20);
  };
  redraw();
  for(const club of identity.clubs){
   const src=crestSource(club.id);if(!src)continue;
   const image=new Image();entry.images.set(club.id,image);entry.pending++;
   image.onload=image.onerror=()=>{entry.pending=Math.max(0,entry.pending-1);redraw();if(!entry.pending){for(const fn of entry.listeners)fn();entry.listeners.clear();}};
   image.src=src;
  }
 }
 if(onReady&&entry.pending)entry.listeners.add(onReady);
 return entry.canvas;
}
function stadiumCrestTexture(club,onReady){
 if(!club)return null;
 let entry=crestBoards.get(club.id);
 if(!entry){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  entry={canvas,pending:true,listeners:new Set()};crestBoards.set(club.id,entry);
  const c=canvas.getContext('2d'),colors=club.colors||['#23344c','#e8edf2'];
  const paint=image=>{
   c.clearRect(0,0,256,256);c.fillStyle=colors[0];c.fillRect(0,0,256,256);c.fillStyle=colors[1];
   c.beginPath();c.moveTo(256,0);c.lineTo(256,256);c.lineTo(0,256);c.closePath();c.fill();
   c.fillStyle='rgba(4,9,16,.72)';c.fillRect(12,12,232,232);c.strokeStyle='#f1d589';c.lineWidth=7;c.strokeRect(12,12,232,232);
   if(image?.naturalWidth){const ratio=Math.min(188/image.naturalWidth,188/image.naturalHeight);c.drawImage(image,128-image.naturalWidth*ratio/2,128-image.naturalHeight*ratio/2,image.naturalWidth*ratio,image.naturalHeight*ratio)}
  };
  paint();const src=crestSource(club.id);
  if(src){const image=new Image();image.onload=()=>{entry.pending=false;paint(image);for(const fn of entry.listeners)fn();entry.listeners.clear()};image.onerror=()=>{entry.pending=false;for(const fn of entry.listeners)fn();entry.listeners.clear()};image.src=src}else entry.pending=false;
 }
 if(onReady&&entry.pending)entry.listeners.add(onReady);
 return entry.canvas;
}
function marathonTower(s,x,z,scale=1){
 const concrete='#c9c1a9',shadow='#756f65',glass='#25313a';
 s.box([x,13.5*scale,z],[3.3*scale,27*scale,3.4*scale],concrete);
 s.box([x-2.35*scale,11.5*scale,z],[.55*scale,23*scale,3.8*scale],shadow);
 s.box([x+2.35*scale,11.5*scale,z],[.55*scale,23*scale,3.8*scale],shadow);
 for(let y=4.4;y<23;y+=4.4){
  s.box([x,y*scale,z+1.8*scale],[5.4*scale,.42*scale,2.2*scale],concrete);
  const flip=Math.round(y/4.4)%2===0?-1:1;
  s.face([[x-2.05*flip*scale,(y-3.7)*scale,z+3*scale],[x-1.55*flip*scale,(y-3.7)*scale,z+3*scale],[x+2.05*flip*scale,y*scale,z+3*scale],[x+1.55*flip*scale,y*scale,z+3*scale]],shadow);
 }
 for(const y of [6.4,11.8,17.2,22.6])s.box([x,y*scale,z-1.76*scale],[1.55*scale,2.2*scale,.12*scale],glass);
 s.box([x,27.5*scale,z],[6.4*scale,1.15*scale,4.6*scale],concrete);
 s.box([x,29.5*scale,z],[.5*scale,3.2*scale,.5*scale],shadow);
}
function kitSource(side){return kitPath(side==='home'?current.h:current.a,selectedKits[side])}
function setMode(value){
 if(!MODES.includes(value))return;const changed=mode!==value;mode=value;
 if(changed){followCamera=newCamera();positions.clear();if(mode==='2d')highlightState=null;}
 try{localStorage.setItem('s9-match-view',mode)}catch(e){}
 document.querySelectorAll('[data-match-presentation]').forEach(s=>s.value=mode);
 document.getElementById('match').dataset.presentation=mode;
 const tab=document.querySelectorAll('#match .match-tabs span')[2];if(tab){tab.textContent=mode==='2d'?'CAMPO 2D':mode==='highlights'?'AZIONI 3D':'CAMPO 3D';tab.setAttribute('aria-label','Apri '+tab.textContent);}
 if(canvas)canvas.hidden=mode==='2d';
}
function controls(parent,id){
 const label=document.createElement('label');label.className='s9-view-choice';label.htmlFor=id;label.append('Visualizzazione ');
 const select=document.createElement('select');select.id=id;select.dataset.matchPresentation='';
 for(const [value,text] of [['2d','Campo 2D'],['3d','Partita in 3D'],['highlights','Azioni salienti in 3D']]){const o=document.createElement('option');o.value=value;o.textContent=text;select.appendChild(o)}
 select.value=mode;select.addEventListener('change',()=>setMode(select.value));label.appendChild(select);parent.appendChild(label);
}
function ensureCanvas(){
 const pitch=document.getElementById('pitch');if(!pitch)return;
 if(!canvas){canvas=document.createElement('canvas');canvas.id='match3dCanvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Partita in 3D: giocatori con le divise selezionate, pallone e porte');ctx=canvas.getContext('2d');}
 if(canvas.parentNode!==pitch)pitch.prepend(canvas);
 if(!ctx){setMode('2d');return}setMode(mode);
}
async function updateUniforms(){
 if(!current?.h||!current?.a)return;
 const match=current,version=++kitVersion;
 const entries=await Promise.all(['home','away'].map(async side=>[side,await graphics.loadKit(kitSource(side))]));
 if(current!==match||version!==kitVersion)return;
 uniforms=Object.fromEntries(entries);
 for(const side of ['home','away']){
  const kit=uniforms[side];
  document.querySelectorAll('#pitch .dot.'+side).forEach(d=>d.style.background=kit.shirt);
  const swatch=document.querySelector('.pitch-team-swatch.'+side);if(swatch)swatch.style.background=kit.shirt;
 }
}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function ballWorldPosition(){
 const ball=document.getElementById('ball');
 if(!ball)return {x:52.5,z:34,lift:0};
 const lift=/translateY\((-?[\d.]+)px\)/.exec(ball.style.transform||'');
 return {
  x:clamp((Number.isFinite(parseFloat(ball.style.left))?parseFloat(ball.style.left):50)*1.05,-2,107),
  z:clamp((Number.isFinite(parseFloat(ball.style.top))?parseFloat(ball.style.top):50)*.68,0,68),
  lift:lift?-Number(lift[1])/12:0
 };
}
function grassTexture(){
 if(grassTextureCache)return grassTextureCache;
 const c=document.createElement('canvas');c.width=840;c.height=544;
 const g=c.getContext('2d');
 if(!g)return c;
 g.fillStyle='#347f4d';g.fillRect(0,0,c.width,c.height);
 // Texture dell'erba deterministica: viene generata una volta sola, quindi
 // non scintilla tra un fotogramma e l'altro.
 let seed=9000;
 const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let i=0;i<14500;i++){
  const x=rnd()*c.width,y=rnd()*c.height,len=.6+rnd()*1.8;
  g.strokeStyle=rnd()>.48?'rgba(214,239,174,.105)':'rgba(4,45,20,.12)';
  g.lineWidth=.55+rnd()*.45;g.beginPath();g.moveTo(x,y);g.lineTo(x+(rnd()-.5)*.7,y-len);g.stroke();
 }
 // Sottili passate del rasaerba, senza rubare leggibilita' alle righe bianche.
 g.strokeStyle='rgba(235,255,214,.045)';g.lineWidth=1;
 for(let y=18;y<c.height;y+=34){g.beginPath();g.moveTo(0,y);g.lineTo(c.width,y);g.stroke()}
 grassTextureCache=c;return c;
}
function drawField(s,p,w,h,closeUp){
 const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,'#182d47');gradient.addColorStop(1,'#091825');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
 // Stadium tiers, perimeter and alternating mown strips.
 const brand=window.S9Competition?.active()||{name:'SERIE A',accent:'#d5b35f',dark:'#142f57'};
 const stadiumStyle=window.S9Competition?.stadiumStyle()||{tiers:4,seats:'#385572',track:false};
 if(!closeUp){
  // v11 — prima il primo anello di spalti stava a y=tier*1.6-1: per tier 0
  // significava un'altezza NEGATIVA, cioe' lo spalto affondava sotto il
  // livello del campo ed era di fatto invisibile ("tribune a terra"). Ora la
  // base del primo anello sta esattamente sul terreno, e ci sono gradinate
  // anche dietro le due porte (prima esisteva solo il fondo opposto alla
  // telecamera), cosi' lo stadio si legge come chiuso anche da lontano.
  const setback=stadiumStyle.setback||0,left=-8-setback,right=113+setback,back=-10-setback;
  const tierBox=(cx,cz,dx,dz,recedeX,recedeZ,standIndex)=>{const crowd=crowdTexture(brand,stadiumStyle,standIndex);for(let tier=0;tier<(standIndex?stadiumStyle.endTiers||stadiumStyle.tiers:stadiumStyle.tiers);tier++)s.box([cx+(recedeX||0)*tier,.75+tier*1.6,cz+(recedeZ||0)*tier],[dx,1.5,dz],tier%2?stadiumStyle.seats:brand.dark,0,crowd)};
  tierBox(52.5,back,124,3,0,-3,0);      // tribuna principale, di fronte alla telecamera (anelli via via piu' arretrati)
  tierBox(left,34,3,88,-2.4,0,1);        // curva sinistra, dietro una porta
  tierBox(right,34,3,88,2.4,0,2);        // curva destra, dietro l'altra porta
  // Le due curve hanno il lato rivolto verso il campo lungo l'asse x, non z:
  // box() applica la texture solo alla faccia locale z+1 (vedi crowdTexture),
  // quindi qui la folla va disegnata come faccia aggiuntiva con s.face(),
  // sullo stesso lato interno e sugli stessi anelli colorati di sopra.
  const curvaCrowd=(cx,dzC,cz,dz,recedeX,standIndex,inward)=>{
   const crowd=crowdTexture(brand,stadiumStyle,standIndex);
   for(let tier=0;tier<(stadiumStyle.endTiers||stadiumStyle.tiers);tier++){
    const tx=cx+recedeX*tier,ty=.75+tier*1.6,faceX=tx+inward*(dzC/2+.02);
    s.face([[faceX,ty-.75,cz-dz/2],[faceX,ty-.75,cz+dz/2],[faceX,ty+.75,cz+dz/2],[faceX,ty+.75,cz-dz/2]],stadiumStyle.seats,crowd);
   }
  };
  curvaCrowd(left,3,34,88,-2.4,1,1);
  curvaCrowd(right,3,34,88,2.4,2,-1);
  if(stadiumStyle.track)s.box([52.5,-.45,34],[132,.2,94],'#985d4f');
  // V108: silhouette dello stadio differenziata dal nome reale. Non sono
  // fotografie: cambiano davvero tetto, anelli e dettagli del modello 3D.
  const topY=.75+(stadiumStyle.tiers-1)*1.6+1.05,roof=stadiumStyle.roof||'partial',accent=stadiumStyle.accent||'#d9dde5';
  if(roof==='ring'||roof==='continuous'||roof==='closed'){
    s.box([52.5,topY+1.05,-13],[126,.35,5],accent);
    s.box([52.5,topY+1.05,81],[126,.35,5],accent);
    s.box([-11,topY+1.05,34],[5,.35,92],accent);
    s.box([116,topY+1.05,34],[5,.35,92],accent);
  }else if(roof==='steep'||roof==='classic'||roof==='partial'){
    s.box([52.5,topY+1.1,-13],[122,.38,5],accent);
    if(roof!=='partial')s.box([52.5,topY+.7,81],[118,.30,4],accent);
  }else if(roof==='arch'){
    s.box([52.5,topY+1.0,-13],[124,.32,5],accent);
    for(let i=0;i<9;i++){
      const x=12+i*10.2,y=topY+1.7+Math.sin(i*Math.PI/8)*4.2;
      s.box([x,y,-14],[.45,1.2,.45],accent);
    }
  }else if(roof==='towers'){
    for(const x of [-9,114])for(const z of [-9,77]){
      s.box([x,topY+2.4,z],[3.2,7.2,3.2],'#b9c0c8');
      s.box([x,topY+5.9,z],[4.2,.35,4.2],accent);
    }
    s.box([52.5,topY+1.1,-13],[118,.34,5],accent);
  }
  if(stadiumStyle.corners==='closed')for(const x of [left+2,right-2]){
   for(let tier=0;tier<(stadiumStyle.endTiers||2);tier++)s.box([x,.75+tier*1.6,back+2],[14,1.5,3],stadiumStyle.seats,x<0?-.7:.7,crowdTexture(brand,stadiumStyle,2));
  }
  const lightRows=stadiumStyle.landmark==='torre-maratona'?[back-5]:[back-5,78+setback];
  for(const x of [left-3,right+3])for(const z of lightRows){
   s.box([x,8,z],[.35,16,.35],'#b8c2cd');s.box([x,16.4,z],[4,1.6,.5],'#263543');
   s.face([[x-1.8,15.8,z+.28],[x+1.8,15.8,z+.28],[x+1.8,17,z+.28],[x-1.8,17,z+.28]],'#fff2cc');
  }
  if(stadiumStyle.landmark==='torre-maratona')marathonTower(s,52.5,back-7);
  const stadiumIdentity=window.S9Competition?.stadiumIdentity?.();
  if(canvas&&stadiumIdentity){
   const clubNames=stadiumIdentity.clubs.map(club=>club.name).join(' e ');
   const label='Partita in 3D allo '+stadiumIdentity.venue+(clubNames?' · stadio di '+clubNames:'');
   if(canvas.getAttribute('aria-label')!==label)canvas.setAttribute('aria-label',label);
  }
  const identityTexture=stadiumIdentityTexture(stadiumIdentity,stadiumStyle);
  if(identityTexture){
   const identityX=stadiumStyle.landmark==='torre-maratona'?29:52.5;
   const identityY=Math.max(6.2,topY+1.2);
   s.box([identityX,identityY,back+1.85],[stadiumStyle.landmark==='torre-maratona'?31:38,9,.5],'#07111f',0,identityTexture);
   stadiumIdentity.clubs.slice(0,2).forEach((club,index)=>{
    const positions=stadiumIdentity.clubs.length>1?[16,89]:[stadiumStyle.landmark==='torre-maratona'?79:84];
    const crestTexture=stadiumCrestTexture(club);
    if(crestTexture)s.box([positions[index],8.1,back+1.9],[10.5,11,.56],club.colors?.[0]||'#14233a',0,crestTexture);
   });
  }
  for(const x of [0,105])for(const z of [0,68]){s.box([x,.8,z],[.12,1.6,.12],'#e4e9de');s.box([x+.4,1.4,z],[.8,.4,.08],brand.accent)}
  const boardText=(window.S9Competition?.adBoardText?.()||brand.name).toUpperCase();
  let board=boards.get(boardText);if(!board){
   board=document.createElement('canvas');board.width=960;board.height=64;
   const bc=board.getContext('2d');bc.fillStyle=brand.dark;bc.fillRect(0,0,960,64);
   bc.fillStyle='rgba(255,255,255,.08)';bc.fillRect(0,4,960,8);bc.fillRect(0,52,960,8);
   bc.fillStyle=brand.accent;let size=30;bc.textAlign='center';bc.textBaseline='middle';
   do{bc.font='bold '+size+'px Arial'}while(size-->16&&bc.measureText(boardText).width>860);
   bc.fillText(boardText,480,33);
   boards.set(boardText,board)
  }
  // Cartelloni pubblicitari a bordo campo su tutti e tre i lati visibili:
  // prima c'era solo quello davanti alla tribuna principale.
  s.face([[13,.1,-3],[92,.1,-3],[92,3,-3],[13,3,-3]],brand.dark,board);
  s.face([[-3,.1,10],[-3,.1,58],[-3,3,58],[-3,3,10]],brand.dark,board);
  s.face([[108,.1,58],[108,.1,10],[108,3,10],[108,3,58]],brand.dark,board);
 }
 s.flush();
 const turf=graphics.scene(ctx,p);
 turf.face([[-8,-.08,-8],[113,-.08,-8],[113,-.08,76],[-8,-.08,76]],'#245643');
 turf.flush();
 const grass=graphics.scene(ctx,p);
 grass.face([[0,.012,0],[105,.012,0],[105,.012,68],[0,.012,68]],'#347f4d',grassTexture());
 grass.flush();
 for(let i=0;i<12;i++){const strip=graphics.scene(ctx,p),x=i*8.75;strip.face([[x,.025,0],[x+8.75,.025,0],[x+8.75,.025,68],[x,.025,68]],i%2?'rgba(222,240,179,.045)':'rgba(0,24,7,.055)');strip.flush();}
 const line=(points,lw)=>{ctx.beginPath();points.map(v=>p(v)).forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.strokeStyle='#dcebd4';ctx.lineWidth=lw||Math.max(1,w/1000);ctx.stroke()};
 const rect=(x,z,dx,dz,lw)=>line([[x,.04,z],[x+dx,.04,z],[x+dx,.04,z+dz],[x,.04,z+dz],[x,.04,z]],lw);
 // v10.9 — durante il primo piano su un'azione, prima si disegnava
 // SEMPRE tutto il campo (perimetro intero, cerchio di centrocampo,
 // porta opposta, bandierine lontane) — visto da una telecamera vicina e
 // bassa, quelle linee lontane finivano per incrociarsi sullo schermo in
 // una "X" illeggibile. Ora, in primo piano, si disegna solo l'area
 // vicina alla porta interessata: la sua area di rigore/di porta e un
 // pezzo corto di fascia laterale, nient'altro.
 if(closeUp){
  const gx=closeUp.goalX,dir=closeUp.dir; // dir: verso il campo, +1 o -1
  rect(gx,13.84,dir*16.5,40.32,Math.max(2.5,w/350));
  rect(gx-(dir>0?0:5.5),24.84,dir*5.5,18.32,Math.max(2,w/500));
  line([[gx,.04,0],[gx+dir*30,.04,0]]);line([[gx,.04,68],[gx+dir*30,.04,68]]);
 }else{
  rect(0,0,105,68);line([[52.5,.04,0],[52.5,.04,68]]);
  rect(0,13.84,16.5,40.32);rect(88.5,13.84,16.5,40.32);rect(0,24.84,5.5,18.32);rect(99.5,24.84,5.5,18.32);
  line(Array.from({length:65},(_,i)=>[52.5+Math.cos(i*Math.PI/32)*9.15,.04,34+Math.sin(i*Math.PI/32)*9.15]));
  for(const x of [11,52.5,94]){const v=p([x,.05,34]);ctx.fillStyle='#e7eedf';ctx.beginPath();ctx.arc(v.x,v.y,1.8,0,Math.PI*2);ctx.fill()}
  // Quarto di cerchio ai 4 angoli (raggio 1m, zona di battuta del corner):
  // prima mancavano del tutto, il campo finiva a spigolo vivo.
  for(const [cx,cz,sx,sz] of [[0,0,1,1],[105,0,-1,1],[0,68,1,-1],[105,68,-1,-1]])
   line(Array.from({length:9},(_,i)=>[cx+sx*Math.cos(i*Math.PI/16),.04,cz+sz*Math.sin(i*Math.PI/16)]),Math.max(1,w/900));
 }
 for(const x of (closeUp?[closeUp.goalX]:[0,105])){
  const back=x===0?-2:107;
  for(let z=30.34;z<38;z+=.61){line([[x,2.44,z],[back,2.44,z],[back,0,z]])}
  for(let y=0;y<=2.44;y+=.61)line([[x,y,30.34],[back,y,30.34],[back,y,37.66],[x,y,37.66]]);
  ctx.lineWidth=2;line([[x,0,30.34],[x,2.44,30.34],[x,2.44,37.66],[x,0,37.66]]);
 }
}
function render(now){
 frameId=0;
 if(!document.getElementById('match')?.classList.contains('active')||document.hidden)return;
 frameId=requestAnimationFrame(render);
 if(typeof refreshTacticsPitch==='function')refreshTacticsPitch();
 if(mode==='2d'||!ctx||!current||canvas.offsetWidth===0){visualLast=0;return;}
 if(now-lastTime<32)return;lastTime=now;
 const w=Math.round(canvas.clientWidth),h=Math.round(canvas.clientHeight);if(!w||!h)return;
 const ratio=Math.min(window.devicePixelRatio||1,1.5);if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}ctx.setTransform(ratio,0,0,ratio,0,0);
 const ballPos=ballWorldPosition();
 if(visualLast&&!paused&&!document.hidden)visualTime+=Math.min(80,now-visualLast);
 visualLast=now;
 const celebration=celebrationFrame(visualTime);
 const cameraState=celebration||followedCamera(now,ballPos);
 const raw=graphics.camera(cameraState.eye,cameraState.target,w,h,cameraState.fov);
 const bounds=cameraState.bounds.map(raw);
 // Include the actual ball in the safe frame during long passes, including its height.
 if(!celebration){for(const dx of [-7,7])for(const dz of [-6,6])bounds.push(raw([ballPos.x+dx,ballPos.lift+2,ballPos.z+dz]));}
 const venueStyle=window.S9Competition?.stadiumStyle?.();
 if(!celebration&&!highlightState&&venueStyle?.landmarkHeight){
  const setback=venueStyle.setback||0;
  bounds.push(raw([52.5,venueStyle.landmarkHeight,-17-setback]));
 }
 const minX=Math.min(...bounds.map(p=>p.x)),maxX=Math.max(...bounds.map(p=>p.x)),minY=Math.min(...bounds.map(p=>p.y)),maxY=Math.max(...bounds.map(p=>p.y));
 const zoom=Math.max(.1,Math.min((w-28)/(maxX-minX),(h-65)/(maxY-minY)));
 const p=point=>{const v=raw(point);return {x:w/2+(v.x-(minX+maxX)/2)*zoom,y:h/2+12+(v.y-(minY+maxY)/2)*zoom,z:v.z}};
 drawField(graphics.scene(ctx,p),p,w,h,null);
 const actors=graphics.scene(ctx,p);
 for(const side of ['home','away']){
  const kit=uniforms[side]||{shirt:side==='home'?'#305cad':'#eeeeeb',shorts:'#182436',socks:'#eeeeeb'};
  for(const d of playerDots.filter(d=>d.classList.contains(side))){
   if(celebration&&!celebration.targets.has(d.dataset.pid))continue;
   let x=(parseFloat(d.style.left)||0)*1.05,z=(parseFloat(d.style.top)||0)*.68;
   let angle=side==='home'?Math.PI/2:-Math.PI/2;
   let phase=0,celebrating=0;
   const celebTarget=celebration&&celebrationState?.side===side?celebrationState.targets.get(d.dataset.pid):null;
   if(celebTarget){
    x=celebTarget.startX+(celebTarget.x-celebTarget.startX)*celebration.progress;
    z=celebTarget.startZ+(celebTarget.z-celebTarget.startZ)*celebration.progress;
    angle=celebration.variant===1?0:celebTarget.leader?0:Math.atan2(celebration.centerX-x,celebration.centerZ-z);
    phase=celebration.progress<.98?celebration.progress*10:0;
    celebrating=celebration.progress<.65?(celebTarget.leader?.6:0):.92+.08*Math.sin(visualTime/420);
   }else{
    const old=positions.get(d.dataset.pid)||{x,z,phase:0,angle};
    const distance=Math.hypot(x-old.x,z-old.z);phase=old.phase;angle=old.angle;
    if(!paused&&distance>.015){phase+=Math.min(distance,.65)*1.05;const desired=Math.atan2(x-old.x,z-old.z);angle+=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle))*.28}
    positions.set(d.dataset.pid,{x,z,phase,angle});
   }
   const shadow=p([x,.03,z]);ctx.fillStyle='#071f2466';ctx.beginPath();ctx.ellipse(shadow.x,shadow.y,Math.max(3,w/160),Math.max(1.5,w/440),0,0,Math.PI*2);ctx.fill();
   if(!celebration&&S9MatchVisual.carrier===d){ctx.strokeStyle='#f5db79';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(shadow.x,shadow.y,Math.max(5,w/110),Math.max(2,w/330),0,0,Math.PI*2);ctx.stroke();}
   graphics.player(actors,x,z,kit,phase,angle,1.35,d.dataset.role==='GK'?'1':d.textContent,d.dataset.role==='GK',celebrating);
  }
 }
 actors.flush();
 const ball=document.getElementById('ball');if(ball){
  const bx=celebration?celebration.centerX+celebration.dir*2.5:ballPos.x;
  const bz=celebration?celebration.centerZ+3:ballPos.z;
  const bl=celebration?0:ballPos.lift;
  const b=p([bx,.3+bl,bz]),ground=p([bx,.02,bz]);ctx.fillStyle='#06180c88';ctx.beginPath();ctx.ellipse(ground.x,ground.y,4,2,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.strokeStyle='#142537';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(b.x,b.y,Math.max(3,w/260),0,Math.PI*2);ctx.fill();ctx.stroke();}
 if(celebration){const age=visualTime-celebration.started;const alpha=age<250?1-age/250:age>3900?(age-3900)/300:0;if(alpha>0){ctx.fillStyle='rgba(6,15,24,'+clamp(alpha,0,1)+')';ctx.fillRect(0,0,w,h);}}
 const offside=document.querySelector('#pitch .offside-line');if(offside){const x=parseFloat(offside.style.left)*1.05,a=p([x,.1,0]),b=p([x,.1,68]);ctx.strokeStyle='#ffe061';ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([])}
 if(mode==='highlights'&&!eventActive){ctx.fillStyle='#08182dcc';ctx.fillRect(0,0,w,32);ctx.fillStyle='#e9d797';ctx.font='12px Arial';ctx.textAlign='center';ctx.fillText('AZIONI SALIENTI · Avanzamento alla prossima azione',w/2,21)}
}
function wake(){if(!frameId&&!document.hidden&&document.getElementById('match')?.classList.contains('active'))frameId=requestAnimationFrame(render)}
const oldSetup=setupPitch;
setupPitch=function(){
 if(current===trackedMatch&&celebrationState){pendingSetup=true;return;}
 const changed=current!==trackedMatch,half=current?.half||1;
 const result=oldSetup.apply(this,arguments);ensureCanvas();
 if(changed||half!==pitchHalf){
  trackedMatch=current;pitchHalf=half;positions.clear();lastTime=0;followCamera=newCamera();
  highlightState=null;celebrationState=null;visualTime=0;visualLast=0;pendingSetup=false;
  if(changed){uniforms={};document.getElementById('v7EventToast')?.classList.remove('show');delete document.getElementById('match').dataset.cinematic;}
 }
 playerDots=Array.from(document.querySelectorAll('#pitch .dot'));
 positions.clear();
 if(canvas&&eventActive&&mode!=='2d'){canvas.classList.remove('s9-restart');requestAnimationFrame(()=>canvas.classList.add('s9-restart'));}
 updateUniforms();wake();return result;
};
const oldOpenPlay=S9MatchVisual.openPlay;
S9MatchVisual.openPlay=async function(minute){
 if(mode==='highlights'){
  // In highlights mode il tempo di scansione resta rapido, ma non
  // accelera in modo isterico con 4x: l'occhio deve poter leggere la
  // telecronaca e prepararsi all'azione saliente successiva.
  const delay=(Number(speed)||1)>=4?100:(Number(speed)||1)>=2?85:70;
  await new Promise(resolve=>setTimeout(resolve,delay));return;
 }
 return oldOpenPlay.call(this,minute);
};
const oldEvent=doEvent;
doEvent=async function(e){
 const match=current;
 eventActive=true;
 try{return await oldEvent.apply(this,arguments)}
 finally{
  if(current===match){highlightState=null;celebrationState=null;eventActive=false;}
 }
};

function boot(){
 controls(document.querySelector('#kits .panel'),'kitMatchPresentation');controls(document.querySelector('#match .match-controls'),'liveMatchPresentation');
 const hint=document.createElement('p');hint.className='s9-view-hint';hint.textContent='Scegli la partita completa o solo le azioni salienti. Puoi cambiare vista anche durante la gara.';document.querySelector('#kits .panel').appendChild(hint);
 const choice=document.querySelector('#kits .s9-view-choice');document.querySelector('#kits .kit-stage').before(choice);choice.after(hint);
 setMode(mode);new MutationObserver(wake).observe(document.getElementById('match'),{attributes:true,attributeFilter:['class']});document.addEventListener('visibilitychange',()=>{visualLast=0;wake()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
