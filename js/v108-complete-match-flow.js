(function(){
'use strict';
const $=s=>document.querySelector(s);
let penaltyOverlay=null;
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function teamName(id){const team=typeof T==='function'?T(id):null;return team?`${team.name} ${team.season}`:id;}
function activePlayers(teamId){
 const st=career?.teamStates?.[teamId];
 if(!st)return [];
 const ids=st.lineup||[];
 const on=st.players.filter(p=>ids.includes(p.id));
 return on.length?on:st.players;
}
function penaltyTakers(teamId){
 return activePlayers(teamId).filter(p=>p.pos!=='GK').sort((a,b)=>((b.stats?.shooting||b.overall||70)+(b.stats?.technique||0)*.2)-((a.stats?.shooting||a.overall||70)+(a.stats?.technique||0)*.2));
}
function keeper(teamId){
 const ps=activePlayers(teamId);return ps.find(p=>p.pos==='GK')||career?.teamStates?.[teamId]?.players?.find(p=>p.pos==='GK')||null;
}
function resultForKick(shooter,keeperPlayer){
 const shoot=shooter?.stats?.shooting??shooter?.overall??76;
 const tech=shooter?.stats?.technique??shooter?.overall??76;
 const keep=keeperPlayer?.overall??78;
 let pGoal=.72+(shoot-78)*.006+(tech-78)*.002-(keep-78)*.004;
 pGoal=Math.max(.52,Math.min(.88,pGoal));
 if(Math.random()<pGoal)return 'goal';
 return Math.random()<.70?'save':'miss';
}
function ensurePenaltyOverlay(){
 if(penaltyOverlay)return penaltyOverlay;
 penaltyOverlay=document.createElement('div');
 penaltyOverlay.id='v108PenaltyOverlay';penaltyOverlay.hidden=true;
 penaltyOverlay.innerHTML=`<div class="v108-penalty-panel" role="dialog" aria-modal="true" aria-label="Calci di rigore">
   <div class="v108-penalty-kicker">CALCI DI RIGORE</div>
   <div class="v108-penalty-title" id="v108PenaltyTitle"></div>
   <div class="v108-penalty-score"><span id="v108PenHomeName"></span><strong id="v108PenScore">0 - 0</strong><span id="v108PenAwayName"></span></div>
   <div class="v108-penalty-dots"><div id="v108PenHomeDots"></div><div id="v108PenAwayDots"></div></div>
   <div class="v108-penalty-stage" id="v108PenaltyStage">
    <canvas class="v108-penalty-canvas" id="v108PenaltyCanvas"></canvas>
    <div class="v108-penalty-player" id="v108PenaltyPlayer"></div>
    <div class="v108-penalty-result" id="v108PenaltyResult"></div>
   </div>
 </div>`;
 document.body.appendChild(penaltyOverlay);
 return penaltyOverlay;
}
function dotHTML(arr){return arr.map(v=>`<span class="${v}">${v==='goal'?'●':v==='save'?'×':'○'}</span>`).join('')}
function updatePenaltyUI(h,a,hs,as,hr,ar){
 $('#v108PenHomeName').textContent=teamName(h);$('#v108PenAwayName').textContent=teamName(a);$('#v108PenScore').textContent=`${hs} - ${as}`;
 $('#v108PenHomeDots').innerHTML=dotHTML(hr);$('#v108PenAwayDots').innerHTML=dotHTML(ar);
}
/* FIX 2026-09: "i rigori sarebbe belli vederli da dietro il calciatore che
   calcia" - il vecchio rigore era un'animazione piatta CSS/DOM (porta
   disegnata con un div, portiere/palla come rettangoli che si spostano in
   percentuale). Sostituita con una vera scena 3D disegnata su canvas con lo
   stesso motore prospettico usato dalla partita (window.S9Football3D),
   inquadratura da dietro/di lato al rigorista come in una diretta vera. La
   logica di esito (chi para, dove va il pallone) resta identica a prima -
   cambia solo come viene mostrata. */
function kitFor(teamId,isKeeper){
 const colors=(typeof getTeamColors==='function'?getTeamColors(teamId):null)||['#305cad','#eeeeeb'];
 return isKeeper?{shirt:'#e9b637',shorts:'#202d36',socks:'#e9b637'}:{shirt:colors[0]||'#305cad',shorts:'#182436',socks:colors[1]||colors[0]||'#eeeeeb'};
}
function drawPenaltyScene(ctx,w,h,st){
 const g=window.S9Football3D;
 if(!g){ctx.fillStyle='#123449';ctx.fillRect(0,0,w,h);return;}
 const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#0c2338');bg.addColorStop(.52,'#1a4228');bg.addColorStop(1,'#0d2618');
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 /* FIX 2026-09 (21): "i rigori sembra che li tirano da centrocampo" - la
    telecamera era troppo lontana e troppo alta (5.5m dietro il dischetto,
    quasi all'altezza degli occhi, FOV largo 40°): geometricamente le
    misure erano corrette (dischetto a 11m, porta a 7.32m come nella
    realta'), ma quell'inquadratura larga faceva sembrare la porta piccola
    e lontanissima, con un prato enorme in mezzo - l'impressione di un
    tiro da centrocampo invece di un rigore. Portata piu' vicina e piu'
    bassa (tipico angolo da diretta TV dietro il tiratore) e FOV piu'
    stretto/zoomato, cosi' la porta riempie di piu' l'inquadratura. */
 // Camera piu' arretrata e piu' alta per i "rigori in movimento" (st.runFar):
 // la rincorsa parte molto piu' lontano di un rigore classico e va inquadrata
 // per intero, non solo l'ultimo tratto vicino alla porta.
 const camZ=st.runFar?33:15.0,camY=st.runFar?2.1:1.32,camFov=st.runFar?26:32;
 const p=g.camera([st.lateral*0.85,camY,camZ],[0,1.05,0],w,h,camFov),scene=g.scene(ctx,p);
 g.pitchSurface(ctx,p,-9,-1.6,18,17,1.9);
 const post='#f4f3ea';
 scene.box([-3.66,1.22,0],[.14,2.44,.14],post);
 scene.box([3.66,1.22,0],[.14,2.44,.14],post);
 scene.box([0,2.44,0],[7.46,.14,.14],post);
 scene.box([0,1.1,-.3],[7.3,2.3,.06],'#eef2ff1c');
 const keeperX=st.dive==='left'?-2.15*st.diveT:st.dive==='right'?2.15*st.diveT:0;
 const keeperAngle=st.dive==='left'?.55*st.diveT:st.dive==='right'?-.55*st.diveT:0;
 g.player(scene,keeperX,-.1,st.keeperKit,st.t*6,keeperAngle,1.1,'',true,0,null,st.keeperSkin||null,st.keeperLook||null);
 // FIX 2026-09 (53): st.runFar/st.shotZ (passati da animateMovingKick) allungano
 // la rincorsa per i "rigori in movimento" del Trofeo Birra Goretti, senza
 // toccare il calcio di rigore classico (resta 11.3/2.4 di default).
 const shotZ=st.shotZ??11.3,runSpan=st.runFar?20:2.4;
 const runX=st.lateral*1.1*(1-st.runProgress*.5),runZ=shotZ+(1-st.runProgress)*runSpan;
 g.player(scene,runX,runZ,st.shooterKit,st.t*7,0,1.15,'',false,st.celebrate||0,null,st.shooterSkin||null,st.shooterLook||null);
 scene.flush();
 const bp=p(st.ball),edge=p([st.ball[0]+.11,st.ball[1],st.ball[2]]);
 const br=Math.max(2,Math.hypot(edge.x-bp.x,edge.y-bp.y)||0);
 ctx.fillStyle='#fff';ctx.strokeStyle='#1c2836';ctx.lineWidth=1.1;
 ctx.beginPath();ctx.arc(bp.x,bp.y,br,0,Math.PI*2);ctx.fill();ctx.stroke();
}
async function animateKick(side,shooter,outcome,kickNo,teams){
 const canvas=$('#v108PenaltyCanvas'),name=$('#v108PenaltyPlayer'),res=$('#v108PenaltyResult'),stage=$('#v108PenaltyStage');
 name.textContent=`${kickNo}° RIGORE · ${shooter?.name||'Tiratore'} · ${side==='home'?'CASA':'OSPITI'}`;res.textContent='';
 stage.classList.remove('goal','save','miss');
 if(!canvas||!canvas.getContext){await sleep(420);await sleep(700);await sleep(720);return;}
 const ctx=canvas.getContext('2d');
 const ratio=Math.min(window.devicePixelRatio||1,1.5),cw=canvas.clientWidth||640,ch=canvas.clientHeight||255;
 if(canvas.width!==Math.round(cw*ratio)||canvas.height!==Math.round(ch*ratio)){canvas.width=Math.round(cw*ratio);canvas.height=Math.round(ch*ratio)}
 ctx.setTransform(ratio,0,0,ratio,0,0);
 const dive=Math.random()<.5?'left':'right';
 const isShooterHome=side==='home';
 const teamH=teams?.h,teamA=teams?.a;
 const shooterKit=kitFor(isShooterHome?teamH:teamA,false);
 const keeperKit=kitFor(isShooterHome?teamA:teamH,true);
 /* FIX 2026-09 (19): stessa tonalita' di pelle/capigliatura iconica usata in
    campo, anche nella scena 3D del rigore. */
 const shooterTeamId=isShooterHome?teamH:teamA,keeperTeamId=isShooterHome?teamA:teamH;
 const keeperPlayer=career?.teamStates?.[keeperTeamId]?.players?.find(p=>p.pos==='GK');
 // FIX 2026-09 (50): shooter.name/keeperPlayer.name sono nomi PARODIA
 // (js/parody-names.js) - S9_ICONIC_LOOKS e' indicizzata sul nome reale
 // (player.realName). Anche qui il tono di pelle forzato per un pugno di
 // giocatori storici va applicato PRIMA della stima statistica per nazione.
 const shooterLook=(typeof S9_ICONIC_LOOKS!=='undefined'&&shooter)?S9_ICONIC_LOOKS[shooter.realName||shooter.name]:null;
 const keeperLook=(typeof S9_ICONIC_LOOKS!=='undefined'&&keeperPlayer)?S9_ICONIC_LOOKS[keeperPlayer.realName||keeperPlayer.name]:null;
 const shooterSkin=(shooterLook?.skin&&typeof S9_SKIN_TONES!=='undefined')?S9_SKIN_TONES[shooterLook.skin]:((typeof s9SkinFor==='function'&&typeof T==='function')?s9SkinFor(T(shooterTeamId)?.country,shooter?.id||shooterTeamId):null);
 const keeperSkin=(keeperLook?.skin&&typeof S9_SKIN_TONES!=='undefined')?S9_SKIN_TONES[keeperLook.skin]:((typeof s9SkinFor==='function'&&typeof T==='function'&&keeperPlayer)?s9SkinFor(T(keeperTeamId)?.country,keeperPlayer.id):null);
 const lateral=(dive==='left'?-1:1)*(.5+Math.random()*.35);
 let ballEnd;
 if(outcome==='goal')ballEnd=[dive==='left'?2.65:-2.65,2.05,0];
 else if(outcome==='save')ballEnd=[dive==='left'?-2.45:2.45,.6,.6];
 else ballEnd=[Math.random()<.5?-4.7:4.7,1.05,-.6];
 const ballStart=[0,.13,11.3];
 /* FIX 2026-09 (14): "non si capisce nulla, dura un millesimo di secondo...
    il tiratore alza le braccia al cielo a prescindere" - due problemi:
    1) la sequenza era troppo rapida per essere letta (rincorsa, volo ed
    esito si accavallavano in meno di 2 secondi) - tempi allungati e
    aggiunta una breve fase "pronti" iniziale, cosi' si fa in tempo a
    vedere chi sta per tirare, poi la rincorsa, poi il volo del pallone
    ben distinto, poi il risultato con calma;
    2) il tiratore esultava (braccia alzate) SEMPRE non appena colpiva il
    pallone, indipendentemente dall'esito - ora l'esultanza parte solo se
    l'esito e' gol, e solo dopo che il pallone e' arrivato in porta. */
 window.S9SFX?.tone?.(1650,.08,'square',.05);
 const READY=480,RUN=750,FLIGHT=900,HOLD=1600;
 const t1=READY,t2=t1+RUN,t3=t2+FLIGHT,TOTAL=t3+HOLD;
 await new Promise(resolve=>{
  const t0=performance.now();let struckSound=false,resultShown=false;
  function frame(now){
   const el=now-t0;
   const runProgress=el<=t1?0:Math.min(1,(el-t1)/RUN);
   const struck=el>=t2;
   if(struck&&!struckSound){struckSound=true;window.S9SFX?.kickThud?.();}
   const flightT=struck?Math.min(1,(el-t2)/FLIGHT):0;
   const ease=flightT*flightT*(3-2*flightT);
   const ball=[ballStart[0]+(ballEnd[0]-ballStart[0])*ease,ballStart[1]+(ballEnd[1]-ballStart[1])*ease,ballStart[2]+(ballEnd[2]-ballStart[2])*ease];
   const celebrateT=outcome==='goal'?Math.max(0,Math.min(1,(el-t3)/260)):0;
   drawPenaltyScene(ctx,cw,ch,{t:el/1000,lateral,dive,diveT:flightT,runProgress,struck,shooterKit,keeperKit,ball,celebrate:celebrateT,shooterSkin,keeperSkin,shooterLook,keeperLook});
   if(el>=t3&&!resultShown){
    resultShown=true;stage.classList.add(outcome);
    res.textContent=outcome==='goal'?'GOL!':outcome==='save'?'PARATA!':'FUORI!';
    if(outcome==='goal')window.S9SFX?.crowdCheer?.();
    else if(outcome==='save')window.S9SFX?.saveSound?.();
    else window.S9SFX?.crowdGroan?.();
   }
   if(el>=TOTAL){resolve();return;}
   requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
 });
}
function canEndEarly(round,hs,as){
 const homeTaken=Math.ceil(round/2),awayTaken=Math.floor(round/2);
 const homeLeft=Math.max(0,5-homeTaken),awayLeft=Math.max(0,5-awayTaken);
 return hs>as+awayLeft||as>hs+homeLeft;
}
/* FIX 2026-09: "ovviamente bisognera' scegliere i rigoristi nel caso in cui
   si vada ai rigori" - se una delle due squadre e' quella dell'utente, prima
   di far partire la sequenza si mostra un selettore per scegliere chi tira
   e in che ordine, invece di usare sempre l'ordine automatico. La squadra
   CPU (o entrambe, in modalita' spettatore) continua a usare la scelta
   automatica di penaltyTakers(). */
let takerPicker=null;
function ensureTakerPicker(){
 if(takerPicker)return takerPicker;
 takerPicker=document.createElement('div');
 takerPicker.id='v108TakerPicker';takerPicker.hidden=true;
 takerPicker.innerHTML=`<div class="v108-taker-panel" role="dialog" aria-modal="true" aria-label="Scegli i rigoristi">
   <div class="v108-penalty-kicker">SI VA AI RIGORI</div>
   <div class="v108-taker-title" id="v108TakerTitle">Scegli i tuoi rigoristi, in ordine</div>
   <div class="v108-taker-order" id="v108TakerOrder"></div>
   <div class="v108-taker-list" id="v108TakerList"></div>
   <div class="v108-taker-actions">
     <button type="button" class="v108-taker-auto" id="v108TakerAuto">ORDINE CONSIGLIATO</button>
     <button type="button" class="v108-taker-confirm" id="v108TakerConfirm" disabled>CONFERMA ▶</button>
   </div>
 </div>`;
 document.body.appendChild(takerPicker);
 return takerPicker;
}
function pickTakers(teamId){
 return new Promise(resolve=>{
  ensureTakerPicker();
  const recommended=penaltyTakers(teamId);
  const list=recommended.length?recommended:outfield(teamId);
  let order=[];
  const listEl=$('#v108TakerList'),orderEl=$('#v108TakerOrder'),confirmBtn=$('#v108TakerConfirm'),autoBtn=$('#v108TakerAuto'),titleEl=$('#v108TakerTitle');
  titleEl.textContent=`${teamName(teamId)} · scegli i rigoristi (tocca i nomi, nell'ordine in cui devono tirare)`;
  function renderOrder(){
   orderEl.innerHTML=order.length?order.map((p,i)=>`<span>${i+1}. ${p.name}</span>`).join(''):'<em>Nessuno selezionato: tocca i giocatori qui sotto, nell\'ordine.</em>';
   confirmBtn.disabled=order.length===0;
  }
  function renderList(){
   listEl.innerHTML=list.map(p=>`<button type="button" class="v108-taker-chip${order.includes(p)?' picked':''}" data-id="${p.id}">${p.name}</button>`).join('');
   listEl.querySelectorAll('button').forEach(btn=>{
    btn.onclick=()=>{
     const p=list.find(x=>x.id===btn.dataset.id);if(!p)return;
     const idx=order.indexOf(p);
     if(idx>=0)order.splice(idx,1);else order.push(p);
     renderOrder();renderList();
    };
   });
  }
  autoBtn.onclick=()=>{order=list.slice(0,Math.min(5,list.length));renderOrder();renderList();};
  confirmBtn.onclick=()=>{
   takerPicker.hidden=true;
   resolve(order.length?order:recommended);
  };
  order=[];renderOrder();renderList();
  takerPicker.hidden=false;
 });
}
async function playShootout(h,a){
 ensurePenaltyOverlay();
 /* FIX 2026-09 (29): "quando ci sono i rigori succede questo bug che dopo
    la partita rimane la finestra... nella CPU vs CPU non deve nemmeno
    comparire" - S9Exhibition.start() crea SEMPRE una career "usa e getta"
    con career.user=home (S9V10.createMatchCareer(h,...)), anche per le
    partite spettatore CPU contro CPU: quindi userTeam===h risultava vero
    anche li', e il selettore rigoristi (pensato per un umano che sceglie e
    conferma) veniva aperto senza che nessuno potesse mai confermarlo,
    restando "appeso" a schermo sopra la schermata successiva. Ora si
    controlla anche la modalita' spettatore ed entrambe le squadre usano
    l'ordine automatico quando e' attiva. */
 const userTeam=(typeof career!=='undefined'?career?.user:null);
 const spectator=!!window.S9V10?.matchContext?.spectator;
 const homeTakers=(!spectator&&userTeam===h)?await pickTakers(h):penaltyTakers(h);
 const awayTakers=(!spectator&&userTeam===a)?await pickTakers(a):penaltyTakers(a);
 const homeKeeper=keeper(h),awayKeeper=keeper(a);
 penaltyOverlay.hidden=false;
 $('#v108PenaltyTitle').textContent=`${teamName(h)} vs ${teamName(a)}`;
 let hs=0,as=0,hr=[],ar=[],kickIndex=0;
 updatePenaltyUI(h,a,hs,as,hr,ar);
 // primi cinque per parte, con chiusura anticipata se matematicamente deciso
 for(let round=0;round<10;round++){
   const isHome=round%2===0,team=isHome?h:a,takers=isHome?homeTakers:awayTakers,oppKeeper=isHome?awayKeeper:homeKeeper;
   const shooter=takers[Math.floor(round/2)%Math.max(1,takers.length)]||activePlayers(team)[0];
   const outcome=resultForKick(shooter,oppKeeper);kickIndex++;
   await animateKick(isHome?'home':'away',shooter,outcome,kickIndex,{h,a});
   if(isHome){hr.push(outcome);if(outcome==='goal')hs++;}else{ar.push(outcome);if(outcome==='goal')as++;}
   updatePenaltyUI(h,a,hs,as,hr,ar);
   if(round>=5&&canEndEarly(round+1,hs,as))break;
 }
 // oltranza: una coppia completa per volta
 let sudden=0;
 while(hs===as&&sudden<12){
   for(const isHome of [true,false]){
     const team=isHome?h:a,takers=isHome?homeTakers:awayTakers,oppKeeper=isHome?awayKeeper:homeKeeper;
     const shooter=takers[(5+sudden)%Math.max(1,takers.length)]||activePlayers(team)[0];
     const outcome=resultForKick(shooter,oppKeeper);kickIndex++;
     await animateKick(isHome?'home':'away',shooter,outcome,kickIndex,{h,a});
     if(isHome){hr.push(outcome);if(outcome==='goal')hs++;}else{ar.push(outcome);if(outcome==='goal')as++;}
     updatePenaltyUI(h,a,hs,as,hr,ar);
   }
   sudden++;
 }
 if(hs===as){ // failsafe molto raro
   if(Math.random()<.5)hs++;else as++;
 }
 const winner=hs>as?h:a;
 $('#v108PenaltyResult').textContent=`VINCE ${teamName(winner).toUpperCase()} · ${hs}-${as}`;
 await sleep(1500);
 penaltyOverlay.hidden=true;
 return {winner,score:`${hs}-${as} d.c.r.`};
}

/* FIX 2026-09 (53): "gli shootout pensavo fossero visivi invece sono solo
   testuali" - il Trofeo Birra Goretti (js/trofeo-birra.js) decideva i
   pareggi con una sequenza di SOLI popup testuali (stesso sistema di
   gol/parate a partita in corso), mentre le coppe a eliminazione diretta
   avevano gia' questa scena 3D animata vera (playShootout sopra). Qui sotto
   una variante che riusa la STESSA infrastruttura (overlay, canvas,
   S9Football3D, marcatori/punteggio) ma con rincorsa molto piu' lunga e
   punto di tiro piu' vicino alla porta, per rendere visivamente la vera
   regola storica del torneo (conduzione da centrocampo, 1 contro 1 col
   portiere, tiro non dal dischetto) invece del calcio di rigore classico -
   resta comunque l'esito deciso dalla forza delle squadre, non pilotabile.
   Esposta su window perche' questo file e' un IIFE (playShootout() sopra
   NON e' raggiungibile da fuori) e trofeo-birra.js e' un modulo separato. */
async function animateMovingKick(side,shooter,outcome,kickNo,teams){
 const canvas=$('#v108PenaltyCanvas'),name=$('#v108PenaltyPlayer'),res=$('#v108PenaltyResult'),stage=$('#v108PenaltyStage');
 name.textContent=`${kickNo}° TENTATIVO · ${shooter?.name||'Tiratore'} · ${side==='home'?'CASA':'OSPITI'}`;res.textContent='';
 stage.classList.remove('goal','save','miss');
 if(!canvas||!canvas.getContext){await sleep(420);await sleep(1400);await sleep(720);return;}
 const ctx=canvas.getContext('2d');
 const ratio=Math.min(window.devicePixelRatio||1,1.5),cw=canvas.clientWidth||640,ch=canvas.clientHeight||255;
 if(canvas.width!==Math.round(cw*ratio)||canvas.height!==Math.round(ch*ratio)){canvas.width=Math.round(cw*ratio);canvas.height=Math.round(ch*ratio)}
 ctx.setTransform(ratio,0,0,ratio,0,0);
 const dive=Math.random()<.5?'left':'right';
 const isShooterHome=side==='home';
 const teamH=teams?.h,teamA=teams?.a;
 const shooterKit=kitFor(isShooterHome?teamH:teamA,false);
 const keeperKit=kitFor(isShooterHome?teamA:teamH,true);
 const shooterTeamId=isShooterHome?teamH:teamA,keeperTeamId=isShooterHome?teamA:teamH;
 const keeperPlayer=career?.teamStates?.[keeperTeamId]?.players?.find(p=>p.pos==='GK');
 const shooterLook=(typeof S9_ICONIC_LOOKS!=='undefined'&&shooter)?S9_ICONIC_LOOKS[shooter.realName||shooter.name]:null;
 const keeperLook=(typeof S9_ICONIC_LOOKS!=='undefined'&&keeperPlayer)?S9_ICONIC_LOOKS[keeperPlayer.realName||keeperPlayer.name]:null;
 const shooterSkin=(shooterLook?.skin&&typeof S9_SKIN_TONES!=='undefined')?S9_SKIN_TONES[shooterLook.skin]:((typeof s9SkinFor==='function'&&typeof T==='function')?s9SkinFor(T(shooterTeamId)?.country,shooter?.id||shooterTeamId):null);
 const keeperSkin=(keeperLook?.skin&&typeof S9_SKIN_TONES!=='undefined')?S9_SKIN_TONES[keeperLook.skin]:((typeof s9SkinFor==='function'&&typeof T==='function'&&keeperPlayer)?s9SkinFor(T(keeperTeamId)?.country,keeperPlayer.id):null);
 const lateral=(dive==='left'?-1:1)*(.35+Math.random()*.5);
 // Punto di tiro piu' vicino alla porta di un rigore classico (il giocatore
 // arriva gia' in conduzione, non e' fermo sul dischetto) - il tragitto
 // lungo lo fa la rincorsa qui sotto (runZ), non il pallone.
 const shotZ=7.4;
 let ballEnd;
 if(outcome==='goal')ballEnd=[dive==='left'?2.55:-2.55,1.95,0];
 else if(outcome==='save')ballEnd=[dive==='left'?-2.35:2.35,.6,.6];
 else ballEnd=[Math.random()<.5?-4.5:4.5,1.0,-.6];
 const ballStart=[0,.13,shotZ];
 window.S9SFX?.tone?.(1650,.08,'square',.05);
 // Rincorsa molto piu' lunga (RUN) della fase "pronti": si vede davvero la
 // conduzione palla al piede da lontano prima del tiro, come nella regola
 // reale ("parte in conduzione da 30 metri, 5 secondi per superare il
 // portiere"), non un tiro immediato dal dischetto.
 const READY=350,RUN=1500,FLIGHT=850,HOLD=1500;
 const t1=READY,t2=t1+RUN,t3=t2+FLIGHT,TOTAL=t3+HOLD;
 await new Promise(resolve=>{
  const t0=performance.now();let struckSound=false,resultShown=false;
  function frame(now){
   const el=now-t0;
   const runProgress=el<=t1?0:Math.min(1,(el-t1)/RUN);
   const struck=el>=t2;
   if(struck&&!struckSound){struckSound=true;window.S9SFX?.kickThud?.();}
   const flightT=struck?Math.min(1,(el-t2)/FLIGHT):0;
   const ease=flightT*flightT*(3-2*flightT);
   const ball=[ballStart[0]+(ballEnd[0]-ballStart[0])*ease,ballStart[1]+(ballEnd[1]-ballStart[1])*ease,ballStart[2]+(ballEnd[2]-ballStart[2])*ease];
   const celebrateT=outcome==='goal'?Math.max(0,Math.min(1,(el-t3)/260)):0;
   drawPenaltyScene(ctx,cw,ch,{t:el/1000,lateral,dive,diveT:flightT,runProgress,struck,shooterKit,keeperKit,ball,celebrate:celebrateT,shooterSkin,keeperSkin,shooterLook,keeperLook,runFar:true,shotZ});
   if(el>=t3&&!resultShown){
    resultShown=true;stage.classList.add(outcome);
    res.textContent=outcome==='goal'?'GOL!':outcome==='save'?'PARATA!':'FUORI!';
    if(outcome==='goal')window.S9SFX?.crowdCheer?.();
    else if(outcome==='save')window.S9SFX?.saveSound?.();
    else window.S9SFX?.crowdGroan?.();
   }
   if(el>=TOTAL){resolve();return;}
   requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
 });
}
async function playMovingShootout(h,a){
 ensurePenaltyOverlay();
 const kicker=$('.v108-penalty-kicker');const prevKicker=kicker?kicker.textContent:null;
 if(kicker)kicker.textContent='RIGORI IN MOVIMENTO';
 const userTeam=(typeof career!=='undefined'?career?.user:null);
 const spectator=!!window.S9V10?.matchContext?.spectator;
 const homeTakers=(!spectator&&userTeam===h)?await pickTakers(h):penaltyTakers(h);
 const awayTakers=(!spectator&&userTeam===a)?await pickTakers(a):penaltyTakers(a);
 const homeKeeper=keeper(h),awayKeeper=keeper(a);
 penaltyOverlay.hidden=false;
 $('#v108PenaltyTitle').textContent=`${teamName(h)} vs ${teamName(a)}`;
 let hs=0,as=0,hr=[],ar=[],kickIndex=0;
 updatePenaltyUI(h,a,hs,as,hr,ar);
 // 3 tentativi a testa (regola reale del Trofeo Birra Goretti), poi oltranza.
 for(let round=0;round<6;round++){
  const isHome=round%2===0,team=isHome?h:a,takers=isHome?homeTakers:awayTakers,oppKeeper=isHome?awayKeeper:homeKeeper;
  const shooter=takers[Math.floor(round/2)%Math.max(1,takers.length)]||activePlayers(team)[0];
  const outcome=resultForKick(shooter,oppKeeper);kickIndex++;
  await animateMovingKick(isHome?'home':'away',shooter,outcome,kickIndex,{h,a});
  if(isHome){hr.push(outcome);if(outcome==='goal')hs++;}else{ar.push(outcome);if(outcome==='goal')as++;}
  updatePenaltyUI(h,a,hs,as,hr,ar);
 }
 let sudden=0;
 while(hs===as&&sudden<12){
  for(const isHome of [true,false]){
   const team=isHome?h:a,takers=isHome?homeTakers:awayTakers,oppKeeper=isHome?awayKeeper:homeKeeper;
   const shooter=takers[(3+sudden)%Math.max(1,takers.length)]||activePlayers(team)[0];
   const outcome=resultForKick(shooter,oppKeeper);kickIndex++;
   await animateMovingKick(isHome?'home':'away',shooter,outcome,kickIndex,{h,a});
   if(isHome){hr.push(outcome);if(outcome==='goal')hs++;}else{ar.push(outcome);if(outcome==='goal')as++;}
   updatePenaltyUI(h,a,hs,as,hr,ar);
  }
  sudden++;
 }
 if(hs===as){if(Math.random()<.5)hs++;else as++;}
 const winner=hs>as?h:a;
 $('#v108PenaltyResult').textContent=`VINCE ${teamName(winner).toUpperCase()} · ${hs}-${as}`;
 await sleep(1500);
 penaltyOverlay.hidden=true;
 if(kicker)kicker.textContent=prevKicker||'CALCI DI RIGORE';
 return {winner,score:`${hs}-${as}`};
}
window.S9PlayMovingShootout=playMovingShootout;

function outfield(teamId){
 const ps=activePlayers(teamId).filter(p=>p.pos!=='GK');return ps.length?ps:(activePlayers(teamId));
}
function randomPlayer(teamId){const p=outfield(teamId);return p[Math.floor(Math.random()*Math.max(1,p.length))]||{id:teamId+'_p',name:teamName(teamId),pos:'ST',overall:75,stats:{shooting:75}};}
function chance(min,side){
 const id=side==='home'?current.h:current.a,p=randomPlayer(id),opp=side==='home'?current.a:current.h;
 const outcome=typeof nonGoalOutcome==='function'?nonGoalOutcome(p,typeof keeperQuality==='function'?keeperQuality(opp):80,0):(Math.random()<.55?'save':'miss');
 return {min,type:'chance',outcome,side,player:p};
}
function foul(min,side){const id=side==='home'?current.h:current.a;return {min,type:'foul',side,player:randomPlayer(id)}}
function card(min,side){const id=side==='home'?current.h:current.a;return {min,type:Math.random()<.08?'red':'yellow',side,player:randomPlayer(id)}}
function extraEvents(){
 // FIX 2026-09 (32): "la telecronaca è piantata durante i supplementari a
 // meno che non faccia gol qualcuno" - con solo 3-6 eventi su 30 minuti
 // (contro decine nei tempi regolamentari) restava facile non avere NESSUN
 // evento con battuta per minuti reali di fila, sembrando bloccata. Densita'
 // alzata, resta comunque piu' bassa del tempo regolamentare (i supplementari
 // sono storicamente piu' stanchi/attendisti) ma non piu' silenziosa.
 const ev=[];for(let i=0,n=rand(6,11);i<n;i++){const min=rand(92,118),side=Math.random()<.5?'home':'away',r=Math.random();ev.push(r<.58?chance(min,side):r<.88?foul(min,side):card(min,side));}
 if(Math.random()<.58){
   const hp=typeof lineupPower==='function'?lineupPower(current.h):(T(current.h)?.strength||80),ap=typeof lineupPower==='function'?lineupPower(current.a):(T(current.a)?.strength||80);
   const winner=Math.random()<hp/(hp+ap)?current.h:current.a,side=winner===current.h?'home':'away',scorer=randomPlayer(winner),assistPool=outfield(winner).filter(p=>p.id!==scorer.id);
   ev.push({min:rand(96,118),type:'goal',outcome:'goal',side,player:scorer,assist:assistPool.length&&Math.random()<.6?assistPool[Math.floor(Math.random()*assistPool.length)]:null,_v108Golden:true});
 }
 return ev.sort((x,y)=>x.min-y.min);
}
async function playExtraRange(from,to){
 const list=(current.__v108ExtraEvents||[]).filter(e=>e.min>=from&&e.min<=to);
 for(let minute=from;minute<=to;minute++){
   while(paused)await wait(100);
   current.minute=minute;updateScore();
   if(window.S9MatchVisual)await S9MatchVisual.openPlay(minute);else await wait(160);
   for(const e of list.filter(x=>x.min===minute)){
     await doEvent(e);
     if(e._v108Golden){
       const winner=e.side==='home'?current.h:current.a;
       current.decider={winner,note:`GOLDEN GOAL · ${teamName(winner)}`};
       current.keyEvents.push(current.decider.note);log(`${e.min}' GOLDEN GOAL · ${teamName(winner)}!`,'neutral');
       return true;
     }
   }
 }
 current.minute=to;updateScore();return false;
}
function patchMatchDeciders(){
 if(!window.S9V10)return;
 S9V10.finishPlayedTie=async function(){
   const ctx=S9V10.matchContext,m=current;if(!ctx||ctx.match.kind!=='knockout'||m.decider)return;
   const tie=ctx.match.tie;let tied=m.scoreH===m.scoreA;
   if(tie.twoLeg){
     if(ctx.match.leg===1)return;
     const first=tie.legs[0];tied=first.hg+m.scoreA===first.ag+m.scoreH;
     if(tied&&tie.awayGoals&&m.scoreA!==first.ag)return;
   }
   if(!tied)return;
   paused=true;
   if(tie.directPens){
     log("90' FINE PARTITA · CALCI DI RIGORE",'neutral');
     const p=await playShootout(m.h,m.a);m.decider={winner:p.winner,note:`RIGORI ${p.score}`};m.keyEvents.push(m.decider.note);log(m.decider.note,'neutral');paused=false;return;
   }
   m.__v108ExtraEvents=extraEvents();
   log("90' FINE TEMPI REGOLAMENTARI · SUPPLEMENTARI",'neutral');
   await ov(S9Popups.html('extra',{detail:'1° e 2° tempo supplementare. Golden Goal attivo.'}),1200);
   paused=false;current.half=3;current.minute=90;updateScore();
   /* FIX 2026-09 (31): "i supplementari partono a caso" e "sparisce l'audio
      ambientale del tifo" - due buchi distinti alla ripresa dei supplementari:
      1) window.S9SFX.stopAmbientCrowd() viene chiamato a fine tempi
         regolamentari (90', in index.html) prima di sapere se si andra' ai
         supplementari: il tifo restava spento per tutta la frazione
         extra. Riacceso qui esplicitamente.
      2) a differenza del cambio 1°->2° tempo (che richiama setupPitch() e
         S9Match3D.kickoffCinematic()), qui si passava dritti al gioco senza
         alcuna inquadratura d'inizio ne' un vero reset delle posizioni:
         da qui la sensazione di "partenza a caso". */
   try{setupPitch()}catch(err){}
   show('match');
   try{window.S9SFX?.startAmbientCrowd?.()}catch(err){}
   await window.S9Match3D?.kickoffCinematic?.("1° SUPPLEMENTARE");
   log("91' INIZIA IL 1° TEMPO SUPPLEMENTARE",'neutral');
   let golden=await playExtraRange(91,105);
   if(!golden){
     paused=true;await ov(S9Popups.html('extra',{detail:'105° · Cambio campo. Inizia il secondo tempo supplementare.'}),900);paused=false;
     current.half=4;current.minute=105;updateScore();
     try{setupPitch()}catch(err){}
     show('match');
     await window.S9Match3D?.kickoffCinematic?.("2° SUPPLEMENTARE");
     log("106' INIZIA IL 2° TEMPO SUPPLEMENTARE",'neutral');
     golden=await playExtraRange(106,120);
   }
   try{window.S9SFX?.stopAmbientCrowd?.()}catch(err){}
   if(golden){
     paused=true;await ov(S9Popups.html('golden',{player:teamName(m.decider.winner),detail:m.decider.note,footer:'PARTITA TERMINATA'}),1500);paused=false;return;
   }
   current.minute=120;updateScore();log("120' FINE SUPPLEMENTARI · CALCI DI RIGORE",'neutral');paused=true;
   const p=await playShootout(m.h,m.a);m.decider={winner:p.winner,note:`RIGORI ${p.score}`};m.keyEvents.push(m.decider.note);log(m.decider.note,'neutral');paused=false;
 };
}
// FIX 2026-09 (56): "dopo la scelta dei rigori tiriamo gli shootout ma poi
// rimane questa schermata, vedi che dietro c'è il risultato" - il selettore
// rigoristi (#v108TakerPicker) e la scena rigori (#v108PenaltyOverlay) sono
// due overlay a parte, fuori dal sistema di "schermate" (.screen/show()):
// restano sopra qualunque cosa sia attiva sotto. In teoria la sequenza che li
// apre e' sempre "await"ata prima che index.html chiami show("postmatch"),
// ma qui aggiungiamo comunque una rete di sicurezza esplicita, cosi' anche se
// per qualunque motivo (un altro show() in corsa nel frattempo, un futuro
// punto di chiamata non ancora "await"ato) partisse un cambio schermata verso
// "postmatch" mentre uno di questi due overlay e' ancora aperto, quel cambio
// viene rimandato finche' l'utente non conferma/la scena rigori non finisce,
// invece di mostrare il risultato "scoperto" dietro un selettore ancora
// bloccato in attesa di un tocco.
window.S9PenaltyUIBusy=function(){return !!(takerPicker&&!takerPicker.hidden)||!!(penaltyOverlay&&!penaltyOverlay.hidden)};
function guardShowAgainstPenaltyUI(){
 if(typeof window.show!=='function')return;
 const original=window.show;
 window.show=function(id){
  if(id==='postmatch'&&window.S9PenaltyUIBusy()){
   const retry=()=>{if(window.S9PenaltyUIBusy())requestAnimationFrame(retry);else original('postmatch')};
   requestAnimationFrame(retry);
   return;
  }
  return original.apply(this,arguments);
 };
 try{show=window.show}catch(e){}
}
function init(){ensurePenaltyOverlay();patchMatchDeciders();guardShowAgainstPenaltyUI();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
