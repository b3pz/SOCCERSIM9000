/* Procedural trophies and a replayable team celebration, after a confirmed title. */
(function(){
'use strict';
const G=window.S9Football3D,queue=[];
let active=null,dialog,canvas,context,frame=0,previousFocus;
const silver='#d8e3eb',gold='#e5be59';
function lathe(s,x,y,z,profile,color){
 for(let j=0;j<profile.length-1;j++)for(let i=0;i<20;i++){
  const a=i*Math.PI/10,b=(i+1)*Math.PI/10,[r0,h0]=profile[j],[r1,h1]=profile[j+1];
  s.face([[x+r0*Math.cos(a),y+h0,z+r0*Math.sin(a)],[x+r0*Math.cos(b),y+h0,z+r0*Math.sin(b)],[x+r1*Math.cos(b),y+h1,z+r1*Math.sin(b)],[x+r1*Math.cos(a),y+h1,z+r1*Math.sin(a)]],color,null,.06+.22*(1+Math.cos(a))/2);
 }
}
function globe(s,x,y,z,r,color){
 const profile=Array.from({length:13},(_,i)=>[Math.sin(i*Math.PI/12)*r,(1-Math.cos(i*Math.PI/12))*r]);lathe(s,x,y-r,z,profile,color);
}
function handles(s,x,y,z,size,color){
 for(const sign of [-1,1])for(let i=0;i<12;i++){
  const a=i*Math.PI/6,b=(i+1)*Math.PI/6;
  const p=[x+sign*size*(.65+.48*Math.cos(a)),y+size*(.55+.65*Math.sin(a)),z];
  const q=[x+sign*size*(.65+.48*Math.cos(b)),y+size*(.55+.65*Math.sin(b)),z];
  s.box(p,[Math.max(.06,Math.abs(q[0]-p[0])+.06),Math.max(.06,Math.abs(q[1]-p[1])+.06),.075],color);
 }
}
function trophy(s,key,x,y,z,scale=1){
 const type=S9Competition.definitions[key]?.trophy||'friendly';
 // Local geometry adapter keeps each trophy a separate silhouette.
 const local={face:(v,...args)=>s.face(v.map(p=>[x+p[0]*scale,y+p[1]*scale,z+p[2]*scale]),...args),box:(p,size,...args)=>s.box([x+p[0]*scale,y+p[1]*scale,z+p[2]*scale],size.map(n=>n*scale),...args)};
 local.box([0,.04,0],[.62,.09,.48],'#182c36');
 if(type==='world'){
  lathe(local,0,.08,0,[[.28,0],[.28,.12],[.17,.18],[.12,.45],[.23,.72]],gold);globe(local,0,1,0,.29,gold);lathe(local,0,.1,0,[[.28,0],[.28,.06]],'#368b67');
 }else if(type==='cdc'){
  lathe(local,0,.08,0,[[.26,0],[.12,.14],[.12,.29],[.29,.45],[.36,.88],[.39,1]],silver);handles(local,0,.5,0,.67,silver);
 }else if(type==='uefa'){
  lathe(local,0,.08,0,[[.3,0],[.3,.15],[.19,.24],[.22,.52],[.37,1.05]],silver);lathe(local,0,.12,0,[[.29,0],[.29,.07]],'#86683f');
 }else if(type==='euro'){
  lathe(local,0,.08,0,[[.26,0],[.2,.15],[.11,.24],[.3,.45],[.33,.7],[.2,.9],[.25,1.06]],silver);handles(local,0,.58,0,.4,silver);
 }else if(type==='scudetto'){
  lathe(local,0,.08,0,[[.33,0],[.26,.15],[.09,.28],[.15,.42],[.34,.84],[.42,1.1]],gold);
 }else if(type==='italia'){
  lathe(local,0,.08,0,[[.25,0],[.1,.2],[.09,.46],[.28,.65],[.32,1.05]],gold);
  for(const [i,color]of ['#278b56','#fff','#d53c49'].entries())local.box([(i-1)*.08,.5,.13],[.07,.5,.025],color);
 }else if(type==='supercoppa'){
  lathe(local,0,.08,0,[[.25,0],[.13,.2],[.12,.65]],silver);globe(local,0,.93,0,.3,silver);
 }else{
  lathe(local,0,.08,0,[[.25,0],[.12,.2],[.12,.35],[.35,.8]],gold);handles(local,0,.42,0,.38,gold);
 }
}
function confirmed(state){
 if(!state?.completed||!state.champion||state.phase!=='DONE')return false;
 const final=state.roundHistory?.FINAL?.[0]||state.ties?.[0];
 return !!final&&final.winner===state.champion&&Array.isArray(final.legs)&&final.legs.length===(final.twoLeg?2:1);
}
function snapshot(state,m,stadium){
 const side=m?.h===state.champion?'home':m?.a===state.champion?'away':null;
 return {id:state.id,key:state.key,champion:state.champion,exhibition:!!state.exhibition,stadium:stadium||teamMeta[state.champion]?.stadium||'Stadio',kit:side?selectedKits[side]:'home'};
}
function record(state){
 if(!confirmed(state)||state._ceremonySeen)return false;
 const ctx=S9V10.matchContext;
 const watchedFinal=ctx?.state===state&&ctx.match?.tie?.stage==='FINAL';
 if(state.champion!==state.user&&!watchedFinal)return false;
 state._ceremonySeen=true;queue.push(snapshot(state,current,ctx?.stadium));setTimeout(next,0);return true;
}
function exhibition(state,m,stadium){
 if(!state.exhibition||!state.completed||!m?._finished||state._ceremonySeen||![m.h,m.a].includes(state.champion))return false;
 state._ceremonySeen=true;queue.push(snapshot(state,m,stadium));setTimeout(next,0);return true;
}
async function next(){
 if(active||!queue.length)return;
 const item=queue.shift();active=item;
 const kit=await G.loadKit(kitPath(item.champion,item.kit));if(active!==item)return;
 previousFocus=document.activeElement;
 const brand=S9Competition.definitions[item.key]||S9Competition.definitions.friendly;
 dialog.style.setProperty('--competition-accent',brand.accent);dialog.style.setProperty('--competition-dark',brand.dark);
 dialog.querySelector('.s9-ceremony-kicker').textContent=item.exhibition?'FINALE DI ESIBIZIONE':'CAMPIONI · TITOLO CONQUISTATO';
 dialog.querySelector('h2').textContent=T(item.champion).name;
 dialog.querySelector('.s9-ceremony-competition').textContent=brand.name;
 dialog.querySelector('.s9-ceremony-caption').textContent=item.exhibition?'Premiazione di esibizione · nessun titolo aggiunto all’albo d’oro':item.key==='finaleight'?'Campione d’Italia · Final Eight conclusa':'La coppa è vostra';
 dialog.hidden=false;dialog.querySelector('button').focus();
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,start=performance.now();
 function draw(now){
  if(active!==item)return;
  const t=reduced?9:Math.min(12,(now-start)/1000),lift=Math.max(0,Math.min(1,(t-1.8)/2));
  const w=canvas.clientWidth||900,h=canvas.clientHeight||470,ratio=Math.min(devicePixelRatio||1,1.5);
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}context.setTransform(ratio,0,0,ratio,0,0);
  const bg=context.createLinearGradient(0,0,0,h);bg.addColorStop(0,brand.dark);bg.addColorStop(1,'#061421');context.fillStyle=bg;context.fillRect(0,0,w,h);
  const sway=reduced?0:Math.sin(t*.2)*.6;
  const p=G.camera([sway,4.2,12.5],[0,1.6,0],w,h,w/h<1.2?65:44),scene=G.scene(context,p);
  scene.box([0,-.1,0],[10,.2,4],brand.dark);scene.box([0,.06,-.7],[3,.13,2],brand.accent);
  for(let i=0;i<10;i++){
   const x=(i<5?i-5:i-4)*.82,z=-.75+(i%2)*.32;
   G.player(scene,x,z,kit,reduced?0:t*3+i,0,1,'',false,lift*.6);
  }
  G.player(scene,0,.65,kit,0,0,1,'',false,lift);
  trophy(scene,item.key,0,1.17+lift*1.25,1.02,.7);scene.flush();
  if(lift>.8){for(let i=0;i<95;i++){const x=(i*139.7)%w,y=reduced?(i*73)%h:((t*52+i*41)% (h+40))-20;context.fillStyle=i%3===0?brand.accent:i%3===1?'#fff0c1':'#ffffff';context.save();context.translate(x,y);context.rotate(i+t);context.fillRect(-2,-4,4,8);context.restore()}}
  context.fillStyle=brand.accent;context.font='bold '+Math.max(11,w/65)+'px Arial';context.textAlign='center';context.fillText(brand.name,w/2,h-15);
  if(!reduced&&t<12)frame=requestAnimationFrame(draw);
 }
 frame=requestAnimationFrame(draw);
}
function close(){if(!active)return;active=null;cancelAnimationFrame(frame);dialog.hidden=true;previousFocus?.focus?.();next()}
function boot(){
 dialog=document.createElement('div');dialog.id='trophyCeremony';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','ceremonyTeam');
 dialog.innerHTML='<div class="s9-ceremony-panel"><div class="s9-ceremony-kicker"></div><h2 id="ceremonyTeam"></h2><div class="s9-ceremony-competition"></div><canvas role="img" aria-label="La squadra festeggia e il capitano alza la coppa"></canvas><p class="s9-ceremony-caption"></p><button type="button" class="primary">CONTINUA ▶</button></div>';
 document.body.appendChild(dialog);canvas=dialog.querySelector('canvas');context=canvas.getContext('2d');dialog.querySelector('button').onclick=close;
 dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){e.preventDefault();dialog.querySelector('button').focus()}});
}
window.S9Celebration={record,exhibition,confirmed,trophy,get active(){return active},close};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
