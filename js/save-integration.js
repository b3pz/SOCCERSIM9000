(() => {
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function setCareerView(view){
 const modal=$('#s9CareerModal');
 modal.dataset.view=view;
 modal.querySelectorAll('[data-career-view]').forEach(el=>el.hidden=el.dataset.careerView!==view);
 $('#s9CareerHeading').textContent=view==='load'?'CARICA CARRIERA':view==='contract'?'LA TUA NUOVA PANCHINA':'MODALITÀ CARRIERA';
}
function startNewCareer(){
 $('#s9CareerModal').classList.remove('open');
 $('#managerName').value='';
 $('#managerStep').style.display='none';
 $('#teamStep').style.display='block';
 const setup=$('#setup');setup.classList.remove('v72-manager-mode');setup.classList.add('v72-team-mode');
 show('setup');renderTeamPicker();$('#createCareer').focus({preventScroll:true});
}
function ensureUI(){
 if($('#s9CareerModal'))return;
 const d=document.createElement('div');d.id='s9CareerModal';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','s9CareerHeading');
 d.innerHTML=`<div class="s9-save-panel"><button class="s9-close" type="button" aria-label="Chiudi">×</button><h2 id="s9CareerHeading">MODALITÀ CARRIERA</h2>
 <div data-career-view="choice"><p class="s9-choice-intro">Una nuova panchina. Oppure una storia da continuare.</p><div class="s9-career-choices"><button id="s9NewCareer"><strong>NUOVA CARRIERA</strong><span>Scegli i tuoi colori. Il resto è da scrivere.</span></button><button id="s9LoadCareer"><strong>CARICA CARRIERA</strong><span>La tua squadra ti aspetta.</span></button></div></div>
 <div data-career-view="load" hidden><div class="s9-actions"><button id="s9CareerBack">◀ INDIETRO</button><button id="s9ImportCareer">IMPORTA SALVATAGGIO</button><input id="s9ImportFile" type="file" accept=".s9save,application/json" hidden></div><h3>LE TUE CARRIERE</h3><div id="s9CareerList"></div><div class="s9-note">Le carriere sono salvate su questo dispositivo. Esporta una copia per conservarle o trasferirle.</div></div>
 <form data-career-view="contract" id="s9ContractForm" hidden><div class="s9-contract-club" id="s9ContractClub"></div><div class="s9-contract-letter"><p>«L’ultima stagione è finita tra i fischi. Avevamo promesso ai tifosi un posto in Europa, e li abbiamo delusi. La qualificazione non è arrivata. Abbiamo deciso di cambiare allenatore.</p><p>Quest’anno niente Coppa dei Campioni e niente Coppa UEFA. Ci aspettano il campionato e la Coppa Italia: è da lì che dobbiamo ripartire.</p><p>Non ti chiediamo promesse. Vogliamo rivedere una squadra per cui la gente abbia voglia di venire allo stadio. L’Europa, poi, dovremo riguadagnarcela sul campo.</p><p>La panchina è tua. Se te la senti, firma qui.»</p><span>— La dirigenza</span></div><label for="s9ContractName">LA TUA FIRMA · NOME ALLENATORE</label><input id="s9ContractName" maxlength="24" required autocomplete="off" placeholder="Nome e cognome"><div class="s9-actions"><button type="button" id="s9ContractBack">◀ CAMBIA SQUADRA</button><button type="submit" id="s9SignContract">FIRMA E INIZIA LA CARRIERA ▶</button></div></form></div>`;
 document.body.appendChild(d);
 const close=()=>{d.classList.remove('open');(d.dataset.view==='contract'?$('#createCareer'):$('#careerModeBtn')).focus({preventScroll:true})};
 d.querySelector('.s9-close').onclick=close;
 d.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();close()}
  if(e.key==='Tab'){
   const items=[...d.querySelectorAll('button,input')].filter(el=>!el.disabled&&el.getClientRects().length);
   const first=items[0],last=items[items.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
 });
 $('#s9NewCareer').onclick=startNewCareer;
 $('#s9LoadCareer').onclick=async()=>{setCareerView('load');$('#s9CareerList').textContent='Caricamento…';$('#s9CareerBack').focus();try{await renderList()}catch(err){$('#s9CareerList').textContent='Salvataggi non disponibili: '+err.message}};
 $('#s9CareerBack').onclick=openCareerMenu;
 $('#s9ContractBack').onclick=close;
 $('#s9ContractForm').onsubmit=async e=>{
  e.preventDefault();const name=$('#s9ContractName').value.trim();if(!name){$('#s9ContractName').focus();return}
  const sign=$('#s9SignContract');if(sign.disabled)return;sign.disabled=true;
  try{
   $('#managerName').value=name;
   $('#createCareer').onclick();
   d.classList.remove('open');
   career.careerId=career.careerId||S9Save.uuid();
   await S9Save.putCareer(career,{careerId:career.careerId});await S9Save.backupCareer(career);
  }catch(err){alert('Impossibile completare l’avvio o il salvataggio: '+err.message)}finally{sign.disabled=false}
 };
 $('#s9ImportCareer').onclick=()=>$('#s9ImportFile').click();
 $('#s9ImportFile').onchange=async e=>{if(!e.target.files[0])return;try{await S9Save.importCareer(e.target.files[0]);await renderList()}catch(err){alert('Impossibile importare il salvataggio: '+err.message)}finally{e.target.value=''}};
}
function openContract(){
 ensureUI();setCareerView('contract');
 const club=T($('#managerTeam').value);
 $('#s9ContractClub').textContent=club.name+' · Stagione 1998/99';
 $('#s9ContractName').value=$('#managerName').value;
 $('#s9CareerModal').classList.add('open');
 // v10.4 — su schermi bassi (telefono orizzontale) il focus automatico sul
 // campo nome faceva scorrere il pannello per portarlo in vista, nascondendo
 // la lettera dall'inizio. focus({preventScroll:true}) evita lo scorrimento
 // automatico del browser, poi si riporta il pannello in cima a mano.
 $('#s9ContractName').focus({preventScroll:true});
 const panel=document.querySelector('#s9CareerModal .s9-save-panel');
 if(panel)panel.scrollTop=0;
}
async function renderList(){ensureUI();const box=$('#s9CareerList'),list=await S9Save.listCareers();box.innerHTML=list.length?'':`<div class="s9-empty">Nessuna carriera salvata.</div>`;for(const r of list){const el=document.createElement('div');el.className='s9-save-card';let club=null;try{club=typeof T==='function'?T(r.clubId):null}catch(e){}const clubLabel=club?`${club.name} ${club.season}`:(r.clubId||'Carriera');const manager=r.managerName||r.saveData?.manager||'Manager';const crest=club?`assets/crests/italian/${club.id}.png`:'';el.innerHTML=`<div class="s9-save-main">${crest?`<img class="s9-club-crest" src="${crest}" alt="">`:''}<div><b>${esc(manager)} · ${esc(clubLabel)}</b><small>Stagione ${Number(r.seasonYear)||1998}/${String((r.seasonYear+1)%100).padStart(2,'0')} · Giornata ${Number(r.matchday)||0}<br>Ultimo salvataggio: ${new Date(r.updatedAt).toLocaleString('it-IT')}</small></div></div><div class="s9-card-actions"><button data-a="load">CONTINUA</button><button data-a="export">ESPORTA</button><button data-a="delete">ELIMINA</button></div>`;el.querySelector('[data-a=load]').onclick=async()=>{try{const rec=await S9Save.getCareer(r.careerId);if(!rec)return;career=window.S9V10?.normalizeCareer?S9V10.normalizeCareer(rec.saveData):rec.saveData;document.querySelector('#s9CareerModal').classList.remove('open');renderSeason();show('season')}catch(err){alert('Impossibile caricare la carriera: '+err.message)}};el.querySelector('[data-a=export]').onclick=()=>S9Save.exportCareer(r.careerId);el.querySelector('[data-a=delete]').onclick=async()=>{if(confirm('Eliminare questa carriera?')){await S9Save.deleteCareer(r.careerId);renderList()}};box.appendChild(el);}}
function openCareerMenu(){ensureUI();setCareerView('choice');$('#s9CareerModal').classList.add('open');$('#s9NewCareer').focus();}
function install(){
 ensureUI();const c=$('#careerModeBtn');if(c)c.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openCareerMenu()},true);
 const create=$('#createCareer');if(create){create.textContent='PROSEGUI AL CONTRATTO ▶';create.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openContract()},true)}
 const back=$('#teamBack');if(back)back.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();show('mainMenu');openCareerMenu()},true);
 let lastSnapshot='',saving=false;
setInterval(async()=>{
 if(saving||typeof career==='undefined'||!career?.careerId||window.S9V10?.matchContext||window.S9V10?.standalone||current?._running)return;
 const c=career,stamp=JSON.stringify([c.careerId,c.seasonYear,c.round,c.teamStates?.[c.user],Object.values(c.v10Cups||{}).map(s=>[s.id,s.phase,s.played]),c.v10FinalEight?.phase]);
 if(stamp===lastSnapshot)return;saving=true;
 try{await S9Save.putCareer(c,{careerId:c.careerId});await S9Save.backupCareer(c);lastSnapshot=stamp}catch(e){console.warn('Autosave:',e)}finally{saving=false}
},1500);}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();