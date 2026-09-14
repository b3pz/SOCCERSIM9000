(function(){
'use strict';
const $=s=>document.querySelector(s);
const LOGOS={
  italia:'assets/competition_buttons/coppa_italia.png',
  cdc:'assets/competition_buttons/coppa_campioni.png',
  uefa:'assets/competition_buttons/uefa_cup.png',
  world:'assets/competition_buttons/francia98.png',
  euro:'assets/competition_buttons/euro2000.png',
  seriea:'assets/league/serie_a_league.png',
  finaleight:'assets/league/serie_a_league.png',
  friendly:'assets/logo/seriea9000_logo.png',
  supercoppa:'assets/league/serie_a_league.png'
};
function key(){return window.S9V10?.matchContext?.state?.key||'seriea'}
function brand(){return window.S9Competition?.active?.()||{name:'SERIE A',accent:'#d5b35f',dark:'#142f57'}}
function stage(){const c=window.S9V10?.matchContext;return c?.mode==='friendly'?(c.final?'FINALE · ESIBIZIONE':'AMICHEVOLE'):(c?.match?.stage||'PARTITA')}
function teams(){
 const f=current?.fixture;
 if(f&&typeof T==='function'&&T(f[0])&&T(f[1]))return[T(f[0]),T(f[1])];
 if(current&&typeof T==='function'&&T(current.h)&&T(current.a))return[T(current.h),T(current.a)];
 return[];
}
function stadium(){
 const c=window.S9V10?.matchContext;
 const home=current?.fixture?.[0]||current?.h;
 return c?.stadium||teamMeta?.[home]?.stadium||T(home)?.stadium||'Stadio storico';
}
function compactPrematch(){
 const root=$('#prematch');if(!root)return;
 root.classList.add('v110-prematch');
 let hero=root.querySelector('.v107-prematch-hero');
 if(!hero){return;}
 hero.classList.add('v110-prematch-hero');
 const ts=teams(),b=brand(),k=key(),logo=LOGOS[k]||LOGOS.seriea;
 // Il vecchio hero V107 era troppo alto e conteneva un carosello di TUTTE le coppe.
 // Qui diventa una testata compatta e il piccolo logo che scorre e' soltanto quello
 // della competizione corrente.
 const oldAction=root.querySelector('#startMatch')?.closest('.panel');
 hero.innerHTML=`
   <div class="v110-head-main">
    <div class="v110-brand-block">
      <div class="v110-kicker">SERIEA 9000 SIM · PRE-PARTITA</div>
      <div class="v110-title">${escapeHTML(b.name)}</div>
      <div class="v110-matchline">${escapeHTML(stage())} · ${escapeHTML(ts[0]?.name||'CASA')} VS ${escapeHTML(ts[1]?.name||'OSPITI')}</div>
    </div>
    <div class="v110-logo-window" aria-hidden="true"><div class="v110-logo-runner">${Array.from({length:1},()=>`<img src="${logo}" alt="">`).join('')}</div></div>
    <div class="v110-stadium-block"><span>STADIO</span><strong>${escapeHTML(stadium()).toUpperCase()}</strong></div>
    <div class="v110-action-slot"></div>
   </div>`;
 const slot=hero.querySelector('.v110-action-slot');
 if(oldAction&&slot){oldAction.classList.add('v110-prematch-actions');slot.appendChild(oldAction)}
 const banner=root.querySelector('.s9-competition-banner');if(banner)banner.hidden=true;
}
function wrapPrematch(){
 if(typeof window.openPrematch!=='function'||window.openPrematch.__v110Wrapped)return;
 const base=window.openPrematch;
 window.openPrematch=function(){const out=base.apply(this,arguments);requestAnimationFrame(compactPrematch);return out};
 window.openPrematch.__v110Wrapped=true;
}
function init(){wrapPrematch();if($('#prematch.active'))requestAnimationFrame(compactPrematch)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
