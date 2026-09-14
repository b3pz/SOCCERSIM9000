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
 c.blend+=(active-c.blend)*(1-Math.exp(-dt/1.1));
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
 const span=35-c.blend*8+widening;
 return {eye:[c.x,38-c.blend*8,c.z+76-c.blend*15],target:[c.x,.7,c.z],fov:43,
  bounds:[[c.x-span,0,-3+c.blend*12],[c.x+span,0,-3+c.blend*12],[c.x-span,3.5,71-c.blend*12],[c.x+span,3.5,71-c.blend*12]],spanX:span};
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
const positions=new Map(),boards=new Map();
const api=window.S9Match3D={get mode(){return mode},get eventActive(){return eventActive},get celebrating(){return !!celebrationState},waitCelebration:waitForCelebration,celebrate,setMode};
const graphics=window.S9Football3D;
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
  for(let tier=0;tier<stadiumStyle.tiers;tier++)s.box([52.5,tier*1.6-1,-10-tier*3],[124,1.5,3],tier%2?stadiumStyle.seats:brand.dark);
  if(stadiumStyle.track)s.box([52.5,-.45,34],[132,.2,94],'#985d4f');
  for(const x of [0,105])for(const z of [0,68]){s.box([x,.8,z],[.12,1.6,.12],'#e4e9de');s.box([x+.4,1.4,z],[.8,.4,.08],brand.accent)}
  let board=boards.get(brand.name);if(!board){board=document.createElement('canvas');board.width=640;board.height=48;const bc=board.getContext('2d');bc.fillStyle=brand.dark;bc.fillRect(0,0,640,48);bc.fillStyle=brand.accent;bc.font='bold 23px Arial';bc.textAlign='center';bc.fillText(brand.name,320,32);boards.set(brand.name,board)}
  s.face([[13,.1,-3],[92,.1,-3],[92,3,-3],[13,3,-3]],brand.dark,board);
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
