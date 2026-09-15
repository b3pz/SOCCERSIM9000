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
    <div class="v108-goal-frame"><div class="v108-net"></div><div class="v108-keeper" id="v108Keeper"></div><div class="v108-ball" id="v108Ball"></div></div>
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
async function animateKick(side,shooter,outcome,kickNo){
 const ball=$('#v108Ball'),gk=$('#v108Keeper'),name=$('#v108PenaltyPlayer'),res=$('#v108PenaltyResult'),stage=$('#v108PenaltyStage');
 name.textContent=`${kickNo}° RIGORE · ${shooter?.name||'Tiratore'} · ${side==='home'?'CASA':'OSPITI'}`;res.textContent='';
 ball.className='v108-ball';gk.className='v108-keeper';stage.classList.remove('goal','save','miss');
 void ball.offsetWidth;
 await sleep(420);
 const target=Math.random()<.5?'left':'right';
 gk.classList.add(target==='left'?'dive-left':'dive-right');
 if(outcome==='goal')ball.classList.add(target==='left'?'shot-right-high':'shot-left-high');
 else if(outcome==='save')ball.classList.add(target==='left'?'shot-left':'shot-right');
 else ball.classList.add(Math.random()<.5?'shot-wide-left':'shot-wide-right');
 await sleep(700);
 stage.classList.add(outcome);
 res.textContent=outcome==='goal'?'GOL!':outcome==='save'?'PARATA!':'FUORI!';
 await sleep(720);
}
function canEndEarly(round,hs,as){
 const homeTaken=Math.ceil(round/2),awayTaken=Math.floor(round/2);
 const homeLeft=Math.max(0,5-homeTaken),awayLeft=Math.max(0,5-awayTaken);
 return hs>as+awayLeft||as>hs+homeLeft;
}
async function playShootout(h,a){
 ensurePenaltyOverlay();
 penaltyOverlay.hidden=false;
 $('#v108PenaltyTitle').textContent=`${teamName(h)} vs ${teamName(a)}`;
 const homeTakers=penaltyTakers(h),awayTakers=penaltyTakers(a),homeKeeper=keeper(h),awayKeeper=keeper(a);
 let hs=0,as=0,hr=[],ar=[],kickIndex=0;
 updatePenaltyUI(h,a,hs,as,hr,ar);
 // primi cinque per parte, con chiusura anticipata se matematicamente deciso
 for(let round=0;round<10;round++){
   const isHome=round%2===0,team=isHome?h:a,takers=isHome?homeTakers:awayTakers,oppKeeper=isHome?awayKeeper:homeKeeper;
   const shooter=takers[Math.floor(round/2)%Math.max(1,takers.length)]||activePlayers(team)[0];
   const outcome=resultForKick(shooter,oppKeeper);kickIndex++;
   await animateKick(isHome?'home':'away',shooter,outcome,kickIndex);
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
     await animateKick(isHome?'home':'away',shooter,outcome,kickIndex);
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
 const ev=[];for(let i=0,n=rand(3,6);i<n;i++){const min=rand(92,118),side=Math.random()<.5?'home':'away',r=Math.random();ev.push(r<.58?chance(min,side):r<.88?foul(min,side):card(min,side));}
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
   paused=false;current.half=3;current.minute=90;updateScore();show('match');log("91' INIZIA IL 1° TEMPO SUPPLEMENTARE",'neutral');
   let golden=await playExtraRange(91,105);
   if(!golden){
     paused=true;await ov(S9Popups.html('extra',{detail:'105° · Cambio campo. Inizia il secondo tempo supplementare.'}),900);paused=false;
     current.half=4;current.minute=105;updateScore();log("106' INIZIA IL 2° TEMPO SUPPLEMENTARE",'neutral');
     golden=await playExtraRange(106,120);
   }
   if(golden){
     paused=true;await ov(S9Popups.html('golden',{player:teamName(m.decider.winner),detail:m.decider.note,footer:'PARTITA TERMINATA'}),1500);paused=false;return;
   }
   current.minute=120;updateScore();log("120' FINE SUPPLEMENTARI · CALCI DI RIGORE",'neutral');paused=true;
   const p=await playShootout(m.h,m.a);m.decider={winner:p.winner,note:`RIGORI ${p.score}`};m.keyEvents.push(m.decider.note);log(m.decider.note,'neutral');paused=false;
 };
}
function init(){ensurePenaltyOverlay();patchMatchDeciders();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
