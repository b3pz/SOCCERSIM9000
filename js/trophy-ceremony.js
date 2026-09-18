/* Procedural trophies and a replayable team celebration, after a confirmed title. */
(function(){
'use strict';
const G=window.S9Football3D,queue=[];
let active=null,dialog,canvas,context,frame=0,previousFocus,redraw=null;
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
 const st=career?.teamStates?.[state.champion];
 const roster=(st?.lineup||[]).map(id=>{const i=st.players.findIndex(p=>p.id===id);return i<0?null:{number:String(i+1),keeper:st.players[i].pos==='GK'}}).filter(Boolean);
 const captain=roster.findIndex(p=>p.number==='10'&&!p.keeper);
 if(captain>0)roster.unshift(roster.splice(captain,1)[0]);
 else if(roster[0]?.keeper){const i=roster.findIndex(p=>!p.keeper);if(i>0)roster.unshift(roster.splice(i,1)[0]);}
 return {roster,id:state.id,key:state.key,champion:state.champion,exhibition:!!state.exhibition,stadium:stadium||teamMeta[state.champion]?.stadium||'Stadio',kit:side?selectedKits[side]:'home',match:m?{h:m.h,a:m.a,scoreH:m.scoreH,scoreA:m.scoreA,minute:m.minute,half:m.half}:null};
}
function record(state){
 if(!confirmed(state)||state._ceremonySeen)return false;
 const ctx=S9V10.matchContext;
 const watchedFinal=ctx?.state===state&&ctx.match?.tie?.stage==='FINAL';
 if(state.champion!==state.user&&!watchedFinal)return false;
 state._ceremonySeen=true;queue.push(snapshot(state,current,ctx?.stadium));setTimeout(nextV2,0);return true;
}
function exhibition(state,m,stadium){
 if(!state.exhibition||!state.completed||!m?._finished||state._ceremonySeen||![m.h,m.a].includes(state.champion))return false;
 state._ceremonySeen=true;queue.push(snapshot(state,m,stadium));setTimeout(nextV2,0);return true;
}
function loadImage(src){return new Promise(resolve=>{if(!src){resolve(null);return}const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=src})}
async function nextV2(){
 if(active||!queue.length)return;
 const item=queue.shift();active=item;const club=T(item.champion),clubLabel=`${club.name} ${club.season}`;
 const roster=item.roster?.length?item.roster:Array.from({length:11},(_,i)=>({number:String(i===0?10:i<10?i:11),keeper:i===1}));
 const crestSrc=window.S9V10_DATA?.crestPath?.(item.champion)||club.crest||'';
 const [kit,crestImage]=await Promise.all([G.loadKit(kitPath(item.champion,item.kit)),loadImage(crestSrc)]);if(active!==item)return;
 previousFocus=document.activeElement;const brand=S9Competition.definitions[item.key]||S9Competition.definitions.friendly,venueStyle=S9Competition.stadiumStyle(item.stadium);
 dialog.style.setProperty('--competition-accent',brand.accent);dialog.style.setProperty('--competition-dark',brand.dark);
 dialog.querySelector('.s9-ceremony-kicker').textContent=item.exhibition?'FINALE DI ESIBIZIONE':'TITOLO CONQUISTATO';dialog.querySelector('h2').textContent=clubLabel;dialog.querySelector('.s9-ceremony-competition').textContent=brand.name;
 dialog.querySelector('.s9-ceremony-caption').textContent=item.exhibition?'Premiazione di esibizione · nessun titolo aggiunto all’albo d’oro':item.key==='finaleight'?'Campione d’Italia · Final Eight conclusa':'Notte da campioni';
 /* FIX 2026-09 (20/22): "anche durante la premiazione non ci deve essere la
    canzone" poi precisato: "un mix sia all'ingresso che durante i
    festeggiamenti... quando c'e' l'ingresso e la premiazione ci devono
    essere solo le canzoni intro e ancora un po'". La cerimonia e' un dialog
    sovrapposto, non un cambio di schermata via show(), quindi la playlist
    normale dei menu (che si ferma solo su id==='match') continuava a
    suonare sopra il giro d'onore: qui viene fermata esplicitamente e
    sostituita dal mix dedicato (tifo da stadio + le due tracce evento,
    tifo piu' alto). Tutto ripristinato/fermato in close(). */
 window.stopMenuMusic?.();
 window.S9SFX?.startAmbientCrowd?.();
 window.startEventMusic?.();
 dialog.hidden=false;dialog.querySelector('button').focus();const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;dialog.querySelector('button').textContent=reduced?'CONTINUA ▶':'SALTA CINEMATICA ▶';
 let elapsed=0,last=null,lastShot=-1;const steps=[...dialog.querySelectorAll('.s9-ceremony-progress span')],clamp=n=>Math.max(0,Math.min(1,n));
 function draw(now){
  frame=0;if(active!==item)return;if(last!==null&&!document.hidden)elapsed+=Math.min(80,now-last);last=now;
  const t=reduced?70:Math.min(70,elapsed/1000),shot=t<2?0:t<5?1:t<8.2?2:t<14?3:4;if(t>=70)dialog.querySelector('button').textContent='CONTINUA ▶';
  if(shot!==lastShot){steps.forEach((step,i)=>step.classList.toggle('active',i<=shot));lastShot=shot}
  const w=canvas.clientWidth||900,h=canvas.clientHeight||470,ratio=Math.min(devicePixelRatio||1,1.5);if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}context.setTransform(ratio,0,0,ratio,0,0);
  const bg=context.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#020711');bg.addColorStop(.5,'#0f3153');bg.addColorStop(1,'#071c18');context.fillStyle=bg;context.fillRect(0,0,w,h);
  for(let i=0;i<5;i++){const x=w*(.12+i*.19);context.fillStyle=`rgba(190,220,255,${.025+(i%2)*.018})`;context.beginPath();context.moveTo(x,0);context.lineTo(x-w*.11,h*.84);context.lineTo(x+w*.11,h*.84);context.fill()}
  if(shot===4){
   /* FIX 2026-09: breve stacco allo studio proprio all'inizio del giro
      d'onore - i due telecronisti fanno un paio di complimenti alla
      squadra campione, poi si torna al giro di campo con la coppa. */
   const cutawayStart=14,cutawayDur=4.6;
   if(t<cutawayStart+cutawayDur&&window.S9Anchors?.drawStudio){
    if(!item._trophyLinesSet){item._trophyLinesSet=true;window.S9Anchors.setChampion?.(clubLabel)}
    const cprog=clamp((t-cutawayStart)/cutawayDur);
    const line=window.S9Anchors.drawStudio(context,w,h,cprog,'trophy');
    context.fillStyle='#020914df';context.fillRect(0,h-52,w,52);context.fillStyle='#fff0bf';context.textAlign='center';context.font='900 '+Math.max(13,w/62)+'px Arial';context.fillText(line,w/2,h-22,w-24);
    if(!reduced&&t<70)frame=requestAnimationFrame(draw);return;
   }
   // A pitch-level tracking shot follows a broad celebrating group.
   // Fixed offsets in the direction of travel prevent a single-file "snake".
   const progress=clamp((t-14)/56),angle=progress*Math.PI*2;
   const cx=52.5+45*Math.cos(angle),cz=34+26*Math.sin(angle);
   const length=Math.hypot(45*Math.sin(angle),26*Math.cos(angle));
   const tx=-45*Math.sin(angle)/length,tz=26*Math.cos(angle)/length,rx=tz,rz=-tx;
   const focusX=cx-tx*3.1,focusZ=cz-tz*3.1;
   const distance=Math.max(16,12/Math.max(.4,w/h));
   const p=G.camera([focusX+tx*distance+rx*distance*.28,5.1,focusZ+tz*distance+rz*distance*.28],[focusX,1.65,focusZ],w,h,46);
   S9Match3D.drawStadium(context,p,w,h,{stadium:item.stadium,brand,match:item.match});
   const runners=G.scene(context,p);
   const group=[[0,0],[-1.7,-.8],[1.8,-.5],[-3.3,-2.8],[0,-2.7],[3.3,-2.4],[-1.9,-4.9],[1.8,-4.8],[-3.5,-7],[-.1,-7.1],[3.3,-7.2]];
   for(let i=roster.length-1;i>=0;i--){
    const [across,behind]=group[i%group.length];
    const sway=i&&!reduced?Math.sin(t*.9+i*1.7)*.10:0;
    const x=cx+tx*behind+rx*(across+sway),z=cz+tz*behind+rz*(across+sway);
    const heading=Math.atan2(tx,tz)+(i&&!reduced?Math.sin(t*.55+i)*.15:0);
    const salute=i===0?.98:i%3===0?.85+.12*Math.sin(t*1.5+i):i%3===1?.48+.18*Math.sin(t*1.1+i):.2;
    const shadow=p([x,.02,z]);context.fillStyle='#06180b55';context.beginPath();context.ellipse(shadow.x,shadow.y,Math.max(3,h/80),Math.max(1,h/210),0,0,Math.PI*2);context.fill();
    G.player(runners,x,z,kit,reduced?0:t*3.2+i*.85,heading,1.35,roster[i].number,roster[i].keeper,salute);
    if(i===0)trophy(runners,item.key,x,(.96+1.36*salute)*1.35+.04,z,1);
   }
   runners.flush();context.fillStyle='#020914df';context.fillRect(0,h-52,w,52);context.fillStyle='#fff0bf';context.textAlign='center';context.font='900 16px Arial';context.fillText('GIRO D’ONORE · '+clubLabel,w/2,h-22,w-24);
   if(!reduced&&t<70)frame=requestAnimationFrame(draw);return;
  }
  const walk=clamp((t-1.5)/3),handoff=clamp((t-6)/1.1),lift=clamp((t-7.1)/1.25),party=clamp((t-8.2)/2);
  const camera=[[[0,5.3,14],[0,1.6,-1],48],[[2.8,3.1,10.8],[.25,1.15,.35],44],[[1.7,2.55,7.5],[.15,1.42,.55],39],[[.35,3.35,9.4],[0,1.62,.42],42]][shot],portrait=w/h<1.1;
  const p=G.camera([camera[0][0],camera[0][1],camera[0][2]*Math.max(1,portrait?1.25:.82/(w/h))],camera[1],w,h,portrait?58:camera[2]),scene=G.scene(context,p);
  for(let tier=0;tier<venueStyle.tiers;tier++)scene.box([0,1+tier*1.42,-10.4-tier*2.15],[22,1.3,2.8],tier%2?venueStyle.seats:brand.dark,0,S9Match3D.crowdTexture(brand,venueStyle,tier%3));
  scene.box([0,6.4,-10.1],[12,.24,.4],brand.accent);if(crestImage){scene.face([[-6.8,2,-8.85],[-4.5,2,-8.85],[-4.5,4.3,-8.85],[-6.8,4.3,-8.85]],brand.dark,crestImage);scene.face([[4.5,2,-8.85],[6.8,2,-8.85],[6.8,4.3,-8.85],[4.5,4.3,-8.85]],brand.dark,crestImage)}
  if(venueStyle.track){const ground=G.scene(context,p);ground.face([[-7.5,-.12,-4.5],[7.5,-.12,-4.5],[7.5,-.12,4.7],[-7.5,-.12,4.7]],'#985d4f');ground.flush();}
  G.pitchSurface(context,p,-6.6,-3.525,13.2,7.25,.825);
  scene.box([0,.035,.8],[5.5,.08,2],brand.accent);scene.box([0,.13,.72],[4.7,.18,1.55],'#d7c17e');scene.box([0,.28,.64],[3.7,.25,1.08],'#f0dfac');scene.box([0,.012,2.6],[1.35,.035,3.1],brand.accent);
  const squad=[[-.9,-1.1],[.9,-1.1],[-1.8,-.95],[1.8,-.95],[-2.7,-.75],[2.7,-.75],[-3.6,-.45],[3.6,-.45],[-4.5,-.1],[4.5,-.1]];
  roster.slice(1).forEach((player,i)=>{const pos=squad[i];G.player(scene,pos[0]*(1.25-.25*walk),pos[1]-(1-walk)*(3.2+(i%3)*.22),kit,!reduced&&walk>0&&walk<1?t*2.7+i*.37:0,0,1.16,player.number,player.keeper,.1+party*.55)});
  G.player(scene,0,.66,kit,0,0,1.34,roster[0].number,roster[0].keeper,.16+lift*.84);scene.box([-.45,1.55,.5],[.13,.22,.2],brand.accent);
  const approach=clamp((t-4.5)/1.5),retreat=clamp((t-7.15)/2),officialX=3.9-2.8*approach+3.2*retreat;
  // The presenter approaches only after the team has arrived, then walks away.
  const officialKit={shirt:'#172131',shorts:'#172131',socks:'#172131'};
  /* FIX 2026-09: the presenter was drawn at scale .86 while every player around
     him uses 1.16 (line above) — a visible, consistent size mismatch that made
     him look like a child next to the team, not a camera/perspective artefact. */
  G.player(scene,officialX,1.55,officialKit,(approach>0&&approach<1||retreat>0&&retreat<1)?t*3:0,retreat>0?Math.PI/2:-Math.PI/2,1.16,'',false,0);
  trophy(scene,item.key,officialX*(1-handoff)+.08*handoff,1.52+lift*1.72,1.35*(1-handoff)+.48*handoff,.92+lift*.08);scene.flush();
  if(party>.05){for(let i=0;i<(w<600?75:155);i++){const x=(i*97.3)%w,y=reduced?(i*63)%h:(((t-8)*82+i*37)%(h+90))-45;context.fillStyle=i%4===0?brand.accent:i%4===1?'#fff0c1':i%4===2?'#fff':'#d5e5ff';context.save();context.translate(x,y);context.rotate(i*.43+t);context.fillRect(-2,-6,4,12);context.restore()}for(let b=0;b<4;b++){const bx=w*(.16+b*.23),by=h*(.16+(b%2)*.09),r=20+party*55;context.strokeStyle=b%2?brand.accent:'#e9f2ff';context.globalAlpha=.42*party;for(let ray=0;ray<16;ray++){const a=ray*Math.PI/8;context.beginPath();context.moveTo(bx+Math.cos(a)*r*.2,by+Math.sin(a)*r*.2);context.lineTo(bx+Math.cos(a)*r,by+Math.sin(a)*r);context.stroke()}context.globalAlpha=1}}
  const captions=['LA NOTTE DELLA FINALE','VERSO IL PODIO','LA CONSEGNA','CAMPIONI'];context.fillStyle='rgba(2,8,18,.78)';context.fillRect(0,h-58,w,58);context.fillStyle='#f7e7b6';context.textAlign='center';context.font='900 '+Math.max(15,w/55)+'px Arial';context.fillText(captions[shot],w/2,h-31);context.fillStyle='#d7e2ef';context.font='700 '+Math.max(10,w/95)+'px Arial';context.fillText(clubLabel.toUpperCase(),w/2,h-12);
  if(shot===0&&crestImage){const size=Math.min(w*.18,h*.28),alpha=clamp(1-Math.max(0,t-1.25)/.7);context.globalAlpha=alpha;context.drawImage(crestImage,w/2-size/2,h*.30-size/2,size,size);context.globalAlpha=1}if(t>7.75&&t<8.12){context.fillStyle=`rgba(255,246,213,${.55*(1-Math.abs(t-7.93)/.19)})`;context.fillRect(0,0,w,h)}
  const bar=Math.max(8,h*.025);context.fillStyle='#02050a';context.fillRect(0,0,w,bar);context.fillRect(0,h-bar,w,bar);if(!reduced&&t<70)frame=requestAnimationFrame(draw);
 }
 redraw=draw;frame=requestAnimationFrame(draw);
}
function close(){
 if(!active)return;active=null;cancelAnimationFrame(frame);dialog.hidden=true;previousFocus?.focus?.();
 // Il mix tifo+musica evento della cerimonia si ferma sempre qui; se sta
 // per partire subito un'altra premiazione (nextV2 sotto) lo riaccende lei.
 window.stopEventMusic?.();
 window.S9SFX?.stopAmbientCrowd?.();
 nextV2();
 // Se non e' partita subito un'altra premiazione e non si e' tornati in
 // partita nel frattempo, la musica di menu normale riprende.
 if(!active&&!document.getElementById('match')?.classList.contains('active'))window.startMenuMusic?.();
}
function boot(){
 window.addEventListener('resize',()=>{if(active&&!frame&&redraw)redraw(performance.now())});
 dialog=document.createElement('div');dialog.id='trophyCeremony';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','ceremonyTeam');
 dialog.innerHTML='<div class="s9-ceremony-panel"><div class="s9-ceremony-kicker"></div><h2 id="ceremonyTeam"></h2><div class="s9-ceremony-competition"></div><div class="s9-ceremony-progress" aria-hidden="true"><span>STADIO</span><span>PODIO</span><span>CONSEGNA</span><span>FESTA</span><span>GIRO D’ONORE</span></div><canvas role="img" aria-label="Cinematica della finale: ingresso, consegna e alzata della coppa"></canvas><p class="s9-ceremony-caption"></p><button type="button" class="primary">CONTINUA ▶</button></div>';
 document.body.appendChild(dialog);canvas=dialog.querySelector('canvas');context=canvas.getContext('2d');dialog.querySelector('button').onclick=close;
 dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){e.preventDefault();dialog.querySelector('button').focus()}});
}
window.S9Celebration={record,exhibition,confirmed,trophy,get active(){return active},close};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
