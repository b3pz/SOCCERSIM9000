/* SerieA 9000 SIM — V7.5 visual viewport / artboard compatibility */
(function(){
  'use strict';
  const root=document.documentElement;
  const RATIO=16/9;
  let raf=0;

  function measure(){
    raf=0;
    const vv=window.visualViewport;
    const vw=Math.max(1, Math.round(vv ? vv.width : window.innerWidth));
    const vh=Math.max(1, Math.round(vv ? vv.height : window.innerHeight));
    const phoneLandscape=(vw>vh && vh<=600 && vw>=560 && vw<=1200);
    const header=document.querySelector('header');
    const hh=phoneLandscape ? 0 : Math.max(0, Math.round(header ? header.getBoundingClientRect().height : 58));
    const mainH=phoneLandscape ? vh : Math.max(260, vh-hh);
    let sw,sh;
    if(vw/mainH >= RATIO){ sh=mainH; sw=Math.round(sh*RATIO); }
    else { sw=vw; sh=Math.round(sw/RATIO); }

    root.style.setProperty('--v75-vw',vw+'px');
    root.style.setProperty('--v75-vh',vh+'px');
    root.style.setProperty('--v75-head-h',hh+'px');
    root.style.setProperty('--v75-main-h',mainH+'px');
    root.style.setProperty('--v75-stage-w',sw+'px');
    root.style.setProperty('--v75-stage-h',sh+'px');
    root.classList.toggle('v75-phone-landscape',phoneLandscape);
    root.classList.toggle('v75-short', sh<650);
    root.classList.toggle('v75-very-short', sh<560);
    root.dataset.v75Viewport=`${vw}x${vh}`;
    root.dataset.v75Stage=`${sw}x${sh}`;
    root.dataset.v75PhoneLandscape=phoneLandscape?'1':'0';
    if(phoneLandscape){ try{ window.scrollTo(0,0); }catch(_e){} }

    /* Remove stale inline drift left by older kit render passes. */
    document.querySelectorAll('#kits .kit-imgbox img').forEach(img=>{
      img.style.transform='none';
      img.style.objectPosition='50% 50%';
      img.style.marginLeft='auto';
      img.style.marginRight='auto';
    });
  }
  function schedule(){ if(!raf) raf=requestAnimationFrame(measure); }
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(schedule,50),{passive:true});
  if(window.visualViewport){
    visualViewport.addEventListener('resize',schedule,{passive:true});
    visualViewport.addEventListener('scroll',schedule,{passive:true});
  }
  document.addEventListener('DOMContentLoaded',()=>{
    measure();
    const note=document.querySelector('.prototype-note');
    if(note) note.textContent='V7.5 BROWSER COMPAT · SAFARI + CHROME WINDOWED · ARTBOARD 16:9 · ROSE ITALIANE V7.4';
  });
  setTimeout(measure,0); setTimeout(measure,250); setTimeout(measure,800);
})();
