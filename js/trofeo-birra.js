/* TROFEO BIRRA MORETTI — triangolare a 3 squadre, "girone all'italiana"
   con regolamento fornito dall'utente:
   - 3 punti per vittoria diretta, 0 per sconfitta diretta.
   - Ogni pareggio si decide ai rigori: 2 punti a chi vince, 1 punto a chi
     perde (l'utente non ha specificato i punti dello sconfitto ai rigori:
     si e' scelto lo standard 3/2/1/0 gia' usato altrove nel gioco).
   - Ordine partite: si estraggono le prime due squadre (match 1), la terza
     riposa; chi perde il match 1 gioca il match 2 contro chi ha riposato;
     il match 3 e' l'accoppiamento rimasto (chi ha vinto il match 1 contro
     chi ha riposato).
   FIX 2026-09 (47): "dev'essere giocabile, così è solo CPU" - la squadra
   scelta nello slot 1 ("LA TUA SQUADRA") è ora sotto il tuo controllo in
   ogni partita in cui gioca (formazione/tattica/cambi come in carriera);
   quando le altre due si sfidano fra loro resta CPU contro CPU, come prima.
   E' comunque un torneo "usa e getta": non tocca carriera, classifiche o
   albo d'oro, esattamente come l'Amichevole.
   FIX 2026-09 (48): "RIGORI IN MOVIMENTO" - la formula storica del vero
   Trofeo Birra Moretti (1997-2008) non usava i rigori classici dal dischetto
   ma un uno-contro-uno: il giocatore parte in conduzione da 30 metri e ha
   5 secondi per superare il portiere, 3 tentativi a testa e poi oltranza.
   Qui e' presentata come sequenza di eventi (stesso sistema di popup delle
   parate/gol a partita in corso), non come mini-gioco pilotabile: il
   risultato di ogni tentativo resta comunque deciso dalla forza delle
   squadre, come tutto il resto del motore di gioco.
   FIX 2026-09 (49): "è una richiesta esplicita" - le partite del Trofeo
   durano davvero 45' (due tempi da 22'30", vedi index.html: buildMatch
   riceve opts.toMin=45 e playHalf gioca 1-22/23-45 invece di 1-45/46-90
   quando S9V10.matchContext.mode==='trofeo'). Riordinato anche il pool di
   selezione squadre: prima le italiane di club 1998-2008, poi le estere,
   poi le nazionali, infine le altre italiane (non citate fra le priorita').
*/
(function(){
'use strict';
const q=s=>document.querySelector(s);
let saved=null,state=null;

// FIX 2026-09 (52): "la selezione delle squadre dev'essere circoscritta
// alle sole squadre italiane del periodo 97-2008, tutte le altre devono
// essere escluse" - il Trofeo Birra Moretti (modalita' COPPA) ora seleziona
// ESCLUSIVAMENTE club italiani 1997-2008: niente piu' estere/nazionali/altre
// italiane fuori periodo, a differenza dell'Amichevole che invece resta
// libera su tutto il roster (l'utente lo ha confermato esplicitamente:
// "essendo la modalita' giocabile anche in versione amichevole a quel punto
// si possono mettere tutte le altre ma nella modalita' coppa dev'essere
// esclusiva alle sole squadre italiane di quegli anni indicati").
function seasonStartYear(id){const s=T(id)?.season||'';const y=parseInt(s.slice(0,4),10);return Number.isFinite(y)?y:0}
function teamPool(){
 const italian=(S9V10.italianIds||[]).slice();
 return italian.filter(id=>{const y=seasonStartYear(id);return y>=1997&&y<=2008}).sort((a,b)=>seasonStartYear(a)-seasonStartYear(b)||T(a).name.localeCompare(T(b).name));
}

function randomTeams(){
 const pool=teamPool().slice().sort(()=>Math.random()-.5);
 return pool.slice(0,3);
}

function buildState(teams){
 const draw=teams.slice().sort(()=>Math.random()-.5);
 const [t1,t2,rest]=draw;
 return {
  teams,
  myTeam:teams[0],
  pts:Object.fromEntries(teams.map(t=>[t,0])),
  gf:Object.fromEntries(teams.map(t=>[t,0])),
  ga:Object.fromEntries(teams.map(t=>[t,0])),
  log:[],
  resting:rest,
  nextMatch:{h:t1,a:t2},
  matchNum:1,
  done:false,
  champion:null
 };
}

function applyMatchResult(h,a,hg,ag,decider){
 let winner,loser,shootout=null,pointsW=3,pointsL=0;
 if(hg===ag){
  const p=decider||S9V10.penaltyShootout(h,a);
  shootout=p;winner=p.winner;loser=winner===h?a:h;pointsW=2;pointsL=1;
 }else{
  winner=hg>ag?h:a;loser=winner===h?a:h;
 }
 state.pts[winner]+=pointsW;state.pts[loser]+=pointsL;
 state.gf[h]+=hg;state.ga[h]+=ag;state.gf[a]+=ag;state.ga[a]+=hg;
 state.log.push({h,a,hg,ag,shootout,winner,loser});
 if(state.matchNum===1){
  state.nextMatch={h:loser,a:state.resting};state.matchNum=2;
 }else if(state.matchNum===2){
  const pairs=[[state.teams[0],state.teams[1]],[state.teams[0],state.teams[2]],[state.teams[1],state.teams[2]]];
  const played=state.log.map(m=>[m.h,m.a].slice().sort().join('|'));
  const remaining=pairs.find(([x,y])=>!played.includes([x,y].slice().sort().join('|')));
  state.nextMatch={h:remaining[0],a:remaining[1]};state.matchNum=3;
 }else{
  state.done=true;state.nextMatch=null;
  const ranked=state.teams.slice().sort((x,y)=>state.pts[y]-state.pts[x]||(state.gf[y]-state.ga[y])-(state.gf[x]-state.ga[x])||state.gf[y]-state.gf[x]);
  state.champion=ranked[0];
 }
}

function crest(id){const src=CREST_ASSETS[id]||(typeof crestFor==='function'?crestFor(id):null);const initials=(T(id)?.name||'??').substring(0,2).toUpperCase();return src?`<img src="${src}" alt="" onerror="this.outerHTML='<span>${initials}</span>'">`:`<span>${initials}</span>`}
function teamLabel(id){const t=T(id);return t?`${t.name} ${t.season}`:id}

function matchRowHTML(m,n){
 const shootoutNote=m.shootout?` <small>(rigori ${m.shootout.score})</small>`:'';
 return `<div class="card s9-trofeo-row"><b>Partita ${n}</b> — ${teamLabel(m.h)} ${m.hg} - ${m.ag} ${teamLabel(m.a)}${shootoutNote} <span class="muted">vince ${teamLabel(m.winner)}</span></div>`;
}

function renderHub(){
 const hub=q('#trofeoHub');if(!hub||!state)return;
 const standings=state.teams.slice().sort((x,y)=>state.pts[y]-state.pts[x]||(state.gf[y]-state.ga[y])-(state.gf[x]-state.ga[x]));
 const rows=standings.map((id,i)=>`<tr class="${state.done&&id===state.champion?'s9-trofeo-champ-row':''}"><td>${i+1}</td><td>${crest(id)} ${teamLabel(id)}</td><td><b>${state.pts[id]}</b></td><td>${state.gf[id]-state.ga[id]}</td><td>${state.gf[id]}</td><td>${state.ga[id]}</td></tr>`).join('');
 const played=state.log.map((m,i)=>matchRowHTML(m,i+1)).join('');
 const myMatch=state.nextMatch&&(state.nextMatch.h===state.myTeam||state.nextMatch.a===state.myTeam);
 const upcoming=!state.done&&state.nextMatch?`<div class="s9-trofeo-next"><div class="s9-picker-mini-label">PROSSIMA PARTITA · ${state.matchNum===3?'FINALE':'PARTITA '+state.matchNum}${myMatch?' · 🎮 GIOCHI TU':' · CPU vs CPU'}</div><div class="s9-trofeo-vs">${crest(state.nextMatch.h)} <b>${teamLabel(state.nextMatch.h)}</b> vs <b>${teamLabel(state.nextMatch.a)}</b> ${crest(state.nextMatch.a)}</div><button class="primary" id="trofeoPlayNext">${myMatch?'SCENDI IN CAMPO ▶':'SIMULA PARTITA ▶'}</button></div>`:'';
 const trophyBanner=state.done?`<div class="s9-trofeo-trophy"><img src="assets/competition_buttons/trofeo_birra_moretti.png" alt="Trofeo Birra Moretti"><div><div class="s9-trofeo-trophy-kicker">CAMPIONE DEL TRIANGOLARE</div><h2>${teamLabel(state.champion)}</h2></div></div><button class="primary" id="trofeoNew">NUOVO TRIANGOLARE ▶</button>`:'';
 hub.querySelector('.panel').innerHTML=`
  <div class="s9-exhibition-kicker">TROFEO BIRRA MORETTI</div>
  <h1>Triangolare all'italiana</h1>
  ${trophyBanner}
  ${upcoming}
  <table><tr><th>#</th><th>Squadra</th><th>Pt</th><th>DR</th><th>GF</th><th>GS</th></tr>${rows}</table>
  <h3>Risultati</h3>
  ${played||'<p class="muted">Nessuna partita ancora giocata.</p>'}
  <div class="s9-exhibition-actions"><button type="button" id="trofeoBack">← MENU</button></div>
 `;
 if(q('#trofeoPlayNext'))q('#trofeoPlayNext').onclick=playNext;
 if(q('#trofeoNew'))q('#trofeoNew').onclick=()=>{state=null;show('trofeoSetup');renderSetup()};
 q('#trofeoBack').onclick=()=>show('cupsMenu');
}

function playNext(){
 if(!state||state.done||!state.nextMatch||current?._running||S9V10.matchContext)return;
 const {h,a}=state.nextMatch;
 // FIX 2026-09 (47): la squadra dello slot 1 e' sotto il tuo controllo in
 // ogni partita in cui gioca - le altre due, quando si sfidano fra loro,
 // restano CPU contro CPU come prima (nessuna "tua squadra" in campo).
 const myMatch=h===state.myTeam||a===state.myTeam;
 const userTeam=myMatch?state.myTeam:h;
 saved={career,standalone:S9V10.standalone,savedCareer:S9V10.savedCareer};
 career=S9V10.createMatchCareer(userTeam,state.teams);S9V10.standalone=null;
 career.fixtures=[[[h,a]]];career.otherFixtures=[[]];
 const stage=state.matchNum===3?'FINALE · TROFEO BIRRA MORETTI':'TROFEO BIRRA MORETTI · PARTITA '+state.matchNum;
 S9V10.matchContext={mode:'trofeo',spectator:!myMatch,stadium:teamMeta[h]?.stadium||'Stadio Comunale',state:{key:'trofeo'},match:{h,a,kind:'friendly',stage}};
 S9V10.applyCompetitionTheme('friendly');
 openPrematch([h,a]);q('#backSeason').textContent='← TROFEO';
 document.getElementById('match').classList.toggle('s9-spectator',!myMatch);
 if(!myMatch){renderKitScreen();show('kits')}
}

function restore(){
 if(!saved)return;
 if(current?._running&&!current._finished)return;
 document.getElementById('match').classList.remove('s9-spectator');
 const original=saved;saved=null;career=original.career;S9V10.standalone=original.standalone;S9V10.savedCareer=original.savedCareer;S9V10.matchContext=null;current=null;paused=false;
 S9V10.applyCompetitionTheme('');
 renderHub();show('trofeoHub');
}
function complete(){
 const ctx=S9V10.matchContext,m=current;
 if(ctx?.mode!=='trofeo'||!m?._finished||m._trofeoRecorded||!state)return;
 m._trofeoRecorded=true;
 applyMatchResult(m.h,m.a,m.scoreH,m.scoreA,m.decider);
}
function finish(){complete();restore()}
function openFromCups(){if(state&&!state.done){renderHub();show('trofeoHub')}else{renderSetup();show('trofeoSetup')}}

// FIX 2026-09 (48): "RIGORI IN MOVIMENTO" - vedi nota in testa al file.
// Sequenza di eventi (stile parate/gol a partita in corso) che simula il vero
// formato storico del Trofeo Birra Moretti: 1 contro 1 in conduzione da 30
// metri, 5 secondi per superare il portiere, 3 tentativi a testa e poi
// oltranza (solo l'ultima edizione reale uso' i rigori classici dal dischetto
// - qui restiamo fedeli alla versione "in movimento", la piu' rappresentativa
// del torneo). L'esito di ogni tentativo e' comunque deciso dalla forza delle
// due squadre (T(id).strength), non da un input del giocatore.
function attemptChance(shooterId,keeperId){
 const s=T(shooterId)?.strength??70,k=T(keeperId)?.strength??70;
 const base=.62;
 const skew=(s-k)/260;
 return Math.max(.32,Math.min(.86,base+skew));
}
async function runMovingShootout(h,a){
 const order=[h,a];
 const scored={[h]:0,[a]:0};
 const attempts={[h]:0,[a]:0};
 let round=0,sudden=false;
 while(true){
  const isRegular=round<3;
  if(!isRegular)sudden=true;
  for(const shooter of order){
   if(!isRegular){
    // oltranza: si ferma appena una squadra ha segnato e l'altra no dopo
    // lo stesso numero di tentativi in questo turno di oltranza
   }
   const other=shooter===h?a:h;
   attempts[shooter]++;
   const scoredIt=Math.random()<attemptChance(shooter,other);
   if(scoredIt)scored[shooter]++;
   const teamName=T(shooter)?.name||shooter;
   await ov(S9Popups.html(scoredIt?'goal':'save',{
    kicker:'RIGORI IN MOVIMENTO',
    title:scoredIt?'GOL!':'PARATA!',
    player:teamName,
    detail:scoredIt?'Conduzione da 30 metri, supera il portiere in uno contro uno.':'Conduzione da 30 metri, il portiere gli chiude lo specchio.',
    footer:`${teamName} ${scored[shooter]} — tentativo ${attempts[shooter]}`
   }),1300);
   if(sudden&&shooter===order[1]){
    if(scored[h]!==scored[a]){
     const winner=scored[h]>scored[a]?h:a;
     const score=`${scored[h]}-${scored[a]}`;
     await ov(S9Popups.html('penalties',{kicker:'RIGORI IN MOVIMENTO',title:'DECISIVO!',detail:`${T(winner)?.name||winner} vince la sfida a oltranza ${score}.`}),1600);
     return {winner,score};
    }
   }
  }
  if(isRegular){
   round++;
   if(round===3){
    if(scored[h]!==scored[a]){
     const winner=scored[h]>scored[a]?h:a;
     const score=`${scored[h]}-${scored[a]}`;
     await ov(S9Popups.html('penalties',{kicker:'RIGORI IN MOVIMENTO',title:'FINITA!',detail:`${T(winner)?.name||winner} vince ${score} dopo tre tentativi a testa.`}),1600);
     return {winner,score};
    }
   }
  }
 }
}
async function finishPlayedTie(){
 const ctx=S9V10.matchContext,m=current;
 if(ctx?.mode!=='trofeo'||!m||m.scoreH!==m.scoreA||m.decider||!state)return;
 await ov(S9Popups.html('penalties',{
  kicker:'TROFEO BIRRA MORETTI',
  title:'RIGORI IN MOVIMENTO',
  detail:'Pareggio dopo i 45 minuti: si decide in conduzione da 30 metri, 5 secondi per battere il portiere, 3 tentativi a testa poi oltranza.'
 }),1800);
 const result=await runMovingShootout(m.h,m.a);
 m.decider=result;
 if(Array.isArray(m.keyEvents))m.keyEvents.push({type:'penalties',team:result.winner,detail:`Rigori in movimento ${result.score}`});
}
window.S9Trofeo={start,restore,finish,complete,openFromCups,finishPlayedTie,get active(){return !!saved}};

function start(teams){
 state=buildState(teams);renderHub();show('trofeoHub');
}

function slotHTML(slot,label,mine){
 return `<div class="s9-trofeo-slot${mine?' s9-trofeo-slot-mine':''}">
  <div class="s9-trofeo-slot-label">${label}</div>
  <div class="s9-trofeo-slot-art">
   <button type="button" class="s9-trofeo-arrow" data-slot="${slot}" data-dir="-1" aria-label="Squadra precedente">◀</button>
   <div class="s9-trofeo-slot-crest" id="trofeoCrest${slot}"></div>
   <button type="button" class="s9-trofeo-arrow" data-slot="${slot}" data-dir="1" aria-label="Squadra successiva">▶</button>
  </div>
  <div class="s9-trofeo-slot-name" id="trofeoName${slot}"></div>
  <div class="s9-trofeo-slot-ovr" id="trofeoOvr${slot}"></div>
 </div>`;
}
function renderSetup(){
 const pool=teamPool();
 const initial=randomTeams();
 let idx=initial.map(id=>pool.indexOf(id));
 const screen=q('#trofeoSetup');
 screen.querySelector('.panel').innerHTML=`
  <div class="s9-exhibition-kicker">TROFEO BIRRA MORETTI</div>
  <h1>Scegli le tre squadre</h1>
  <p class="s9-exhibition-note">Girone all'italiana fra tre squadre. 3 punti per vittoria diretta, 2 punti per vittoria ai rigori (1 alla sconfitta ai rigori), 0 punti per sconfitta diretta. Il sorteggio decide chi gioca la prima partita: la terza squadra riposa e sfida chi perde. La tua squadra (slot 1) è sotto il tuo controllo in ogni partita in cui gioca; quando le altre due si sfidano resta CPU contro CPU.</p>
  <div class="s9-trofeo-picks">
   ${slotHTML(0,'LA TUA SQUADRA',true)}
   ${slotHTML(1,'CPU',false)}
   ${slotHTML(2,'CPU',false)}
  </div>
  <div class="s9-exhibition-actions"><button type="button" id="trofeoSetupBack">← MENU</button><button type="button" id="trofeoRandom">🎲 CASUALE</button><button type="button" class="primary" id="trofeoStart">SORTEGGIO E INIZIO ▶</button></div>
  <div id="trofeoSetupError" role="alert"></div>
 `;
 function ensureDistinct(slot){
  let guard=0;
  while(idx.some((v,i)=>i!==slot&&v===idx[slot])&&guard<pool.length){idx[slot]=(idx[slot]+1)%pool.length;guard++}
 }
 function renderSlot(slot){
  const id=pool[idx[slot]];
  q('#trofeoCrest'+slot).innerHTML=crest(id);
  q('#trofeoName'+slot).textContent=teamLabel(id);
  q('#trofeoOvr'+slot).textContent='OVR '+(T(id)?.strength??'—');
 }
 function renderAll(){[0,1,2].forEach(renderSlot)}
 screen.querySelectorAll('.s9-trofeo-arrow').forEach(btn=>{
  btn.onclick=()=>{
   const slot=+btn.dataset.slot,dir=+btn.dataset.dir;
   idx[slot]=(idx[slot]+dir+pool.length)%pool.length;ensureDistinct(slot);renderAll();
  };
 });
 q('#trofeoSetupBack').onclick=()=>show('cupsMenu');
 q('#trofeoRandom').onclick=()=>{const r=randomTeams();idx=r.map(id=>pool.indexOf(id));renderAll()};
 q('#trofeoStart').onclick=()=>{
  const ids=idx.map(i=>pool[i]);
  if(new Set(ids).size!==3){q('#trofeoSetupError').textContent='Scegli tre squadre diverse.';return}
  q('#trofeoSetupError').textContent='';
  start(ids);
 };
 renderAll();
}

// FIX 2026-09 (46): "il trofeo birra moretti dovrebbe stare nella sezione
// coppe" - niente piu' bottone proprio nel menu principale: l'ingresso ora
// e' una card del carosello Coppe e Tornei (vedi rebuildCupsMenu in
// v10-release.js), che chiama S9Trofeo.openFromCups(). Qui restano solo le
// due schermate (setup squadre + hub torneo) da iniettare nel DOM.
function boot(){
 const setupScreen=document.createElement('section');setupScreen.id='trofeoSetup';setupScreen.className='screen';
 setupScreen.innerHTML='<div class="s9-exhibition-shell panel"></div>';
 document.querySelector('main').appendChild(setupScreen);
 const hubScreen=document.createElement('section');hubScreen.id='trofeoHub';hubScreen.className='screen';
 hubScreen.innerHTML='<div class="s9-exhibition-shell panel"></div>';
 document.querySelector('main').appendChild(hubScreen);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
