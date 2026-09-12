/* SerieA 9000 SIM — V9.1 final touches */
(function(){
  'use strict';
  const $ = s => document.querySelector(s);

  function compactStatsHTML(){
    const s = typeof current!=='undefined' && current?.stats ? current.stats : null;
    if(!s) return '';
    const rows = [
      ['Possesso palla', `${s.possessionH ?? 50}%`, `${s.possessionA ?? 50}%`],
      ['Tiri', s.shotsH || 0, s.shotsA || 0],
      ['Tiri in porta', s.onH || 0, s.onA || 0],
      ['Parate', s.savesH || 0, s.savesA || 0],
      ["Calci d'angolo", s.cornersH || 0, s.cornersA || 0]
    ];
    return `<div class="v73-stats-grid v91-compact-stats">${rows.map(r => `<div class="v73-stat-cell v73-stat-home">${r[1]}</div><div class="v73-stat-cell v73-stat-label">${r[0]}</div><div class="v73-stat-cell v73-stat-away">${r[2]}</div>`).join('')}</div>`;
  }

  function repaintCompactStats(){
    const html = compactStatsHTML();
    if(!html) return;
    const h = $('#halftimeStats');
    if(h) h.innerHTML = html;
    const p = $('#postStats');
    if(p){
      const st = typeof career!=='undefined' && career?.teamStates ? career.teamStates[career.user] : null;
      p.innerHTML = html + `<div style="margin-top:12px;text-align:center;color:#f2e6bd">Modulo: <b>${st?.formation || '—'}</b> &nbsp; · &nbsp; Atteggiamento: <b>${st?.mentality || '—'}</b></div>`;
    }
  }

  function kitPolish(){
    const stage = $('#kits .kit-stage');
    if(stage) stage.style.transform = 'none';
    document.querySelectorAll('#kits .kit-card').forEach(card => {
      card.style.justifyItems = 'center';
      card.style.textAlign = 'center';
    });
    ['#kitHomeImg', '#kitAwayImg'].forEach(sel => {
      const img = $(sel);
      if(img){
        img.style.objectPosition = '50% 50%';
        img.style.transform = 'none';
        img.style.margin = '0 auto';
      }
    });
    const contrast = $('#kitContrast');
    if(contrast) contrast.style.textAlign = 'center';
    const bar = $('#kits > .panel > .toolbar');
    if(bar){
      bar.style.justifyContent = 'center';
      bar.style.flexWrap = 'nowrap';
      bar.style.alignItems = 'center';
    }
  }

  function seasonPolish(){
    const wrap = $('#season .season-next-wrap');
    if(wrap) wrap.style.justifyItems = 'center';
    const row = $('#season .season-next-match');
    if(row){
      row.style.margin = '0 auto';
      row.style.justifyItems = 'center';
    }
  }

  function runAll(){
    requestAnimationFrame(() => {
      repaintCompactStats();
      kitPolish();
      seasonPolish();
    });
    setTimeout(() => {
      repaintCompactStats();
      kitPolish();
      seasonPolish();
    }, 80);
  }

  if(typeof window.show === 'function'){
    const originalShow = window.show;
    window.show = function(id){
      const out = originalShow.apply(this, arguments);
      if(id === 'halftime' || id === 'postmatch' || id === 'kits' || id === 'season') runAll();
      return out;
    };
    try{ show = window.show; }catch(e){}
  }

  if(typeof window.renderKitScreen === 'function'){
    const originalKit = window.renderKitScreen;
    window.renderKitScreen = function(){
      const out = originalKit.apply(this, arguments);
      runAll();
      return out;
    };
    try{ renderKitScreen = window.renderKitScreen; }catch(e){}
  }

  if(typeof window.renderSeasonView === 'function'){
    const originalSeasonView = window.renderSeasonView;
    window.renderSeasonView = function(){
      const out = originalSeasonView.apply(this, arguments);
      runAll();
      return out;
    };
    try{ renderSeasonView = window.renderSeasonView; }catch(e){}
  }

  window.addEventListener('resize', runAll, { passive:true });
  document.addEventListener('DOMContentLoaded', runAll);
  runAll();
})();
