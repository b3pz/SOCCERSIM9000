/* SerieA 9000 SIM — V7.1 FINAL POLISH runtime guardrails */
(function(){
  'use strict';
  const match=document.getElementById('match');
  let eventReset=0;

  /* Unify event visuals: when the V7 toast is active, suppress legacy overlay for the same event. */
  if(typeof window.v7ShowEvent==='function'){
    const original=window.v7ShowEvent;
    window.v7ShowEvent=function(kind,title,sub,duration){
      if(match){match.dataset.v71Event=kind||'';clearTimeout(eventReset);eventReset=setTimeout(()=>{delete match.dataset.v71Event},Math.max(1900,(duration||1700)+220));}
      return original.apply(this,arguments);
    };
  }

  /* Keep kit art geometrically centered after every render, including late image loads. */
  function centerKits(){
    document.querySelectorAll('#kits .kit-imgbox img').forEach(img=>{
      img.style.objectPosition='50% 50%';
      img.style.marginLeft='auto'; img.style.marginRight='auto';
      img.decoding='async';
    });
  }
  if(typeof window.renderKitScreen==='function'){
    const original=window.renderKitScreen;
    window.renderKitScreen=function(){const out=original.apply(this,arguments);requestAnimationFrame(centerKits);setTimeout(centerKits,80);return out;};
    try{renderKitScreen=window.renderKitScreen}catch(e){}
  }

  /* Viewport guard: desktop screens remain fitted; mobile is allowed to flow vertically. */
  function viewportGuard(){
    document.documentElement.style.setProperty('--v71-real-vh',(window.innerHeight*.01)+'px');
    document.querySelectorAll('.screen.active').forEach(s=>s.dataset.v71Viewport=window.innerWidth+'x'+window.innerHeight);
    centerKits();
  }
  addEventListener('resize',viewportGuard,{passive:true});
  addEventListener('orientationchange',viewportGuard,{passive:true});

  /* Accessibility/readability: give generated main controls meaningful labels where missing. */
  function patchA11y(){
    const prev=document.getElementById('prevTeam'),next=document.getElementById('nextTeam');
    if(prev&&!prev.getAttribute('aria-label'))prev.setAttribute('aria-label','Squadra precedente');
    if(next&&!next.getAttribute('aria-label'))next.setAttribute('aria-label','Squadra successiva');
    const home=document.getElementById('kitHomeImg'),away=document.getElementById('kitAwayImg');
    if(home)home.setAttribute('draggable','false'); if(away)away.setAttribute('draggable','false');
  }

  document.addEventListener('DOMContentLoaded',()=>{
    viewportGuard();patchA11y();centerKits();
    const note=document.querySelector('.prototype-note');
    if(note)note.textContent='V7.1 FINAL POLISH · RELEASE CANDIDATE PUBBLICABILE · EVENTI VISIVI · CAMBI CPU · SALVATAGGI MULTIPLI';
  });
})();
