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
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;let elapsed=0,last=null;
 dialog.querySelector('button').textContent=reduced?'CONTINUA ▶':'SALTA INTRODUZIONE ▶';
 const venueStyle=S9Competition.stadiumStyle(item.stadium);
 function draw(now){
  if(active!==item)return;
  if(last!==null&&!document.hidden)elapsed+=Math.min(80,now-last);last=now;
  const t=reduced?12:Math.min(12,elapsed/1000);
  if(t>=12)dialog.querySelector('button').textContent='CONTINUA ▶';
  const w=canvas.clientWidth||900,h=canvas.clientHeight||470,ratio=Math.min(devicePixelRatio||1,1.5);
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}context.setTransform(ratio,0,0,ratio,0,0);
  const bg=context.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#07182a');bg.addColorStop(.52,'#14324d');bg.addColorStop(1,'#0a2419');context.fillStyle=bg;context.fillRect(0,0,w,h);
  const handoff=Math.max(0,Math.min(1,(t-1.0)/1.9));
  const lift=Math.max(0,Math.min(1,(t-3.0)/1.8));
  const arrival=Math.max(0,Math.min(1,t/1.6));
  const sway=reduced?0:Math.sin(t*.18)*.22;
  const reveal=Math.min(1,t/2.4),hero=Math.max(0,Math.min(1,(t-4.6)/3));
  const p=G.camera([2.4*(1-reveal)+sway,3.6-hero*.35,(11-reveal*1.2-hero*1.4)*Math.max(1,.78/(w/h))],[.5*(1-reveal),1.15+hero*.5,.15],w,h,w/h<1.2?62:43),scene=G.scene(context,p);
  const stadiumStyle=venueStyle;
  // Stadio e campo: la premiazione usa le stesse caratteristiche dello stadio della partita.
  for(let tier=0;tier<stadiumStyle.tiers;tier++)scene.box([0,1.0+tier*1.42,-10.4-tier*2.15],[20,1.3,2.8],brand.dark,0,S9Match3D.crowdTexture(brand,stadiumStyle,tier%3));
  if(stadiumStyle.track)scene.box([0,-.08,.1],[15,.05,9.2],'#985d4f');
  for(let i=-8;i<8;i++)scene.box([i*.82,-.035,.1],[.8,.03,7.2],i%2?'#2e7847':'#368651');
  scene.box([0,-.018,.1],[.10,.035,7.1],'#eef4e6');
  // cerchio di centrocampo approssimato con piccoli segmenti 3D
  for(let i=0;i<28;i++){const a=i*Math.PI*2/28;scene.box([Math.cos(a)*1.48,.01,.1+Math.sin(a)*1.48],[.18,.035,.06],'#edf2e5',-a)}
  // tappeto basso di premiazione, dentro il campo
  scene.box([0,.035,.65],[4.2,.08,1.55],brand.accent);
  scene.box([0,.095,.65],[3.45,.10,1.1],'#d9c58d');
  const squad=[[-3.25,-.25],[-2.55,-.65],[-1.85,-.82],[-1.12,-.92],[-.42,-.98],[.55,-.98],[1.22,-.90],[1.92,-.80],[2.62,-.58],[3.22,-.20],[-2.45,.55],[2.45,.55]];
  squad.forEach((pos,i)=>{
    const x=pos[0]*(1.34-.34*arrival),z=pos[1]+(1-arrival)*(1.5+(i%3)*.15);
    G.player(scene,x,z,kit,reduced?0:t*2.4+i*.32,0,1.18,'',false,lift>.45?.55:.18);
  });
  // Capitano al centro: riceve la coppa e la alza.
  G.player(scene,0,.62,kit,reduced?0:t*2.2,0,1.30,'',false,.18+lift*.82);
  // Addetto alla premiazione: figura distinta in abito scuro, a destra del capitano.
  const officialX=2.05-.38*handoff;
  scene.box([officialX,.82,.72],[.58,1.18,.36],'#202735');
  scene.box([officialX,1.53,.72],[.34,.36,.31],'#c89572');
  scene.box([officialX,1.12,.47],[.70,.16,.18],'#202735',-.25);
  // La coppa passa fisicamente dall'addetto al capitano, poi sale sopra la testa.
  const trophyX=2.0*(1-handoff)+.10*handoff;
  const trophyY=1.48 + lift*1.65;
  const trophyZ=.56-.10*handoff;
  trophy(scene,item.key,trophyX,trophyY,trophyZ,.82);
  scene.flush();
  if(lift>.35){
   for(let i=0;i<(w<600?70:140);i++){
    const x=(i*97.3)%w,y=reduced?(i*63)%h:((t*68+i*37)%(h+80))-40;
    context.fillStyle=i%4===0?brand.accent:i%4===1?'#fff0c1':i%4===2?'#ffffff':'#d5e5ff';
    context.save();context.translate(x,y);context.rotate(i*.43+t);context.fillRect(-2,-6,4,12);context.restore();
   }
  }
  if(t>4.5){context.fillStyle='rgba(4,14,30,.72)';context.fillRect(w*.18,h-56,w*.64,36);context.fillStyle='#fff1c9';context.font='900 '+Math.max(14,w/58)+'px Arial';context.textAlign='center';context.fillText(item.exhibition?'CAMPIONI DELLA FINALE':'LA COPPA È VOSTRA',w/2,h-32)}
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
