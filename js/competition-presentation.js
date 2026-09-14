/* One identity shared by match UI, stadium boards and trophy ceremony. */
(function(){
'use strict';
const definitions={
 friendly:{name:'AMICHEVOLE',accent:'#71c4b8',dark:'#153e43',trophy:'friendly'},
 seriea:{name:'SERIE A · SCUDETTO',accent:'#d5b35f',dark:'#142f57',trophy:'scudetto'},
 finaleight:{name:'SERIE A · FINAL EIGHT',accent:'#d5b35f',dark:'#142f57',trophy:'scudetto'},
 italia:{name:'COPPA ITALIA',accent:'#65bc91',dark:'#153c36',trophy:'italia'},
 cdc:{name:'COPPA DEI CAMPIONI',accent:'#a7c8ff',dark:'#101f55',trophy:'cdc'},
 uefa:{name:'COPPA UEFA',accent:'#eeb976',dark:'#423024',trophy:'uefa'},
 world:{name:'COPPA DEL MONDO · FRANCIA 98',accent:'#e2c467',dark:'#163d78',trophy:'world'},
 euro:{name:'EURO 2000',accent:'#82d4df',dark:'#173f55',trophy:'euro'},
 supercoppa:{name:'SUPERCOPPA ITALIANA',accent:'#d6adc9',dark:'#3c2850',trophy:'supercoppa'}
};
function key(){return S9V10.matchContext?.state?.key||'seriea'}
function active(){return definitions[key()]||definitions.seriea}
function stadium(){const ctx=S9V10.matchContext;return ctx?.stadium||teamMeta[current?.h]?.stadium||T(current?.h)?.stadium||'Stadio nazionale'}
function apply(){
 const brand=active(),k=key();
 for(const id of ['prematch','kits','match','halftime','postmatch']){
  const el=document.getElementById(id);if(!el)continue;
  el.dataset.competitionKey=k;el.style.setProperty('--competition-accent',brand.accent);el.style.setProperty('--competition-dark',brand.dark);
 }
 const label=document.getElementById('stadiumLabel');if(label&&current?.h)label.textContent='DIRETTA: '+stadium().toUpperCase();
 const strip=document.querySelector('#match .radio-strip > span:last-child');if(strip)strip.textContent=brand.name;
 const ctx=S9V10.matchContext;
 const stage=ctx?.mode==='friendly'?(ctx.final?'FINALE · ESIBIZIONE':'AMICHEVOLE'):ctx?.match?.stage||'CAMPIONATO';
 for(const id of ['prematch','kits','halftime','postmatch']){
  const root=document.getElementById(id);if(!root)continue;
  let banner=root.querySelector('.s9-competition-banner');if(!banner){banner=document.createElement('div');banner.className='s9-competition-banner';root.appendChild(banner)}
  banner.textContent=brand.name+' · '+stage+(ctx?.stadium?' · '+ctx.stadium:'');
 }
}
function stadiumStyle(){
 const name=stadium().toLowerCase();
 const track=/olimpico|stade de france|san paolo/.test(name);
 const tiers=/san siro|bernab|camp nou/.test(name)?5:3;
 return {track,tiers,seats:/wembley|olimpico/.test(name)?'#983d43':/kuip/.test(name)?'#567f85':'#385572'};
}
window.S9Competition={definitions,key,active,stadium,stadiumStyle,apply};
const originalScore=updateScore;updateScore=function(){const result=originalScore.apply(this,arguments);apply();return result};
const originalPrematch=openPrematch;openPrematch=function(){const result=originalPrematch.apply(this,arguments);apply();return result};
})();
