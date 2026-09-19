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
   Le partite sono sempre "evento" (CPU contro CPU, come l'esibizione in
   modalita' spettatore) cosi' non serve scegliere una "propria" squadra fra
   le tre estratte a sorteggio. E' un torneo "usa e getta": non tocca
   carriera, classifiche o albo d'oro, esattamente come l'Amichevole.
*/
(function(){
'use strict';
const q=s=>document.querySelector(s);
let saved=null,state=null;

function teamPool(){return [...S9V10.clubIds,...S9V10.nationalIds]}

function randomTeams(){
 const pool=teamPool().slice().sort(()=>Math.random()-.5);
 return pool.slice(0,3);
}

function buildState(teams){
 const draw=teams.slice().sort(()=>Math.random()-.5);
 const [t1,t2,rest]=draw;
 return {
  teams,
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

function applyMatchResult(h,a,hg,ag){
 let winner,loser,shootout=null,pointsW=3,pointsL=0;
 if(hg===ag){
  const p=S9V10.penaltyShootout(h,a);
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
 const upcoming=!state.done&&state.nextMatch?`<div class="s9-trofeo-next"><div class="s9-picker-mini-label">PROSSIMA PARTITA · ${state.matchNum===3?'FINALE':'PARTITA '+state.matchNum}</div><div class="s9-trofeo-vs">${crest(state.nextMatch.h)} <b>${teamLabel(state.nextMatch.h)}</b> vs <b>${teamLabel(state.nextMatch.a)}</b> ${crest(state.nextMatch.a)}</div><button class="primary" id="trofeoPlayNext">SCENDI IN CAMPO ▶</button></div>`:'';
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
 q('#trofeoBack').onclick=()=>show('mainMenu');
}

function playNext(){
 if(!state||state.done||!state.nextMatch||current?._running||S9V10.matchContext)return;
 const {h,a}=state.nextMatch;
 saved={career,standalone:S9V10.standalone,savedCareer:S9V10.savedCareer};
 career=S9V10.createMatchCareer(h,state.teams);S9V10.standalone=null;
 career.fixtures=[[[h,a]]];career.otherFixtures=[[]];
 const stage=state.matchNum===3?'FINALE · TROFEO BIRRA MORETTI':'TROFEO BIRRA MORETTI · PARTITA '+state.matchNum;
 S9V10.matchContext={mode:'trofeo',spectator:true,stadium:teamMeta[h]?.stadium||'Stadio Comunale',match:{h,a,kind:'friendly',stage}};
 S9V10.applyCompetitionTheme('friendly');
 openPrematch([h,a]);q('#backSeason').textContent='← TROFEO';
 document.getElementById('match').classList.add('s9-spectator');
 renderKitScreen();show('kits');
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
 applyMatchResult(m.h,m.a,m.scoreH,m.scoreA);
}
function finish(){complete();restore()}
window.S9Trofeo={start,restore,finish,complete,get active(){return !!saved}};

function start(teams){
 state=buildState(teams);renderHub();show('trofeoHub');
}

function renderSetup(){
 const picks=randomTeams();
 const screen=q('#trofeoSetup');
 screen.querySelector('.panel').innerHTML=`
  <div class="s9-exhibition-kicker">TROFEO BIRRA MORETTI</div>
  <h1>Scegli le tre squadre</h1>
  <p class="s9-exhibition-note">Girone all'italiana fra tre squadre. 3 punti per vittoria diretta, 2 punti per vittoria ai rigori (1 alla sconfitta ai rigori), 0 punti per sconfitta diretta. Il sorteggio decide chi gioca la prima partita: la terza squadra riposa e sfida chi perde.</p>
  <div class="s9-trofeo-picks">
   <select id="trofeoTeam1"></select>
   <select id="trofeoTeam2"></select>
   <select id="trofeoTeam3"></select>
  </div>
  <div class="s9-exhibition-actions"><button type="button" id="trofeoSetupBack">← MENU</button><button type="button" id="trofeoRandom">🎲 CASUALE</button><button type="button" class="primary" id="trofeoStart">SORTEGGIO E INIZIO ▶</button></div>
  <div id="trofeoSetupError" role="alert"></div>
 `;
 const opts=teamPool().map(id=>`<option value="${id}">${teamLabel(id)}</option>`).join('');
 ['trofeoTeam1','trofeoTeam2','trofeoTeam3'].forEach((id,i)=>{const el=q('#'+id);el.innerHTML=opts;el.value=picks[i]});
 q('#trofeoSetupBack').onclick=()=>show('mainMenu');
 q('#trofeoRandom').onclick=()=>{const r=randomTeams();['trofeoTeam1','trofeoTeam2','trofeoTeam3'].forEach((id,i)=>q('#'+id).value=r[i])};
 q('#trofeoStart').onclick=()=>{
  const ids=['trofeoTeam1','trofeoTeam2','trofeoTeam3'].map(id=>q('#'+id).value);
  if(new Set(ids).size!==3){q('#trofeoSetupError').textContent='Scegli tre squadre diverse.';return}
  q('#trofeoSetupError').textContent='';
  start(ids);
 };
}

function boot(){
 const btn=document.createElement('button');btn.id='trofeoBirraBtn';btn.textContent='🍺 TROFEO BIRRA MORETTI';
 const menu=q('.menu-secondary');if(menu)menu.appendChild(btn);
 const setupScreen=document.createElement('section');setupScreen.id='trofeoSetup';setupScreen.className='screen';
 setupScreen.innerHTML='<div class="s9-exhibition-shell panel"></div>';
 document.querySelector('main').appendChild(setupScreen);
 const hubScreen=document.createElement('section');hubScreen.id='trofeoHub';hubScreen.className='screen';
 hubScreen.innerHTML='<div class="s9-exhibition-shell panel"></div>';
 document.querySelector('main').appendChild(hubScreen);
 btn.onclick=()=>{if(state&&!state.done){renderHub();show('trofeoHub')}else{renderSetup();show('trofeoSetup')}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
