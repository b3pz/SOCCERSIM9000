/* SerieA 9000 SIM — V7.3.1 ALIGNMENT & DATA FIX */
(function(){
  'use strict';
  const $=s=>document.querySelector(s);

  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}

  /* Hiring copy: keep the strong headline, but make the body short and editorial. */
  function rewriteHiring(){
    const step=$('#managerStep'); if(!step) return;
    const title=$('h2',step), lore=$('.lore-strip',step), badge=$('.welcome-badge',step);
    if(badge) badge.textContent="ULTIM'ORA — SERIE A";
    if(title) title.textContent='UNA PANCHINA È APPENA DIVENTATA LIBERA.';
    if(lore) lore.innerHTML=`
      <div class="headline">LA SOCIETÀ HA DECISO DI APRIRE UN NUOVO CICLO.</div>
      <p>La stagione precedente non ha rispettato le aspettative. La dirigenza ha scelto di cambiare guida tecnica e ripartire con un progetto nuovo.</p>
      <p><strong>La chiamata è arrivata a te.</strong> Avrai una squadra storica e un campionato intero per riportarla ai vertici. L'Europa non è garantita: dovrai conquistarla sul campo.</p>`;
  }

  /* Additional match statistics. V7/V7.1 remain responsible for gameplay/events. */
  if(typeof window.buildMatch==='function'){
    const originalBuild=window.buildMatch;
    window.buildMatch=function(h,a){
      const m=originalBuild.apply(this,arguments);
      m.stats=m.stats||{};
      const hp=(typeof lineupPower==='function'?lineupPower(h):(typeof T==='function'?(T(h)?.strength||80):80));
      const ap=(typeof lineupPower==='function'?lineupPower(a):(typeof T==='function'?(T(a)?.strength||80):80));
      const delta=clamp(Math.round((hp-ap)*.42 + (Math.random()*5-2.5)),-12,12);
      const possH=clamp(50+delta,38,62);
      Object.assign(m.stats,{
        cornersH:0,cornersA:0,foulsH:0,foulsA:0,freeH:0,freeA:0,savesH:0,savesA:0,
        possessionH:possH,possessionA:100-possH
      });
      return m;
    };
    try{buildMatch=window.buildMatch}catch(e){}
  }

  if(typeof window.doEvent==='function'){
    const originalEvent=window.doEvent;
    window.doEvent=async function(e){
      const s=current?.stats;
      if(s&&e){
        if(e.type==='goal'){
          if(e.side==='home'){s.shotsH=(s.shotsH||0)+1;s.onH=(s.onH||0)+1;}
          else{s.shotsA=(s.shotsA||0)+1;s.onA=(s.onA||0)+1;}
        }
        if(e.type==='foul'){
          if(e.side==='home'){s.foulsH=(s.foulsH||0)+1;s.freeA=(s.freeA||0)+1;}
          else{s.foulsA=(s.foulsA||0)+1;s.freeH=(s.freeH||0)+1;}
        }
      }
      const beforeH=s?.onH||0,beforeA=s?.onA||0;
      const out=await originalEvent.apply(this,arguments);
      if(s&&e?.type==='chance'){
        if((s.onH||0)>beforeH) s.savesA=(s.savesA||0)+1;
        if((s.onA||0)>beforeA) s.savesH=(s.savesH||0)+1;
        if(Math.random()<.28){
          if(e.side==='home')s.cornersH=(s.cornersH||0)+1;
          else s.cornersA=(s.cornersA||0)+1;
        }
      }
      return out;
    };
    try{doEvent=window.doEvent}catch(e){}
  }

  function statsGrid(){
    if(!current?.stats) return '';
    const s=current.stats;
    const rows=[
      ['Possesso palla',`${s.possessionH??50}%`,`${s.possessionA??50}%`],
      ['Tiri',s.shotsH||0,s.shotsA||0],
      ['Tiri in porta',s.onH||0,s.onA||0],
      ['Parate',s.savesH||0,s.savesA||0],
      ["Calci d'angolo",s.cornersH||0,s.cornersA||0],
      ['Falli',s.foulsH||0,s.foulsA||0],
      ['Punizioni',s.freeH||0,s.freeA||0]
    ];
    return `<div class="v73-stats-grid">${rows.map(r=>`<div class="v73-stat-cell v73-stat-home">${r[1]}</div><div class="v73-stat-cell v73-stat-label">${r[0]}</div><div class="v73-stat-cell v73-stat-away">${r[2]}</div>`).join('')}</div>`;
  }
  function repaintStats(){
    const h=$('#halftimeStats'); if(h&&current) h.innerHTML=statsGrid();
    const p=$('#postStats'); if(p&&current){
      const st=career?.teamStates?.[career.user];
      p.innerHTML=statsGrid()+`<div style="margin-top:12px;text-align:center;color:#f2e6bd">Modulo: <b>${st?.formation||'—'}</b> &nbsp; · &nbsp; Atteggiamento: <b>${st?.mentality||'—'}</b></div>`;
    }
  }

  if(typeof window.show==='function'){
    const originalShow=window.show;
    window.show=function(id){
      const out=originalShow.apply(this,arguments);
      if(id==='halftime'||id==='postmatch') requestAnimationFrame(repaintStats);
      return out;
    };
    try{show=window.show}catch(e){}
  }

  /* Season hub: force correct dedicated crest files and neutral visual cards. */
  function repaintSeasonCrests(){
    document.querySelectorAll('#season .season-club').forEach(card=>{
      card.style.background='transparent';card.style.borderColor='transparent';
      const img=card.querySelector('img'); if(img){img.style.visibility='visible';img.style.objectFit='contain';}
    });
  }
  if(typeof window.renderSeasonView==='function'){
    const originalView=window.renderSeasonView;
    window.renderSeasonView=function(v){const out=originalView.apply(this,arguments);requestAnimationFrame(repaintSeasonCrests);return out;};
    try{renderSeasonView=window.renderSeasonView}catch(e){}
  }
  if(typeof window.renderSeason==='function'){
    const originalSeason=window.renderSeason;
    window.renderSeason=function(){const out=originalSeason.apply(this,arguments);requestAnimationFrame(repaintSeasonCrests);return out;};
    try{renderSeason=window.renderSeason}catch(e){}
  }

  function centerKits(){
    const stage=$('#kits .kit-stage'); if(stage) stage.style.transform='none';
    ['#kitHomeImg','#kitAwayImg'].forEach(sel=>{const img=$(sel);if(img){img.style.objectPosition='50% 50%';img.style.transform='translateX(0)';img.style.margin='auto';}});
  }
  if(typeof window.renderKitScreen==='function'){
    const originalKit=window.renderKitScreen;
    window.renderKitScreen=function(){const out=originalKit.apply(this,arguments);requestAnimationFrame(centerKits);setTimeout(centerKits,80);return out;};
    try{renderKitScreen=window.renderKitScreen}catch(e){}
  }

  function versionStamp(){
    const note=$('.prototype-note');
    if(note)note.textContent='V7.3.1 ALIGNMENT + KIT FIX · STEMMI 32/32 · DASHBOARD ALLINEATA · SAVE UI · STATISTICHE MATCH ESTESE';
  }

  rewriteHiring();
  centerKits();
  repaintSeasonCrests();
  versionStamp();
  addEventListener('resize',()=>{centerKits();repaintSeasonCrests();},{passive:true});
})();
