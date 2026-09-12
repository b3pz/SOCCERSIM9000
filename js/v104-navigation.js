/* SerieA 9000 SIM — V10.4 consistent return-to-menu navigation. */
(function(){
  'use strict';

  const buttonTargets=[
    ['setup','MENU PRINCIPALE'],
    ['season','MENU PRINCIPALE'],
    ['prematch','MENU PRINCIPALE'],
    ['kits','MENU PRINCIPALE'],
    ['match','ABBANDONA PARTITA'],
    ['halftime','ABBANDONA PARTITA'],
    ['postmatch','MENU PRINCIPALE'],
    ['v10CupSetup','MENU PRINCIPALE'],
    ['v10Tournament','MENU PRINCIPALE'],
    ['v10FinalEight','MENU PRINCIPALE'],
    ['v10Trophy','MENU PRINCIPALE']
  ];

  function closeOverlays(){
    window._prematchEdit=false;
    ['tacticsModal','playerModal'].forEach(function(id){
      const el=document.getElementById(id);
      if(el) el.style.display='none';
    });
    const careerModal=document.getElementById('s9CareerModal');
    if(careerModal){
      careerModal.classList.remove('open');
      /* Never leave display:none inline: .open must be able to show it again. */
      careerModal.style.removeProperty('display');
    }
  }

  function resetCareerSetup(){
    const setup=document.getElementById('setup');
    const manager=document.getElementById('managerStep');
    const team=document.getElementById('teamStep');
    if(manager) manager.style.display='block';
    if(team) team.style.display='none';
    if(setup){
      setup.classList.add('v72-manager-mode');
      setup.classList.remove('v72-team-mode');
      setup.scrollTop=0;
    }
  }

  function openMainMenu(){
    closeOverlays();
    if(typeof window.show==='function') window.show('mainMenu');
    else{
      document.querySelectorAll('.screen').forEach(function(el){el.classList.remove('active')});
      const menu=document.getElementById('mainMenu');
      if(menu) menu.classList.add('active');
    }
    window.scrollTo(0,0);
  }

  function leaveCurrentScreen(){
    const live=document.querySelector('#match.active,#halftime.active');
    if(live){
      if(!window.confirm('Abbandonare la partita in corso e tornare al menu principale?')) return;
      try{sessionStorage.setItem('v104-return-menu','1')}catch(e){}
      window.location.reload();
      return;
    }
    if(window.S9V10?.leaveContext)S9V10.leaveContext();
    resetCareerSetup();
    openMainMenu();
  }

  function installButtons(){
    buttonTargets.forEach(function(item){
      const screen=document.getElementById(item[0]);
      if(!screen||screen.querySelector(':scope > .v104-menu-back')) return;
      const button=document.createElement('button');
      button.type='button';
      button.className='v104-menu-back';
      button.textContent='◀ '+item[1];
      button.setAttribute('aria-label',item[1]);
      button.addEventListener('click',leaveCurrentScreen);
      screen.prepend(button);
    });
  }

  function installSeasonViewState(){
    if(typeof window.renderSeasonView!=='function'||window.renderSeasonView._v104Wrapped) return;
    const original=window.renderSeasonView;
    const wrapped=function(view){
      const season=document.getElementById('season');
      if(season) season.dataset.seasonView=view||'next';
      const result=original.apply(this,arguments);
      requestAnimationFrame(function(){
        const content=document.getElementById('seasonContent');
        if(content){content.scrollTop=0;content.scrollLeft=0}
      });
      return result;
    };
    wrapped._v104Wrapped=true;
    window.renderSeasonView=wrapped;
  }

  installButtons();
  installSeasonViewState();
  window.addEventListener('load',function(){installButtons();installSeasonViewState()},{once:true});

  /* The save-system creates this button dynamically. Reset the wizard before
     its own click handler opens #setup, including on the second visit. */
  document.addEventListener('click',function(event){
    if(event.target.closest('#s9NewCareer')) resetCareerSetup();
    if(event.target.closest('#season [data-view]')){
      const button=event.target.closest('[data-view]');
      const season=document.getElementById('season');
      if(season&&button) season.dataset.seasonView=button.dataset.view||'next';
      requestAnimationFrame(function(){
        const content=document.getElementById('seasonContent');
        if(content){content.scrollTop=0;content.scrollLeft=0}
      });
    }
  },true);

  try{
    if(sessionStorage.getItem('v104-return-menu')==='1'){
      sessionStorage.removeItem('v104-return-menu');
      const title=document.getElementById('titleScreen');
      if(title){title.style.display='none';title.style.pointerEvents='none'}
      openMainMenu();
    }
  }catch(e){}
})();
