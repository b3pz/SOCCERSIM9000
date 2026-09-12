/* SerieA 9000 SIM — V10 FINAL
   Competitions: Final Eight, Coppa Italia, Coppa dei Campioni, Coppa UEFA,
   World Cup (France 98 format), European Championship (Euro 2000 format).
   Standalone cups are separate from Career and support foreign/national teams.
*/
(function(){
'use strict';

const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const V10=window.S9V10={version:'10.0',matchContext:null,standalone:null,savedCareer:null,selectedCompetition:null,pickerIndex:0};
const V10_CUP_SAVE_KEY='S9_V10_STANDALONE_CUP';
function saveStandaloneState(){try{if(V10.standalone)localStorage.setItem(V10_CUP_SAVE_KEY,JSON.stringify({version:10,state:{...V10.standalone,teamStates:career?.teamStates,pstats:career?.pstats},ts:Date.now()}))}catch(e){}}
function readStandaloneState(){try{const x=JSON.parse(localStorage.getItem(V10_CUP_SAVE_KEY)||'null'),s=x?.state,f=s&&FORMATS[s.key];return f&&Array.isArray(s.participants)&&s.participants.length===f.participants&&new Set(s.participants).size===f.participants&&s.participants.every(id=>T(id))&&s.participants.includes(s.user)?normalizeTournament(s):null}catch(e){return null}}
function clearStandaloneState(){try{localStorage.removeItem(V10_CUP_SAVE_KEY)}catch(e){}}
async function persistCareerV10(){try{if(career?.careerId&&window.S9Save){await S9Save.putCareer(career,{careerId:career.careerId});await S9Save.backupCareer(career)}}catch(e){console.warn('V10 save:',e)}}
V10.italianIds=teams.map(t=>t.id); // snapshot BEFORE foreign/national additions
V10.foreignIds=(window.V10_FOREIGN_TEAMS||[]).map(t=>t.id);
V10.nationalIds=(window.V10_NATIONAL_TEAMS||[]).map(t=>t.id);
V10.clubIds=[...V10.italianIds,...V10.foreignIds];

function addMissing(list){for(const t of list||[]){if(!teams.some(x=>x.id===t.id))teams.push(t)}}
addMissing(window.V10_FOREIGN_TEAMS);addMissing(window.V10_NATIONAL_TEAMS);

function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function sample(a,n){return shuffle(a).slice(0,n)}
function teamLabel(id){const t=T(id);return t?`${t.name} ${t.season}`:id}
function isNational(id){return V10.nationalIds.includes(id)}
function isForeign(id){return V10.foreignIds.includes(id)}
function crestFor(id){return isNational(id)?`assets/crests/national/${id}.png`:isForeign(id)?`assets/crests/foreign/${id}.png`:`assets/crests/italian/${id}.png`}
function kitFor(id,kind){return isNational(id)?`assets/kits/national/${kind}/${id}.png`:isForeign(id)?`assets/kits/foreign/${kind}/${id}.png`:`assets/kits/italian/${kind}/${id}.png`}
function fmtScore(r){return `${r.hg}–${r.ag}`}

/* National/foreign visual integration. */
try{
 const oldKit=kitPath;
 kitPath=function(teamId,kind){return isNational(teamId)?kitFor(teamId,kind):oldKit(teamId,kind)};
}catch(e){}
try{
 const oldColors=getTeamColors;
 getTeamColors=function(id){const t=T(id);if(t?.primary)return[t.primary,t.secondary||'#fff'];return oldColors(id)};
}catch(e){}

/* Every external club/national must have a game-ready state when needed. */
function ensureTeamStates(ids, targetCareer=career){
 if(!targetCareer)return;
 targetCareer.teamStates=targetCareer.teamStates||{};
 for(const id of ids){const t=T(id);if(t&&!targetCareer.teamStates[id])targetCareer.teamStates[id]=initTeamState(t)}
}

/* ------------------------------------------------------------------
   MATCH SIM / TIE RESOLUTION
------------------------------------------------------------------ */
function sim90(h,a){
 ensureTeamStates([h,a]);
 const H=T(h),A=T(a),hs=career?.teamStates?.[h]?lineupPower(h):H?.strength||80,as=career?.teamStates?.[a]?lineupPower(a):A?.strength||80;
 const hp=Math.max(.25,1.15+(hs-as)/20+.18),ap=Math.max(.22,1.00+(as-hs)/20);
 const result={h,a,hg:Math.min(6,poisson(hp)),ag:Math.min(6,poisson(ap)),note:''};
 if(V10.simulateCondition)V10.simulateCondition(h,a);return result;
}
function penaltyShootout(a,b){
 const sa=T(a)?.strength||80,sb=T(b)?.strength||80;
 let pa=3+rand(0,2),pb=3+rand(0,2);
 while(pa===pb){if(Math.random()<sa/(sa+sb))pa++;else pb++}
 return {winner:pa>pb?a:b,score:`${pa}-${pb} d.c.r.`};
}
function goldenOrPens(a,b){
 const sa=T(a)?.strength||80,sb=T(b)?.strength||80;
 if(Math.random()<.62){const w=Math.random()<sa/(sa+sb)?a:b;return {winner:w,note:`GOLDEN GOAL · ${teamLabel(w)}`}}
 const p=penaltyShootout(a,b);return {winner:p.winner,note:`RIGORI ${p.score}`};
}
function resolveSingle(tie,res,directPens=false){
 tie.legs=[res];
 if(res.decider){tie.winner=res.decider.winner;tie.loser=tie.winner===tie.a?tie.b:tie.a;tie.note=res.decider.note;return}
 if(res.hg>res.ag){tie.winner=tie.a;tie.loser=tie.b}
 else if(res.ag>res.hg){tie.winner=tie.b;tie.loser=tie.a}
 else if(directPens){const p=penaltyShootout(tie.a,tie.b);tie.winner=p.winner;tie.loser=p.winner===tie.a?tie.b:tie.a;tie.note=`RIGORI ${p.score}`}
 else{const x=goldenOrPens(tie.a,tie.b);tie.winner=x.winner;tie.loser=x.winner===tie.a?tie.b:tie.a;tie.note=x.note;if(x.note.startsWith('GOLDEN GOAL')){if(x.winner===res.h)res.hg++;else res.ag++}}
}
function resolveTwoLeg(tie,awayGoals){
 const [l1,l2]=tie.legs;if(!l1||!l2)return;
 if(l2.decider){tie.winner=l2.decider.winner;tie.loser=tie.winner===tie.a?tie.b:tie.a;tie.note=l2.decider.note;tie.aggregate=`${l1.hg+l2.ag}-${l1.ag+l2.hg}`;return}
 const aAgg=l1.hg+l2.ag,bAgg=l1.ag+l2.hg;
 tie.aggregate=`${aAgg}-${bAgg}`;
 if(aAgg>bAgg){tie.winner=tie.a;tie.loser=tie.b;return}
 if(bAgg>aAgg){tie.winner=tie.b;tie.loser=tie.a;return}
 if(awayGoals){
   const aAway=l2.ag,bAway=l1.ag;
   if(aAway>bAway){tie.winner=tie.a;tie.loser=tie.b;tie.note='GOL IN TRASFERTA';return}
   if(bAway>aAway){tie.winner=tie.b;tie.loser=tie.a;tie.note='GOL IN TRASFERTA';return}
 }
 const x=goldenOrPens(tie.a,tie.b);tie.winner=x.winner;tie.loser=x.winner===tie.a?tie.b:tie.a;tie.note=x.note;if(x.note.startsWith('GOLDEN GOAL')){if(x.winner===l2.h)l2.hg++;else l2.ag++;tie.aggregate=`${l1.hg+l2.ag}-${l1.ag+l2.hg}`;}
}

/* ------------------------------------------------------------------
   GROUPS
------------------------------------------------------------------ */
function blankStanding(id){return {id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}}
function applyGroupResult(state,r){
 if(state.results.some(x=>x.group===r.group&&x.h===r.h&&x.a===r.a))return;
 const H=state.groupStats[r.group][r.h],A=state.groupStats[r.group][r.a];
 H.p++;A.p++;H.gf+=r.hg;H.ga+=r.ag;A.gf+=r.ag;A.ga+=r.hg;
 if(r.hg>r.ag){H.w++;A.l++;H.pts+=3}else if(r.hg<r.ag){A.w++;H.l++;A.pts+=3}else{H.d++;A.d++;H.pts++;A.pts++}
 state.results.push(r);
}
function standings(state,g){return Object.values(state.groupStats[g]).sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf)}
function groupFixtures(ids,doubleRound){
 const out=[];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
   if(Math.random()<.5)out.push([ids[i],ids[j]]);else out.push([ids[j],ids[i]]);
   if(doubleRound){const [h,a]=out[out.length-1];out.push([a,h])}
 }return out;
}
function createGroupPhase(state,groupsCount,doubleRound){
 const shuffled=shuffle(state.participants),groups=[];state.groupStats={};state.results=[];state.userFixtures=[];
 for(let i=0;i<groupsCount;i++){const g=String.fromCharCode(65+i),ids=shuffled.slice(i*4,i*4+4);groups.push({name:g,teams:ids});state.groupStats[g]={};ids.forEach(id=>state.groupStats[g][id]=blankStanding(id));
   for(const [h,a] of groupFixtures(ids,doubleRound)){
     if(h===state.user||a===state.user)state.userFixtures.push({h,a,group:g,stage:`GIRONE ${g}`});
     else{const r=sim90(h,a);r.group=g;r.stage=`GIRONE ${g}`;applyGroupResult(state,r)}
   }
 }
 state.groups=groups;state.phase='GROUPS';state.groupMatchIndex=0;
}
function finishGroups(state){
 const q=[];for(const g of state.groups){const s=standings(state,g.name);q.push({g:g.name,first:s[0].id,second:s[1].id})}
 let pairs=[];
 if(q.length===4)pairs=[[q[0].first,q[1].second],[q[2].first,q[3].second],[q[1].first,q[0].second],[q[3].first,q[2].second]];
 else if(q.length===8)pairs=[[q[0].first,q[1].second],[q[2].first,q[3].second],[q[4].first,q[5].second],[q[6].first,q[7].second],[q[1].first,q[0].second],[q[3].first,q[2].second],[q[5].first,q[4].second],[q[7].first,q[6].second]];
 state.qualifiers=q;createRoundFromPairs(state,state.format.afterGroups,pairs);
}

/* ------------------------------------------------------------------
   KNOCKOUT
------------------------------------------------------------------ */
const FORMATS={
 italia:{key:'italia',name:'COPPA ITALIA',participants:32,groups:0,rounds:{R32:{two:false,directPens:true,next:'R16'},R16:{two:false,directPens:true,next:'QF'},QF:{two:false,directPens:true,next:'SF'},SF:{two:true,away:false,next:'FINAL'},FINAL:{two:false,directPens:false,next:null}}},
 cdc:{key:'cdc',name:'COPPA DEI CAMPIONI',participants:16,groups:4,double:true,afterGroups:'QF',rounds:{QF:{two:true,away:true,next:'SF'},SF:{two:true,away:true,next:'FINAL'},FINAL:{two:false,directPens:false,next:null}}},
 uefa:{key:'uefa',name:'COPPA UEFA',participants:16,groups:4,double:true,afterGroups:'QF',rounds:{QF:{two:true,away:true,next:'SF'},SF:{two:true,away:true,next:'FINAL'},FINAL:{two:false,directPens:false,next:null}}},
 world:{key:'world',name:'COPPA DEL MONDO',participants:32,groups:8,double:false,afterGroups:'R16',rounds:{R16:{two:false,directPens:false,next:'QF'},QF:{two:false,directPens:false,next:'SF'},SF:{two:false,directPens:false,next:'FINAL'},FINAL:{two:false,directPens:false,next:null}}},
 euro:{key:'euro',name:'EUROPEO',participants:16,groups:4,double:false,afterGroups:'QF',rounds:{QF:{two:false,directPens:false,next:'SF'},SF:{two:false,directPens:false,next:'FINAL'},FINAL:{two:false,directPens:false,next:null}}},
 finaleight:{key:'finaleight',name:'FINAL EIGHT · SCUDETTO',participants:8,groups:0,rounds:{QF:{two:false,directPens:false,next:'SF'},SF:{two:false,directPens:false,next:'FINAL'},FINAL:{two:false,directPens:false,next:null}}}
};
function stageLabel(s){return ({R32:'SEDICESIMI',R16:'OTTAVI',QF:'QUARTI',SF:'SEMIFINALI',FINAL:'FINALE',GROUPS:'GIRONI'})[s]||s}
function createRoundFromPairs(state,stage,pairs){
 state.phase=stage;state.roundHistory=state.roundHistory||{};state.eliminated=state.eliminated||{};
 const rule=state.format.rounds[stage];
 state.ties=pairs.map((p,i)=>({id:`${stage}_${i}`,stage,a:p[0],b:p[1],twoLeg:!!rule.two,awayGoals:!!rule.away,directPens:!!rule.directPens,legs:[],winner:null,loser:null,note:''}));
 state.roundHistory[stage]=state.ties;
 simulateCpuTies(state);
}
function createRound(state,stage,ids){const sh=shuffle(ids),pairs=[];for(let i=0;i<sh.length;i+=2)pairs.push([sh[i],sh[i+1]]);createRoundFromPairs(state,stage,pairs)}
function simulateTie(tie){
 if(tie.twoLeg){const r1=sim90(tie.a,tie.b),r2=sim90(tie.b,tie.a);tie.legs=[r1,r2];resolveTwoLeg(tie,tie.awayGoals)}
 else resolveSingle(tie,sim90(tie.a,tie.b),tie.directPens);
}
function simulateCpuTies(state){for(const tie of state.ties){if(tie.a!==state.user&&tie.b!==state.user)simulateTie(tie)}checkRoundComplete(state)}
function recordEliminations(state){for(const t of state.ties)if(t.loser)state.eliminated[t.loser]=state.phase}
function checkRoundComplete(state){
 if(!state.ties?.length||!state.ties.every(t=>t.winner))return false;
 recordEliminations(state);const winners=state.ties.map(t=>t.winner),rule=state.format.rounds[state.phase];
 if(!rule.next){state.champion=winners[0];state.runnerUp=state.ties[0].loser;state.completed=true;state.phase='DONE';if(state.format.key==='finaleight')buildFinalEightRanking(state);return true}
 createRoundFromPairs(state,rule.next,winners.reduce((pairs,id,i)=>{if(i%2===0)pairs.push([id,winners[i+1]]);return pairs},[]));return true;
}
function nextUserTournamentMatch(state){
 if(state.completed)return null;
 if(state.phase==='GROUPS'){
   const f=state.userFixtures[state.groupMatchIndex];return f?{...f,kind:'group'}:null;
 }
 const tie=state.ties?.find(t=>!t.winner&&(t.a===state.user||t.b===state.user));if(!tie)return null;
 if(tie.twoLeg){if(tie.legs.length===0)return{h:tie.a,a:tie.b,kind:'knockout',tie,leg:1,stage:stageLabel(state.phase)};if(tie.legs.length===1)return{h:tie.b,a:tie.a,kind:'knockout',tie,leg:2,stage:stageLabel(state.phase)}}
 else if(tie.legs.length===0)return{h:tie.a,a:tie.b,kind:'knockout',tie,leg:1,stage:stageLabel(state.phase)};
 return null;
}
function processTournamentResult(state,match,res){
 if(match.processed||state.completed)return;match.processed=true;state.played=playedCupMatches(state)+1;
 res.stage=match.stage;
 if(match.kind==='group'){
   res.group=match.group;applyGroupResult(state,res);state.groupMatchIndex++;
   if(state.groupMatchIndex>=state.userFixtures.length)finishGroups(state);
   return;
 }
 const tie=match.tie;tie.legs.push(res);
 if(tie.twoLeg){if(tie.legs.length===2)resolveTwoLeg(tie,tie.awayGoals)}else resolveSingle(tie,res,tie.directPens);
 if(tie.winner){state.eliminated[tie.loser]=state.phase;if(tie.winner!==state.user&&tie.loser===state.user){simulateTournamentToEnd(state);return}}
 checkRoundComplete(state);
}
function simulateTournamentToEnd(state){
 let guard=0;
 while(!state.completed&&guard++<20){
   if(state.phase==='GROUPS'){
     for(let i=state.groupMatchIndex;i<state.userFixtures.length;i++){const f=state.userFixtures[i],r=sim90(f.h,f.a);r.group=f.group;applyGroupResult(state,r)}state.groupMatchIndex=state.userFixtures.length;finishGroups(state);
   }else{
     for(const tie of state.ties)if(!tie.winner)simulateTie(tie);
     checkRoundComplete(state);
   }
 }
}
function buildFinalEightRanking(state){
 const final=state.roundHistory.FINAL?.[0],semis=state.roundHistory.SF||[],qfs=state.roundHistory.QF||[];
 const semiLosers=semis.map(t=>t.loser).filter(Boolean).sort((a,b)=>(T(b)?.strength||0)-(T(a)?.strength||0));
 const qfLosers=qfs.map(t=>t.loser).filter(Boolean).sort((a,b)=>(T(b)?.strength||0)-(T(a)?.strength||0));
 state.ranking=[state.champion,final?.loser,...semiLosers,...qfLosers].filter(Boolean);
}

/* ------------------------------------------------------------------
   TOURNAMENT CREATION
------------------------------------------------------------------ */
function createTournament(key,participants,user,opts={}){
 const format=FORMATS[key];
 if(!format||participants.length!==format.participants||new Set(participants).size!==participants.length||participants.some(id=>!T(id)))throw new Error('Partecipanti non validi');
 if((key==='world'||key==='euro')&&new Set(participants.map(id=>T(id).country)).size!==participants.length)throw new Error('Paese duplicato');
 const state={id:`${key}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,key,name:format.name,format,user,participants:[...participants],phase:null,completed:false,champion:null,results:[],roundHistory:{},eliminated:{},careerMode:!!opts.careerMode};
 if(format.groups)createGroupPhase(state,format.groups,format.double);
 else if(opts.initialPairs)createRoundFromPairs(state,opts.startStage||'QF',opts.initialPairs);
 else createRound(state,key==='italia'?'R32':opts.startStage||'QF',participants);
 if(!user)simulateTournamentToEnd(state);
 return state;
}
function uniqueNationalSelection(pool,user,n){
 const userT=T(user);if(!userT)return [];const used=new Set([userT.country]),out=[user];
 for(const id of shuffle(pool.filter(x=>x!==user))){const t=T(id);if(!t||used.has(t.country))continue;used.add(t.country);out.push(id);if(out.length>=n)break}
 return out;
}
function standaloneParticipants(key,user){
 if(key==='italia')return [...V10.italianIds];
 if(key==='cdc'||key==='uefa'){
   if(V10.italianIds.includes(user))return shuffle([user,...sample(V10.italianIds.filter(x=>x!==user),3),...sample(V10.foreignIds,12)]);
   return shuffle([...sample(V10.italianIds,4),user,...sample(V10.foreignIds.filter(x=>x!==user),11)]);
 }
 if(key==='world')return shuffle(uniqueNationalSelection(V10.nationalIds,user,32));
 if(key==='euro')return shuffle(uniqueNationalSelection(V10.nationalIds.filter(id=>T(id)?.confed==='UEFA'),user,16));
 return [];
}

/* ------------------------------------------------------------------
   STANDALONE CAREER CONTEXT + MATCH HANDOFF
------------------------------------------------------------------ */
function makeStandaloneCareer(user,participants){
 const c={manager:'COPPE STANDALONE',user,round:0,fixtures:[],otherFixtures:[[]],stats:initStats(),pstats:initPlayerStats(),teamStates:{},results:[],groups:{A:[],B:[]},europe:{cdc:{winner:'V10',history:[]},uefa:{winner:'V10',history:[]}}};
 ensureTeamStates(participants,c);return c;
}
function tempPrepareCareerMatch(h,a,meta){
 const standalone=meta.mode==='standalone';
 if(!standalone){
   V10.matchContext.saved={fixtures:career.fixtures,otherFixtures:career.otherFixtures,round:career.round,stats:career.stats,results:career.results,pstats:career.pstats,europe:career.europe,groups:career.groups,userGroup:career.userGroup,otherGroup:career.otherGroup};
 }
 ensureTeamStates([h,a],career);
 career.fixtures=[[[h,a]]];career.otherFixtures=[[]];career.round=0;career.stats=initStats();career.results=[];career.pstats=initPlayerStats();career.europe={cdc:{winner:'V10',history:[]},uefa:{winner:'V10',history:[]}};
 if(!career.groups)career.groups={A:[],B:[]};
}
function restoreCareerAfterCup(){
 const s=V10.matchContext?.saved;if(!s)return;
 Object.assign(career,s);
}
function playTournamentFixture(state,match,mode){
 if(V10.matchContext||current?._running)return;
 V10.matchContext={state,match,mode,saved:null};tempPrepareCareerMatch(match.h,match.a,{mode});
 const back=q('#backSeason');if(back)back.textContent='← TORNEO';
 openPrematch([match.h,match.a]);
}
function cancelTournamentPrematch(){
 if(!V10.matchContext)return false;
 if(V10.matchContext.mode!=='standalone')restoreCareerAfterCup();
 const mode=V10.matchContext.mode;V10.matchContext=null;
 if(mode==='finaleight')show('v10FinalEight');else if(mode==='careerCup'){renderSeasonView('europe');show('season')}else show('v10Tournament');
 return true;
}

function normalizeTournament(state){
 state.format=FORMATS[state.key];state.name=state.format.name;state.results=state.results||[];state.roundHistory=state.roundHistory||{};state.eliminated=state.eliminated||{};
 if(state.ties&&state.phase!=='GROUPS'&&state.phase!=='DONE')state.roundHistory[state.phase]=state.ties;
 return state;
}
function normalizeCareer(c){
 if(!c)return c;
 if(!V10.italianIds.includes(c.user))throw new Error('Squadra della carriera non valida');
 c.seasonYear=Number(c.seasonYear)||1998;c.round=Math.max(0,Math.min(30,Number(c.round)||0));
 if(!c.groups){const own=[...new Set((c.fixtures?.[0]||[]).flat())];const rest=V10.italianIds.filter(id=>!own.includes(id));c.groups=own.length===16&&rest.length===16?{A:own,B:rest}:v4DrawGroups(V10.italianIds)}
 c.userGroup=c.groups.A.includes(c.user)?'A':'B';c.otherGroup=c.userGroup==='A'?'B':'A';
 c.fixtures=c.fixtures||fixtures(c.groups[c.userGroup]);c.otherFixtures=c.otherFixtures||fixtures(c.groups[c.otherGroup]);
 c.stats=Object.assign(initStats(),c.stats||{});for(const stat of Object.values(c.stats)){for(const key of ['p','w','d','l','gf','ga','pts'])if(!Number.isFinite(stat[key]))stat[key]=0;}c.pstats=Object.assign(initPlayerStats(),c.pstats||{});c.results=c.results||[];
 c.leagueDates=(c.leagueDates||v4SeasonSundays(c.seasonYear)).map(d=>new Date(d));
 c.calendar=(c.calendar||v4BuildCalendar(c.seasonYear)).map(e=>({...e,date:new Date(e.date)}));
 c.honours=c.honours||{};['scudetti','coppaItalia','cdc','uefa','world','euro'].forEach(k=>c.honours[k]=c.honours[k]||[]);
 c.europe=c.europe||legacyEuropeDummy();ensureTeamStates(V10.clubIds,c);
 Object.values(c.v10Cups||{}).forEach(normalizeTournament);if(c.v10FinalEight)normalizeTournament(c.v10FinalEight);
 return c;
}
V10.normalizeCareer=normalizeCareer;
V10.finishPlayedTie=async function(){
 const ctx=V10.matchContext,m=current;if(!ctx||ctx.match.kind!=='knockout'||m.decider)return;
 const tie=ctx.match.tie;let tied=m.scoreH===m.scoreA;
 if(tie.twoLeg){
   if(ctx.match.leg===1)return;
   const first=tie.legs[0];tied=first.hg+m.scoreA===first.ag+m.scoreH;
   if(tied&&tie.awayGoals&&m.scoreA!==first.ag)return;
 }
 if(!tied)return;
 let result;
 if(tie.directPens){const p=penaltyShootout(m.h,m.a);result={winner:p.winner,note:`RIGORI ${p.score}`}}
 else{
   log("90' SUPPLEMENTARI · GOLDEN GOAL");await ov('<h2>SUPPLEMENTARI · GOLDEN GOAL</h2>',1300);
   result=goldenOrPens(m.h,m.a);
   if(result.note.startsWith('GOLDEN GOAL')){
     m.minute=91+rand(0,29);if(result.winner===m.h)m.scoreH++;else m.scoreA++;updateScore();
   }else m.minute=120;
 }
 m.decider=result;m.keyEvents.push(result.note);log(result.note);await ov(`<h2>${result.note}</h2>`,1800);
};
V10.leaveContext=function(){
 if(V10.matchContext&&current?._finished)q('#returnSeason').onclick();
 else if(V10.matchContext)cancelTournamentPrematch();
 if(V10.standalone)leaveStandalone();
 current=null;
};

/* ------------------------------------------------------------------
   UI BUILD
------------------------------------------------------------------ */
function injectScreens(){
 if(q('#v10CupSetup'))return;
 const main=q('main');
 const html=`
 <section id="v10CupSetup" class="screen"><img class="v51-page-logo" src="assets/logo/seriea9000_logo.png" alt="SerieA 9000 SIM"><div class="s9-team-picker">
 <header class="s9-picker-heading" id="v10SetupTitle">COPPA</header>
 <section class="s9-picker-grid">
 <aside class="s9-picker-side"><div id="v10PickerDescription"></div><details class="s9-picker-details"><summary>FORMATO TORNEO</summary><div id="v10FormatInfo"></div></details></aside>
 <article class="s9-picker-center"><div class="s9-picker-name" id="v10PickerName"></div><div class="s9-picker-year" id="v10PickerSeason"></div><div class="s9-picker-art"><button class="s9-picker-arrow" id="v10PrevTeam" aria-label="Squadra precedente">◀</button><div class="s9-picker-crest"><img id="v10PickerCrest" alt="Stemma"></div><button class="s9-picker-arrow" id="v10NextTeam" aria-label="Squadra successiva">▶</button></div><div class="s9-picker-kits"><figure><img id="v10PickerHome" alt="Divisa HOME"><figcaption>HOME</figcaption></figure><figure><img id="v10PickerAway" alt="Divisa AWAY"><figcaption>AWAY</figcaption></figure></div></article>
 <aside class="s9-picker-side s9-picker-rating"><div id="v10PickerRating"></div><details class="s9-picker-details"><summary>SQUADRE DISPONIBILI</summary><div id="v10TeamList" class="v10-team-list"></div></details></aside>
 </section><footer class="s9-picker-actions"><button id="v10CupSetupBack">◀ COPPE</button><button class="primary" id="v10CreateCup">SORTEGGIA TORNEO ▶</button></footer></div></section>
 <section id="v10Tournament" class="screen"><img class="v51-page-logo" src="assets/logo/seriea9000_logo.png" alt="SerieA 9000 SIM"><div class="v10-tournament-shell"><div class="v10-competition-head"><div class="v10-userclub" id="v10UserTeam"></div><div class="v10-title" id="v10TournamentTitle"></div><div class="v10-stage" id="v10TournamentStage"></div></div><div class="v10-tabs"><button data-v10tab="overview" class="active">PROSSIMA</button><button data-v10tab="groups">GIRONI</button><button data-v10tab="bracket">TABELLONE</button><button data-v10tab="results">RISULTATI</button></div><div id="v10TournamentContent"></div><div class="v10-actions"><button id="v10TournamentExit">◀ MENU COPPE</button><button class="primary" id="v10PlayNext">PREPARA PARTITA ▶</button></div></div></section>
 <section id="v10FinalEight" class="screen"><img class="v51-page-logo" src="assets/logo/seriea9000_logo.png" alt="SerieA 9000 SIM"><div class="v10-tournament-shell"><div class="v10-competition-head"><div class="v10-userclub">FASE FINALE CAMPIONATO</div><div class="v10-title">FINAL EIGHT · SCUDETTO</div><div class="v10-stage" id="v10FEStage"></div></div><div class="v10-tabs"><button data-fetab="overview" class="active">PROSSIMA</button><button data-fetab="bracket">TABELLONE</button><button data-fetab="ranking">CLASSIFICA FINALE</button></div><div id="v10FEContent"></div><div class="v10-actions"><button id="v10FEBack">◀ STAGIONE</button><button class="primary" id="v10FEPlay">GIOCA ▶</button></div></div></section>
 <section id="v10Trophy" class="screen"><img class="v51-page-logo" src="assets/logo/seriea9000_logo.png" alt="SerieA 9000 SIM"><div class="v10-shell"><div class="v10-champion"><div class="v10-title" id="v10TrophyTitle">CAMPIONE</div><img id="v10TrophyCrest" alt=""><div class="v10-champion-name" id="v10TrophyName"></div><div id="v10TrophyNote"></div><div class="v10-actions"><button class="primary" id="v10TrophyContinue">CONTINUA ▶</button></div></div></div></section>`;
 main.insertAdjacentHTML('beforeend',html);
}
function rebuildCupsMenu(){
 const shell=q('#cupsMenu .cups-shell');if(!shell)return;
 shell.innerHTML=`<div class="v10-title">MODALITÀ COPPE · STANDALONE</div><div class="v10-subtitle">Tornei indipendenti dalla Carriera. Ogni nuova partita genera un sorteggio differente.</div><div class="v10-cup-grid">
 ${[['italia','🏆','COPPA ITALIA','32 italiane · eliminazione diretta'],['cdc','★','COPPA DEI CAMPIONI','16 club · gironi + A/R'],['uefa','◆','COPPA UEFA','16 club · gironi + A/R'],['world','◉','COPPA DEL MONDO','Francia 98 · 32 nazionali'],['euro','✦','EUROPEO','Euro 2000 · 16 nazionali']].map(x=>`<button class="v10-cup-btn" data-v10cup="${x[0]}"><span class="v10-cup-icon">${x[1]}</span><span class="v10-cup-name">${x[2]}</span><span class="v10-cup-desc">${x[3]}</span></button>`).join('')}</div><div class="v10-actions"><button id="cupsBack">◀ MENU PRINCIPALE</button></div>`;
 const saved=readStandaloneState();
 if(saved){const actions=shell.querySelector('.v10-actions');actions.insertAdjacentHTML('afterbegin',`<button class="primary" id="v10ContinueCup">CONTINUA ${saved.name||'COPPA'} ▶</button>`);q('#v10ContinueCup').onclick=continueStandalone;}
 q('#cupsBack').onclick=()=>show('mainMenu');qa('[data-v10cup]').forEach(b=>b.onclick=()=>openCupSetup(b.dataset.v10cup));
}
function formatInfo(key){
 const m={
  italia:'32 italiane. Sedicesimi, Ottavi e Quarti a gara secca con rigori diretti in caso di parità. Semifinali A/R; parità complessiva → supplementari Golden Goal → rigori. Finale secca con Golden Goal e rigori.',
  cdc:'16 squadre: 4 italiane + 12 straniere. 4 gironi da 4 A/R, prime 2 ai Quarti. Quarti e Semifinali A/R con regola dei gol in trasferta. Finale secca. Supplementari Golden Goal e rigori.',
  uefa:'16 squadre: 4 italiane + 12 straniere. 4 gironi da 4 A/R, prime 2 ai Quarti. Quarti e Semifinali A/R con regola dei gol in trasferta. Finale secca. Supplementari Golden Goal e rigori.',
  world:'Formato Francia 1998: 32 nazionali, 8 gironi da 4, prime 2 agli Ottavi. Eliminazione diretta a gara secca. Supplementari con Golden Goal, poi rigori.',
  euro:'Formato Euro 2000: 16 nazionali, 4 gironi da 4, prime 2 ai Quarti. Eliminazione diretta a gara secca. Supplementari con Golden Goal, poi rigori.'};return m[key]
}
function pickerPool(key){if(key==='italia')return V10.italianIds;if(key==='cdc'||key==='uefa')return [...V10.italianIds,...V10.foreignIds];if(key==='world')return V10.nationalIds;if(key==='euro')return V10.nationalIds.filter(id=>T(id)?.confed==='UEFA');return[]}
function openCupSetup(key){
 V10.selectedCompetition=key;V10.pickerPool=pickerPool(key);V10.pickerIndex=0;
 q('#v10CupSetup').classList.toggle('v10-world',key==='world');q('#v10CupSetup').classList.toggle('v10-euro-nations',key==='euro');
 q('#v10SetupTitle').textContent=FORMATS[key].name;q('#v10FormatInfo').textContent=formatInfo(key);renderCupPicker();show('v10CupSetup');
}
function pickerDescription(t){
 const m=teamMeta[t.id]||{};
 return `<div class="s9-picker-label">${isNational(t.id)?'NAZIONALE':'CLUB STORICO'}</div><p>${escapeHTML(t.name)} · ${escapeHTML(t.season)}</p><dl><dt>${isNational(t.id)?'NAZIONE':'CITTÀ'}</dt><dd>${escapeHTML(isNational(t.id)?t.name:m.city||t.country||'Italia')}</dd><dt>STADIO</dt><dd>${escapeHTML(m.stadium||'Stadio storico')}</dd><dt>ALLENATORE</dt><dd>${escapeHTML(t.coach||'—')}</dd></dl>`;
}
function pickerRating(t){return `<div class="s9-picker-label">OVR</div><div class="s9-picker-ovr">${t.strength}</div><div class="s9-picker-label">MODULI</div><div class="s9-picker-formations">${t.formations.map(escapeHTML).join('<br>')}</div>`}
function renderCupPicker(){
 const id=V10.pickerPool[V10.pickerIndex],t=T(id);if(!t)return;
 q('#v10PickerDescription').innerHTML=pickerDescription(t);q('#v10PickerRating').innerHTML=pickerRating(t);
 q('#v10PickerCrest').src=crestFor(id);q('#v10PickerName').textContent=t.name;q('#v10PickerSeason').textContent=t.season;q('#v10PickerHome').src=kitFor(id,'home');q('#v10PickerAway').src=kitFor(id,'away');
 const box=q('#v10TeamList');box.innerHTML=V10.pickerPool.map((x,i)=>`<button class="${i===V10.pickerIndex?'active':''}" data-pick="${i}">${teamLabel(x)}</button>`).join('');qa('[data-pick]').forEach(b=>b.onclick=()=>{V10.pickerIndex=+b.dataset.pick;renderCupPicker()});
}
function beginStandalone(){
 const key=V10.selectedCompetition,user=V10.pickerPool[V10.pickerIndex],participants=standaloneParticipants(key,user);
 if(participants.length<FORMATS[key].participants)return alert('Pool squadre insufficiente per questo torneo.');
 V10.savedCareer=career;career=makeStandaloneCareer(user,participants);V10.standalone=createTournament(key,participants,user);V10.activeTab='overview';saveStandaloneState();renderTournament();show('v10Tournament');
}
function leaveStandalone(){saveStandaloneState();career=V10.savedCareer;V10.savedCareer=null;V10.standalone=null;V10.matchContext=null;rebuildCupsMenu();show('cupsMenu')}
function continueStandalone(){const state=readStandaloneState();if(!state)return;V10.savedCareer=career;career=makeStandaloneCareer(state.user,state.participants);if(state.teamStates)career.teamStates=state.teamStates;if(state.pstats)career.pstats=state.pstats;V10.standalone=state;V10.selectedCompetition=state.key;V10.activeTab='overview';ensureTeamStates(state.participants,career);renderTournament();show('v10Tournament')}

/* ------------------------------------------------------------------
   TOURNAMENT RENDERING
------------------------------------------------------------------ */
function renderGroups(state){
 if(!state.groups)return`<div class="v10-empty">Questa competizione non prevede una fase a gironi.</div>`;
 return `<div class="v10-groups-grid">${state.groups.map(g=>{const rows=standings(state,g.name);return`<div class="v10-group"><h3>GIRONE ${g.name}</h3><table><tr><th>#</th><th>Squadra</th><th>Pt</th><th>G</th><th>DR</th></tr>${rows.map((r,i)=>`<tr class="${r.id===state.user?'user ':''}${i<2?'qual':''}"><td>${i+1}</td><td>${teamLabel(r.id)}</td><td><b>${r.pts}</b></td><td>${r.p}</td><td>${r.gf-r.ga}</td></tr>`).join('')}</table></div>`}).join('')}</div>`;
}
function renderTie(tie,state){
 const legs=tie.legs.map((r,i)=>`<div class="v10-scoreline"><span>${teamLabel(r.h)}</span><b>${fmtScore(r)}</b><span>${teamLabel(r.a)}</span></div>`).join('');
 return `<div class="v10-tie ${(tie.a===state.user||tie.b===state.user)?'user':''}"><div><b>${teamLabel(tie.a)}</b> vs <b>${teamLabel(tie.b)}</b></div>${legs||'<div class="muted">Da giocare</div>'}${tie.aggregate?`<div>Totale: <b>${tie.aggregate}</b></div>`:''}${tie.note?`<div class="v10-pens">${tie.note}</div>`:''}${tie.winner?`<div class="v10-win">→ ${teamLabel(tie.winner)}</div>`:''}</div>`;
}
function renderBracket(state){
 const stages=['R32','R16','QF','SF','FINAL'].filter(s=>state.roundHistory?.[s]);if(!stages.length)return`<div class="v10-empty">Il tabellone apparirà al termine dei gironi.</div>`;
 return `<div class="v10-bracket">${stages.map(s=>`<div class="v10-round"><h3>${stageLabel(s)}</h3>${state.roundHistory[s].map(t=>renderTie(t,state)).join('')}</div>`).join('')}</div>`;
}
function renderResults(state){
 const arr=[];
 for(const r of state.results||[])arr.push(`<div class="v10-log-row">${r.stage||('Girone '+r.group)} · ${teamLabel(r.h)} <b>${r.hg}-${r.ag}</b> ${teamLabel(r.a)}</div>`);
 for(const s of ['R32','R16','QF','SF','FINAL'])for(const t of state.roundHistory?.[s]||[])for(const r of t.legs||[])arr.push(`<div class="v10-log-row">${stageLabel(s)} · ${teamLabel(r.h)} <b>${r.hg}-${r.ag}</b> ${teamLabel(r.a)} ${t.note?`· ${t.note}`:''}</div>`);
 return `<div class="v10-log">${arr.length?arr.reverse().join(''):'<div class="v10-empty">Nessun risultato.</div>'}</div>`;
}
function nextCard(state){
 if(state.completed)return championHTML(state);
 const m=nextUserTournamentMatch(state);if(!m)return`<div class="v10-empty">La tua squadra non ha un incontro da disputare. Il torneo viene completato dalla simulazione.</div>`;
 return `<div class="v10-next-card"><div class="v10-next-team"><img src="${crestFor(m.h)}"><span>${teamLabel(m.h)}</span></div><div class="v10-vs">VS</div><div class="v10-next-team away"><img src="${crestFor(m.a)}"><span>${teamLabel(m.a)}</span></div></div><div style="text-align:center;color:#e8dfca">${m.stage}${m.tie?.twoLeg?` · ${m.leg}ª GARA`:''}</div>`;
}
function championHTML(state){return`<div class="v10-champion"><img src="${crestFor(state.champion)}"><div class="v10-champion-name">${teamLabel(state.champion)}</div><div>${state.name} · CAMPIONE</div></div>`}
function renderTournament(tab=V10.activeTab||'overview'){
 const s=V10.standalone;if(!s)return;V10.activeTab=tab;q('#v10TournamentTitle').textContent=s.name;q('#v10TournamentStage').textContent=s.completed?'CONCLUSA':stageLabel(s.phase);q('#v10UserTeam').textContent=`TU: ${teamLabel(s.user)}`;
 qa('[data-v10tab]').forEach(b=>b.classList.toggle('active',b.dataset.v10tab===tab));const c=q('#v10TournamentContent');c.innerHTML=tab==='groups'?renderGroups(s):tab==='bracket'?renderBracket(s):tab==='results'?renderResults(s):nextCard(s);
 const m=nextUserTournamentMatch(s),play=q('#v10PlayNext');play.style.display=s.completed?'none':'';play.disabled=!m;play.textContent=m?`PREPARA ${m.stage} ▶`:'NESSUNA PARTITA';
}
function playStandaloneNext(){const s=V10.standalone,m=nextUserTournamentMatch(s);if(m)playTournamentFixture(s,m,'standalone')}

/* ------------------------------------------------------------------
   CAREER: CREATE + CUP COMPETITIONS
------------------------------------------------------------------ */
function legacyEuropeDummy(){return{cdc:{winner:'V10',history:[]},uefa:{winner:'V10',history:[]}}}
function createEuropeParticipants(italians,key){return shuffle([...italians,...sample(V10.foreignIds,12)])}
function initCareerCups(c,qualified=null){
 const user=c.user;
 c.v10Cups={};
 c.v10Cups.italia=createTournament('italia',V10.italianIds,user,{careerMode:true});
 let cdcIt,uefaIt;
 if(qualified?.cdc?.length===4&&qualified?.uefa?.length===4){cdcIt=[...qualified.cdc];uefaIt=[...qualified.uefa]}
 else{
   const pool=sample(V10.italianIds.filter(x=>x!==user),8);cdcIt=pool.slice(0,4);uefaIt=pool.slice(4,8);
 }
 c.v10Cups.cdc=createTournament('cdc',createEuropeParticipants(cdcIt,'cdc'),cdcIt.includes(user)?user:null,{careerMode:true});
 c.v10Cups.uefa=createTournament('uefa',createEuropeParticipants(uefaIt,'uefa'),uefaIt.includes(user)?user:null,{careerMode:true});
 c.v10Cups.cdc.italianParticipants=cdcIt;c.v10Cups.uefa.italianParticipants=uefaIt;syncCupCalendar(c);
}
function createCareerV10(){
 const name=q('#managerName').value.trim()||'Manager',team=q('#managerTeam').value;const groups=v4DrawGroups(V10.italianIds),ug=groups.A.includes(team)?'A':'B',og=ug==='A'?'B':'A';
 career={manager:name,user:team,round:0,seasonYear:1998,groups,userGroup:ug,otherGroup:og,fixtures:fixtures(groups[ug]),otherFixtures:fixtures(groups[og]),stats:initStats(),pstats:initPlayerStats(),teamStates:{},results:[],leagueDates:v4SeasonSundays(1998),calendar:v4BuildCalendar(1998),honours:{scudetti:[],coppaItalia:[],cdc:[],uefa:[],world:[],euro:[]},qualified:null,europe:legacyEuropeDummy(),v10FinalEight:null};
 ensureTeamStates(V10.clubIds,career);initCareerCups(career,null);renderSeason();show('season');
}
const CUP_SLOTS={italia:[2,6,10,15,19,27],cdc:[1,3,5,7,9,11,16,18,21,23,28],uefa:[1,3,5,7,9,11,16,18,21,23,28]};
function playedCupMatches(s){return Number.isFinite(s.played)?s.played:(s.results||[]).filter(r=>r.h===s.user||r.a===s.user).length+Object.values(s.roundHistory||{}).flat().flatMap(t=>t.legs||[]).filter(r=>r.h===s.user||r.a===s.user).length}
function cupSlot(s){return CUP_SLOTS[s.key]?.[playedCupMatches(s)]??30}
function cupDate(s){const d=new Date(career.leagueDates[Math.max(0,cupSlot(s)-1)]);d.setDate(d.getDate()+3);return d}
function dueCareerCup(){
 if(!career||V10.standalone||V10.matchContext)return null;
 return Object.values(career.v10Cups||{}).filter(s=>!s.completed&&s.user===career.user&&nextUserTournamentMatch(s)&&cupSlot(s)<=career.round).sort((a,b)=>cupSlot(a)-cupSlot(b))[0]||null;
}
V10.dueCareerCup=dueCareerCup;
function syncCupCalendar(c){
 if(!c.v10Cups)return;
 c.honours=c.honours||{};for(const s of Object.values(c.v10Cups)){const key=s.key==='italia'?'coppaItalia':s.key;c.honours[key]=c.honours[key]||[];if(s.completed&&!c.honours[key].some(h=>h.year===c.seasonYear))c.honours[key].push({year:c.seasonYear,team:s.champion})}
 c.calendar=v4BuildCalendar(c.seasonYear);
 for(const s of Object.values(c.v10Cups)){
   if(s.user!==c.user)continue;
   for(const [i,slot]of CUP_SLOTS[s.key].entries()){
     const d=new Date(c.leagueDates[slot-1]);d.setDate(d.getDate()+3);
     const event=c.calendar.find(e=>e.type==='MERCOLEDÌ'&&e.round===slot-1);
     if(event)event.label=`${s.name} · Gara ${i+1}${i<playedCupMatches(s)?' · disputata':s.completed?' · eliminata/conclusa':''}`;
   }
 }
}
function careerCupSummary(state){
 const userIn=state.participants.includes(career.user),m=userIn?nextUserTournamentMatch(state):null;
 return `<div class="euro-card"><h3>${state.name}</h3><div class="euro-stage">${state.completed?'CONCLUSA':stageLabel(state.phase)}</div>${state.completed?`<h2>🏆 ${teamLabel(state.champion)}</h2>`:userIn?(m?`<div class="euro-match">Prossima: ${teamLabel(m.h)} vs ${teamLabel(m.a)}</div><button class="primary" data-careercup="${state.key}" ${cupSlot(state)>career.round?'disabled':''}>${v4FmtDate(cupDate(state))} · GIOCA PROSSIMA ▶</button>`:`<div class="euro-match">In attesa del turno successivo.</div>`):`<div class="euro-match">La tua squadra non partecipa. Competizione simulata.</div>`}<details><summary>Tabellone / risultati</summary>${state.groups?renderGroups(state):''}${renderBracket(state)}</details></div>`;
}
function renderCareerCups(){
 const c=q('#seasonContent');if(!career.v10Cups)initCareerCups(career,career.qualified);
 c.innerHTML=`<h2>COPPE DELLA STAGIONE</h2><p>Coppa Italia sempre accessibile. Le coppe europee vengono assegnate dalla classifica finale della Final Eight della stagione precedente.</p><div class="europe-grid">${careerCupSummary(career.v10Cups.italia)}${careerCupSummary(career.v10Cups.cdc)}${careerCupSummary(career.v10Cups.uefa)}</div>`;
 qa('[data-careercup]').forEach(b=>b.onclick=()=>playCareerCup(b.dataset.careercup));
}
function playCareerCup(key){const s=career.v10Cups[key],m=nextUserTournamentMatch(s);if(cupSlot(s)>career.round)return;if(m)playTournamentFixture(s,m,'careerCup')}

/* ------------------------------------------------------------------
   CAREER FINAL EIGHT + NEW SEASON
------------------------------------------------------------------ */
function startFinalEight(){
 if(career.round<30)return;const due=dueCareerCup();if(due){playCareerCup(due.key);return}
 const A=v4Standings('A').slice(0,4).map(x=>x.t.id),B=v4Standings('B').slice(0,4).map(x=>x.t.id);
 const pairs=[[A[0],B[3]],[A[1],B[2]],[B[0],A[3]],[B[1],A[2]]],participants=[...A,...B];
 const user=participants.includes(career.user)?career.user:null;career.v10FinalEight=createTournament('finaleight',participants,user,{careerMode:true,initialPairs:pairs,startStage:'QF'});
 if(!user)simulateTournamentToEnd(career.v10FinalEight);finalizeFinalEightIfNeeded();persistCareerV10();renderFinalEight();show('v10FinalEight');
}
function renderFinalEight(tab=V10.feTab||'overview'){
 const s=career?.v10FinalEight;if(!s)return;V10.feTab=tab;q('#v10FEStage').textContent=s.completed?'CONCLUSA':stageLabel(s.phase);qa('[data-fetab]').forEach(b=>b.classList.toggle('active',b.dataset.fetab===tab));
 const c=q('#v10FEContent');
 if(tab==='bracket')c.innerHTML=renderBracket(s);else if(tab==='ranking')c.innerHTML=s.ranking?rankingHTML(s):'<div class="v10-empty">La classifica finale sarà disponibile al termine della Final Eight.</div>';else c.innerHTML=nextCard(s);
 const m=nextUserTournamentMatch(s),play=q('#v10FEPlay');play.style.display=s.completed?'none':'';play.disabled=!m;play.textContent=m?`GIOCA ${m.stage} ▶`:'SIMULAZIONE';
}
function rankingHTML(s){return`<table class="v10-ranking"><tr><th>#</th><th>Squadra</th><th>Europa</th></tr>${s.ranking.map((id,i)=>`<tr><td>${i+1}</td><td>${teamLabel(id)}</td><td>${i<4?'COPPA DEI CAMPIONI':'COPPA UEFA'}</td></tr>`).join('')}</table>`}
function playFinalEightNext(){const s=career.v10FinalEight,m=nextUserTournamentMatch(s);if(m)playTournamentFixture(s,m,'finaleight');else if(!s.completed){simulateTournamentToEnd(s);renderFinalEight()}}
function finalizeFinalEightIfNeeded(){
 normalizeCareer(career);
 const s=career.v10FinalEight;if(!s?.completed)return;
 if(!s.ranking)buildFinalEightRanking(s);career.qualified={cdc:s.ranking.slice(0,4),uefa:s.ranking.slice(4,8)};
 const yr=career.seasonYear;if(!career.honours.scudetti.some(x=>x.year===yr))career.honours.scudetti.push({year:yr,team:s.ranking[0]});
}
function advanceCareerSeasonV10(){
 finalizeFinalEightIfNeeded();const champ=career.v10FinalEight.ranking[0],nextYear=career.seasonYear+1,qualified=career.qualified,groups=v4DrawGroups(V10.italianIds,qualified);
 career.seasonYear=nextYear;career.groups=groups;career.userGroup=groups.A.includes(career.user)?'A':'B';career.otherGroup=career.userGroup==='A'?'B':'A';career.fixtures=fixtures(groups[career.userGroup]);career.otherFixtures=fixtures(groups[career.otherGroup]);career.round=0;career.stats=initStats();career.pstats=initPlayerStats();career.results=[];career.leagueDates=v4SeasonSundays(nextYear);career.calendar=v4BuildCalendar(nextYear);career.europe=legacyEuropeDummy();career.v10FinalEight=null;Object.values(career.teamStates||{}).forEach(st=>{st.subs=0;(st.players||[]).forEach(p=>{p.fitness=100;p.yellowStreak=0;p.injuryGames=Math.max(0,(p.injuryGames||0)-6)})});ensureTeamStates(V10.clubIds,career);initCareerCups(career,qualified);persistCareerV10();renderSeason();show('season');alert(`Nuova stagione ${nextYear}/${String(nextYear+1).slice(-2)}. Campione d'Italia: ${teamLabel(champ)}.`)
}

/* ------------------------------------------------------------------
   ARBITRO V10: fewer dismissals, variable profile.
------------------------------------------------------------------ */
try{
 const oldBuild=buildMatch;
 buildMatch=function(h,a){
   const m=oldBuild(h,a),r=Math.random(),profile=r<.28?'PERMISSIVO':r<.82?'NORMALE':'SEVERO';m.referee=profile;
   const keep=profile==='PERMISSIVO'?.48:profile==='NORMALE'?.67:.82,redChance=profile==='PERMISSIVO'?.006:profile==='NORMALE'?.018:.038;
   m.events=m.events.filter(e=>{if(e.type!=='yellow'&&e.type!=='red')return true;if(Math.random()>keep)return false;if(e.type==='red'&&Math.random()>redChance)e.type='yellow';return true});
   return m;
 };
}catch(e){}

/* ------------------------------------------------------------------
   PATCH EXISTING RENDERERS / MATCH RETURN
------------------------------------------------------------------ */
function installOverrides(){
 /* Career picker must remain strictly Italian even though V10 loads foreign/national teams. */
 try{
   const oldPicker=renderTeamPicker;
   renderTeamPicker=function(){selectedTeamIndex=((selectedTeamIndex%V10.italianIds.length)+V10.italianIds.length)%V10.italianIds.length;const out=oldPicker();const t=T(V10.italianIds[selectedTeamIndex]);q('#teamLeftInfo').innerHTML=pickerDescription(t);q('#teamRightInfo').innerHTML=pickerRating(t);q('#teamEmblem').innerHTML=`<img src="${crestFor(t.id)}" alt="Stemma ${escapeHTML(t.name)}">`;q('#teamHomeKit').src=kitFor(t.id,'home');q('#teamAwayKit').src=kitFor(t.id,'away');return out};
   q('#prevTeam').onclick=()=>{selectedTeamIndex=(selectedTeamIndex-1+V10.italianIds.length)%V10.italianIds.length;renderTeamPicker()};
   q('#nextTeam').onclick=()=>{selectedTeamIndex=(selectedTeamIndex+1)%V10.italianIds.length;renderTeamPicker()};
 }catch(e){}
 q('#createCareer').onclick=createCareerV10;
 const proto=q('.prototype-note');if(proto)proto.textContent='V10 FINAL · FINAL EIGHT · COPPE · NAZIONALI 1990–2010 · GOLDEN GOAL · b3pZ';
 const cupButton=q('#cupsModeBtn');if(cupButton){cupButton.querySelector('.small').textContent='CLUB + MONDIALE + EUROPEO · TORNEI STANDALONE';cupButton.onclick=()=>show('cupsMenu')}
 const euroBtn=q('[data-view="europe"]');if(euroBtn)euroBtn.textContent='Coppe';

 const oldSeason=renderSeason;renderSeason=function(){const out=oldSeason();const due=dueCareerCup();if(due){q('#seasonStatus').textContent=`${due.name} · ${v4FmtDate(cupDate(due))}`;q('#headerRight').textContent=v4FmtDate(cupDate(due))}return out};
 const oldRender=renderSeasonView;
 renderSeasonView=function(v){
   const seasonEl=q('#season');
   if(seasonEl){seasonEl.dataset.seasonView=v;seasonEl.classList.toggle('v51-calendar-bg',v==='calendar');seasonEl.classList.toggle('v51-europe-bg',v==='europe')}
   if(v==='calendar')syncCupCalendar(career);
   const due=v==='next'?dueCareerCup():null;
   if(due){const status=q('#seasonStatus');if(status)status.textContent=`${due.name} · ${v4FmtDate(cupDate(due))}`;q('#seasonContent').innerHTML=`<h2>${due.name}</h2><p>${v4FmtDate(cupDate(due))} · Impegno infrasettimanale</p>${nextCard(due)}<button class="primary" id="v10DueCup">PREPARA PARTITA ▶</button>`;q('#v10DueCup').onclick=()=>playCareerCup(due.key);return}
   if(v==='europe'){renderCareerCups();return}
   oldRender(v);
   if(v==='next'&&career?.round>=30){
     const c=q('#seasonContent');
     if(!career.v10FinalEight)c.innerHTML=`<h2>REGULAR SEASON TERMINATA</h2><p>Le prime 4 del Girone A e le prime 4 del Girone A2 accedono alla Final Eight. La classifica finale assegna Scudetto e qualificazioni europee.</p><button class="primary" id="v10StartFE">INIZIA FINAL EIGHT ▶</button>`;
     else if(career.v10FinalEight.completed){finalizeFinalEightIfNeeded();c.innerHTML=`<h2>FINAL EIGHT CONCLUSA</h2>${rankingHTML(career.v10FinalEight)}<button class="primary" id="v10AdvanceSeason">NUOVA STAGIONE ▶</button>`;q('#v10AdvanceSeason').onclick=advanceCareerSeasonV10}
     else c.innerHTML=`<h2>FINAL EIGHT IN CORSO</h2><button class="primary" id="v10OpenFE">APRI FINAL EIGHT ▶</button>`;
     if(q('#v10StartFE'))q('#v10StartFE').onclick=startFinalEight;if(q('#v10OpenFE'))q('#v10OpenFE').onclick=()=>{renderFinalEight();show('v10FinalEight')};
   }
 };
 try{window.renderSeasonView=renderSeasonView}catch(e){}

 const returnBtn=q('#returnSeason');
 returnBtn.onclick=()=>{
   if(!V10.matchContext){renderSeason();show('season');return}
   if(!current?._finished)return;
   const ctx=V10.matchContext,res={h:current.h,a:current.a,hg:current.scoreH,ag:current.scoreA,note:current.decider?.note||'',decider:current.decider};
   if(ctx.mode!=='standalone')restoreCareerAfterCup();
   processTournamentResult(ctx.state,ctx.match,res);V10.matchContext=null;current=null;
   if(ctx.mode==='standalone'){saveStandaloneState();renderTournament();show('v10Tournament')}
   else if(ctx.mode==='careerCup'){syncCupCalendar(career);persistCareerV10();renderSeason();renderSeasonView('europe');show('season')}
   else{finalizeFinalEightIfNeeded();persistCareerV10();renderFinalEight();show('v10FinalEight')}
 };
 q('#backSeason').onclick=()=>{if(!cancelTournamentPrematch())show('season')};
}

/* ------------------------------------------------------------------
   EVENTS
------------------------------------------------------------------ */
function bindV10(){
 q('#v10PrevTeam').onclick=()=>{V10.pickerIndex=(V10.pickerIndex-1+V10.pickerPool.length)%V10.pickerPool.length;renderCupPicker()};
 q('#v10NextTeam').onclick=()=>{V10.pickerIndex=(V10.pickerIndex+1)%V10.pickerPool.length;renderCupPicker()};
 q('#v10CupSetupBack').onclick=()=>show('cupsMenu');q('#v10CreateCup').onclick=beginStandalone;q('#v10TournamentExit').onclick=leaveStandalone;q('#v10PlayNext').onclick=playStandaloneNext;
 qa('[data-v10tab]').forEach(b=>b.onclick=()=>renderTournament(b.dataset.v10tab));
 qa('[data-fetab]').forEach(b=>b.onclick=()=>renderFinalEight(b.dataset.fetab));q('#v10FEPlay').onclick=playFinalEightNext;q('#v10FEBack').onclick=()=>{renderSeason();show('season')};
 q('#v10TrophyContinue').onclick=()=>show('mainMenu');
}

function init(){injectScreens();rebuildCupsMenu();installOverrides();bindV10();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();

})();

/* ==================================================================
   SerieA 9000 SIM — V10.3 PLAYER CONDITION / DISCIPLINE
   - persistent player fitness across career matches
   - live fatigue display in tactics
   - injuries with match-based recovery times
   - red card => one-match suspension
   - yellow card in 3 consecutive team matches => one-match suspension
   - unavailable players automatically removed from the XI
   ================================================================== */
(function(){
'use strict';

const S9=window.S9V10||{};
S9.version='10 FINAL';
window.S9V10=S9;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const $c=s=>document.querySelector(s);
const $$c=s=>Array.from(document.querySelectorAll(s));

function ensurePlayerState(p){
 if(!p)return p;
 if(!Number.isFinite(p.fitness))p.fitness=100;
 p.fitness=clamp(Math.round(p.fitness),20,100);
 if(!Number.isFinite(p.injuryGames))p.injuryGames=0;
 if(!Number.isFinite(p.suspensionGames))p.suspensionGames=0;
 if(!Number.isFinite(p.yellowStreak))p.yellowStreak=0;
 if(!Number.isFinite(p.matchesPlayedV103))p.matchesPlayedV103=0;
 p.injuryGames=clamp(Math.floor(p.injuryGames),0,20);p.suspensionGames=clamp(Math.floor(p.suspensionGames),0,10);p.yellowStreak=clamp(Math.floor(p.yellowStreak),0,2);
 return p;
}
function ensureTeamStateV103(id){
 const st=career?.teamStates?.[id];
 if(!st)return null;
 const defaults=(!Array.isArray(st.players)||!Array.isArray(st.lineup)||!st.setPieces||!st.formation||!st.mentality)?initTeamState(T(id)):st;
 if(!Array.isArray(st.players)||!st.players.length)st.players=defaults.players;
 if(!Array.isArray(st.lineup))st.lineup=defaults.lineup;
 st.setPieces={...defaults.setPieces,...st.setPieces};st.formation=st.formation||defaults.formation;st.mentality=st.mentality||defaults.mentality;
 st.players.forEach(ensurePlayerState);
 return st;
}
function ensureAllV103(){
 if(!career?.teamStates)return;
 Object.keys(career.teamStates).forEach(ensureTeamStateV103);
}
function unavailable(p){ensurePlayerState(p);return p.injuryGames>0||p.suspensionGames>0}
function statusText(p){
 ensurePlayerState(p);
 if(p.injuryGames>0)return `INFORTUNATO · ${p.injuryGames} ${p.injuryGames===1?'gara':'gare'}`;
 if(p.suspensionGames>0)return `SQUALIFICATO · ${p.suspensionGames} ${p.suspensionGames===1?'gara':'gare'}`;
 if(p.yellowStreak===2)return 'DIFFIDA · 2 gialli consecutivi';
 return 'DISPONIBILE';
}
function fitnessClass(v){return v<45?'v103-fit-critical':v<65?'v103-fit-low':v<80?'v103-fit-mid':'v103-fit-good'}
function playerPhysical(p){return Number.isFinite(p?.stats?.physical)?p.stats.physical:75}

function chooseReplacement(st,outPlayer,used){
 const pool=(st.players||[]).filter(p=>!used.has(p.id)&&!unavailable(p));
 if(!pool.length)return null;
 const target=typeof roleGroup==='function'?roleGroup(outPlayer?.pos):outPlayer?.pos;
 const same=pool.filter(p=>(typeof roleGroup==='function'?roleGroup(p.pos):p.pos)===target);
 return (same.length?same:pool).sort((a,b)=>(b.overall||0)-(a.overall||0))[0]||null;
}
function ensureAvailableLineup(id){
 const st=ensureTeamStateV103(id);if(!st)return [];
 st.lineup=Array.isArray(st.lineup)?st.lineup.slice(0,11):[];
 const used=new Set(st.lineup.filter(pid=>{const p=st.players.find(x=>x.id===pid);return p&&!unavailable(p)}));
 const next=[];
 for(const pid of st.lineup){
   const p=st.players.find(x=>x.id===pid);
   if(p&&!unavailable(p)&&!next.includes(pid)){next.push(pid);continue}
   const rep=chooseReplacement(st,p,used);
   if(rep){next.push(rep.id);used.add(rep.id)}
 }
 while(next.length<11){const rep=chooseReplacement(st,null,new Set(next));if(!rep)break;next.push(rep.id)}
 st.lineup=next.slice(0,11);
 if(st.setPieces){
   const fallback=st.lineup[8]||st.lineup[0];
   Object.keys(st.setPieces).forEach(k=>{if(!st.lineup.includes(st.setPieces[k]))st.setPieces[k]=fallback});
 }
 return st.lineup;
}

/* New careers / newly materialized foreign teams receive condition fields immediately. */
try{
 const oldInitTeamState=initTeamState;
 initTeamState=function(t){const st=oldInitTeamState(t);(st.players||[]).forEach(ensurePlayerState);return st};
}catch(e){console.warn('V10.3 initTeamState patch',e)}

/* Fitness now has a real effect on the strength used by the match engine. */
try{
 const oldLineupPower=lineupPower;
 lineupPower=function(id){
   const st=ensureTeamStateV103(id);if(!st)return oldLineupPower(id);
   const ids=st.lineup||[];
   const ps=ids.map(pid=>st.players.find(p=>p.id===pid)).filter(Boolean);
   const avgFit=ps.length?ps.reduce((s,p)=>s+(p.fitness||100),0)/ps.length:100;
   const factor=.82+.18*(avgFit/100);
   return oldLineupPower(id)*factor;
 };
}catch(e){console.warn('V10.3 lineupPower patch',e)}

function weightedInjuryPlayer(id){
 const st=ensureTeamStateV103(id);if(!st)return null;
 const ps=(st.lineup||[]).map(pid=>st.players.find(p=>p.id===pid)).filter(p=>p&&!unavailable(p));
 if(!ps.length)return null;
 const weighted=[];
 for(const p of ps){
   const weight=1+Math.max(0,82-p.fitness)/8+Math.max(0,78-playerPhysical(p))/14;
   const n=Math.max(1,Math.round(weight*2));for(let i=0;i<n;i++)weighted.push(p);
 }
 return weighted[Math.floor(Math.random()*weighted.length)]||ps[0];
}
function injuryProfile(){
 const r=Math.random();
 if(r<.38)return{games:1,label:'AFFATICAMENTO MUSCOLARE'};
 if(r<.66)return{games:2,label:'CONTRATTURA'};
 if(r<.84)return{games:3,label:'DISTORSIONE'};
 if(r<.96)return{games:4,label:'STIRAMENTO'};
 return{games:5+Math.floor(Math.random()*2),label:'LESIONE MUSCOLARE'};
}
function teamTrack(id){
 const st=ensureTeamStateV103(id);if(!st)return null;
 const initial=(st.lineup||[]).slice(0,11);
 const enteredAt={},startFitness={},preInjury={},preSuspension={};
 for(const p of st.players){
   ensurePlayerState(p);startFitness[p.id]=p.fitness;preInjury[p.id]=p.injuryGames;preSuspension[p.id]=p.suspensionGames;
 }
 initial.forEach(pid=>enteredAt[pid]=0);
 return{initialLineup:initial,enteredAt,exitedAt:{},startFitness,preInjury,preSuspension,yellows:{},reds:{},newInjuries:{}};
}
function avgTeamFitness(id){
 const st=ensureTeamStateV103(id);if(!st)return 100;
 const ps=(st.lineup||[]).map(pid=>st.players.find(p=>p.id===pid)).filter(Boolean);
 return ps.length?ps.reduce((s,p)=>s+p.fitness,0)/ps.length:100;
}

/* Add injury events and keep cards/fouls on players who are actually on the pitch. */
try{
 const oldBuildMatchV103=buildMatch;
 buildMatch=function(h,a){
   ensureAvailableLineup(h);ensureAvailableLineup(a);
   [h,a].forEach(id=>{career.teamStates[id].subs=0;career.teamStates[id].usedSubs=[]});
   const m=oldBuildMatchV103(h,a);
   m._v103={teams:{[h]:teamTrack(h),[a]:teamTrack(a)},finalized:false};
   for(const e of m.events||[]){
     if(!['yellow','red','foul'].includes(e.type))continue;
     const id=e.side==='home'?h:a,st=ensureTeamStateV103(id);
     if(!st)continue;
     if(!e.player||!st.lineup.includes(e.player.id))e.player=st.players.find(p=>p.id===st.lineup[Math.floor(Math.random()*st.lineup.length)])||e.player;
   }
   for(const [id,side] of [[h,'home'],[a,'away']]){
     const fit=avgTeamFitness(id);
     const risk=clamp(.065+Math.max(0,76-fit)*.0045,.055,.20);
     if(Math.random()<risk){
       const p=weightedInjuryPlayer(id);if(p){const inf=injuryProfile();m.events.push({min:20+Math.floor(Math.random()*66),type:'injury',side,player:p,recovery:inf.games,injuryLabel:inf.label})}
     }
   }
   m.events.sort((x,y)=>x.min-y.min);
   return m;
 };
}catch(e){console.warn('V10.3 buildMatch patch',e)}

function getTrackForPlayer(pid){
 if(!current?._v103?.teams)return null;
 for(const [tid,tr] of Object.entries(current._v103.teams))if(tr.startFitness&&Object.prototype.hasOwnProperty.call(tr.startFitness,pid))return{tid,tr};
 return null;
}
function minutesPlayed(pid,atMinute){
 const x=getTrackForPlayer(pid);if(!x)return 0;
 const start=x.tr.enteredAt[pid];if(start==null)return 0;
 const end=x.tr.exitedAt[pid]??atMinute??current?.minute??0;
 return clamp(end-start,0,120);
}
function liveFitness(p){
 ensurePlayerState(p);
 if(!current?._v103)return p.fitness;
 const x=getTrackForPlayer(p.id);if(!x)return p.fitness;
 if(x.tr.newInjuries[p.id])return Math.min(12,p.fitness);
 const mins=minutesPlayed(p.id,current.minute||0);
 const drainPer90=20+Math.max(0,78-playerPhysical(p))*.12;
 return clamp(Math.round((x.tr.startFitness[p.id]??p.fitness)-drainPer90*(mins/90)),8,100);
}

/* Track cards. Second yellow in the same match becomes a dismissal. */
try{
 const oldDoEventV103=doEvent;
 doEvent=async function(e){
   if(!current||current._finished||!e||e._processed)return;e._processed=true;
   while(paused)await wait(250);if(!current||current._finished)return;
   if(e.player&&current._v103){const tid=e.side==='home'?current.h:current.a,tr=current._v103.teams[tid],st=career.teamStates[tid];
     if(tr?.newInjuries[e.player.id]||tr?.reds[e.player.id]||tr?.exitedAt[e.player.id]!=null||!st.lineup.includes(e.player.id)){
       const pool=st.players.filter(p=>st.lineup.includes(p.id)&&!tr.reds[p.id]&&!tr.newInjuries[p.id]);if(!pool.length)return;e={...e,player:pick(pool)};
     }
     if(e.assist&&!st.lineup.includes(e.assist.id))e={...e,assist:null};
   }
   if(current?._v103&&e?.player){
     const tid=e.side==='home'?current.h:current.a,tr=current._v103.teams?.[tid];
     if(tr){
       if(e.type==='yellow'){
         if(tr.reds[e.player.id])return;
         tr.yellows[e.player.id]=(tr.yellows[e.player.id]||0)+1;
         if(tr.yellows[e.player.id]>=2){e={...e,type:'red',secondYellow:true};tr.reds[e.player.id]=true}
       }else if(e.type==='red'){
         if(tr.reds[e.player.id])return;
         tr.reds[e.player.id]=true;
       }
       if(e.type==='red'){tr.exitedAt[e.player.id]=e.min;const st=career.teamStates[tid];st.lineup=st.lineup.filter(id=>id!==e.player.id);Object.keys(st.setPieces||{}).forEach(k=>{if(st.setPieces[k]===e.player.id)st.setPieces[k]=st.lineup[0]})}
       if(e.type==='injury'){
         const st=ensureTeamStateV103(tid),p=st?.players?.find(x=>x.id===e.player.id);if(!p)return;
         const games=Math.max(1,e.recovery||1),label=e.injuryLabel||'INFORTUNIO';
         p.injuryGames=Math.max(p.injuryGames||0,games);tr.newInjuries[p.id]={games,label};
         current.keyEvents.push(`${e.min}' INFORTUNIO ${p.name} · ${games} ${games===1?'gara':'gare'}`);
         log(`${e.min}' INFORTUNIO - ${p.name}: ${label}. Recupero previsto ${games} ${games===1?'gara':'gare'}.`,e.side);
         try{showPitchImportant();await ov(`<div class="v103-injury-overlay"><div class="v103-injury-icon">✚</div><h2>INFORTUNIO</h2><b>${p.name}</b><div>${label}</div><div class="v103-recovery">RECUPERO: ${games} ${games===1?'GARA':'GARE'}</div></div>`,1700);hidePitch()}catch(_e){}
         return;
       }
     }
   }
   return oldDoEventV103(e);
 };
}catch(e){console.warn('V10.3 doEvent patch',e)}

function processSilentEvents(m){
 if(!m?._v103)return;
 for(const e of m.events||[]){
   if(!e.player)continue;
   const tid=e.side==='home'?m.h:m.a,tr=m._v103.teams?.[tid],st=ensureTeamStateV103(tid);if(!tr||!st)continue;
   const p=st.players.find(x=>x.id===e.player.id);if(!p||tr.reds[p.id]||tr.newInjuries[p.id])continue;
   if(e.type==='injury'){
     const games=Math.max(1,e.recovery||1);p.injuryGames=Math.max(p.injuryGames||0,games);tr.newInjuries[p.id]={games,label:e.injuryLabel||'INFORTUNIO'};
   }else if(e.type==='yellow'){
     tr.yellows[p.id]=(tr.yellows[p.id]||0)+1;if(tr.yellows[p.id]>=2)tr.reds[p.id]=true;
   }else if(e.type==='red')tr.reds[p.id]=true;
   if(tr.reds[p.id])tr.exitedAt[p.id]=e.min;
 }
}

function playedMinutesFrom(m,tr,pid){
 const start=tr.enteredAt[pid];if(start==null)return 0;return clamp((tr.exitedAt[pid]??Math.max(90,m.minute||0))-start,0,120);
}
function finalizeTeamCondition(m,id,visible){
 const st=ensureTeamStateV103(id),tr=m?._v103?.teams?.[id];if(!st||!tr)return[];
 const notes=[];
 /* Existing absences serve one match of their recovery/suspension here. */
 for(const p of st.players){
   ensurePlayerState(p);
   if((tr.preInjury[p.id]||0)>0&&!tr.newInjuries[p.id])p.injuryGames=Math.max(0,p.injuryGames-1);
   if((tr.preSuspension[p.id]||0)>0)p.suspensionGames=Math.max(0,p.suspensionGames-1);
 }
 /* Fatigue + partial recovery. Full 90 minutes repeatedly will progressively lower fitness. */
 for(const p of st.players){
   const mins=playedMinutesFrom(m,tr,p.id),start=tr.startFitness[p.id]??p.fitness;
   const load=(20+Math.max(0,78-playerPhysical(p))*.12)*(mins/90);
   p.fitness=clamp(Math.round(start+12-load),25,100);
   if(mins>0){p.matchesPlayedV103=(p.matchesPlayedV103||0)+1;const stat=career.pstats?.[p.id];if(stat)stat.apps=(stat.apps||0)+1;}
   if(tr.newInjuries[p.id])p.fitness=Math.min(p.fitness,55);
 }
 /* Three yellows in three consecutive team matches => one-match ban. A red always bans the next match. */
 for(const p of st.players){
   const mins=playedMinutesFrom(m,tr,p.id),red=!!tr.reds[p.id],yellow=(tr.yellows[p.id]||0)>0;
   if(red){p.suspensionGames=Math.max(p.suspensionGames,1);p.yellowStreak=0;notes.push(`🟥 ${p.name}: squalificato per la prossima partita`);continue}
   if(mins>0){
     if(yellow){p.yellowStreak=(p.yellowStreak||0)+1;if(p.yellowStreak>=3){p.suspensionGames=Math.max(p.suspensionGames,1);p.yellowStreak=0;notes.push(`🟨 ${p.name}: 3 gialli consecutivi · squalificato per la prossima partita`)}}
     else p.yellowStreak=0;
   }else if(!yellow){p.yellowStreak=0}
   if(tr.newInjuries[p.id]){const inf=tr.newInjuries[p.id];notes.push(`✚ ${p.name}: ${inf.label} · ${inf.games} ${inf.games===1?'gara':'gare'} di recupero`)}
 }
 return notes;
}
function finalizeMatchCondition(m=current,visible=true){
 if(!m?._v103||m._v103.finalized)return [];
 const notes=[...finalizeTeamCondition(m,m.h,visible),...finalizeTeamCondition(m,m.a,visible)];
 m._v103.finalized=true;m._v103.summary=notes;
 if(visible&&notes.length){
   const box=$c('#postEvents');if(box)box.insertAdjacentHTML('afterbegin',`<div class="v103-post-summary">${notes.map(n=>`<div>${n}</div>`).join('')}</div>`);
 }
 // The match owner persists once all results and condition have been finalized.
 return notes;
}

/* CPU league matches use the same condition/discipline rules. */
try{
 simOther=function(h,a){
   ensureAvailableLineup(h);ensureAvailableLineup(a);
   const m=buildMatch(h,a);m.scoreH=m.events.filter(e=>e.type==='goal'&&e.side==='home').length;m.scoreA=m.events.filter(e=>e.type==='goal'&&e.side==='away').length;
   m.events.filter(e=>e.type==='goal').forEach(e=>{
     if(!career.pstats[e.player.id])career.pstats[e.player.id]={name:e.player.name,team:(e.side==='home'?m.h:m.a),goals:0,assists:0,apps:0};
     career.pstats[e.player.id].goals++;
     if(e.assist){if(!career.pstats[e.assist.id])career.pstats[e.assist.id]={name:e.assist.name,team:(e.side==='home'?m.h:m.a),goals:0,assists:0,apps:0};career.pstats[e.assist.id].assists++}
   });
   processSilentEvents(m);finalizeMatchCondition(m,false);updateLeague(m);
 };
}catch(e){console.warn('V10.3 simOther patch',e)}

/* Prematch: recover migration, remove unavailable players and expose absences. */
try{
 const oldOpenPrematchV103=openPrematch;
 openPrematch=function(g){
   ensureAllV103();const ids=[g[0],g[1]];ids.forEach(ensureAvailableLineup);
   const ust=ensureTeamStateV103(career.user);if(ust)ust.subs=0;
   const out=oldOpenPrematchV103(g);
   const info=$c('#prematchInfo');if(info&&ust){
     const absent=ust.players.filter(unavailable);
     const tired=ust.players.filter(p=>!unavailable(p)&&p.fitness<70).sort((a,b)=>a.fitness-b.fitness).slice(0,4);
     const lines=[];
     if(absent.length)lines.push(`<b>Assenti:</b> ${absent.map(p=>`${p.name} (${statusText(p)})`).join(' · ')}`);
     if(tired.length)lines.push(`<b>Da gestire:</b> ${tired.map(p=>`${p.name} COND ${p.fitness}%`).join(' · ')}`);
     if(lines.length)info.insertAdjacentHTML('beforeend',`<div class="v103-prematch-alert">${lines.join('<br>')}</div>`);
   }
   return out;
 };
}catch(e){console.warn('V10.3 openPrematch patch',e)}

/* Prematch XI shows persistent fitness and disciplinary/medical status. */
try{
 const oldRenderPrematchV103=renderPrematchLineup;
 renderPrematchLineup=function(){
   const out=oldRenderPrematchV103();const st=ensureTeamStateV103(career.user);if(!st)return out;
   $$c('#lineupPreview .lineup-row-v33').forEach(row=>{
     const pid=row.dataset.playerCard,p=st.players.find(x=>x.id===pid),main=row.querySelector('.lineup-player-main');if(!p||!main)return;
     main.insertAdjacentHTML('beforeend',`<div class="v103-line-state"><span class="v103-fitness ${fitnessClass(p.fitness)}">COND ${p.fitness}%</span>${p.yellowStreak===2?'<span class="v103-diffida">DIFFIDA</span>':''}</div>`);
   });
   return out;
 };
}catch(e){console.warn('V10.3 renderPrematchLineup patch',e)}

/* Tactics/change tables show individual live fatigue. Unavailable bench players cannot enter. */
try{
 playerRow=function(p,kind){
   const fit=liveFitness(p),blocked=unavailable(p),status=blocked?statusText(p):(p.yellowStreak===2?'DIFFIDA':'');
   return `<tr class="selectable ${blocked?'v103-unavailable':''}" data-${kind}="${p.id}" data-v103-player="${p.id}">
   <td><span class="rolebadge">${roleGroup(p.pos)}</span></td>
   <td><b class="player-click" data-profile="${p.id}">${p.name}</b><div class="smallstat">${p.pos} · <span class="v103-fitness ${fitnessClass(fit)}">COND ${fit}%</span>${status?` · <span class="v103-status">${status}</span>`:''}</div></td>
   <td>${p.overall}</td><td>${p.morale}</td><td>${p.stats?.speed??'—'}</td><td>${p.stats?.technique??'—'}</td><td>${p.stats?.passing??'—'}</td></tr>`;
 };
 const oldBindSubRowsV103=bindSubRows;
 bindSubRows=function(){
   oldBindSubRowsV103();
   $$c('[data-in]').forEach(tr=>{const st=ensureTeamStateV103(career.user),p=st?.players.find(x=>x.id===tr.dataset.in);if(p&&(unavailable(p)||(!window._prematchEdit&&!S9.canSubstitute(st,null,p.id,false)))){tr.classList.add('v103-unavailable');tr.onclick=()=>{};tr.setAttribute('aria-disabled','true')}});
 };
}catch(e){console.warn('V10.3 tactics table patch',e)}

/* Record the exact minute of substitutions so fatigue is proportional to minutes played. */
function bindSubTracking(){} // Changes are tracked only after validation, in the substitution handler.
S9.canSubstitute=function(st,outId,inId,prematch=false){
 const p=st?.players?.find(x=>x.id===inId);
 return !!p&&!unavailable(p)&&!st.lineup.includes(inId)&&(!outId||st.lineup.includes(outId))&&(prematch||((st.subs||0)<3&&!(st.usedSubs||[]).includes(inId)&&!Object.values(current?._v103?.teams||{}).some(tr=>tr.reds[inId])));
};
S9.recordSubstitution=function(tid,outId,inId,minute){
 const st=career.teamStates[tid],tr=current?._v103?.teams?.[tid];st.usedSubs=st.usedSubs||[];st.usedSubs.push(outId,inId);
 if(tr){tr.exitedAt[outId]=minute||0;tr.enteredAt[inId]=minute||0;}
};
S9.simulateCondition=function(h,a){
 ensureAvailableLineup(h);ensureAvailableLineup(a);const m=buildMatch(h,a);processSilentEvents(m);finalizeMatchCondition(m,false);
};
S9.ensureAvailableLineup=ensureAvailableLineup;

/* Player profile includes condition, recovery and suspension information. */
try{
 const oldProfileV103=showPlayerProfile;
 showPlayerProfile=function(id){
   const out=oldProfileV103(id),p=findUserPlayer(id),meta=$c('#playerProfileMeta');if(p&&meta){const fit=liveFitness(p);meta.insertAdjacentHTML('beforeend',`<div class="v103-profile-state"><span class="v103-fitness ${fitnessClass(fit)}">CONDIZIONE ${fit}%</span> · ${statusText(p)}${p.yellowStreak?` · GIALLI CONSECUTIVI ${p.yellowStreak}/3`:''}</div>`)}return out;
 };
}catch(e){console.warn('V10.3 player profile patch',e)}

/* Finalize condition exactly once when a played match reaches post-match. */
try{
 const oldShowV103=show;
 show=function(id){const out=oldShowV103(id);if(id==='postmatch')finalizeMatchCondition(current,true);return out};
}catch(e){console.warn('V10.3 show patch',e)}

/* Small live indicator: individual values remain available in TATTICA/CAMBI. */
function updateLiveConditionHeader(){
 if(!current||!$c('#match.active'))return;
 const st=ensureTeamStateV103(career?.user);if(!st)return;
 const on=(st.lineup||[]).map(id=>st.players.find(p=>p.id===id)).filter(Boolean);if(!on.length)return;
 const avg=Math.round(on.reduce((s,p)=>s+liveFitness(p),0)/on.length);
 const title=$c('#match .history-title');if(title)title.innerHTML=`CRONACA PARTITA <span class="v103-live-average ${fitnessClass(avg)}">COND MEDIA ${avg}%</span>`;
}
setInterval(updateLiveConditionHeader,1200);

function bootV103(){ensureAllV103();bindSubTracking();const proto=$c('.prototype-note');if(proto)proto.textContent='V10 FINAL · STANCHEZZA · INFORTUNI · SQUALIFICHE · COPPE · NAZIONALI · b3pZ'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootV103,{once:true});else bootV103();
})();
