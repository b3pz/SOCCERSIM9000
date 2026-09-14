(function(){
'use strict';
const $=s=>document.querySelector(s);
const LOGOS={
  italia:'assets/competition_buttons/coppa_italia.png',
  cdc:'assets/competition_buttons/coppa_campioni.png',
  uefa:'assets/competition_buttons/uefa_cup.png',
  world:'assets/competition_buttons/francia98.png',
  euro:'assets/competition_buttons/euro2000.png'
};
const ORDER=['italia','cdc','uefa','world','euro'];
const LABELS={
  italia:'Coppa Italia',
  cdc:'Coppa dei Campioni',
  uefa:'Coppa UEFA',
  world:'Francia 98',
  euro:'Euro 2000'
};
function currentCompetitionKey(){
  const k=window.S9V10?.matchContext?.state?.key;
  return k||'seriea';
}
function currentCompetitionLabel(){
  return window.S9Competition?.active?.()?.name||LABELS[currentCompetitionKey()]||'Campionato';
}
function currentStageLabel(){
  const ctx=window.S9V10?.matchContext;
  if(ctx?.mode==='friendly') return ctx.final?'FINALE · ESIBIZIONE':'AMICHEVOLE';
  return ctx?.match?.stage||'PARTITA';
}
function resolveTeams(){
  const fix=current?.fixture;
  if(fix&&typeof T==='function'){
    const h=T(fix[0]),a=T(fix[1]);
    if(h&&a)return {home:h,away:a};
  }
  if(current&&typeof T==='function'){
    const h=T(current.h),a=T(current.a);
    if(h&&a)return {home:h,away:a};
  }
  return null;
}
function resolveStadiumDossier(){
  const teams=resolveTeams();
  const homeId=current?.h||current?.fixture?.[0];
  const meta=(window.teamMeta&&homeId?teamMeta[homeId]:null)||{};
  const ctx=window.S9V10?.matchContext;
  return {
    stadium:ctx?.stadium||meta.stadium||teams?.home?.stadium||'Stadio storico',
    city:meta.city||teams?.home?.name||'Italia',
    coach:teams?.home?.coach||'—',
    opponentCoach:teams?.away?.coach||'—'
  };
}
function ensurePrematchHero(){
  const root=$('#prematch');
  if(!root)return;
  if(root.querySelector('.v110-prematch-hero'))return;
  let hero=root.querySelector('.v107-prematch-hero');
  if(!hero){
    hero=document.createElement('div');
    hero.className='v107-prematch-hero';
    hero.innerHTML='\
      <div class="v107-prematch-brand">\
        <div class="v107-prematch-kicker">SERIEA 9000 SIM</div>\
        <div class="v107-prematch-title"></div>\
        <div class="v107-prematch-sub"></div>\
      </div>\
      <div class="v107-prematch-rail" aria-hidden="true"></div>\
      <div class="v107-prematch-dossier">\
        <div class="v107-dossier-card">\
          <span class="v107-label">STADIO</span>\
          <strong class="v107-stadium-name"></strong>\
          <span class="v107-stadium-city"></span>\
        </div>\
        <div class="v107-dossier-card">\
          <span class="v107-label">ALLENATORI</span>\
          <strong class="v107-home-coach"></strong>\
          <span class="v107-away-coach"></span>\
        </div>\
      </div>';
    root.insertBefore(hero,root.firstChild);
  }
  root.classList.add('v107-prematch-upgraded');
  const teams=resolveTeams();
  const dossier=resolveStadiumDossier();
  hero.querySelector('.v107-prematch-title').textContent=currentCompetitionLabel();
  hero.querySelector('.v107-prematch-sub').textContent=`${currentStageLabel()} · ${teams?teams.home.name+' vs '+teams.away.name:'PREPARAZIONE PARTITA'}`;
  hero.querySelector('.v107-stadium-name').textContent=dossier.stadium.toUpperCase();
  hero.querySelector('.v107-stadium-city').textContent=dossier.city;
  hero.querySelector('.v107-home-coach').textContent=`${teams?.home?.name||'Casa'} · ${dossier.coach}`;
  hero.querySelector('.v107-away-coach').textContent=`${teams?.away?.name||'Ospiti'} · ${dossier.opponentCoach}`;
  const rail=hero.querySelector('.v107-prematch-rail');
  const active=currentCompetitionKey();
  const cards=ORDER.map(k=>`<span class="v107-rail-item ${active===k?'active':''}"><img src="${LOGOS[k]}" alt="${LABELS[k]}"><b>${LABELS[k]}</b></span>`).join('');
  rail.innerHTML=`<div class="v107-rail-track">${cards}${cards}</div>`;
  const panels=root.querySelectorAll(':scope > .grid > .panel');
  if(panels[0]) panels[0].classList.add('v107-meta-panel');
  if(panels[1]) panels[1].classList.add('v107-lineup-panel');
}
function improveTacticsModal(){
  const modal=$('#tacticsModal');
  if(!modal)return;
  modal.classList.add('v107-tactics-upgraded');
  const panel=modal.querySelector('.panel');
  if(panel)panel.classList.add('v107-tactics-shell');
  const grid=modal.querySelector('.grid');
  if(grid){
    const cols=[...grid.children];
    cols[0]?.classList.add('v107-tactics-side');
    cols[1]?.classList.add('v107-tactics-change');
  }
}
function wrapOpeners(){
  if(typeof window.openPrematch==='function'&&!window.openPrematch.__v107Wrapped){
    const base=window.openPrematch;
    window.openPrematch=function(){const out=base.apply(this,arguments);requestAnimationFrame(ensurePrematchHero);return out};
    window.openPrematch.__v107Wrapped=true;
  }
  if(typeof window.openTactics==='function'&&!window.openTactics.__v107Wrapped){
    const base=window.openTactics;
    window.openTactics=function(){const out=base.apply(this,arguments);requestAnimationFrame(improveTacticsModal);return out};
    window.openTactics.__v107Wrapped=true;
  }
}

function fitHalfLabel(){
  if(typeof window.updateScore==='function'&&!window.updateScore.__v107Wrapped){
    const base=window.updateScore;
    window.updateScore=function(){
      const out=base.apply(this,arguments);
      const hl=$('#halfLabel');
      if(hl&&current){
        if(current.half===3) hl.textContent='1° TS';
        else if(current.half===4) hl.textContent='2° TS';
      }
      return out;
    };
    window.updateScore.__v107Wrapped=true;
  }
}

function playerPool(teamId){
  const st=career?.teamStates?.[teamId];
  const ids=st?.lineup||[];
  const arr=(st?.players||[]).filter(p=>ids.includes(p.id)&&p.pos!=='GK');
  return arr.length?arr:(st?.players||[]).filter(p=>p.pos!=='GK');
}
function randomOutfield(teamId){
  const pool=playerPool(teamId);
  return pool.length?pick(pool):career?.teamStates?.[teamId]?.players?.[0]||{id:teamId+'_x',name:T(teamId)?.name||'Giocatore',pos:'ST'};
}
function maybeAssist(teamId,scorerId){
  const pool=playerPool(teamId).filter(p=>p.id!==scorerId);
  return pool.length&&Math.random()<0.62?pick(pool):null;
}
function makeChance(min,side){
  const id=side==='home'?current.h:current.a;
  const player=randomOutfield(id);
  const keeper=typeof keeperQuality==='function'?keeperQuality(side==='home'?current.a:current.h):80;
  const outcome=typeof nonGoalOutcome==='function'?nonGoalOutcome(player,keeper,0):pick(['save','miss','post']);
  return {min,type:'chance',outcome,side,player};
}
function makeFoul(min,side){
  const id=side==='home'?current.h:current.a;
  return {min,type:'foul',side,player:randomOutfield(id)};
}
function makeCard(min,side){
  const id=side==='home'?current.h:current.a;
  return {min,type:Math.random()<.1?'red':'yellow',side,player:randomOutfield(id)};
}
function buildExtraTimeEvents(){
  const events=[];
  const total=rand(2,5);
  for(let i=0;i<total;i++){
    const min=rand(92,118);
    const side=Math.random()<.5?'home':'away';
    const roll=Math.random();
    if(roll<.56) events.push(makeChance(min,side));
    else if(roll<.86) events.push(makeFoul(min,side));
    else events.push(makeCard(min,side));
  }
  let goldenEvent=null;
  if(Math.random()<.58){
    const hs=(typeof lineupPower==='function'?lineupPower(current.h):(T(current.h)?.strength||80));
    const as=(typeof lineupPower==='function'?lineupPower(current.a):(T(current.a)?.strength||80));
    const winner=Math.random()<hs/(hs+as)?current.h:current.a;
    const side=winner===current.h?'home':'away';
    const scorer=randomOutfield(winner);
    goldenEvent={min:rand(97,118),type:'goal',outcome:'goal',side,player:scorer,assist:maybeAssist(winner,scorer.id),_v107GoldenGoal:true};
    events.push(goldenEvent);
  }
  return events.sort((a,b)=>a.min-b.min);
}
async function playExtraSegment(start,end){
  const evts=(current.__v107ExtraEvents||[]).filter(e=>e.min>=start&&e.min<=end);
  for(let minute=start;minute<=end;minute++){
    while(paused)await wait(100);
    current.minute=minute;updateScore();
    if(window.S9MatchVisual) await S9MatchVisual.openPlay(minute);
    else await wait(165);
    for(const e of evts.filter(x=>x.min===minute)){
      await doEvent(e);
      if(e._v107GoldenGoal){
        const winner=e.side==='home'?current.h:current.a;
        current.decider={winner,note:`GOLDEN GOAL · ${T(winner).name}`};
        current.keyEvents.push(current.decider.note);
        log(`${e.min}' GOLDEN GOAL! ${T(winner).name} chiude i supplementari.`,'neutral');
        return 'golden';
      }
    }
  }
  current.minute=end;updateScore();
  return 'done';
}

function patchExtraTime(){
  if(!window.S9V10||window.S9V10.__v107ExtraPatched)return;
  window.S9V10.finishPlayedTie=async function(){
    const ctx=S9V10.matchContext,m=current;
    if(!ctx||ctx.match.kind!=='knockout'||m.decider) return;
    const tie=ctx.match.tie; let tied=m.scoreH===m.scoreA;
    if(tie.twoLeg){
      if(ctx.match.leg===1) return;
      const first=tie.legs[0];
      tied=first.hg+m.scoreA===first.ag+m.scoreH;
      if(tied&&tie.awayGoals&&m.scoreA!==first.ag) return;
    }
    if(!tied) return;
    if(tie.directPens){
      log("90' FINE PARTITA · SI VA DIRETTAMENTE AI RIGORI",'neutral');
      await ov(S9Popups.html('penalties',{detail:'La sfida si decide dal dischetto.'}),1200);
      const p=penaltyShootout(m.h,m.a);
      m.decider={winner:p.winner,note:`RIGORI ${p.score}`};
      m.keyEvents.push(m.decider.note);log(m.decider.note);await ov(S9Popups.html('penalties',{player:T(p.winner).name,detail:m.decider.note,footer:'VINCE '+T(p.winner).name}),1800);
      return;
    }
    m.__v107ExtraEvents=buildExtraTimeEvents();
    log("90' FINE TEMPI REGOLAMENTARI · SUPPLEMENTARI",'neutral');
    await ov(S9Popups.html('extra',{detail:'Si giocano i supplementari. Golden goal attivo.'}),1300);
    current.half=3; current.minute=90; updateScore(); show('match'); paused=false;
    log("91' INIZIA IL 1° TEMPO SUPPLEMENTARE",'neutral');
    let result=await playExtraSegment(91,105);
    if(result!=='golden'){
      paused=true;
      await ov(S9Popups.html('extra',{detail:'Cambio campo per il 2° tempo supplementare.'}),950);
      paused=false;
      current.half=4; current.minute=105; updateScore();
      log("106' INIZIA IL 2° TEMPO SUPPLEMENTARE",'neutral');
      result=await playExtraSegment(106,120);
    }
    if(result==='golden'){
      await ov(S9Popups.html('golden',{player:T(m.decider.winner).name,detail:m.decider.note,footer:'VINCE '+T(m.decider.winner).name}),1700);
      return;
    }
    current.minute=120; updateScore();
    log("120' FINE SUPPLEMENTARI",'neutral');
    const p=penaltyShootout(m.h,m.a);
    m.decider={winner:p.winner,note:`RIGORI ${p.score}`};
    m.keyEvents.push(m.decider.note);log(m.decider.note);await ov(S9Popups.html('penalties',{player:T(p.winner).name,detail:m.decider.note,footer:'VINCE '+T(p.winner).name}),1800);
  };
  window.S9V10.__v107ExtraPatched=true;
}

function init(){
  wrapOpeners();
  fitHalfLabel();
  patchExtraTime();
  requestAnimationFrame(()=>{ensurePrematchHero();improveTacticsModal();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
