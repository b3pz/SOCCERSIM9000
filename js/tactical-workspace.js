/* Direct, touch-friendly pre-match formation editor. Existing match state remains authoritative. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles={GK:'Portiere',DF:'Difensore',MF:'Centrocampista',AM:'Trequartista',ST:'Attaccante',FW:'Attaccante'};
let root,slot=null,candidate=null,filter='ALL',query='',history=[],fixture=null,notice='',layoutMode=false;
/* Griglia di disposizione libera: 3 zone (difesa/centrocampo/attacco) da 2 linee
   ciascuna, più la porta. La larghezza (x) resta libera; la profondità (y) scatta
   sulla linea più vicina, così lo schema resta leggibile ma personalizzabile
   (es. rombo a centrocampo, terzini/ali più alti, difesa che si allarga). */
const DEPTH_LINES=[80,66,52,38,24,10];
function nearestLine(y){return DEPTH_LINES.reduce((best,v)=>Math.abs(v-y)<Math.abs(best-y)?v:best,DEPTH_LINES[0]);}
function effectiveLayout(s){
 const base=slots(s.formation);
 if(!Array.isArray(s.customLayout)||s.customLayout.length!==base.length)return base;
 return base.map((b,i)=>i===0?b:{...b,...s.customLayout[i]});
}
const state=()=>career?.teamStates?.[career.user];
const player=id=>state()?.players.find(p=>p.id===id);
const number=p=>state().players.findIndex(x=>x.id===p.id)+1;
const fit=p=>Math.round(p.fitness??100);
const unavailable=p=>(p.injuryGames||0)>0||(p.suspensionGames||0)>0;
function slots(formation){
 const rows=formation.split('-').map(Number),out=[{x:50,y:89,role:'GK'}];
 rows.forEach((count,row)=>{for(let i=0;i<count;i++)out.push({x:100*(i+1)/(count+1),y:70-row*54/Math.max(1,rows.length-1),role:row===0?'DF':row===rows.length-1?'ST':row===rows.length-2&&count<=3&&rows.length>=4?'AM':'MF'})});return out;
}
const compatible=(p,role)=>p.pos===role||(['MF','AM'].includes(p.pos)&&['MF','AM'].includes(role))||(['ST','FW'].includes(p.pos)&&role==='ST');
function save(){const s=state();history.push({lineup:[...s.lineup],formation:s.formation,mentality:s.mentality,setPieces:{...s.setPieces},customLayout:s.customLayout?s.customLayout.map(p=>({...p})):null});if(history.length>20)history.shift();}
function arrange(s,formation){
 const pool=s.lineup.map(id=>s.players.find(p=>p.id===id)).filter(Boolean),result=[];
 for(const target of slots(formation)){let i=pool.findIndex(p=>p.pos===target.role);if(i<0)i=pool.findIndex(p=>compatible(p,target.role));if(i<0)i=pool.findIndex(p=>p.pos!=='GK');if(i<0)i=0;if(pool[i])result.push(pool.splice(i,1)[0].id);}
 return result;
}
function selectSlot(i){if(slot!==null&&slot!==i){candidate=state().lineup[i];}else{slot=slot===i?null:i;candidate=null;}notice='';render();}
function confirm(){
 const s=state(),out=s.lineup[slot],incoming=player(candidate);if(slot===null||!incoming||(!s.lineup.includes(incoming.id)&&!S9V10.canSubstitute(s,out,incoming.id,true)))return;
 const outgoing=player(out);if((outgoing.pos==='GK')!==(incoming.pos==='GK'))return;
 save();const other=s.lineup.indexOf(incoming.id);if(other>=0){s.lineup[other]=out;s.lineup[slot]=incoming.id;notice='Posizioni scambiate. Controlla la compatibilità dei ruoli.';candidate=null;render();return;}s.lineup[slot]=incoming.id;for(const key of Object.keys(s.setPieces||{}))if(s.setPieces[key]===out)s.setPieces[key]=incoming.id;
 notice=`${outgoing.name} esce · ${incoming.name} entra nello stesso posto.`;candidate=null;render();
}
function choosePlayer(id){
 if(slot===null){notice='Seleziona prima un giocatore sul campo.';render();return;}
 candidate=id;notice='';render();
}
function row(p){
 const selected=candidate===p.id,status=p.injuryGames>0?'Infortunato':p.suspensionGames>0?'Squalificato':'';
 return `<button type="button" class="tw-reserve ${selected?'chosen':''}" data-reserve="${esc(p.id)}" draggable="${status?'false':'true'}" ${status?'disabled':''}><span class="tw-number">${number(p)}</span><span class="tw-person"><b>${esc(p.name)}</b><small>${roles[p.pos]||p.pos}${status?' · '+status:''}</small></span><span class="tw-value"><b>${p.overall}</b><small>OVR</small></span><span class="tw-value ${fit(p)<70?'low':''}"><b>${fit(p)}%</b><small>COND.</small></span></button>`;
}
function render(){
 const s=state();if(!root||!s)return;
 const scroll=root.querySelector('.tw-reserves')?.scrollTop||0;
 const team=T(career.user),layout=effectiveLayout(s),on=s.lineup.map(player).filter(Boolean),out=slot===null?null:on[slot],incoming=player(candidate);
 const warnings=on.filter((p,i)=>!compatible(p,layout[i]?.role)||unavailable(p));
 const bench=s.players.filter(p=>!s.lineup.includes(p.id)).filter(p=>filter==='ALL'||p.pos===filter||(filter==='ST'&&p.pos==='FW')).filter(p=>p.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const ordered=bench.sort((a,b)=>Number(unavailable(a))-Number(unavailable(b))||(out?Number(!compatible(a,layout[slot]?.role))-Number(!compatible(b,layout[slot]?.role)):0)||b.overall-a.overall);
 const canConfirm=out&&incoming&&(s.lineup.includes(incoming.id)||S9V10.canSubstitute(s,out.id,incoming.id,true))&&((out.pos==='GK')===(incoming.pos==='GK'));
 root.innerHTML=`<div class="tw-heading"><button type="button" data-action="back" class="tw-back">← INDIETRO</button><div><small>PREPARAZIONE PARTITA</small><h1>${esc(team.name)} <span>${esc(team.season)}</span></h1><p>${esc((current?.fixture||[]).map(id=>{const t=T(id);return t.name+' '+t.season}).join(' · '))}</p></div><button type="button" data-action="kits" class="tw-primary">SCEGLI DIVISE →</button></div>
 <div class="tw-settings"><label>MODULO<select id="twFormation">${team.formations.map(f=>`<option ${s.formation===f?'selected':''}>${f}</option>`).join('')}</select></label><fieldset><legend>ATTEGGIAMENTO</legend>${['Difensivo','Normale','Offensivo'].map(m=>`<button type="button" data-mentality="${m}" aria-pressed="${s.mentality===m}">${m}</button>`).join('')}</fieldset><div class="tw-readiness"><b>${on.length}/11</b><span>TITOLARI · COND. ${Math.round(on.reduce((n,p)=>n+fit(p),0)/Math.max(1,on.length))}%</span><button type="button" data-action="undo" ${history.length?'':'disabled'}>↶ Annulla ultima modifica</button></div></div>
 <div class="tw-main"><div class="tw-board"><div class="tw-board-title"><b>LA TUA FORMAZIONE</b><span>${esc(s.formation)} · ATTACCO ↑</span></div><div class="tw-layout-tools"><button type="button" data-action="layout-mode" aria-pressed="${layoutMode}" class="${layoutMode?'tw-primary':''}">${layoutMode?'✓ FINE DISPOSIZIONE LIBERA':'✎ DISPOSIZIONE LIBERA'}</button>${s.customLayout?'<button type="button" data-action="layout-reset">↺ Ripristina modulo base</button>':''}</div><p class="tw-help">${layoutMode?'Trascina un giocatore per cambiare la sua posizione in campo: la larghezza è libera, la profondità si aggancia alla linea più vicina.':'Seleziona un titolare, poi una riserva o un altro titolare per scambiare posizione.'}</p><div class="tw-pitch"><div class="tw-field-lines" aria-hidden="true"><i></i><em></em></div>${on.map((p,i)=>{const pt=layout[i]||{x:50,y:50},warning=!compatible(p,pt.role)||unavailable(p);return `<button type="button" data-slot="${i}" aria-pressed="${slot===i}" aria-label="${esc(p.name)}, numero ${number(p)}, ${roles[p.pos]}, posizione ${roles[pt.role]}, condizione ${fit(p)}%" class="tw-player ${slot===i?'chosen':''} ${warning?'warning':''}" draggable="true" style="left:${pt.x}%;top:${pt.y}%"><span class="tw-shirt">${number(p)}</span><b>${esc(p.name.split(' ').slice(-1)[0])}</b><small>${roles[pt.role]||pt.role} · ${fit(p)}%</small></button>`}).join('')}</div><div class="tw-warning">${warnings.length?`${warnings.length} giocatori da controllare: ${warnings.map(p=>esc(p.name)+(unavailable(p)?' (non disponibile)':' (fuori ruolo)')).join(', ')}.`:'✓ Undici completo · ruoli coperti'}</div></div>
 <div class="tw-bench"><div class="tw-board-title"><b>PANCHINA</b><span>${s.players.length-on.length} GIOCATORI</span></div><label class="tw-search">CERCA GIOCATORE<input id="twSearch" type="search" placeholder="Nome del giocatore" value="${esc(query)}"></label><div class="tw-filters" aria-label="Filtra per ruolo">${[['ALL','Tutti'],['GK','POR'],['DF','DIF'],['MF','CEN'],['AM','TRQ'],['ST','ATT']].map(([v,n])=>`<button type="button" data-filter="${v}" aria-pressed="${filter===v}">${n}</button>`).join('')}</div><div class="tw-reserves">${ordered.map(row).join('')||'<p class="tw-empty">Nessun giocatore corrisponde al filtro.</p>'}</div></div></div>
 <div class="tw-transfer" aria-live="polite"><div><small>${out?'TITOLARE SELEZIONATO':'GESTIONE FORMAZIONE'}</small><strong>${out?`N° ${number(out)} · ${esc(out.name)}`:'Scegli chi schierare'}</strong><span>${out?`${roles[out.pos]} · OVR ${out.overall} · Condizione ${fit(out)}% · Morale ${out.morale}`:'I cambi pre-partita sono liberi. Ogni riserva prende il posto selezionato.'}</span>${out?'<button type="button" data-action="profile">Scheda giocatore</button>':''}</div><div><small>${incoming?'GIOCATORE IN ENTRATA':'CONFRONTO'}</small><strong>${incoming?`N° ${number(incoming)} · ${esc(incoming.name)}`:'Seleziona una riserva'}</strong><span>${incoming?`${roles[incoming.pos]} · OVR ${incoming.overall} (${incoming.overall-out.overall>=0?'+':''}${incoming.overall-out.overall}) · Condizione ${fit(incoming)}%`:'Qualità, condizione e ruolo prima di confermare.'}</span>${incoming&&!compatible(incoming,layout[slot]?.role)?'<em>Attenzione: ruolo diverso dalla posizione selezionata.</em>':''}</div><button type="button" data-action="confirm" class="tw-primary" ${canConfirm?'':'disabled'}>${incoming&&s.lineup.includes(incoming.id)?'SCAMBIA POSIZIONI':'CONFERMA CAMBIO'}</button></div>
 <div class="tw-notice" role="status">${esc(notice)}</div><details class="tw-setpieces"><summary>BATTITORI E CALCI PIAZZATI</summary><div>${[['penalty','Rigori'],['direct','Punizioni dirette'],['indirect','Punizioni indirette'],['cornerL','Angoli sinistri'],['cornerR','Angoli destri']].map(([key,label])=>`<label>${label}<select data-setpiece="${key}">${on.map(p=>`<option value="${esc(p.id)}" ${s.setPieces?.[key]===p.id?'selected':''}>${number(p)} · ${esc(p.name)}</option>`).join('')}</select></label>`).join('')}</div></details>`;
 root.querySelector('.tw-reserves').scrollTop=scroll;
 root.querySelector('#twFormation').onchange=e=>{save();s.lineup=arrange(s,e.target.value);s.formation=e.target.value;s.customLayout=null;slot=null;candidate=null;notice='Modulo aggiornato: gli stessi undici sono stati riposizionati per ruolo.';render();};
 root.querySelector('#twSearch').oninput=e=>{query=e.target.value;const cursor=e.target.selectionStart;render();const input=root.querySelector('#twSearch');input.focus({preventScroll:true});try{input.setSelectionRange(cursor,cursor)}catch(_){}};
 root.querySelectorAll('[data-slot]').forEach(b=>{
  b.onclick=()=>{if(!layoutMode)selectSlot(+b.dataset.slot)};
  b.ondragstart=e=>{e.dataTransfer.setData('text/plain','slot:'+b.dataset.slot);e.dataTransfer.effectAllowed='move'};
  if(layoutMode){
   // In modalità disposizione la destinazione del drop è il campo stesso (posizione libera),
   // non un altro giocatore: lo scambio titolari/riserve resta disattivato qui.
   b.draggable=b.dataset.slot!=='0';
  }else{
   b.ondragover=e=>{e.preventDefault();b.classList.add('drag-over')};
   b.ondragleave=()=>b.classList.remove('drag-over');
   b.ondrop=e=>{
    e.preventDefault();b.classList.remove('drag-over');
    const data=e.dataTransfer.getData('text/plain'),targetIdx=+b.dataset.slot;
    if(!data)return;
    let dragCandidate=null;
    if(data.startsWith('slot:')){const fromIdx=+data.slice(5);if(fromIdx===targetIdx)return;dragCandidate=state().lineup[fromIdx];}
    else if(data.startsWith('reserve:'))dragCandidate=data.slice(8);
    if(!dragCandidate)return;
    slot=targetIdx;candidate=dragCandidate;render();confirm();
   };
  }
 });
 const pitch=root.querySelector('.tw-pitch');
 if(layoutMode&&pitch){
  pitch.ondragover=e=>e.preventDefault();
  pitch.ondrop=e=>{
   e.preventDefault();
   const data=e.dataTransfer.getData('text/plain');
   if(!data||!data.startsWith('slot:'))return;
   const i=+data.slice(5);if(i===0)return; // il portiere resta fisso in porta
   const rect=pitch.getBoundingClientRect();
   const x=Math.max(6,Math.min(94,((e.clientX-rect.left)/rect.width)*100));
   const y=nearestLine(((e.clientY-rect.top)/rect.height)*100);
   save();
   const next=(s.customLayout||slots(s.formation)).map(p=>({x:p.x,y:p.y}));
   next[i]={x:Math.round(x*10)/10,y};
   s.customLayout=next;
   notice='Disposizione aggiornata.';render();
  };
 }
 root.querySelectorAll('[data-reserve]').forEach(b=>{
  b.onclick=()=>choosePlayer(b.dataset.reserve);
  if(!b.disabled)b.ondragstart=e=>{e.dataTransfer.setData('text/plain','reserve:'+b.dataset.reserve);e.dataTransfer.effectAllowed='move'};
 });
 root.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;render()});
 root.querySelectorAll('[data-mentality]').forEach(b=>b.onclick=()=>{save();s.mentality=b.dataset.mentality;render()});
 root.querySelectorAll('[data-setpiece]').forEach(el=>el.onchange=()=>{save();s.setPieces[el.dataset.setpiece]=el.value;notice='Battitore aggiornato.';root.querySelector('.tw-notice').textContent=notice});
 root.querySelector('[data-action="confirm"]').onclick=confirm;
 root.querySelector('[data-action="layout-mode"]').onclick=()=>{layoutMode=!layoutMode;slot=null;candidate=null;render()};
 root.querySelector('[data-action="layout-reset"]')?.addEventListener('click',()=>{save();s.customLayout=null;notice='Disposizione ripristinata al modulo base.';render()});
 root.querySelector('[data-action="undo"]').onclick=()=>{const previous=history.pop();if(previous){Object.assign(s,previous);slot=null;candidate=null;notice='Ultima modifica annullata.';render()}};
 root.querySelector('[data-action="back"]').onclick=()=>document.getElementById('backSeason').click();
 root.querySelector('[data-action="kits"]').onclick=()=>{if(on.length!==11||on.some(unavailable)||on.filter(p=>p.pos==='GK').length!==1){notice='Completa gli undici con giocatori disponibili prima di proseguire.';root.querySelector('.tw-notice').textContent=notice;return}document.getElementById('startMatch').click()};
 root.querySelector('[data-action="profile"]')?.addEventListener('click',()=>showPlayerProfile(out.id));
}
function open(){
 const screen=document.getElementById('prematch');if(!screen||!state())return;
 screen.classList.add('tw-active');
 /* FIX 2026-09: #prematch can carry other legacy classes at the same time
    (e.g. "v110-prematch"), and some older rules chain several classes together
    (e.g. "#prematch.active.v110-prematch>.grid{display:grid!important}"), which
    out-specifies the plain ".tw-active>:not(.tw-workspace)" CSS hide rule, leaving
    the old PRE-PARTITA/Formazione panel visible underneath this new editor. Setting
    an inline !important declaration here wins over any external stylesheet
    !important rule regardless of its specificity, so this is the reliable fix. */
 Array.from(screen.children).forEach(el=>{
   if(!el.classList.contains('tw-workspace')) el.style.setProperty('display','none','important');
 });
 if(!root){
   root=document.createElement('div');root.className='tw-workspace';screen.appendChild(root);
 }
 root.style.removeProperty('display');
 if(fixture!==current){fixture=current;slot=null;candidate=null;history=[];filter='ALL';query='';notice='';}
 render();
}
const original=openPrematch;openPrematch=function(){const result=original.apply(this,arguments);open();return result};window.openPrematch=openPrematch;
window.S9TacticalWorkspace={slots,arrange,compatible,refresh:open};
/* Feedback visivo per il drag&drop: aggiunto una volta sola, il pannello viene ridisegnato spesso. */
const dragStyle=document.createElement('style');
dragStyle.textContent='.tw-player.drag-over{outline:3px solid #74dec9!important;outline-offset:2px}.tw-player[draggable="true"],.tw-reserve[draggable="true"]{cursor:grab}';
document.head.appendChild(dragStyle);
})();
