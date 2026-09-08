/* SerieA 9000 SIM — V7.2 PUBLICATION UI runtime refinements.
   Layout/readability only: core career and match logic remains untouched. */
(function(){
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));

  function rewriteHiringStory(){
    const step=$('#managerStep');
    if(!step) return;
    const badge=$('.welcome-badge',step), title=$('h2',step), lore=$('.lore-strip',step);
    if(badge) badge.textContent="ULTIM'ORA — SERIE A";
    if(title) title.textContent='UNA PANCHINA È APPENA DIVENTATA LIBERA.';
    if(lore){
      lore.innerHTML=`
        <div class="headline">LA SOCIETÀ HA DECISO DI APRIRE UN NUOVO CICLO.</div>
        <p>La stagione precedente ha lasciato il segno: gli obiettivi non sono stati raggiunti e la dirigenza ha scelto di cambiare rotta.</p>
        <p><strong>Ora la chiamata è arrivata a te.</strong> Avrai una squadra storica, una stagione intera e un solo compito: riportarla in alto. L'Europa non è garantita: dovrai conquistarla sul campo.</p>`;
    }
  }

  function syncSetupMode(){
    const setup=$('#setup'), manager=$('#managerStep'), team=$('#teamStep');
    if(!setup||!manager||!team) return;
    const teamVisible=getComputedStyle(team).display!=='none';
    setup.classList.toggle('v72-team-mode',teamVisible);
    setup.classList.toggle('v72-manager-mode',!teamVisible);
  }

  function moveSeasonNav(){
    const season=$('#season'), grid=$('#season>.grid');
    if(!season||!grid) return;
    let nav=$('#season .season-nav');
    if(nav) return;
    const old=$('#season>.grid>.panel:first-child .toolbar');
    if(old){
      old.classList.add('season-nav');
      old.removeAttribute('style');
      grid.insertAdjacentElement('afterend',old);
    }
  }

  function patchTeamPicker(){
    if(typeof window.renderTeamPicker!=='function') return;
    const original=window.renderTeamPicker;
    window.renderTeamPicker=function(){
      const out=original.apply(this,arguments);
      try{
        const t=(typeof teams!=='undefined'&&typeof selectedTeamIndex!=='undefined')?teams[selectedTeamIndex]:null;
        if(!t) return out;
        const m=(typeof teamMeta!=='undefined'?teamMeta[t.id]:null)||{city:'—',stadium:'—',motto:'—'};
        const left=$('#teamLeftInfo'), right=$('#teamRightInfo');
        if(left){
          left.innerHTML=`
            <div class="team-info-row"><span class="team-info-label">Città</span><span class="team-info-value">${m.city||'—'}</span></div>
            <div class="team-info-row"><span class="team-info-label">Stadio</span><span class="team-info-value">${m.stadium||'—'}</span></div>
            <div class="team-info-row"><span class="team-info-label">Vice</span><span class="team-info-value">${t.coach||'—'}</span></div>
            <div class="team-motto">“${m.motto||'—'}”</div>`;
        }
        if(right){
          right.innerHTML=`
            <div class="team-overall-label">OVERALL</div>
            <div class="overall90">${t.strength}</div>
            <div class="team-stat-divider"></div>
            <div class="team-modules-title">MODULI</div>
            <div class="team-modules-list">${(t.formations||[]).join('<br>')}</div>`;
        }
        syncSetupMode();
      }catch(e){console.warn('V7.2 team picker polish:',e)}
      return out;
    };
    try{renderTeamPicker=window.renderTeamPicker}catch(e){}
  }

  function crestPath(id){
    return `assets/crests/italian/${id}.png`;
  }

  function patchSeasonRender(){
    if(typeof window.renderSeason!=='function'||typeof window.renderSeasonView!=='function') return;
    const originalSeason=window.renderSeason;
    const originalView=window.renderSeasonView;

    window.renderSeason=function(){
      const out=originalSeason.apply(this,arguments);
      try{
        const t=(typeof T==='function'&&typeof career!=='undefined'&&career)?T(career.user):null;
        if(t&&typeof career!=='undefined'&&career){
          const summary=$('#managerSummary'), status=$('#seasonStatus');
          if(summary){
            summary.innerHTML=`
              <div class="season-summary-row"><span class="season-summary-label">Manager:</span><span class="season-summary-value">${career.manager}</span></div>
              <div class="season-summary-row"><span class="season-summary-label">Squadra:</span><span class="season-summary-value">${t.name} ${t.season}</span></div>
              <div class="season-summary-row"><span class="season-summary-label">Vice:</span><span class="season-summary-value">${t.coach}</span></div>
              <div class="season-summary-row"><span class="season-summary-label">Serie A:</span><span class="season-summary-value">Girone ${career.userGroup||'A'}</span></div>
              <div class="season-summary-row"><span class="season-summary-label">Stagione:</span><span class="season-summary-value accent">${career.seasonYear||1998}/${String((career.seasonYear||1998)+1).slice(-2)}</span></div>`;
          }
          if(status){
            const d=typeof v4CurrentDate==='function'?v4CurrentDate():null;
            const date=d&&typeof v4FmtDate==='function'?v4FmtDate(d):'';
            status.innerHTML=career.round>=30
              ? `<div class="season-status-primary">Stagione regolare conclusa.</div><div class="season-status-secondary">Le prime 4 di ogni girone accedono ai Playoff Scudetto.</div>`
              : `<div class="season-status-primary">Prossima giornata: <strong>${career.round+1}${date?' · '+date:''}</strong></div><div class="season-status-secondary">Il mercoledì è delle Coppe.</div>`;
          }
        }
      }catch(e){console.warn('V7.2 season summary polish:',e)}
      return out;
    };
    try{renderSeason=window.renderSeason}catch(e){}

    window.renderSeasonView=function(v){
      const out=originalView.apply(this,arguments);
      try{
        const c=$('#seasonContent');
        if(v==='next'&&c&&typeof career!=='undefined'&&career){
          const g=typeof nextUserGame==='function'?nextUserGame():null;
          if(g){
            const h=typeof T==='function'?T(g[0]):null, a=typeof T==='function'?T(g[1]):null;
            const d=career.leagueDates?.[career.round];
            const date=d&&typeof v4FmtDate==='function'?v4FmtDate(d):'';
            c.innerHTML=`
              <div class="season-next-wrap">
                <div class="season-next-title">PROSSIMA PARTITA</div>
                <div class="season-next-match">
                  <div class="season-club home">
                    <img src="${crestPath(h.id)}" alt="Stemma ${h.name}" onerror="this.style.visibility='hidden'">
                    <div class="season-club-name">${h.name} ${h.season}</div>
                  </div>
                  <div class="season-vs">VS</div>
                  <div class="season-club away">
                    <img src="${crestPath(a.id)}" alt="Stemma ${a.name}" onerror="this.style.visibility='hidden'">
                    <div class="season-club-name">${a.name} ${a.season}</div>
                  </div>
                </div>
                <div class="season-next-meta">${date?date+' · ':''}Giornata ${career.round+1} · Girone ${career.userGroup||'A'}</div>
                <div class="season-next-action"><button class="primary" id="goPrematch">PREPARA PARTITA</button></div>
              </div>`;
            const go=$('#goPrematch'); if(go&&typeof openPrematch==='function') go.onclick=()=>openPrematch(g);
          }
        }
      }catch(e){console.warn('V7.2 next match polish:',e)}
      return out;
    };
    try{renderSeasonView=window.renderSeasonView}catch(e){}
  }

  function patchButtonsAndObservers(){
    const managerNext=$('#managerNext'), teamBack=$('#teamBack');
    if(managerNext) managerNext.addEventListener('click',()=>setTimeout(syncSetupMode,0));
    if(teamBack) teamBack.addEventListener('click',()=>setTimeout(syncSetupMode,0));
    const team=$('#teamStep'), manager=$('#managerStep');
    const obs=new MutationObserver(syncSetupMode);
    if(team) obs.observe(team,{attributes:true,attributeFilter:['style','class']});
    if(manager) obs.observe(manager,{attributes:true,attributeFilter:['style','class']});
  }

  function versionStamp(){
    const note=$('.prototype-note');
    if(note) note.textContent='V7.2 PUBLICATION UI · LEGGIBILITÀ FINALE · DASHBOARD RIFATTA · KIT TRASPARENTI · EVENTI VISIVI · CAMBI CPU';
  }

  /* Execute after legacy V7.1 has defined all renderers. */
  rewriteHiringStory();
  moveSeasonNav();
  patchTeamPicker();
  patchSeasonRender();
  patchButtonsAndObservers();
  versionStamp();
  syncSetupMode();

  /* Repaint current picker if it was already rendered before this script loaded. */
  try{ if(typeof window.renderTeamPicker==='function') window.renderTeamPicker(); }catch(e){}
})();
