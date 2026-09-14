/* Season pages and a fixture calendar. Presentation only; competition state stays in S9V10. */
(function(){
'use strict';
const $=s=>document.querySelector(s),esc=escapeHTML;
const titles={results:'RISULTATI',table:'GIRONI A / B',calendar:'CALENDARIO',europe:'COPPE',scorers:'MARCATORI',assists:'ASSIST',next:'PROSSIMO IMPEGNO'};
let month=null,calendarCareer=null,renderingHub=false;
const dateKey=d=>{d=new Date(d);return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`};
const crest=id=>CREST_ASSETS[id]||T(id)?.crest||'';
function calendarMatches(){
 const games=[];
 (career.leagueDates||[]).forEach((date,round)=>{
  const fixture=career.fixtures[round]?.find(g=>g.includes(career.user));if(!fixture)return;
  const [h,a]=fixture,result=career.results.find(r=>r.round===round+1&&r.h===h&&r.a===a);
  games.push({date:new Date(date),h,a,label:`Serie A · Giornata ${round+1}`,score:result?`${result.hg}–${result.ag}`:'',next:round===career.round});
 });
 return games.concat(S9V10.calendarCupMatches?.()||[]);
}
function calendarHTML(selected){
 const y=selected.getFullYear(),m=selected.getMonth(),first=new Date(y,m,1),offset=(first.getDay()+6)%7;
 const count=Math.ceil((offset+new Date(y,m+1,0).getDate())/7)*7,byDay=new Map();
 for(const game of calendarMatches()){const key=dateKey(game.date);if(!byDay.has(key))byDay.set(key,[]);byDay.get(key).push(game)}
 const team=T(career.user),name=new Intl.DateTimeFormat('it-IT',{month:'long'}).format(first);
 return `<article class="s9-calendar-paper" aria-label="Calendario ${name} ${y}">
 <div class="s9-calendar-masthead"><div><small>${esc(team.name.toUpperCase())} · ${esc(team.season)}</small><h2>${name.toUpperCase()}</h2><span>${y}</span></div><img class="s9-calendar-club" src="${crest(career.user)}" alt="${esc(team.name)}"><img class="s9-calendar-league" src="assets/league/serie_a_league.png" alt="Serie A"></div>
 <div class="s9-calendar-controls"><button id="calPrevMonth" type="button" aria-label="Mese precedente">◀</button><span>IL TUO CALENDARIO PARTITE</span><button id="calNextMonth" type="button" aria-label="Mese successivo">▶</button></div>
 <div class="s9-month-grid">${['L','M','M','G','V','S','D'].map((d,i)=>`<div class="s9-month-weekday" aria-label="${['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'][i]}">${d}</div>`).join('')}
 ${Array.from({length:count},(_,i)=>{
  const date=new Date(y,m,i-offset+1),games=byDay.get(dateKey(date))||[],outside=date.getMonth()!==m;
  return `<div class="s9-month-day${outside?' is-outside':''}${games.some(g=>g.next)?' is-next':''}" aria-label="${v4FmtDate(date)}"><span class="s9-month-number">${date.getDate()}</span>${games.map(g=>{
   const opponent=g.h===career.user?g.a:g.h,away=g.a===career.user,name=opponent?T(opponent)?.name:'Avversaria da definire';
   return `<div class="s9-calendar-fixture" title="${esc(g.label+' · '+name+(opponent?(away?' · Trasferta':' · In casa'):''))}">${opponent?`<img src="${crest(opponent)}" alt="${esc(name)}"><span class="s9-calendar-venue" aria-label="${away?'Trasferta':'In casa'}">${away?'✈':'⌂'}</span>`:`<span class="s9-calendar-cup" aria-label="${esc(g.label)} · Avversaria da definire">COPPA</span>`}<small>${g.score||esc(opponent?name:g.label)}</small></div>`;
  }).join('')}</div>`;
 }).join('')}</div><div class="s9-calendar-legend"><span>⌂ IN CASA</span><span>✈ IN TRASFERTA</span><span class="s9-calendar-next-key">PROSSIMO TURNO</span></div></article>`;
}
function renderCalendar(){
 if(calendarCareer!==career){month=null;calendarCareer=career}
 if(!month){const now=v4CurrentDate()||new Date(career.seasonYear,8,1);month=new Date(now.getFullYear(),now.getMonth(),1)}
 $('#seasonContent').innerHTML=calendarHTML(month);
 $('#calPrevMonth').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);renderCalendar()};
 $('#calNextMonth').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);renderCalendar()};
}
function openPage(view,title){
 const page=$('#seasonPage');page.dataset.view=view;
 $('#seasonPageTitle').textContent=title||titles[view]||'STAGIONE';
 const back=$('#seasonPageBack');back.textContent='◀ STAGIONE';back.onclick=()=>{renderSeason();show('season')};
 show('seasonPage');page.scrollTop=0;$('#seasonContent').scrollTop=0;
 requestAnimationFrame(()=>$('#seasonPageTitle').focus({preventScroll:true}));
}
function bindCupPages(){
 document.querySelectorAll('[data-cup-bracket]').forEach(b=>b.onclick=()=>{
  const key=b.dataset.cupBracket,state=career.v10Cups[key];
  $('#seasonContent').innerHTML=S9V10.careerCupBracketHTML(key);openPage('cupBracket',state.name);
  $('#seasonPageBack').textContent='◀ COPPE';$('#seasonPageBack').onclick=()=>renderSeasonView('europe');
 });
}
function boot(){
 document.documentElement.classList.add('s9-responsive');
 const page=document.createElement('section');page.id='seasonPage';page.className='screen';page.setAttribute('aria-labelledby','seasonPageTitle');
 page.innerHTML='<div class="s9-page-heading"><button id="seasonPageBack" type="button">◀ STAGIONE</button><div><small>IL TUO CLUB</small><h1 id="seasonPageTitle" tabindex="-1">STAGIONE</h1></div></div>';
 document.querySelector('main').appendChild(page);
 const content=$('#seasonContent');content.classList.remove('panel');content.classList.add('s9-page-content');content.removeAttribute('style');page.appendChild(content);
 $('#season .toolbar').classList.add('s9-season-links');$('#season').classList.add('s9-clean-hub');
 const baseView=renderSeasonView;
 renderSeasonView=function(view){
  if(renderingHub)return;
  const out=baseView.apply(this,arguments);
  if(titles[view]){if(view==='calendar')renderCalendar();openPage(view);if(view==='europe')bindCupPages()}
  return out;
 };
 const baseSeason=renderSeason;
 renderSeason=function(){
  renderingHub=true;let out;try{out=baseSeason.apply(this,arguments)}finally{renderingHub=false}
  $('#seasonContent').replaceChildren();$('#season').dataset.seasonView='home';
  $('#season').classList.remove('v51-calendar-bg','v51-europe-bg');
  document.querySelectorAll('#season [data-view]').forEach(b=>{b.classList.remove('active');b.removeAttribute('aria-pressed')});
  const due=S9V10.dueCareerCup?.();
  if(due){$('#hubNext').innerHTML=`<div class="hub-kicker">${esc(due.name)}</div><h2>LA COPPA TI ASPETTA</h2><p>Il prossimo impegno è infrasettimanale.</p><button id="s9DueCup" class="primary">PREPARA PARTITA ▶</button>`;$('#s9DueCup').onclick=()=>renderSeasonView('next')}
  const final=$('#hubNextSeason');if(final){final.textContent='APRI FINALE DI STAGIONE ▶';final.onclick=()=>renderSeasonView('next')}
  return out;
 };
 if($('#season.active'))renderSeason();
}
window.S9Presentation={calendarMatches,calendarHTML,dateKey,openPage};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
