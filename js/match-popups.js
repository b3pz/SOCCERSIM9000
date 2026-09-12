/* Shared match event presentation. Artwork never identifies a player or team. */
(function(){
  'use strict';
  const events={
    goal:{title:'GOL!',asset:'goal.png',alt:'Pallone nella rete'},
    save:{title:'PARATA!',asset:'save-neutral.png',alt:'Guantone che ferma il pallone'},
    post:{title:'PALO!',asset:'post-neutral.png',alt:'Pallone che colpisce il palo'},
    miss:{title:'TIRO FUORI',asset:'miss-neutral.png',alt:'Pallone fuori dallo specchio della porta'},
    foul:{title:'FALLO',asset:'foul.png',alt:'Fischietto arbitrale'},
    offside:{title:'FUORIGIOCO',asset:'offside.png',alt:'Bandierina del guardalinee alzata'},
    yellow:{title:'AMMONIZIONE',asset:'yellow.png',alt:'Cartellino giallo'},
    red:{title:'ESPULSIONE',asset:'red.png',alt:'Cartellino rosso'},
    sub:{title:'SOSTITUZIONE',asset:'substitution-neutral.png',alt:'Tabellone con freccia rossa in uscita e verde in entrata'},
    injury:{title:'INFORTUNIO',asset:'injury-neutral.png',alt:'Borsa medica e fasciatura sportiva'},
    extra:{title:'SUPPLEMENTARI',asset:'foul.png',alt:'Fischietto per la ripresa del gioco'},
    penalties:{title:'CALCI DI RIGORE',asset:'penalties-neutral.png',alt:'Pallone sul dischetto davanti alla porta'},
    golden:{title:'GOLDEN GOAL!',asset:'goal.png',alt:'Pallone in rete: gol decisivo'}
  };
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function art(kind){const e=events[kind];return e?`<img class="s9-event-art" src="assets/events/${e.asset}" alt="${esc(e.alt)}">`:'';}
  function html(kind,info={}){
    const e=events[kind];if(!e)throw new Error('Unknown match popup: '+kind);
    return `<div class="s9-event-card" data-event-kind="${kind}">${art(kind)}<div class="s9-event-copy"><div class="s9-event-kicker">${esc(info.kicker||'DIRETTA PARTITA')}</div><h2>${esc(info.title||e.title)}</h2>${info.player?`<div class="s9-event-player">${esc(info.player)}</div>`:''}${info.detail?`<div class="s9-event-detail">${esc(info.detail)}</div>`:''}${info.footer?`<div class="s9-event-footer">${esc(info.footer)}</div>`:''}</div></div>`;
  }
  // Major events already have a central popup; commentary only opens compact
  // notices for the remaining events, preventing duplicate goal/card/save alerts.
  function detect(text){
    const t=String(text||'').toUpperCase();
    if(t.includes('FUORIGIOCO'))return 'offside';
    if(t.includes('CAMBIO')||t.includes('SOSTITUZ'))return 'sub';
    if(t.includes('FALLO'))return 'foul';
    if(t.includes('PALO!'))return 'post';
    if(t.includes('TIRO FUORI'))return 'miss';
    return null;
  }
  window.S9Popups={events,art,html,detect,esc};
})();
