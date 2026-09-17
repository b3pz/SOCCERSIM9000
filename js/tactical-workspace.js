/* Direct, touch-friendly pre-match formation editor. Existing match state remains authoritative. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles={GK:'Portiere',DF:'Difensore',MF:'Centrocampista',AM:'Trequartista',ST:'Attaccante',FW:'Attaccante'};
let root,slot=null,candidate=null,filter='ALL',query='',history=[],fixture=null,notice='',layoutMode=false,layoutSelected=null;
/* Griglia di disposizione libera: 3 zone (difesa/centrocampo/attacco) da 2 linee
   ciascuna, più la porta. La larghezza (x) resta libera; la profondità (y) scatta
   sulla linea più vicina, così lo schema resta leggibile ma personalizzabile
   (es. rombo a centrocampo, terzini/ali più alti, difesa che si allarga). */
const DEPTH_LINES=[80,66,52,38,24,10];
function nearestLine(y){return DEPTH_LINES.reduce((best,v)=>Math.abs(v-y)<Math.abs(best-y)?v:best,DEPTH_LINES[0]);}
/* FIX 2026-09: in modalita' disposizione libera la x era completamente
   libera e la y scattava sulla riga piu' vicina, ma senza indicazioni
   visive le persone toccavano il campo "a caso" senza sapere dove
   sarebbero finiti davvero. Questi pallini-fantasma (solo decorativi,
   pointer-events:none) marcano le 6 righe selezionabili per la profondita'
   con qualche colonna di riferimento, cosi' la disposizione resta guidata
   anche se la larghezza rimane libera. */
const LAYOUT_COLS=[10,30,50,70,90];
function layoutGhostGrid(){
 return `<div class="tw-layout-grid" aria-hidden="true">${DEPTH_LINES.map(y=>LAYOUT_COLS.map(x=>`<span class="tw-layout-dot" style="left:${x}%;top:${y}%"></span>`).join('')).join('')}</div>`;
}
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
function selectSlot(i){if(layoutMode){layoutSelected=layoutSelected===i?null:i;notice='';render();return}if(slot!==null&&slot!==i){candidate=state().lineup[i];}else{slot=slot===i?null:i;candidate=null;}notice='';render();}
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
 return `<button type="button" class="tw-reserve ${selected?'chosen':''}" data-reserve="${esc(p.id)}" ${status?'disabled':''}><span class="tw-number">${number(p)}</span><span class="tw-person"><b>${esc(p.name)}</b><small>${roles[p.pos]||p.pos}${status?' · '+status:''}</small></span><span class="tw-value"><b>${p.overall}</b><small>OVR</small></span><span class="tw-value ${fit(p)<70?'low':''}"><b>${fit(p)}%</b><small>COND.</small></span></button>`;
}
function render(){
 const s=state();if(!root||!s)return;
 const scroll=root.querySelector('.tw-reserves')?.scrollTop||0;
 const team=T(career.user),layout=effectiveLayout(s),on=s.lineup.map(player).filter(Boolean),out=slot===null?null:on[slot],incoming=player(candidate);
 const warnings=on.filter((p,i)=>!compatible(p,layout[i]?.role)||unavailable(p));
 const bench=s.players.filter(p=>!s.lineup.includes(p.id)).filter(p=>filter==='ALL'||p.pos===filter||(filter==='ST'&&p.pos==='FW')).filter(p=>p.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const ordered=bench.sort((a,b)=>Number(unavailable(a))-Number(unavailable(b))||(out?Number(!compatible(a,layout[slot]?.role))-Number(!compatible(b,layout[slot]?.role)):0)||b.overall-a.overall);
 const canConfirm=out&&incoming&&(s.lineup.includes(incoming.id)||S9V10.canSubstitute(s,out.id,incoming.id,true))&&((out.pos==='GK')===(incoming.pos==='GK'));
 root.innerHTML=`<div class="tw-heading"><button type="button" data-action="back" class="tw-back">← INDIETRO</button><div><small>PREPARAZIONE PARTITA</small><h1>${esc(team.name)} <span>${esc(team.season)}</span></h1><p>${esc((current?.fixture||[]).map(id=>{const t=T(id);return t.name+' '+t.season}).join(' · '))}</p>${(window.pickMatchFlavor?.((current?.h||'')+(current?.a||'')+(current?.id||''),3)||[]).map(line=>`<p class="tw-flavor" style="margin-top:4px;font-style:italic;font-size:12px;line-height:1.4;color:#c9d6e5;opacity:.85;max-width:52ch">» ${esc(line)}</p>`).join('')}</div><button type="button" data-action="kits" class="tw-primary">SCEGLI DIVISE →</button></div>
 <div class="tw-settings"><label>MODULO<select id="twFormation">${team.formations.map(f=>`<option ${s.formation===f?'selected':''}>${f}</option>`).join('')}</select></label><fieldset><legend>ATTEGGIAMENTO</legend>${['Difensivo','Normale','Offensivo'].map(m=>`<button type="button" data-mentality="${m}" aria-pressed="${s.mentality===m}">${m}</button>`).join('')}</fieldset><div class="tw-readiness"><b>${on.length}/11</b><span>TITOLARI · COND. ${Math.round(on.reduce((n,p)=>n+fit(p),0)/Math.max(1,on.length))}%</span><button type="button" data-action="undo" ${history.length?'':'disabled'}>↶ Annulla ultima modifica</button></div></div>
 <div class="tw-main"><div class="tw-board"><div class="tw-board-title"><b>LA TUA FORMAZIONE</b><span>${esc(s.formation)} · ATTACCO ↑</span></div><div class="tw-layout-tools"><button type="button" data-action="layout-mode" aria-pressed="${layoutMode}" class="${layoutMode?'tw-primary':''}">${layoutMode?'✓ FINE DISPOSIZIONE LIBERA':'✎ DISPOSIZIONE LIBERA'}</button>${s.customLayout?'<button type="button" data-action="layout-reset">↺ Ripristina modulo base</button>':''}</div><p class="tw-help">${layoutMode?(layoutSelected===null?'Tocca un giocatore, poi tocca il punto del campo dove vuoi spostarlo.':'Ora tocca il punto del campo dove vuoi spostare questo giocatore.'):'Seleziona un titolare, poi una riserva o un altro titolare per scambiare posizione.'}</p><div class="tw-pitch ${layoutMode?'tw-layout-active':''} ${layoutMode&&layoutSelected!==null?'tw-layout-picking':''}"><div class="tw-field-lines" aria-hidden="true"><i></i><em></em></div>${layoutMode?layoutGhostGrid():''}${on.map((p,i)=>{const pt=layout[i]||{x:50,y:50},warning=!compatible(p,pt.role)||unavailable(p);return `<button type="button" data-slot="${i}" aria-pressed="${layoutMode?layoutSelected===i:slot===i}" aria-label="${esc(p.name)}, numero ${number(p)}, ${roles[p.pos]}, posizione ${roles[pt.role]}, condizione ${fit(p)}%" class="tw-player ${(layoutMode?layoutSelected===i:slot===i)?'chosen':''} ${warning?'warning':''}" style="left:${pt.x}%;top:${pt.y}%"><span class="tw-shirt">${number(p)}</span><b>${esc(p.name.split(' ').slice(-1)[0])}</b><small>${roles[pt.role]||pt.role} · ${fit(p)}%</small></button>`}).join('')}</div><div class="tw-warning">${warnings.length?`${warnings.length} giocatori da controllare: ${warnings.map(p=>esc(p.name)+(unavailable(p)?' (non disponibile)':' (fuori ruolo)')).join(', ')}.`:'✓ Undici completo · ruoli coperti'}</div></div>
 <div class="tw-bench"><div class="tw-board-title"><b>PANCHINA</b><span>${s.players.length-on.length} GIOCATORI</span></div><label class="tw-search">CERCA GIOCATORE<input id="twSearch" type="search" placeholder="Nome del giocatore" value="${esc(query)}"></label><div class="tw-filters" aria-label="Filtra per ruolo">${[['ALL','Tutti'],['GK','POR'],['DF','DIF'],['MF','CEN'],['AM','TRQ'],['ST','ATT']].map(([v,n])=>`<button type="button" data-filter="${v}" aria-pressed="${filter===v}">${n}</button>`).join('')}</div><div class="tw-reserves">${ordered.map(row).join('')||'<p class="tw-empty">Nessun giocatore corrisponde al filtro.</p>'}</div></div></div>
 <div class="tw-transfer" aria-live="polite"><div><small>${out?'TITOLARE SELEZIONATO':'GESTIONE FORMAZIONE'}</small><strong>${out?`N° ${number(out)} · ${esc(out.name)}`:'Scegli chi schierare'}</strong><span>${out?`${roles[out.pos]} · OVR ${out.overall} · Condizione ${fit(out)}% · Morale ${out.morale}`:'I cambi pre-partita sono liberi. Ogni riserva prende il posto selezionato.'}</span>${out?'<button type="button" data-action="profile">Scheda giocatore</button>':''}</div><div><small>${incoming?'GIOCATORE IN ENTRATA':'CONFRONTO'}</small><strong>${incoming?`N° ${number(incoming)} · ${esc(incoming.name)}`:'Seleziona una riserva'}</strong><span>${incoming?`${roles[incoming.pos]} · OVR ${incoming.overall} (${incoming.overall-out.overall>=0?'+':''}${incoming.overall-out.overall}) · Condizione ${fit(incoming)}%`:'Qualità, condizione e ruolo prima di confermare.'}</span>${incoming&&!compatible(incoming,layout[slot]?.role)?'<em>Attenzione: ruolo diverso dalla posizione selezionata.</em>':''}</div><button type="button" data-action="confirm" class="tw-primary" ${canConfirm?'':'disabled'}>${incoming&&s.lineup.includes(incoming.id)?'SCAMBIA POSIZIONI':'CONFERMA CAMBIO'}</button></div>
 <div class="tw-notice" role="status">${esc(notice)}</div><details class="tw-setpieces"><summary>BATTITORI E CALCI PIAZZATI</summary><div>${[['penalty','Rigori'],['direct','Punizioni dirette'],['indirect','Punizioni indirette'],['cornerL','Angoli sinistri'],['cornerR','Angoli destri']].map(([key,label])=>`<label>${label}<select data-setpiece="${key}">${on.map(p=>`<option value="${esc(p.id)}" ${s.setPieces?.[key]===p.id?'selected':''}>${number(p)} · ${esc(p.name)}</option>`).join('')}</select></label>`).join('')}</div></details>`;
 root.querySelector('.tw-reserves').scrollTop=scroll;
 root.querySelector('#twFormation').onchange=e=>{save();s.lineup=arrange(s,e.target.value);s.formation=e.target.value;s.customLayout=null;slot=null;candidate=null;notice='Modulo aggiornato: gli stessi undici sono stati riposizionati per ruolo.';render();};
 root.querySelector('#twSearch').oninput=e=>{query=e.target.value;const cursor=e.target.selectionStart;render();const input=root.querySelector('#twSearch');input.focus({preventScroll:true});try{input.setSelectionRange(cursor,cursor)}catch(_){}};
 root.querySelectorAll('[data-slot]').forEach(b=>{
  b.onclick=()=>selectSlot(+b.dataset.slot);
 });
 const pitch=root.querySelector('.tw-pitch');
 if(layoutMode&&pitch){
  pitch.onclick=e=>{
   if(e.target.closest('[data-slot]'))return; // gestito sopra: seleziona/deseleziona il giocatore
   if(layoutSelected===null||layoutSelected===0)return; // il portiere resta fisso in porta
   const rect=pitch.getBoundingClientRect();
   const x=Math.max(6,Math.min(94,((e.clientX-rect.left)/rect.width)*100));
   const y=nearestLine(((e.clientY-rect.top)/rect.height)*100);
   save();
   const next=(s.customLayout||slots(s.formation)).map(p=>({x:p.x,y:p.y}));
   next[layoutSelected]={x:Math.round(x*10)/10,y};
   s.customLayout=next;
   layoutSelected=null;
   notice='Posizione aggiornata.';render();
  };
 }
 root.querySelectorAll('[data-reserve]').forEach(b=>{
  b.onclick=()=>choosePlayer(b.dataset.reserve);
 });
 root.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;render()});
 root.querySelectorAll('[data-mentality]').forEach(b=>b.onclick=()=>{save();s.mentality=b.dataset.mentality;render()});
 root.querySelectorAll('[data-setpiece]').forEach(el=>el.onchange=()=>{save();s.setPieces[el.dataset.setpiece]=el.value;notice='Battitore aggiornato.';root.querySelector('.tw-notice').textContent=notice});
 root.querySelector('[data-action="confirm"]').onclick=confirm;
 root.querySelector('[data-action="layout-mode"]').onclick=()=>{layoutMode=!layoutMode;layoutSelected=null;slot=null;candidate=null;render()};
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
/* Cursore "a mirino" quando si tocca il campo in modalità disposizione libera. */
const dragStyle=document.createElement('style');
dragStyle.textContent='.tw-pitch.tw-layout-active{cursor:crosshair}';
document.head.appendChild(dragStyle);
})();
