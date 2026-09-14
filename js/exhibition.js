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
 S9V10.matchContext={mode:'friendly',state,stadium:config.stadium.trim(),final,match:{h,a,kind:final?'knockout':'friendly',tie,leg:1,stage:final?'FINALE · ESIBIZIONE':'AMICHEVOLE'}};
 career.fixtures=[[[h,a]]];career.otherFixtures=[[]];
 S9V10.applyCompetitionTheme(config.competition);openPrematch([h,a]);q('#backSeason').textContent='← AMICHEVOLE';
}
function restore(){
 if(!saved)return;
 if(current?._running&&!current._finished)return;
 const original=saved;saved=null;career=original.career;S9V10.standalone=original.standalone;S9V10.savedCareer=original.savedCareer;S9V10.matchContext=null;current=null;paused=false;
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
 screen.innerHTML=`<div class="s9-exhibition-shell"><div class="s9-exhibition-kicker">PARTITA LIBERA</div><h1>La tua partita, il tuo stadio</h1><p>Scegli le squadre e l’atmosfera. Puoi giocare anche una finale di esibizione.</p><form id="exhibitionForm"><div class="s9-exhibition-grid"><label>Competizione<select id="exhibitionCompetition"></select></label><label>Squadre<select id="exhibitionPool"><option value="all">Tutte le squadre</option><option value="clubs">Club</option><option value="national">Nazionali</option></select></label><label>Squadra di casa<select id="exhibitionHome"></select></label><label>Squadra ospite<select id="exhibitionAway"></select></label><label class="s9-wide">Stadio<div class="s9-stadium-carousel"><button type="button" class="s9-stadium-arrow" id="stadiumPrev" aria-label="Stadio precedente">◀</button><div class="s9-stadium-card"><div class="s9-stadium-name" id="stadiumName">San Siro</div><div class="s9-stadium-counter" id="stadiumCounter">1 / 8</div></div><button type="button" class="s9-stadium-arrow" id="stadiumNext" aria-label="Stadio successivo">▶</button></div><input type="hidden" id="exhibitionStadium"></label><label class="s9-wide s9-final-choice"><input type="checkbox" id="exhibitionFinal"> Finale · in caso di pareggio, supplementari e rigori</label></div><p class="s9-exhibition-note">Le esibizioni non modificano carriera, classifiche o albo d’oro. La finale include la premiazione con la coppa della competizione scelta.</p><div id="exhibitionError" role="alert"></div><div class="s9-exhibition-actions"><button type="button" id="exhibitionBack">← MENU</button><button type="submit" id="exhibitionSubmit" class="primary">PREPARA PARTITA ▶</button></div></form></div>`;
 document.querySelector('main').appendChild(screen);
 for(const [key,brand]of Object.entries(S9Competition.definitions)){if(key==='finaleight')continue;const o=document.createElement('option');o.value=key;o.textContent=brand.name;q('#exhibitionCompetition').appendChild(o)}
 const stadiums=new Set(['San Siro','Stadio Olimpico','Stade de France','Wembley','De Kuip','Camp Nou','Santiago Bernabéu','Stadio San Paolo']);
 Object.values(teamMeta).forEach(m=>{if(m.stadium)stadiums.add(m.stadium)});
 const stadiumList=[...stadiums].sort();
 let stadiumIndex=0;
 function renderStadium(){
  q('#stadiumName').textContent=stadiumList[stadiumIndex];
  q('#stadiumCounter').textContent=(stadiumIndex+1)+' / '+stadiumList.length;
  q('#exhibitionStadium').value=stadiumList[stadiumIndex];
 }
 function setStadium(name){const i=stadiumList.indexOf(name);stadiumIndex=i>=0?i:0;renderStadium()}
 q('#stadiumPrev').onclick=()=>{stadiumIndex=(stadiumIndex-1+stadiumList.length)%stadiumList.length;renderStadium()};
 q('#stadiumNext').onclick=()=>{stadiumIndex=(stadiumIndex+1)%stadiumList.length;renderStadium()};
 renderStadium();
 function refreshTeams(){
  const pool=q('#exhibitionPool').value,ids=pool==='national'?S9V10.nationalIds:pool==='clubs'?S9V10.clubIds:[...S9V10.clubIds,...S9V10.nationalIds];
  for(const side of ['Home','Away']){const select=q('#exhibition'+side),old=select.value;select.replaceChildren();for(const id of ids){const t=T(id),o=document.createElement('option');o.value=id;o.textContent=t.name+' · '+t.season;select.appendChild(o)}if(ids.includes(old))select.value=old;else select.selectedIndex=side==='Away'?1:0;}
  if(q('#exhibitionHome').value===q('#exhibitionAway').value)q('#exhibitionAway').selectedIndex=1;
 }
 q('#exhibitionPool').onchange=refreshTeams;refreshTeams();
 q('#exhibitionCompetition').onchange=()=>{const key=q('#exhibitionCompetition').value;q('#exhibitionPool').value=['world','euro'].includes(key)?'national':key==='friendly'?'all':'clubs';refreshTeams()};
 q('#exhibitionHome').onchange=()=>{const id=q('#exhibitionHome').value;setStadium(teamMeta[id]?.stadium||'San Siro')};
 q('#exhibitionBack').onclick=()=>show('mainMenu');button.onclick=()=>{q('#exhibitionError').textContent='';show('exhibitionSetup')};
 q('#exhibitionForm').onsubmit=e=>{e.preventDefault();try{start({home:q('#exhibitionHome').value,away:q('#exhibitionAway').value,competition:q('#exhibitionCompetition').value,stadium:q('#exhibitionStadium').value,final:q('#exhibitionFinal').checked})}catch(error){q('#exhibitionError').textContent=error.message}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
