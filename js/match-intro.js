/* Pre-match ceremony: walkout, anthem/competition theme and coin toss. */
(function(){
'use strict';
const q=s=>document.querySelector(s),G=window.S9Football3D;
let overlay,canvas,ctx,active=null,frame=0,resolveActive=null,lastFocus=null;
const clamp=n=>Math.max(0,Math.min(1,n));
const teamLabel=id=>{const team=T(id);return team?`${team.name} ${team.season}`:id};
const national=id=>!!window.S9V10?.nationalIds?.includes(id);
const crest=id=>window.S9V10_DATA?.crestPath?.(id)||window.CREST_ASSETS?.[id]||T(id)?.crest||'';
const sideName=(item,side)=>teamLabel(side==='home'?item.h:item.a);

function ceremonialSound(isNational){
 try{
  const a=audio();if(a.state==='suspended')a.resume();
  const start=a.currentTime+.04;
  const notes=isNational
   ?[[261.63,0,.72],[329.63,.02,.72],[392,.04,.72],[349.23,.82,.7],[440,.84,.7],[523.25,.86,.7],[392,1.62,.8],[493.88,1.64,.8],[587.33,1.66,.8],[523.25,2.52,1.05],[659.25,2.54,1.05],[783.99,2.56,1.05]]
   :[[196,0,.35],[293.66,.05,.34],[392,.1,.75],[261.63,.7,.34],[392,.75,.34],[523.25,.8,.82],[329.63,1.48,.34],[493.88,1.53,.34],[659.25,1.58,1.0]];
  notes.forEach(([hz,at,dur],i)=>{
   const o=a.createOscillator(),g=a.createGain();o.type=isNational?(i%3?'sine':'triangle'):'triangle';
   o.frequency.setValueAtTime(hz,start+at);g.gain.setValueAtTime(.0001,start+at);g.gain.exponentialRampToValueAtTime(isNational ? .015 : .019,start+at+.08);g.gain.exponentialRampToValueAtTime(.0001,start+at+dur);
   o.connect(g);g.connect(a.destination);o.start(start+at);o.stop(start+at+dur+.03);
  });
  crowd(isNational ? .012 : .018,isNational ? 4.2 : 3.2);
 }catch(e){console.warn('Cerimoniale audio non disponibile',e)}
}

function makeDecision(item,choice){
 const winner=item.tossWinner,fieldSide=choice==='field'?winner:(winner==='home'?'away':'home');
 const kickoffSide=choice==='ball'?winner:(winner==='home'?'away':'home');
 const fieldEnd=Math.random()<.5?'CURVA NORD':'CURVA SUD';
 const homeAttacksRight=fieldSide==='home'?(fieldEnd==='CURVA NORD'):(fieldEnd!=='CURVA NORD');
 return {winner,choice,kickoffSide,fieldSide,fieldEnd,homeAttacksRight};
}
function describeDecision(item,decision){
 const winner=sideName(item,decision.winner),kickoff=sideName(item,decision.kickoffSide),field=sideName(item,decision.fieldSide);
 return `${item.coinFace==='heads'?'TESTA':'CROCE'} · ${winner} sceglie ${decision.choice==='ball'?'PALLA':'CAMPO'} · Calcio d’inizio: ${kickoff} · ${field} verso ${decision.fieldEnd}`;
}
function revealToss(){
 if(!active||active.tossRevealed)return;
 active.tossRevealed=true;
 const result=overlay.querySelector('.s9-intro-toss-result');
 result.hidden=false;result.textContent=`È USCITA ${active.coinFace==='heads'?'TESTA':'CROCE'} · ${sideName(active,active.tossWinner)} VINCE IL SORTEGGIO`;
 overlay.querySelector('.s9-intro-caption').textContent=`${active.coinFace==='heads'?'TESTA':'CROCE'} · ${sideName(active,active.tossWinner).toUpperCase()} VINCE IL SORTEGGIO`;
 if(active.tossWinner===active.controlledSide){
  overlay.querySelector('.s9-intro-choices').hidden=false;
  if(innerWidth>600)overlay.querySelector('.s9-intro-choice-ball').focus({preventScroll:true});
 }else choose(Math.random()<.5?'ball':'field');
}
function callCoin(face,instant=false){
 if(!active||active.coinCall)return;
 active.coinCall=face;active.coinFace=Math.random()<.5?'heads':'tails';active.callAt=performance.now();
 const caller=active.callingSide;
 active.tossWinner=active.coinFace===face?caller:(caller==='home'?'away':'home');
 overlay.querySelector('.s9-intro-call').hidden=true;
 overlay.querySelector('.s9-intro-caption').textContent=`${sideName(active,caller).toUpperCase()} CHIAMA ${face==='heads'?'TESTA':'CROCE'} · MONETA IN ARIA`;
 if(instant)revealToss();
}
function choose(choice){
 if(!active||!active.tossRevealed||active.decision)return;
 active.decision=makeDecision(active,choice);active.decisionAt=performance.now();
 overlay.querySelector('.s9-intro-choices').hidden=true;
 const result=overlay.querySelector('.s9-intro-toss-result');result.hidden=false;result.textContent=describeDecision(active,active.decision);
 overlay.querySelector('.s9-intro-caption').textContent='IL SORTEGGIO È DECISO';
}
function finish(){
 if(!active)return;
 if(!active.coinCall)callCoin(Math.random()<.5?'heads':'tails',true);
 if(!active.tossRevealed)revealToss();
 if(!active.decision)active.decision=makeDecision(active,Math.random()<.5?'ball':'field');
 const decision=active.decision,resolver=resolveActive;active=null;resolveActive=null;cancelAnimationFrame(frame);overlay.hidden=true;
 lastFocus?.focus?.({preventScroll:true});resolver?.(decision);
}
function skip(){
 if(!active)return;
 if(!active.coinCall)callCoin(Math.random()<.5?'heads':'tails',true);
 if(!active.tossRevealed)revealToss();
 if(!active.decision)choose(Math.random()<.5?'ball':'field');
 finish();
}

function paint(item,now){
 if(item.lastFrame!==null&&!document.hidden)item.elapsed+=Math.min(80,now-item.lastFrame);item.lastFrame=now;
 const reduced=item.reduced,t=reduced?39:Math.min(50,item.elapsed/1000),stage=t<24?0:t<36?1:2;
 /* FIX 2026-09: vero stacco in studio durante l'inno (mai per le nazionali -
    "mai quelli delle nazionali"): invece di disegnare ancora il campo, per
    tutta la durata di questa fase il canvas mostra i due telecronisti,
    esattamente come farebbe una regia TV vera che stacca dallo stadio allo
    studio e poi torna in campo per il sorteggio. */
 const cutaway=stage===1&&!item.isNational;
 const w=canvas.clientWidth||1000,h=canvas.clientHeight||500,ratio=Math.min(devicePixelRatio||1,1.5);
 if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}
 ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
 const portrait=w/h<1.05,arrival=clamp(t/24),toss=clamp((t-36)/2.6),brand=item.brand,venue=item.venueStyle;
 let anthemLine='';
 if(cutaway){
  anthemLine=window.S9Anchors?.drawStudio?.(ctx,w,h,clamp((t-24)/12),'anthem')||'';
 }else{
 const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#061323');bg.addColorStop(.55,'#18344c');bg.addColorStop(1,'#071b14');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 const p=G.camera([0,portrait?10:4.5+arrival*3.5,portrait?26:12+arrival*12],[0,1,-5+arrival*2],w,h,portrait?70:50),scene=G.scene(ctx,p);
 G.pitchSurface(ctx,p,-13,-14,26,21,1.3);
 // Real opening between two stands, with a dark passage, side walls and canopy.
 for(let tier=0;tier<Math.min(4,venue.tiers);tier++)for(const sign of [-1,1])scene.box([sign*8.6,1+tier*1.25,-11.5-tier*1.65],[11.5,1.14,2.6],tier%2?venue.seats:brand.dark,0,S9Match3D.crowdTexture(brand,venue,tier%3));
 scene.box([0,1.3,-13],[5,2.6,.3],'#03070b');
 scene.box([-2.55,1.35,-10.2],[.32,2.7,5.6],'#25364b');scene.box([2.55,1.35,-10.2],[.32,2.7,5.6],'#25364b');
 scene.box([0,2.85,-10.2],[5.45,.3,5.6],brand.dark);
 scene.box([0,2.66,-7.5],[4.85,.08,.12],'#fff1ba');
 scene.box([-2.3,.025,-9.8],[.08,.04,4.5],brand.accent);scene.box([2.3,.025,-9.8],[.08,.04,4.5],brand.accent);
 const homeStart=-9.15,awayStart=1.95,step=.72;
 for(let i=0;i<11;i++)for(const side of ['home','away']){
  const sign=side==='home'?-1:1,target=side==='home'?homeStart+i*step:awayStart+(10-i)*step;
  const forward=Math.min(0,-11.5-i*.78+t*1.08),reached=(11.5+i*.78)/1.08,spread=clamp((t-reached)/(Math.abs(target-sign*1.05)/1.6||1));
  let x=sign*1.05+(target-sign*1.05)*spread,z=forward,angle=forward<0?0:spread<1?sign*Math.PI/2:0;
  const captain=i===10;
  if(captain){const advance=clamp(toss*2),across=clamp((toss-.5)*2);z+=2.4*advance;x+=(sign*1.12-x)*across;angle=0;}
  if(z<-10.7)continue;
  const walking=forward<0||spread<1||captain&&toss>0&&toss<1;
  const player=item.rosters[side][i];
  G.player(scene,x,z,side==='home'?item.homeKit:item.awayKit,walking&&!reduced?t*3.1+i*.17:0,angle,.72,player?.number||String(i+1),player?.keeper??i===0,0);
 }
 /* FIX 2026-09: the referee's shirt (#f0c940, golden yellow) and the goalkeeper's
    shirt (#e9b637 in football-3d.js) were nearly the same shade, so on the pitch
    referees and keepers were hard to tell apart. Referees now wear the classic
    all-black kit, which no goalkeeper colour in this game uses. */
 const refereeKit={shirt:'#1c1c1c',shorts:'#1c1c1c',socks:'#1c1c1c'};
 for(let i=0;i<3;i++){
  const rz=Math.min(0,-8.5-i*.85+t*1.08),spread=clamp((t-(8.5+i*.85)/1.08)/2.5),target=(i-1)*.8;
  // Referees pass to the side of the trophy plinth, then take the centre slots.
  const rx=-1.9+(target+1.9)*spread;
  G.player(scene,rx,rz+(i===1?2.4*toss:0),refereeKit,!reduced&&(rz<0||spread<1||i===1&&toss>0&&toss<1)?t*3.1:0,0,.77,'',false,0);
 }
 if(item.isFinal){
  scene.box([0,.65,-5.15],[.7,1.3,.7],'#101b2a');scene.box([0,1.34,-5.15],[.85,.1,.85],brand.accent);
  window.S9Celebration?.trophy(scene,item.key,0,1.4,-5.15,.65);
 }
 scene.flush();
 if(stage===2){
  const spin=item.tossRevealed?1:Math.max(.12,Math.abs(Math.cos(t*8))),cy=h*(portrait?.37:.29);
  ctx.fillStyle='#e8c65f';ctx.strokeStyle='#fff1ba';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(w/2,cy,13,13*spin,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(item.tossRevealed){ctx.fillStyle='#182236';ctx.font='900 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(item.coinFace==='heads'?'T':'C',w/2,cy)}
 }
 }
 const ceremonialCaption=item.isNational
  ?`INNO NAZIONALE · ${sideName(item,t<30?'home':'away').toUpperCase()}`
  :item.key==='friendly'?'PRESENTAZIONE DELLE SQUADRE':`SIGLA · ${item.brand.name}`;
 const tossCaption=!item.coinCall?'LANCIO DELLA MONETA · SCEGLI TESTA O CROCE':!item.tossRevealed?'MONETA IN ARIA':`${item.coinFace==='heads'?'TESTA':'CROCE'} · ${sideName(item,item.tossWinner).toUpperCase()} VINCE IL SORTEGGIO`;
 const captions=[`INGRESSO IN CAMPO · ${item.stadium.toUpperCase()}`,cutaway?anthemLine:ceremonialCaption,tossCaption];
 const caption=overlay.querySelector('.s9-intro-caption');if(caption.textContent!==captions[stage]&&!item.decision)caption.textContent=captions[stage];
 overlay.querySelectorAll('.s9-intro-progress span').forEach((el,i)=>el.classList.toggle('active',i<=stage));
 if(stage===1&&!item.soundPlayed){item.soundPlayed=true;ceremonialSound(item.isNational)}
 if(stage===2&&t>=38.8&&!item.callPrompted){
  item.callPrompted=true;
  if(item.controlledSide){overlay.querySelector('.s9-intro-call').hidden=false;if(innerWidth>600)overlay.querySelector('.s9-intro-heads').focus({preventScroll:true})}
  else callCoin(Math.random()<.5?'heads':'tails');
 }
 if(item.coinCall&&!item.tossRevealed&&now-item.callAt>2300)revealToss();
 if(item.decision&&now-item.decisionAt>3000){finish();return}
 if(active===item)frame=requestAnimationFrame(n=>paint(item,n));
}

async function play(options){
 if(active)finish();
 const h=options.h,a=options.a,key=options.key||S9Competition.key(),brand=S9Competition.definitions[key]||S9Competition.definitions.friendly;
 const controlledSide=S9V10?.matchContext?.spectator?null:career?.user===h?'home':career?.user===a?'away':null;
 const context=S9V10?.matchContext,isFinal=!!context?.final||context?.match?.tie?.stage==='FINAL'||context?.match?.stage==='FINAL';
 // FIX 2026-09 (50): stessi numeri "iconici" mostrati in campo/pre-partita
 // anche nell'ingresso in campo cinematico, invece del solo indice in rosa.
 const rosters=Object.fromEntries([['home',h],['away',a]].map(([side,id])=>{const st=career?.teamStates?.[id];const nums=typeof s9SquadNumbers==='function'&&st?s9SquadNumbers(st):null;return [side,(st?.lineup||[]).map(pid=>({number:String(nums?.[pid]||(st.players.findIndex(p=>p.id===pid)+1)),keeper:st.players.find(p=>p.id===pid)?.pos==='GK'}))]}));
 const item={h,a,key,brand,isFinal,rosters,elapsed:0,lastFrame:null,stadium:options.stadium||S9Competition.stadium(),venueStyle:S9Competition.stadiumStyle(options.stadium||S9Competition.stadium()),isNational:national(h)&&national(a),controlledSide,callingSide:controlledSide||'away',coinCall:null,coinFace:null,callAt:0,callPrompted:false,tossWinner:null,tossRevealed:false,decision:null,decisionAt:0,soundPlayed:false,reduced:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,started:0,
  /* FIX 2026-09: canale passato da index.html (uguale per tutta la partita,
     scorebug + eventuale invasione compresi); se manca, se ne sceglie uno
     al volo cosi' l'intro resta funzionante anche chiamata da sola. */
  channel:options.channel||(window.S9Channel?S9Channel():'S9 90')};
 [item.homeKit,item.awayKit]=await Promise.all([G.loadKit(kitPath(h,selectedKits.home)),G.loadKit(kitPath(a,selectedKits.away))]);
 const home=T(h),away=T(a);overlay.style.setProperty('--intro-accent',brand.accent);overlay.querySelector('.s9-intro-kicker').textContent=`${isFinal?'FINALE · ':''}${brand.name} · ${item.stadium}`;
 overlay.querySelector('.s9-intro-home img').src=crest(h);overlay.querySelector('.s9-intro-home strong').textContent=teamLabel(h);
 overlay.querySelector('.s9-intro-away img').src=crest(a);overlay.querySelector('.s9-intro-away strong').textContent=teamLabel(a);
 {const bug=window.S9ChannelBug?window.S9ChannelBug(item.channel):'';overlay.querySelector('.s9-intro-live').innerHTML=`<span class="s9-tv-bug">${bug}</span>${item.channel} <b>LIVE</b>`;}
 /* FIX 2026-09: i due telecronisti dell'emittente scelta per la partita —
    stessa coppia per tutta l'intro, agganciata all'inizio in modo che
    l'ingresso e l'inno (solo club, mai nazionali) usino nomi/cravatta
    coerenti col resto della cronaca. */
 window.S9Anchors?.setup({channel:item.channel,h:teamLabel(h),a:teamLabel(a)});
 overlay.querySelector('.s9-intro-home img').alt=`Stemma ${home.name}`;overlay.querySelector('.s9-intro-away img').alt=`Stemma ${away.name}`;
 overlay.querySelector('.s9-intro-call').hidden=true;overlay.querySelector('.s9-intro-choices').hidden=true;overlay.querySelector('.s9-intro-toss-result').hidden=true;overlay.querySelector('.s9-intro-toss-result').textContent='';
 overlay.querySelector('.s9-intro-skip').textContent=item.reduced?'CONTINUA ▶':'SALTA INTRO ▶';lastFocus=document.activeElement;
 window.scrollTo(0,0);item.started=performance.now();active=item;overlay.hidden=false;
 if(innerWidth>600)overlay.querySelector('.s9-intro-skip').focus({preventScroll:true});
 return new Promise(resolve=>{resolveActive=resolve;frame=requestAnimationFrame(n=>paint(item,n))});
}

function boot(){
 overlay=document.createElement('div');overlay.id='s9MatchIntro';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','s9IntroCaption');
 overlay.innerHTML=`<div class="s9-intro-shell"><div class="s9-intro-kicker"></div><div class="s9-intro-teams"><div class="s9-intro-team s9-intro-home"><img alt=""><strong></strong></div><div class="s9-intro-versus">MATCHDAY</div><div class="s9-intro-team s9-intro-away"><strong></strong><img alt=""></div></div><div class="s9-intro-progress" aria-hidden="true"><span>INGRESSO</span><span>CERIMONIALE</span><span>SORTEGGIO</span></div><div class="s9-intro-stage"><canvas role="img" aria-label="Squadre schierate con la terna arbitrale al centro"></canvas><div class="s9-intro-live">${window.S9Channel?window.S9Channel():'S9 90'} <b>LIVE</b></div><div class="s9-intro-caption" id="s9IntroCaption" aria-live="polite"></div></div><div class="s9-intro-toss-result" hidden aria-live="polite"></div><div class="s9-intro-call" hidden><span>SCEGLI PRIMA DEL LANCIO</span><button type="button" class="s9-intro-heads">TESTA</button><button type="button" class="s9-intro-tails">CROCE</button></div><div class="s9-intro-choices" hidden><span>HAI VINTO IL SORTEGGIO. COSA SCEGLI?</span><button type="button" class="s9-intro-choice-ball">${S9Icon('ball')} PALLA</button><button type="button" class="s9-intro-choice-field">◩ CAMPO</button></div><button type="button" class="s9-intro-skip">SALTA INTRO ▶</button></div>`;
 document.body.appendChild(overlay);canvas=overlay.querySelector('canvas');ctx=canvas.getContext('2d');
 overlay.querySelector('.s9-intro-skip').onclick=skip;overlay.querySelector('.s9-intro-heads').onclick=()=>callCoin('heads');overlay.querySelector('.s9-intro-tails').onclick=()=>callCoin('tails');overlay.querySelector('.s9-intro-choice-ball').onclick=()=>choose('ball');overlay.querySelector('.s9-intro-choice-field').onclick=()=>choose('field');
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();skip()}});
}
window.S9MatchIntro={play,get active(){return !!active},skip};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
