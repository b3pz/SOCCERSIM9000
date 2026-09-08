/* SerieA 9000 SIM — V7.6 MATCH UI FIX */
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function teamName(id){try{return typeof T==='function'?(T(id)?.name||id):id}catch(e){return id||'—'}}

  function ensurePanel(){
    const stage=$('#match .match-stage'); if(!stage) return null;
    let p=$('#v76MatchTabPanel');
    if(!p){
      p=document.createElement('div');
      p.id='v76MatchTabPanel';
      p.className='v76-match-tab-panel';
      p.hidden=true;
      const pitch=$('#pitchWrap90');
      if(pitch) stage.insertBefore(p,pitch); else stage.appendChild(p);
    }
    return p;
  }

  function stats(){
    const s=(typeof current!=='undefined'&&current?.stats)||{};
    return {
      possessionH:s.possessionH??50, possessionA:s.possessionA??50,
      shotsH:s.shotsH||0, shotsA:s.shotsA||0,
      onH:s.onH||0, onA:s.onA||0,
      savesH:s.savesH||0, savesA:s.savesA||0,
      cornersH:s.cornersH||0, cornersA:s.cornersA||0,
      foulsH:s.foulsH||0, foulsA:s.foulsA||0,
      freeH:s.freeH||0, freeA:s.freeA||0
    };
  }

  function baseHead(){
    if(typeof current==='undefined'||!current) return '';
    const h=teamName(current.h),a=teamName(current.a);
    return `<div class="v76-tab-head"><div class="v76-tab-team">${esc(h)}</div><div class="v76-tab-score">${current.scoreH||0} - ${current.scoreA||0}</div><div class="v76-tab-team away">${esc(a)}</div></div><div class="v76-tab-minute">${esc((current.half===2||current.minute>45)?'2° TEMPO':'1° TEMPO')} · ${esc(current.minute||0)}'</div>`;
  }

  function overviewHTML(){
    const s=stats();
    const keys=(typeof current!=='undefined'&&current?.keyEvents)||[];
    const last=keys.length?keys[keys.length-1]:'Partita in corso';
    return baseHead()+`<div class="v76-overview-grid">
      <div class="v76-overview-card">POSSESSO<b>${s.possessionH}% - ${s.possessionA}%</b></div>
      <div class="v76-overview-card">TIRI<b>${s.shotsH} - ${s.shotsA}</b></div>
      <div class="v76-overview-card">IN PORTA<b>${s.onH} - ${s.onA}</b></div>
      <div class="v76-overview-card">PARATE<b>${s.savesH} - ${s.savesA}</b></div>
      <div class="v76-overview-card">FALLI<b>${s.foulsH} - ${s.foulsA}</b></div>
      <div class="v76-overview-card">ULTIMO EVENTO<b style="font-size:15px;line-height:1.25">${esc(last)}</b></div>
    </div>`;
  }

  function statsHTML(){
    const s=stats();
    const rows=[
      ['Possesso palla',`${s.possessionH}%`,`${s.possessionA}%`],
      ['Tiri',s.shotsH,s.shotsA],
      ['Tiri in porta',s.onH,s.onA],
      ['Parate',s.savesH,s.savesA],
      ["Calci d'angolo",s.cornersH,s.cornersA],
      ['Falli',s.foulsH,s.foulsA],
      ['Punizioni',s.freeH,s.freeA]
    ];
    return baseHead()+`<div class="v76-possession"><div class="home" style="width:${s.possessionH}%"></div><div class="away" style="width:${s.possessionA}%"></div></div><div class="v76-stats-table">${rows.map(r=>`<div class="home">${esc(r[1])}</div><div class="label">${esc(r[0])}</div><div class="away">${esc(r[2])}</div>`).join('')}</div>`;
  }

  function reportHTML(){
    const keys=(typeof current!=='undefined'&&current?.keyEvents)||[];
    let rows='';
    if(keys.length){
      rows=keys.slice().reverse().map(x=>{
        const m=String(x).match(/^(\d+)'\s*(.*)$/);
        return `<div class="v76-report-row"><div class="min">${m?esc(m[1])+"'":'•'}</div><div>${esc(m?m[2]:x)}</div></div>`;
      }).join('');
    }else rows='<div class="v76-report-empty">Nessun evento chiave registrato finora.</div>';
    return baseHead()+`<div class="v76-report-list">${rows}</div>`;
  }

  let currentView='pitch';
  function renderView(view){
    currentView=view;
    const match=$('#match'),p=ensurePanel(); if(!match||!p)return;
    match.dataset.matchView=view;
    $$('#match .match-tabs span').forEach((el,i)=>el.classList.toggle('active',['overview','stats','pitch','report'][i]===view));
    if(view==='pitch'){
      p.hidden=true;
      return;
    }
    p.hidden=false;
    p.innerHTML=view==='overview'?overviewHTML():view==='stats'?statsHTML():reportHTML();
  }

  function wireTabs(){
    const tabs=$$('#match .match-tabs span');
    const views=['overview','stats','pitch','report'];
    tabs.forEach((el,i)=>{
      el.dataset.matchView=views[i];
      el.setAttribute('role','button');
      el.setAttribute('tabindex','0');
      el.setAttribute('aria-label',`Apri ${el.textContent.trim()}`);
      el.onclick=()=>renderView(views[i]);
      el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();renderView(views[i]);}};
    });
    renderView('pitch');
  }

  /* Keep the selected tab live while the match runs. */
  setInterval(()=>{if(currentView!=='pitch'&&$('#match.active'))renderView(currentView)},900);

  /* Cleaner save replay: a diving keeper, not the old clip-art glove. */
  window.saveGloveSVG=function(){
    return `<div class="v76-save-replay">
      <svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs><linearGradient id="g76" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#173b74"/><stop offset="1" stop-color="#07152f"/></linearGradient></defs>
        <rect x="2" y="2" width="516" height="256" rx="6" fill="url(#g76)" stroke="#d3b34b" stroke-width="3"/>
        <g opacity=".2" stroke="#fff"><path d="M25 55h470M25 95h470M25 135h470M25 175h470M25 215h470"/></g>
        <circle cx="414" cy="91" r="25" fill="#f8f4e8" stroke="#111" stroke-width="5"/>
        <path d="M395 78l39 26M430 76l-33 30M392 91h44" stroke="#111" stroke-width="3"/>
        <g transform="translate(75 48) rotate(-12 155 85)">
          <circle cx="92" cy="62" r="22" fill="#e8b07a" stroke="#05080d" stroke-width="6"/>
          <path d="M113 79c38 14 64 26 101 38l-18 47c-37-12-74-31-111-52z" fill="#f0d24c" stroke="#05080d" stroke-width="7"/>
          <path d="M194 118l65-32 15 23-55 42z" fill="#e8b07a" stroke="#05080d" stroke-width="7"/>
          <path d="M107 101l-58 57-22-18 47-65z" fill="#e8b07a" stroke="#05080d" stroke-width="7"/>
          <path d="M195 155l42 48-22 18-48-45z" fill="#182849" stroke="#05080d" stroke-width="7"/>
          <path d="M168 151l-17 60-29-7 12-64z" fill="#182849" stroke="#05080d" stroke-width="7"/>
          <path d="M263 81l19-7 18 26-16 16z" fill="#fff" stroke="#05080d" stroke-width="6"/>
        </g>
        <path d="M345 92c28-18 42-16 54-10" fill="none" stroke="#f2d45c" stroke-width="4" stroke-dasharray="8 8"/>
      </svg>
      <div><div class="v76-save-kicker">REPLAY · INTERVENTO DEL PORTIERE</div><div class="v76-save-title">PARATA!</div><div class="v76-save-sub">Riflesso decisivo. Il portiere respinge il tiro e tiene in piedi la sua squadra.</div></div>
    </div>`;
  };
  try{saveGloveSVG=window.saveGloveSVG}catch(e){}

  function boot(){wireTabs();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
