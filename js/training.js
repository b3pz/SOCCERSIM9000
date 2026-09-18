/* SerieA 9000 SIM — allenamenti settimanali in modalità carriera.
   Richiesta rimasta in sospeso da tempo ("macro blocco"): un motivo in più
   per aprire la carriera oltre alla prossima partita. Una volta per
   giornata il manager sceglie un focus di allenamento; l'effetto tocca
   fitness/morale dei giocatori, gli STESSI campi già usati dal motore di
   gioco (moraleMult/shotQuality in index.html), quindi ha un impatto reale
   sulla partita successiva, non è solo un testo di colore. */
(function(){
'use strict';
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const avgOf=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const pick=a=>a[Math.floor(Math.random()*a.length)];

const FOCI=[
 {key:'fisico',icon:'💪',label:'PREPARAZIONE FISICA',desc:'Scatti, resistenza, il preparatore atletico che urla numeri a caso.',
  outcomes:['La squadra torna dal campo distrutta ma un filo più tonica.','Il preparatore atletico dichiara “ottimo lavoro”, come ogni settimana, a prescindere dal risultato.','Qualche gamba pesante, ma la condizione generale migliora.'],
  apply(p){p.fitness=clamp((p.fitness??100)+rand(6,11),0,100)}},
 {key:'tecnico',icon:'⚽',label:'LAVORO TECNICO',desc:'Torelli, passaggi corti, qualche pallonetto finito sulla tribuna.',
  outcomes:['Buona seduta: due triangolazioni su tre sono riuscite, non male per essere lunedì.','Il vice allenatore ha disegnato uno schema nuovo. Nessuno lo ha capito, ma si sono divertiti.','Tecnica in crescita, anche se il rigorista si è fatto parare tre rigori su tre dal secondo portiere.'],
  apply(p){p.fitness=clamp((p.fitness??100)+rand(2,5),0,100);p.morale=clamp((p.morale??50)+rand(1,4),0,100)}},
 {key:'mentale',icon:'🔥',label:'CARICA MENTALE',desc:'Discorso motivazionale del mister e playlist ad alto volume in spogliatoio.',
  outcomes:['Il mister ha citato tre film sportivi diversi nello stesso discorso. Ha funzionato comunque.','Squadra compatta, capitano in prima fila ad applaudire con convinzione sospetta.','Musica a palla in spogliatoio: il gruppo sembra crederci davvero, per ora.'],
  apply(p){p.morale=clamp((p.morale??50)+rand(8,14),0,100)}},
 {key:'recupero',icon:'🧊',label:'SCARICO E RECUPERO',desc:'Piscina, massaggi, il fisioterapista che finisce il ghiaccio prima ancora di iniziare.',
  outcomes:['Bagno in piscina e defaticamento: la squadra respira meglio già da domani.','Il magazziniere ha ordinato più ghiaccio della settimana scorsa. Imparerà, prima o poi.','Recupero completato, qualche acciacco in meno da gestire per la prossima gara.'],
  apply(p){p.fitness=clamp((p.fitness??100)+rand(10,16),0,100);if(p.injuryGames)p.injuryGames=Math.max(0,p.injuryGames-2)}}
];

function trainingState(){
 if(!career)return null;
 career.training=career.training||{lastRound:-1,log:[]};
 return career.training;
}
function canTrainThisRound(){
 const t=trainingState();if(!t)return false;
 return t.lastRound!==(career.round??0);
}
function applyTraining(key){
 if(!canTrainThisRound())return;
 const focus=FOCI.find(f=>f.key===key);if(!focus)return;
 const st=career.teamStates?.[career.user];if(!st)return;
 let injured=null;
 st.players.forEach(p=>{
  focus.apply(p);
  // Sovraccarico occasionale in preparazione fisica: rischio minimo, per
  // dare un peso reale alla scelta invece che essere solo un bonus gratis.
  if(focus.key==='fisico'&&!injured&&Math.random()<.05){
   injured=p;p.fitness=Math.max(15,(p.fitness??100)-22);p.injuryGames=Math.max(p.injuryGames||0,rand(1,2));
  }
 });
 const t=trainingState();
 t.lastRound=career.round??0;
 t.log.unshift({round:career.round??0,focus:key,injured:injured?injured.name:null,text:pick(focus.outcomes)});
 t.log=t.log.slice(0,20);
 try{if(career.careerId&&window.S9Save)window.S9Save.putCareer(career).catch(()=>{})}catch(e){}
 if(typeof renderSeasonView==='function')renderSeasonView('training');
}
function renderTraining(){
 if(!career?.teamStates?.[career.user])return '<h2>ALLENAMENTO</h2><p class="muted">Nessuna squadra in carriera.</p>';
 const st=career.teamStates[career.user],t=trainingState(),done=!canTrainThisRound();
 const avgFit=Math.round(avgOf(st.players.map(p=>p.fitness??100))),avgMor=Math.round(avgOf(st.players.map(p=>p.morale??50)));
 return `<h2>ALLENAMENTO SETTIMANALE</h2>
 <p class="muted">Condizione media rosa: <b>${avgFit}</b> · Morale medio rosa: <b>${avgMor}</b>${done?' · <b>Seduta già svolta per questa giornata</b>':''}</p>
 <div class="training-grid">
 ${FOCI.map(f=>`<div class="training-card"><h3>${f.icon} ${f.label}</h3><p>${f.desc}</p><button type="button" data-train="${f.key}" ${done?'disabled':''}>ALLENA ▶</button></div>`).join('')}
 </div>
 ${t?.log?.length?`<h3 class="training-log-title">ULTIMI ALLENAMENTI</h3><div class="training-log">${t.log.map(l=>{const f=FOCI.find(x=>x.key===l.focus);return `<div class="training-log-row">G${l.round+1} · <b>${f?f.icon+' '+f.label:l.focus}</b>${l.injured?` · ⚠ ${l.injured} accusa un piccolo problema fisico`:''}<br><small>${l.text}</small></div>`}).join('')}</div>`:''}
 `;
}
document.addEventListener('click',ev=>{
 const b=ev.target.closest('[data-train]');
 if(b&&!b.disabled)applyTraining(b.dataset.train);
});
window.S9Training={renderTraining,applyTraining};
})();
