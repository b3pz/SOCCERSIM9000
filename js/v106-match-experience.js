/* Match view follows salient events; playback speed is the only pace control. */
(function(){
'use strict';
/* ---------------- AUTO-SWITCH AZIONI SALIENTI ---------------- */
function currentMatchView(){return document.getElementById('match')?.dataset.matchView||'pitch'}
function openMatchView(view){
  const tab=document.querySelector(`#match .match-tabs span[data-match-view="${view}"]`);
  if(tab){tab.click();return true}
  return false;
}
function isSalient(e){
  return !!e&&['goal','chance','red','injury'].includes(e.type);
}
function highlightMode(){return window.S9Match3D?.mode==='highlights'}

try{
  const oldDoEventV106=doEvent;
  doEvent=async function(e){
    const matchEl=document.getElementById('match');
    const before=currentMatchView();
    const auto=highlightMode()&&before!=='pitch'&&isSalient(e)&&document.getElementById('match')?.classList.contains('active');
    if(auto){
      if(matchEl)matchEl.dataset.v106AutoHighlight='1';
      openMatchView('pitch');
    }
    try{
      return await oldDoEventV106.apply(this,arguments);
    }finally{
      if(auto){
        /* Se durante l'azione l'utente ha scelto manualmente un'altra scheda,
           non sovrascriviamo la sua scelta. Altrimenti torniamo alla scheda
           che stava consultando prima dell'azione saliente. */
        if(currentMatchView()==='pitch')openMatchView(before);
        if(matchEl)delete matchEl.dataset.v106AutoHighlight;
      }
    }
  };
}catch(e){console.warn('V10.6 highlight auto-switch non installato',e)}


})();
