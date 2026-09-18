/* An exhibition owns a disposable career; the real career is restored by reference. */
(function(){
'use strict';
let saved=null;
const q=s=>document.querySelector(s);
function valid(config){return !!T(config.home)&&!!T(config.away)&&config.home!==config.away&&!!S9Competition.definitions[config.competition]&&typeof config.stadium==='string'&&config.stadium.trim().length>0&&config.stadium.length<=100}
function start(config){
 if(!valid(config))throw new Error('Scegli due squadre diverse e uno stadio.');
 if(saved||current?._running||S9V10.matchContext)throw new Error('Concludi prima la partita in corso.');
 saved={career,standalone:S9V10.standalone,savedCareer:S9V10.savedCareer};
 const h=config.home,a=config.away,final=!!config.final;
 career=S9V10.createMatchCareer(h,[h,a]);S9V10.standalone=null;
 const state={id:'friendly_'+Date.now(),key:config.competition,name:S9Competition.definitions[config.competition].name,exhibition:true,completed:false};
 const tie={a:h,b:a,twoLeg:false,directPens:false,legs:[]};
 S9V10.matchContext={mode:'friendly',state,spectator:!!config.spectator,stadium:config.stadium.trim(),final,match:{h,a,kind:final?'knockout':'friendly',tie,leg:1,stage:final?'FINALE · ESIBIZIONE':'AMICHEVOLE'}};
 career.fixtures=[[[h,a]]];career.otherFixtures=[[]];
 S9V10.applyCompetitionTheme(config.competition);openPrematch([h,a]);q('#backSeason').textContent='← AMICHEVOLE';
 document.getElementById('match').classList.toggle('s9-spectator',!!config.spectator);
 if(config.spectator){renderKitScreen();show('kits')}
}
function restore(){
 if(!saved)return;
 if(current?._running&&!current._finished)return;
 document.getElementById('match').classList.remove('s9-spectator');const original=saved;saved=null;career=original.career;S9V10.standalone=original.standalone;S9V10.savedCareer=original.savedCareer;S9V10.matchContext=null;current=null;paused=false;
 S9V10.applyCompetitionTheme('');show('exhibitionSetup');
}
function complete(){
 const ctx=S9V10.matchContext,m=current;if(ctx?.mode!=='friendly'||!m?._finished)return;
 if(ctx.final&&!ctx.state.completed){
  const champion=m.decider?.winner||(m.scoreH>m.scoreA?m.h:m.scoreA>m.scoreH?m.a:null);
  if(champion){Object.assign(ctx.state,{completed:true,champion,phase:'DONE'});S9Celebration.exhibition(ctx.state,m,ctx.stadium)}
 }
}
function finish(){complete();restore()}
window.S9Exhibition={start,restore,finish,complete,valid,get active(){return !!saved}};
function boot(){
 const button=document.createElement('button');button.id='friendlyModeBtn';button.textContent='PARTITA AMICHEVOLE';
 // v10.6 — spostato dal menu secondario (piccolo, in un angolo) a scheda
 // pari con Carriera e Coppe, stessa struttura visiva delle altre due.
 const grid=q('.main-menu-grid');
 button.className='big-menu-btn';
 button.innerHTML='<span style="font-size:44px;line-height:70px">⚽</span><span class="big" style="font-size:.85em">PARTITA AMICHEVOLE</span><span class="small">SCEGLI SQUADRE E STADIO · NESSUN IMPATTO SULLA CARRIERA</span>';
 if(grid)grid.appendChild(button);else q('#mainMenu .menu-secondary').prepend(button);
 const screen=document.createElement('section');screen.id='exhibitionSetup';screen.className='screen';
 // v13 — prima tutto (competizione, squadre, stadio) stava sulla stessa
 // schermata tutto insieme. Ora e' una vera sequenza a passi (1 Competizione
 // -> 2 Squadre -> 3 Stadio), con un pulsante "Casuale" che salta dritto in
 // fondo con tutto gia' scelto a caso, pronto da confermare o ritoccare.
 screen.innerHTML=`<div class="s9-exhibition-shell"><div class="s9-exhibition-kicker">PARTITA LIBERA</div><h1>La tua partita, il tuo stadio</h1>
 <div class="s9-wizard-progress">
  <button type="button" class="s9-wizard-dot" data-step="1"><span class="s9-wizard-num">1</span><small>Competizione</small></button>
  <button type="button" class="s9-wizard-dot" data-step="2"><span class="s9-wizard-num">2</span><small>Squadre</small></button>
  <button type="button" class="s9-wizard-dot" data-step="3"><span class="s9-wizard-num">3</span><small>Stadio</small></button>
  <button type="button" id="exhibitionRandom" class="s9-wizard-random">🎲 CASUALE</button>
 </div>
 <form id="exhibitionForm">
 <div class="s9-wizard-step" data-step="1">
 <div class="s9-picker-mini-label">COMPETIZIONE</div>
 <div class="s9-exhibition-comp-carousel" id="exhibitionCompetitionCarousel">
  <button type="button" class="s9-ex-comp-arrow" id="exCompPrev" aria-label="Competizione precedente">◀</button>
  <div class="s9-ex-comp-side" id="exCompPrevCard" aria-hidden="true"></div>
  <button type="button" class="s9-ex-comp-feature" id="exCompFeature" aria-label="Competizione selezionata"></button>
  <div class="s9-ex-comp-side" id="exCompNextCard" aria-hidden="true"></div>
  <button type="button" class="s9-ex-comp-arrow" id="exCompNext" aria-label="Competizione successiva">▶</button>
 </div>
 <div class="s9-ex-comp-dots" id="exCompDots"></div>
 <div class="s9-picker-mini-label">SQUADRE</div><div class="toolbar s9-pill-row" id="exhibitionPoolPills">
  <button type="button" data-pool="all">TUTTE</button><button type="button" data-pool="clubs">CLUB</button><button type="button" data-pool="national">NAZIONALI</button>
 </div>
 </div>
 <div class="s9-wizard-step" data-step="2">
 <div class="s9-exhibition-teams">
  <div class="s9-picker-mini"><div class="s9-picker-mini-label">SQUADRA DI CASA</div>
   <div class="s9-picker-art">
    <button type="button" class="s9-picker-neighbor s9-picker-neighbor-prev" id="homePrevPreview" aria-label="Squadra precedente"></button>
    <button type="button" class="s9-picker-arrow" id="homePrev" aria-label="Precedente">◀</button>
    <div class="s9-picker-crest" id="homeCrest"></div>
    <button type="button" class="s9-picker-arrow" id="homeNext" aria-label="Successiva">▶</button>
    <button type="button" class="s9-picker-neighbor s9-picker-neighbor-next" id="homeNextPreview" aria-label="Squadra successiva"></button>
   </div>
   <div class="s9-picker-name" id="homeName"></div>
   <div class="s9-picker-kits"><figure><img id="homeKitHome" alt="Prima divisa"><figcaption>PRIMA DIVISA</figcaption></figure><figure><img id="homeKitAway" alt="Seconda divisa"><figcaption>SECONDA DIVISA</figcaption></figure></div>
   <div class="s9-picker-rating" id="homeRating"></div>
  </div>
  <div class="s9-exhibition-vs">VS</div>
  <div class="s9-picker-mini"><div class="s9-picker-mini-label">SQUADRA OSPITE</div>
   <div class="s9-picker-art">
    <button type="button" class="s9-picker-neighbor s9-picker-neighbor-prev" id="awayPrevPreview" aria-label="Squadra precedente"></button>
    <button type="button" class="s9-picker-arrow" id="awayPrev" aria-label="Precedente">◀</button>
    <div class="s9-picker-crest" id="awayCrest"></div>
    <button type="button" class="s9-picker-arrow" id="awayNext" aria-label="Successiva">▶</button>
    <button type="button" class="s9-picker-neighbor s9-picker-neighbor-next" id="awayNextPreview" aria-label="Squadra successiva"></button>
   </div>
   <div class="s9-picker-name" id="awayName"></div>
   <div class="s9-picker-kits"><figure><img id="awayKitHome" alt="Prima divisa"><figcaption>PRIMA DIVISA</figcaption></figure><figure><img id="awayKitAway" alt="Seconda divisa"><figcaption>SECONDA DIVISA</figcaption></figure></div>
   <div class="s9-picker-rating" id="awayRating"></div>
  </div>
 </div>
 </div>
 <div class="s9-wizard-step" data-step="3">
 <div class="s9-picker-mini s9-stadium-block"><div class="s9-picker-mini-label">STADIO</div>
  <canvas id="stadiumPreviewCanvas" class="s9-stadium-preview" width="320" height="170" aria-hidden="true"></canvas>
  <div class="s9-picker-art">
   <button type="button" class="s9-picker-neighbor s9-picker-neighbor-prev" id="stadiumPrevPreview" aria-label="Stadio precedente"></button>
   <button type="button" class="s9-stadium-arrow" id="stadiumPrev" aria-label="Precedente">◀</button>
   <div class="s9-stadium-card"><div class="s9-stadium-name" id="stadiumName"></div><div class="s9-stadium-counter" id="stadiumCounter"></div></div>
   <button type="button" class="s9-stadium-arrow" id="stadiumNext" aria-label="Successivo">▶</button>
   <button type="button" class="s9-picker-neighbor s9-picker-neighbor-next" id="stadiumNextPreview" aria-label="Stadio successivo"></button>
  </div>
  <input type="hidden" id="exhibitionStadium">
 </div>
 <label class="s9-final-choice"><input type="checkbox" id="exhibitionSpectator"> Guarda evento · CPU contro CPU</label>
 <label class="s9-final-choice"><input type="checkbox" id="exhibitionFinal"> Finale · in caso di pareggio, supplementari e rigori</label>
 <p class="s9-exhibition-note">Le esibizioni non modificano carriera, classifiche o albo d’oro. La finale include la premiazione con la coppa della competizione scelta.</p>
 </div>
 <div id="exhibitionError" role="alert"></div>
 <div class="s9-exhibition-actions"><button type="button" id="wizBack">← MENU</button><button type="button" id="wizNext">AVANTI ▶</button><button type="submit" id="exhibitionSubmit" class="primary">PREPARA PARTITA ▶</button></div>
 </form></div>`;
 document.querySelector('main').appendChild(screen);

 const stadiums=new Set(['San Siro','Stadio Olimpico','Stade de France','Wembley','De Kuip','Camp Nou','Santiago Bernabéu','Stadio San Paolo']);
 Object.values(teamMeta).forEach(m=>{if(m.stadium)stadiums.add(m.stadium)});
 const stadiumList=[...stadiums].sort();
 let stadiumIndex=0,ids=[],homeIndex=0,awayIndex=1,pool='all',competition=null;

 function renderStadium(){
  q('#stadiumName').textContent=stadiumList[stadiumIndex];
  q('#stadiumCounter').textContent=(stadiumIndex+1)+' / '+stadiumList.length;
  q('#exhibitionStadium').value=stadiumList[stadiumIndex];
  const prev=stadiumList[(stadiumIndex-1+stadiumList.length)%stadiumList.length],next=stadiumList[(stadiumIndex+1)%stadiumList.length];
  q('#stadiumPrevPreview').innerHTML=`<span>🏟</span><small>${prev}</small>`;
  q('#stadiumNextPreview').innerHTML=`<span>🏟</span><small>${next}</small>`;
  renderStadiumPreview();
 }
 // Anteprima dello stesso profilo usato in partita: struttura, club di casa
 // e monumenti caratteristici devono essere riconoscibili gia' nel selettore.
 function renderStadiumPreview(){
  const canvas=q('#stadiumPreviewCanvas');
  if(!canvas||!window.S9Football3D)return;
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,name=(stadiumList[stadiumIndex]||'Stadio').toLowerCase();
  ctx.clearRect(0,0,W,H);
  const style=S9Competition.stadiumStyle(stadiumList[stadiumIndex]);
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#071a35');bg.addColorStop(1,'#162740');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  const g=window.S9Football3D,p=g.camera([0,18,35],[0,3,-2],W,H,40),s=g.scene(ctx,p);
  if(style.track)s.box([0,-.25,0],[43,.16,31],'#9b6458');
  s.box([0,-.12,0],[36,.18,24],'#2f7a48');
  for(let i=-4;i<4;i++)s.box([i*4.4,-.05,0],[3.7,.03,24],i%2?'#347f4d':'#2f7a48');
  const stands=[[0,-16,44,5],[0,16,44,5],[-23,0,5,34],[23,0,5,34]];
  for(const [cx,cz,dx,dz] of stands){
   for(let tier=0;tier<(cx?style.endTiers:style.tiers);tier++)s.box([cx,.9+tier*1.25,cz+(cz<0?-1:cz>0?1:0)*tier*1.5],[dx-tier*1.2,1.15,dz],tier%2?style.seats:'#253d58');
  }
  const top=.9+(style.tiers-1)*1.25+1.2;
  if(['ring','continuous'].includes(style.roof)){
   s.box([0,top,-18],[46,.28,4],style.accent);s.box([0,top,18],[46,.28,4],style.accent);s.box([-25,top,0],[4,.28,36],style.accent);s.box([25,top,0],[4,.28,36],style.accent);
  }else if(style.roof==='steep'||style.roof==='partial'){
   s.box([0,top,-18],[45,.3,4],style.accent);if(style.roof==='steep')s.box([0,top-.5,18],[42,.3,4],style.accent);
  }else if(style.roof==='towers'){
   for(const x of [-24,24])for(const z of [-16,16]){s.box([x,top+1.6,z],[2.2,5.2,2.2],'#bec4ca');s.box([x,top+4.2,z],[3,.25,3],style.accent)}
   s.box([0,top,-18],[43,.28,4],style.accent);
  }else if(style.roof==='arch'){
   s.box([0,top,-18],[44,.28,4],style.accent);for(let i=0;i<7;i++){const x=-18+i*6,y=top+1+Math.sin(i*Math.PI/6)*3.4;s.box([x,y,-19],[.3,1,.3],style.accent)}
  }
  if(style.landmark==='torre-maratona'){
   const z=-21,concrete='#c9c1a9',shadow='#756f65';
   s.box([0,7.5,z],[1.8,15,2.1],concrete);s.box([-1.35,6.5,z],[.34,13,2.4],shadow);s.box([1.35,6.5,z],[.34,13,2.4],shadow);
   for(const y of [2.5,5,7.5,10,12.5])s.box([0,y,z+1.15],[3.2,.28,1.3],concrete);
   s.box([0,15.5,z],[3.8,.72,2.8],concrete);s.box([0,17,z],[.3,2.4,.3],shadow);
  }
  const identity=S9Competition.stadiumIdentity(stadiumList[stadiumIndex]);
  const identityTexture=S9Match3D.stadiumIdentityTexture(identity,style,renderStadiumPreview);
  if(identityTexture){
   // Nell'anteprima i club residenti sono una targhetta della tribuna: il
   // maxischermo con il risultato appartiene esclusivamente alla partita.
   s.box([style.landmark==='torre-maratona'?-9:0,5.2,-13.35],[style.landmark==='torre-maratona'?19:25,1.55,.3],'#111923',0,identityTexture);
  }
  s.flush();
  ctx.fillStyle='rgba(3,10,22,.76)';ctx.fillRect(0,H-31,W,31);ctx.fillStyle='#f7e6b4';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.fillText(stadiumList[stadiumIndex].toUpperCase(),W/2,H-12);
 }
 function setStadium(name){const i=stadiumList.indexOf(name);stadiumIndex=i>=0?i:0;renderStadium()}
 function stadiumStep(delta){stadiumIndex=(stadiumIndex+delta+stadiumList.length)%stadiumList.length;renderStadium()}
 q('#stadiumPrev').onclick=()=>stadiumStep(-1);q('#stadiumNext').onclick=()=>stadiumStep(1);
 q('#stadiumPrevPreview').onclick=()=>stadiumStep(-1);q('#stadiumNextPreview').onclick=()=>stadiumStep(1);

 function renderSide(side,index){
  const id=ids[index];if(!id)return;const t=T(id);
  /* FIX 2026-09: come neighborCrest() in index.html, CREST_ASSETS copre solo
     le squadre italiane storiche - qui in Amichevole il pool include anche
     estere e nazionali, che finivano sempre nel fallback a sole iniziali
     ("stemma rotto"). crestFor() risolve il percorso giusto per ogni
     categoria, quindi lo usiamo come fallback. */
  const crestSrc=CREST_ASSETS[id]||(typeof crestFor==='function'?crestFor(id):null);
  const initials=t.name.substring(0,2).toUpperCase();
  q('#'+side+'Crest').innerHTML=crestSrc?`<img src="${crestSrc}" alt="Stemma ${t.name}" onerror="this.outerHTML='<span>${initials}</span>'">`:`<span>${initials}</span>`;
  q('#'+side+'Name').textContent=`${t.name} ${t.season}`;
  /* FIX 2026-09: allineata alla schermata di selezione squadra di
     Carriera/Coppe (che mostra OVR grande + lista MODULI accanto allo
     stemma) - prima qui in Amichevole si vedevano solo stemma e nome,
     schermata piu' povera e visivamente diversa dalle altre. Stesse
     classi CSS (.s9-picker-label/-ovr/-formations) gia' usate li',
     cosi' l'aspetto e' identico senza bisogno di nuovo CSS. */
  const ratingEl=q('#'+side+'Rating');
  /* FIX 2026-09: aggiunto anche qui il pentagono delle forze (stesse
     funzioni teamPentagon/pentagonSVG del picker base), richiesto da un
     tester come idea PES - prima Amichevole mostrava solo OVR+moduli. */
  const pentagon=(typeof teamPentagon==='function'&&typeof pentagonSVG==='function'&&t.players)?pentagonSVG(teamPentagon(t)):'';
  if(ratingEl)ratingEl.innerHTML=`<div class="s9-picker-label">OVR</div><div class="s9-picker-ovr">${t.strength}</div>${pentagon}<div class="s9-picker-label">MODULI</div><div class="s9-picker-formations">${(t.formations||[]).join('<br>')}</div>`;
  /* FIX 2026-09: anteprime maglia (prima/seconda divisa), stessa idea gia'
     usata in Carriera/Coppe - prima qui in Amichevole non si vedevano. */
  const homeKitEl=q('#'+side+'KitHome'),awayKitEl=q('#'+side+'KitAway');
  if(homeKitEl)homeKitEl.src=kitPath(id,'home');
  if(awayKitEl)awayKitEl.src=kitPath(id,'away');
  const prevT=T(ids[(index-1+ids.length)%ids.length]),nextT=T(ids[(index+1)%ids.length]);
  q('#'+side+'PrevPreview').innerHTML=neighborCrest(prevT);
  q('#'+side+'NextPreview').innerHTML=neighborCrest(nextT);
 }
 function ensureDistinct(){if(ids.length>1&&ids[homeIndex]===ids[awayIndex])awayIndex=(awayIndex+1)%ids.length}
 function renderBothSides(){renderSide('home',homeIndex);renderSide('away',awayIndex);setStadium(teamMeta[ids[homeIndex]]?.stadium||stadiumList[stadiumIndex])}
 function homeStep(delta){homeIndex=(homeIndex+delta+ids.length)%ids.length;ensureDistinct();renderBothSides()}
 function awayStep(delta){awayIndex=(awayIndex+delta+ids.length)%ids.length;ensureDistinct();renderSide('away',awayIndex)}
 q('#homePrev').onclick=()=>homeStep(-1);q('#homeNext').onclick=()=>homeStep(1);
 q('#homePrevPreview').onclick=()=>homeStep(-1);q('#homeNextPreview').onclick=()=>homeStep(1);
 q('#awayPrev').onclick=()=>awayStep(-1);q('#awayNext').onclick=()=>awayStep(1);
 q('#awayPrevPreview').onclick=()=>awayStep(-1);q('#awayNextPreview').onclick=()=>awayStep(1);

 function refreshTeams(){
  ids=pool==='national'?S9V10.nationalIds:pool==='clubs'?S9V10.clubIds:[...S9V10.clubIds,...S9V10.nationalIds];
  if(!ids.length)return;
  homeIndex=Math.min(homeIndex,ids.length-1);awayIndex=Math.min(awayIndex,ids.length-1);
  ensureDistinct();renderBothSides();
 }
 const poolRow=q('#exhibitionPoolPills');
 poolRow.querySelectorAll('button').forEach(b=>{b.onclick=()=>{pool=b.dataset.pool;poolRow.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));refreshTeams()}});

 const competitionKeys=Object.keys(S9Competition.definitions).filter(k=>k!=='finaleight');
 const competitionLogos={friendly:'assets/logo/seriea9000_logo.png',seriea:'assets/league/serie_a_league.png',italia:'assets/competition_buttons/coppa_italia.png',cdc:'assets/competition_buttons/coppa_campioni.png',uefa:'assets/competition_buttons/uefa_cup.png',world:'assets/competition_buttons/francia98.png',euro:'assets/competition_buttons/euro2000.png',supercoppa:'assets/league/serie_a_league.png'};
 let competitionIndex=0;
 function competitionCard(key,side=false){
  const brand=S9Competition.definitions[key],logo=competitionLogos[key]||'assets/logo/seriea9000_logo.png';
  return `<img src="${logo}" alt=""><strong>${brand.name}</strong>${side?'':`<small>${key==='friendly'?'PARTITA LIBERA':key==='seriea'?'ATMOSFERA CAMPIONATO':key==='world'?'MONDIALE':key==='euro'?'NAZIONALI':'NOTTE DI COPPA'}</small>`}`;
 }
 function renderCompetitionCarousel(){
  const key=competitionKeys[competitionIndex],prev=competitionKeys[(competitionIndex-1+competitionKeys.length)%competitionKeys.length],next=competitionKeys[(competitionIndex+1)%competitionKeys.length];
  q('#exCompFeature').innerHTML=competitionCard(key,false);q('#exCompPrevCard').innerHTML=competitionCard(prev,true);q('#exCompNextCard').innerHTML=competitionCard(next,true);
  q('#exCompDots').innerHTML=competitionKeys.map((_,i)=>`<span class="${i===competitionIndex?'active':''}"></span>`).join('');
 }
 function selectCompetition(key){
  competition=key;screen.dataset.exhibitionCompetition=key;
  const ix=competitionKeys.indexOf(key);if(ix>=0)competitionIndex=ix;
  renderCompetitionCarousel();
  pool=['world','euro'].includes(key)?'national':key==='friendly'?'all':'clubs';
  poolRow.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.pool===pool));
  refreshTeams();
 }
 function competitionStep(delta){competitionIndex=(competitionIndex+delta+competitionKeys.length)%competitionKeys.length;selectCompetition(competitionKeys[competitionIndex])}
 q('#exCompPrev').onclick=()=>competitionStep(-1);q('#exCompNext').onclick=()=>competitionStep(1);
 q('#exCompPrevCard').onclick=()=>competitionStep(-1);q('#exCompNextCard').onclick=()=>competitionStep(1);
 q('#exCompFeature').onclick=()=>competitionStep(1);
 competition=competitionKeys[0];selectCompetition(competition);
 renderStadium();

 // v13 — sequenza a passi: 1 Competizione -> 2 Squadre -> 3 Stadio. I
 // puntini di avanzamento sono cliccabili solo per tornare indietro (non
 // si puo' saltare avanti senza passare dai passi precedenti).
 let step=1;
 const steps=q('#exhibitionForm').querySelectorAll('.s9-wizard-step'),dots=screen.querySelectorAll('.s9-wizard-dot');
 function showStep(n){
  step=Math.max(1,Math.min(3,n));
  steps.forEach(el=>el.classList.toggle('active',Number(el.dataset.step)===step));
  dots.forEach(el=>{const s=Number(el.dataset.step);el.classList.toggle('active',s===step);el.classList.toggle('done',s<step)});
  q('#wizBack').textContent=step===1?'← MENU':'◀ INDIETRO';
  q('#wizNext').style.display=step<3?'':'none';
  q('#exhibitionSubmit').style.display=step===3?'':'none';
  if(step===3)renderStadiumPreview();
 }
 q('#wizBack').onclick=()=>{if(step===1)show('mainMenu');else showStep(step-1)};
 q('#wizNext').onclick=()=>showStep(step+1);
 dots.forEach(d=>d.onclick=()=>{const target=Number(d.dataset.step);if(target<step)showStep(target)});

 // v13 — selezione casuale: competizione, squadre e stadio scelti a caso in
 // un colpo, e si va direttamente al passo 3 per vedere/confermare (o
 // ritoccare) prima di scendere in campo.
 q('#exhibitionRandom').onclick=()=>{
  const keys=Object.keys(S9Competition.definitions).filter(k=>k!=='finaleight');
  selectCompetition(keys[Math.floor(Math.random()*keys.length)]);
  if(ids.length){
   homeIndex=Math.floor(Math.random()*ids.length);
   awayIndex=Math.floor(Math.random()*ids.length);
   ensureDistinct();
   renderBothSides();
  }
  stadiumIndex=Math.floor(Math.random()*stadiumList.length);
  renderStadium();
  showStep(3);
 };

 showStep(1);
 button.onclick=()=>{q('#exhibitionError').textContent='';show('exhibitionSetup');showStep(1)};
 q('#exhibitionForm').onsubmit=e=>{e.preventDefault();if(step<3){showStep(step+1);return}try{start({home:ids[homeIndex],away:ids[awayIndex],competition,stadium:q('#exhibitionStadium').value,final:q('#exhibitionFinal').checked,spectator:q('#exhibitionSpectator').checked})}catch(error){q('#exhibitionError').textContent=error.message}};
}
// Spectator matches progress through the interval and both benches are automated.
let intervalMatch=null,intervalTimer=0;
setInterval(()=>{
 const context=S9V10.matchContext,m=current;if(!context?.spectator||!m?._running||m._finished)return;
 if((document.getElementById('halftime')?.classList.contains('active')||window.S9Match3D?.intermission)){
  if(intervalMatch!==m){intervalMatch=m;clearTimeout(intervalTimer);intervalTimer=setTimeout(()=>{if(current===m&&S9V10.matchContext?.spectator&&(document.getElementById('halftime')?.classList.contains('active')||window.S9Match3D?.intermission))document.getElementById('resumeSecond')?.click()},8000)}
  return;
 }
 if(paused||m.minute<55||S9Match3D.eventActive||S9Match3D.celebrating)return;
 for(const id of [m.h,m.a]){
  const st=career.teamStates[id];if(!st||st.subs>=3||m.minute<55+st.subs*12)continue;
  const starters=st.lineup.map(pid=>st.players.find(p=>p.id===pid)).filter(p=>p&&p.pos!=='GK').sort((a,b)=>(a.fitness??100)-(b.fitness??100));
  for(const out of starters){
   const incoming=st.players.filter(p=>!st.lineup.includes(p.id)&&roleGroup(p.pos)===roleGroup(out.pos)&&S9V10.canSubstitute(st,out.id,p.id,false)).sort((a,b)=>b.overall-a.overall)[0];
   if(!incoming)continue;
   S9V10.recordSubstitution(id,out.id,incoming.id,m.minute);st.lineup[st.lineup.indexOf(out.id)]=incoming.id;st.subs++;
   Object.keys(st.setPieces||{}).forEach(k=>{if(st.setPieces[k]===out.id)st.setPieces[k]=incoming.id});
   log(`${m.minute}' CAMBIO ${T(id).name} ${T(id).season}: ${out.name} ↓ ${incoming.name} ↑`);m._tacticsDirty=true;break;
  }
 }
},500);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
