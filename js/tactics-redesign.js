/* Matchday squad room: one clear workflow for pre-match edits and live substitutions. */
(function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fullTeam=id=>{const t=T(id);return t?`${t.name} ${t.season}`:'—'};
function playerStatus(p){
 if((p.injuryGames||0)>0)return `INFORTUNATO · ${p.injuryGames} G`;
 if((p.suspensionGames||0)>0)return `SQUALIFICATO · ${p.suspensionGames} G`;
 return p.yellowStreak===2?'DIFFIDATO':'';
}
function displayFitness(p,kind){
 const base=Number.isFinite(p.fitness)?p.fitness:100;
 const live=!window._prematchEdit&&current?.minute&&kind==='out'?Math.round(current.minute*.12):0;
 return Math.max(20,Math.min(100,Math.round(base-live)));
}
function numberFor(p){
 const st=career?.teamStates?.[career.user],ix=st?.players?.findIndex(x=>x.id===p.id)??-1;
 return String(ix+1).padStart(2,'0');
}
function squadCard(p,kind,slot=-1){
 const status=playerStatus(p),blocked=!!status&&status!=='DIFFIDATO',fit=displayFitness(p,kind);
 const condition=fit<55?'low':fit<75?'medium':'good';
 return `<div class="s9-squad-card selectable ${blocked?'v103-unavailable':''}" data-${kind}="${p.id}" data-v103-player="${p.id}" tabindex="${blocked?'-1':'0'}"${blocked?' aria-disabled="true"':''}>
  <span class="s9-squad-number" title="Numero di maglia ${numberFor(p)}">${numberFor(p)}</span>
  <span class="s9-squad-person"><b>${esc(p.name)}</b><small>${esc(p.pos)} · ${esc(roleGroup(p.pos))}${status?` · <i>${esc(status)}</i>`:''}</small></span>
  <span class="s9-squad-rating"><small>OVR</small><b>${p.overall}</b></span>
  <span class="s9-squad-condition ${condition}"><small>COND</small><b>${fit}%</b><i style="--condition:${fit}%"></i></span>
  <span class="s9-squad-form"><small>MOR</small><b>${p.morale}</b></span>
 </div>`;
}
function installShell(){
 const modal=$('#tacticsModal'),oldDo=$('#doSub'),oldClose=$('#closeTactics');if(!modal||modal.dataset.squadRoom)return;
 const doAction=oldDo?.onclick,closeAction=oldClose?.onclick;
 modal.dataset.squadRoom='true';modal.classList.add('s9-squad-room');
 modal.innerHTML=`<div class="s9-squad-shell" role="document">
  <header class="s9-squad-head">
   <div class="s9-squad-club"><img id="squadClubCrest" alt=""><span><small id="squadMode">GESTIONE ROSA</small><strong id="squadTeamName">SQUADRA</strong></span></div>
  <div class="s9-squad-match" id="squadMatchContext"></div>
  <button type="button" id="closeTactics" class="s9-squad-close" aria-label="Chiudi gestione squadra">CHIUDI ×</button>
  </header>
  <div class="s9-squad-scroll">
  <div class="s9-squad-toolbar">
   <label><span>MODULO</span><select id="liveFormation"></select></label>
   <label><span>ATTEGGIAMENTO</span><select id="liveMentality"><option>Difensivo</option><option>Normale</option><option>Offensivo</option></select></label>
   <div class="s9-squad-counter"><span id="squadCounterLabel">CAMBI</span><strong id="subsCount">0/3</strong></div>
  </div>
  <div class="s9-transfer-desk">
   <div class="s9-transfer-slot out" id="squadOutSlot"><small>1 · SCEGLI CHI ESCE</small><strong>Nessun titolare selezionato</strong></div>
   <div class="s9-transfer-arrow" aria-hidden="true">→</div>
   <div class="s9-transfer-slot in" id="squadInSlot"><small>2 · SCEGLI CHI ENTRA</small><strong>Nessuna riserva selezionata</strong></div>
   <button type="button" id="doSub" disabled>CONFERMA CAMBIO</button>
  </div>
  <main class="s9-squad-columns">
   <section class="s9-squad-list"><header><span>TITOLARI</span><small>Seleziona il giocatore da sostituire</small></header><div id="startersTable" tabindex="0" aria-label="Scorri i titolari"></div></section>
   <section class="s9-squad-list bench"><header><span>PANCHINA</span><small>Seleziona il giocatore da inserire</small></header><div id="benchTable" tabindex="0" aria-label="Scorri la panchina"></div></section>
  </main>
  <details class="s9-squad-setpieces"><summary>BATTITORI E CALCI PIAZZATI</summary><div id="liveSetPieces"></div></details>
  </div>
 </div>`;
 const newDo=$('#doSub'),newClose=$('#closeTactics');if(doAction)newDo.onclick=doAction;if(closeAction)newClose.onclick=closeAction;
}
function selectedPlayer(id){return career?.teamStates?.[career.user]?.players?.find(p=>p.id===id)}
function updateTransferDesk(){
 const st=career?.teamStates?.[career.user];if(!st)return;
 const out=selectedPlayer(selectedOut),inp=selectedPlayer(selectedIn),outSlot=$('#squadOutSlot'),inSlot=$('#squadInSlot'),button=$('#doSub');
 if(outSlot)outSlot.innerHTML=out?`<small>USCITA · N° ${numberFor(out)} · ${esc(out.pos)}</small><strong>${esc(out.name)}</strong><span>OVR ${out.overall} · COND ${displayFitness(out,'out')}%</span>`:'<small>1 · SCEGLI CHI ESCE</small><strong>Nessun titolare selezionato</strong>';
 if(inSlot)inSlot.innerHTML=inp?`<small>ENTRATA · N° ${numberFor(inp)} · ${esc(inp.pos)}</small><strong>${esc(inp.name)}</strong><span>OVR ${inp.overall} · COND ${displayFitness(inp,'in')}%</span>`:'<small>2 · SCEGLI CHI ENTRA</small><strong>Nessuna riserva selezionata</strong>';
 if(button){button.textContent=window._prematchEdit?'CONFERMA MODIFICA':'CONFERMA CAMBIO';button.setAttribute('aria-label',out&&inp?`${out.name} esce, ${inp.name} entra`:button.textContent)}
 const invalid=!(out&&inp)||(!window._prematchEdit&&st.subs>=3)||(window.S9V10?.canSubstitute&&!S9V10.canSubstitute(st,selectedOut,selectedIn,!!window._prematchEdit));
 if(button)button.disabled=invalid;
}
function bindCards(){
 const activate=(card,kind)=>{
  if(card.getAttribute('aria-disabled')==='true')return;
  if(kind==='out')selectedOut=card.dataset.out;else selectedIn=card.dataset.in;
  $$(`[data-${kind}]`).forEach(x=>x.classList.toggle('selected',x===card));updateTransferDesk();
 };
 for(const kind of ['out','in'])$$(`[data-${kind}]`).forEach(card=>{
  card.onclick=()=>activate(card,kind);card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(card,kind)}};
 });
}
function openSquadRoom(){
 if(window.S9V10?.matchContext?.spectator)return;
 installShell();const st=career?.teamStates?.[career.user],team=career&&T(career.user);if(!st||!team)return;
 const modal=$('#tacticsModal');if(modal.style.display!=='flex')tacticsWasPaused=paused;paused=true;selectedOut=null;selectedIn=null;
 if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
 $('#liveFormation').innerHTML=team.formations.map(f=>`<option ${f===st.formation?'selected':''}>${esc(f)}</option>`).join('');$('#liveMentality').value=st.mentality;
 const starters=st.lineup.map(id=>st.players.find(p=>p.id===id)).filter(Boolean);
 $('#startersTable').innerHTML=starters.map((p,slot)=>squadCard(p,'out',slot)).join('');
 $('#benchTable').innerHTML=st.players.filter(p=>!st.lineup.includes(p.id)).map(p=>squadCard(p,'in')).join('');
 $('#startersTable').scrollTop=0;$('#benchTable').scrollTop=0;
 const crest=window.S9V10_DATA?.crestPath?.(career.user)||CREST_ASSETS[career.user]||'';const crestEl=$('#squadClubCrest');crestEl.src=crest;crestEl.alt=`Stemma ${fullTeam(career.user)}`;
 $('#squadTeamName').textContent=fullTeam(career.user);$('#squadMode').textContent=window._prematchEdit?'PREPARAZIONE GARA':'TATTICA IN PARTITA';
 $('#squadMatchContext').textContent=window._prematchEdit?'MODIFICHE LIBERE':`${current?.minute||0}' · ${fullTeam(current?.h)} vs ${fullTeam(current?.a)}`;
 $('#squadCounterLabel').textContent=window._prematchEdit?'ROSA':'CAMBI USATI';$('#subsCount').textContent=window._prematchEdit?'LIBERI':`${st.subs||0}/3`;
 renderSetPieces('#liveSetPieces');collapseSetPieceMenus();bindCards();updateTransferDesk();modal.style.display='flex';
 const shell=modal.querySelector('.s9-squad-shell');if(shell){shell.scrollTop=0;requestAnimationFrame(()=>{modal.scrollTop=0;shell.scrollTop=0})}
}
function install(){
 installShell();window.openTactics=openSquadRoom;try{openTactics=openSquadRoom}catch(e){}
 const live=$('#tacticsBtn'),half=$('#halfTactics'),pre=$('#prematchLineup');
 if(live)live.onclick=()=>{window._prematchEdit=false;openSquadRoom()};if(half)half.onclick=()=>{window._prematchEdit=false;openSquadRoom()};if(pre)pre.onclick=()=>{window._prematchEdit=true;openSquadRoom()};
 // The later condition module may call these after rebuilding a squad list.
 window.bindSubRows=bindCards;try{bindSubRows=bindCards}catch(e){}window.updateSubButton=updateTransferDesk;try{updateSubButton=updateTransferDesk}catch(e){}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
