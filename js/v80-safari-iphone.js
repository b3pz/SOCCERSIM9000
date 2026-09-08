/* SerieA 9000 SIM — V8.0 Safari iPhone orientation / visual viewport bridge */
(function(){
  'use strict';

  const root=document.documentElement;
  let raf=0;

  function viewport(){
    const vv=window.visualViewport;
    return {
      w:Math.max(1,Math.round(vv?vv.width:window.innerWidth)),
      h:Math.max(1,Math.round(vv?vv.height:window.innerHeight))
    };
  }

  function isPhoneLike(w,h){
    const ua=navigator.userAgent||'';
    const iPhone=/iPhone|iPod/i.test(ua) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1 && Math.min(w,h)<=600);
    const touch=(navigator.maxTouchPoints||0)>0;
    return (iPhone||touch) && Math.min(w,h)<=600 && Math.max(w,h)<=1200;
  }

  function ensureRotateOverlay(){
    if(document.getElementById('s9RotateDevice')) return;
    const el=document.createElement('div');
    el.id='s9RotateDevice';
    el.setAttribute('aria-live','polite');
    el.innerHTML=`<div class="s9-rotate-card">
      <img class="s9-rotate-logo" src="assets/logo/seriea9000_logo.png" alt="SerieA 9000 SIM">
      <span class="s9-rotate-icon" aria-hidden="true">↻</span>
      <h2 class="s9-rotate-title">Ruota l'iPhone</h2>
      <p class="s9-rotate-copy">SerieA 9000 SIM è progettato per essere giocato in orizzontale. Ruota il telefono per continuare.</p>
      <div class="s9-rotate-credit">Sviluppato ed ideato da b3pZ</div>
    </div>`;
    document.body.appendChild(el);
  }

  function apply(){
    raf=0;
    const {w,h}=viewport();
    const phone=isPhoneLike(w,h);
    const portrait=phone && h>=w;
    const landscape=phone && w>h;

    root.style.setProperty('--s9-vw',w+'px');
    root.style.setProperty('--s9-vh',h+'px');
    root.classList.toggle('s9-phone-portrait',portrait);
    root.classList.toggle('s9-phone-landscape',landscape);
    root.dataset.s9Viewport=`${w}x${h}`;
    root.dataset.s9Orientation=portrait?'portrait':(landscape?'landscape':'desktop');

    /* Keep the older V7.8 artboard layer in sync, but V8.0 remains the final authority. */
    root.style.setProperty('--v75-vw',w+'px');
    root.style.setProperty('--v75-vh',h+'px');
    if(landscape){
      root.style.setProperty('--v75-head-h','0px');
      root.style.setProperty('--v75-main-h',h+'px');
      root.classList.add('v75-phone-landscape');
      try{window.scrollTo(0,0);}catch(_e){}
    }else{
      root.classList.remove('v75-phone-landscape');
    }
  }

  function schedule(){
    if(!raf) raf=requestAnimationFrame(apply);
  }

  function settle(){
    schedule();
    setTimeout(schedule,60);
    setTimeout(schedule,220);
    setTimeout(schedule,520);
    setTimeout(schedule,950);
  }

  document.addEventListener('DOMContentLoaded',function(){
    ensureRotateOverlay();
    settle();
  });
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',settle,{passive:true});
  window.addEventListener('pageshow',settle,{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',schedule,{passive:true});
    window.visualViewport.addEventListener('scroll',schedule,{passive:true});
  }
  settle();
})();
