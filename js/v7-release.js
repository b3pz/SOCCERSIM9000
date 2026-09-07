/* SerieA 9000 SIM — V7 RELEASE CANDIDATE runtime polish */
(function(){
  'use strict';
  const EVENT_ASSETS={
    goal:'assets/events/goal.png',offside:'assets/events/offside.png',foul:'assets/events/foul.png',
    yellow:'assets/events/yellow.png',red:'assets/events/red.png',sub:'assets/events/substitution.png'
  };
  let toastTimer=0;
  function ensureToast(){
    let el=document.getElementById('v7EventToast');
    if(el) return el;
    el=document.createElement('div'); el.id='v7EventToast'; el.setAttribute('aria-live','polite');
    el.innerHTML='<img alt=""><div><div class="v7-event-title"></div><div class="v7-event-sub"></div></div>';
    const match=document.getElementById('match'); (match||document.body).appendChild(el); return el;
  }
  function eventKind(text){
    const t=String(text||'').toUpperCase();
    if(t.includes('GOOOL')||/\bGOL\b/.test(t)) return ['goal','GOOOL!'];
    if(t.includes('FUORIGIOCO')) return ['offside','FUORIGIOCO'];
    if(t.includes('ESPULSIONE')||t.includes('ROSSO')) return ['red','ESPULSIONE'];
    if(t.includes('AMMONIZIONE')||t.includes('GIALLO')) return ['yellow','AMMONIZIONE'];
    if(t.includes('CAMBIO')||t.includes('SOSTITUZ')) return ['sub','SOSTITUZIONE'];
    if(t.includes('FALLO')) return ['foul','FALLO'];
    return null;
  }
  window.v7ShowEvent=function(kind,title,sub,duration){
    const el=ensureToast(),img=el.querySelector('img');
    img.src=EVENT_ASSETS[kind]||''; img.alt=title||'';
    el.querySelector('.v7-event-title').textContent=title||'';
    el.querySelector('.v7-event-sub').textContent=sub||'';
    clearTimeout(toastTimer); el.classList.add('show');
    toastTimer=setTimeout(()=>el.classList.remove('show'),duration||1700);
  };

  /* Every important commentary event gets a visual cue. */
  if(typeof window.log==='function'){
    const originalLog=window.log;
    window.log=function(txt,side){
      const out=originalLog.apply(this,arguments); const k=eventKind(txt);
      if(k) window.v7ShowEvent(k[0],k[1],String(txt).replace(/^\d+'\s*/,''),k[0]==='goal'?2300:1500);
      return out;
    };
    try{ log=window.log; }catch(e){}
  }

  /* Add offside and genuine opponent substitutions to generated matches. */
  if(typeof window.buildMatch==='function'){
    const originalBuildMatch=window.buildMatch;
    window.buildMatch=function(h,a){
      const m=originalBuildMatch.apply(this,arguments);
      const rnd=(lo,hi)=>Math.floor(Math.random()*(hi-lo+1))+lo;
      const pickOne=arr=>arr[Math.floor(Math.random()*arr.length)];
      for(let i=0;i<rnd(2,5);i++){
        const side=Math.random()<.5?'home':'away',id=side==='home'?h:a,st=career?.teamStates?.[id];
        const pool=st?.players||[]; if(pool.length) m.events.push({min:rnd(6,88),type:'offside',side,player:pickOne(pool)});
      }
      const oppId=(career&&career.user===h)?a:h, oppSide=oppId===h?'home':'away';
      const n=rnd(1,3), used=new Set();
      for(let i=0;i<n;i++){ let minute=rnd(56+i*5,Math.min(84,72+i*7)); while(used.has(minute)) minute++; used.add(minute); m.events.push({min:minute,type:'sub',side:oppSide,teamId:oppId}); }
      m.events.sort((x,y)=>x.min-y.min); return m;
    };
    try{ buildMatch=window.buildMatch; }catch(e){}
  }

  function aiSub(e){
    const id=e.teamId||(e.side==='home'?current.h:current.a), st=career?.teamStates?.[id]; if(!st)return null;
    const starters=st.players.filter(p=>st.lineup.includes(p.id));
    const bench=st.players.filter(p=>!st.lineup.includes(p.id));
    if(!starters.length||!bench.length||(st.subs||0)>=3)return null;
    const outPool=starters.filter(p=>p.pos!=='GK'); const out=(outPool.length?outPool:starters)[Math.floor(Math.random()*(outPool.length||starters.length))];
    let compatible=bench.filter(p=>p.pos===out.pos); const inp=(compatible.length?compatible:bench)[Math.floor(Math.random()*(compatible.length||bench.length))];
    const ix=st.lineup.indexOf(out.id); if(ix<0)return null; st.lineup[ix]=inp.id; st.subs=(st.subs||0)+1;
    return {out,inp};
  }

  if(typeof window.doEvent==='function'){
    const originalDoEvent=window.doEvent;
    window.doEvent=async function(e){
      if(e&&e.type==='offside'){
        while(paused) await wait(250); current.minute=e.min; updateScore(); whistle();
        log(`${e.min}' FUORIGIOCO - ${e.player?.name||'attaccante'}`,e.side); showPitchImportant();
        current.keyEvents.push(`${e.min}' Fuorigioco ${e.player?.name||''}`.trim());
        await wait(1250); hidePitch(); return;
      }
      if(e&&e.type==='sub'){
        while(paused) await wait(250); current.minute=e.min; updateScore();
        const sw=aiSub(e); if(sw){
          const team=T(e.teamId||(e.side==='home'?current.h:current.a));
          log(`${e.min}' CAMBIO ${team.name}: ${sw.out.name} ↓  ${sw.inp.name} ↑`,e.side);
          current.keyEvents.push(`${e.min}' Cambio ${team.name}: ${sw.out.name} / ${sw.inp.name}`);
          setupPitch(); await wait(1100);
        }
        return;
      }
      return originalDoEvent.apply(this,arguments);
    };
    try{ doEvent=window.doEvent; }catch(e){}
  }

  /* Connected-background transparency for the historical kit sprites.
     Only the light region connected to the image border becomes transparent,
     so white parts of a shirt remain intact. */
  const transparentCache=new Map();
  function removeConnectedLightBackground(img){
    const src=img.currentSrc||img.src; if(!src||transparentCache.has(src)){ if(transparentCache.has(src)) img.src=transparentCache.get(src); return; }
    const work=new Image(); work.onload=()=>{
      try{
        const maxDim=700,scale=Math.min(1,maxDim/Math.max(work.naturalWidth,work.naturalHeight));
        const w=Math.max(1,Math.round(work.naturalWidth*scale)),h=Math.max(1,Math.round(work.naturalHeight*scale));
        const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(work,0,0,w,h);
        const im=ctx.getImageData(0,0,w,h),d=im.data,seen=new Uint8Array(w*h),stack=[];
        const seed=(x,y)=>{const p=y*w+x;if(!seen[p]){seen[p]=1;stack.push(p)}};
        for(let x=0;x<w;x++){seed(x,0);seed(x,h-1)} for(let y=1;y<h-1;y++){seed(0,y);seed(w-1,y)}
        const isBg=p=>{const i=p*4,r=d[i],g=d[i+1],b=d[i+2];return r>212&&g>212&&b>207&&Math.max(r,g,b)-Math.min(r,g,b)<34};
        while(stack.length){const p=stack.pop(); if(!isBg(p))continue; d[p*4+3]=0; const x=p%w,y=(p/w)|0; if(x>0)seed(x-1,y);if(x<w-1)seed(x+1,y);if(y>0)seed(x,y-1);if(y<h-1)seed(x,y+1)}
        ctx.putImageData(im,0,0); const out=c.toDataURL('image/png');transparentCache.set(src,out);img.src=out;
      }catch(err){console.warn('Kit transparency skipped',err)}
    }; work.src=src;
  }
  window.v7ProcessKits=function(){document.querySelectorAll('#kits .kit-imgbox img').forEach(img=>{ if(img.complete)removeConnectedLightBackground(img); else img.addEventListener('load',()=>removeConnectedLightBackground(img),{once:true}); });};
  if(typeof window.renderKitScreen==='function'){
    const originalRenderKit=window.renderKitScreen;
    window.renderKitScreen=function(){const r=originalRenderKit.apply(this,arguments);setTimeout(window.v7ProcessKits,0);return r};
    try{ renderKitScreen=window.renderKitScreen; }catch(e){}
  }

  /* Keep every active screen fitted after resize/orientation changes. */
  function fit(){
    document.documentElement.style.setProperty('--v7-vh',(window.innerHeight*.01)+'px');
    const active=document.querySelector('.screen.active'); if(active) active.dataset.v7Viewport=`${innerWidth}x${innerHeight}`;
  }
  addEventListener('resize',fit,{passive:true}); addEventListener('orientationchange',fit,{passive:true});
  document.addEventListener('DOMContentLoaded',()=>{
    fit(); ensureToast();
    const note=document.querySelector('.prototype-note'); if(note) note.textContent='V7 RELEASE CANDIDATE · UI FINAL PASS · EVENTI VISIVI · CAMBI CPU · SALVATAGGI MULTIPLI';
    const opt=document.getElementById('simpleMessageBody');
  });
})();
