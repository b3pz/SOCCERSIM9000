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
 const reduced=item.reduced,t=reduced?9.2:Math.min(20,(now-item.started)/1000),stage=t<3?0:t<7?1:2;
 const w=canvas.clientWidth||1000,h=canvas.clientHeight||500,ratio=Math.min(devicePixelRatio||1,1.5);
 if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}
 ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
 const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#061323');bg.addColorStop(.55,'#18344c');bg.addColorStop(1,'#071b14');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 const portrait=w/h<1.05,arrival=clamp(t/2.5),toss=clamp((t-7)/1.1),walk=reduced?0:t*4.2,cameraX=stage===0?-6*(1-arrival):stage===1?Math.sin((t-3)*.7)*1.2:0;
 const p=G.camera([cameraX,portrait?7.5:5.2,portrait?19:16],[cameraX*.15,1.05,.2],w,h,portrait?62:45),scene=G.scene(ctx,p),brand=item.brand,venue=item.venueStyle;
 for(let tier=0;tier<Math.min(4,venue.tiers);tier++)scene.box([0,1+tier*1.25,-10.5-tier*1.65],[23-tier*.7,1.14,2.6],tier%2?venue.seats:brand.dark,0,S9Match3D.crowdTexture(brand,venue,tier%3));
 scene.box([0,5.9,-10.1],[12,.18,.35],brand.accent);
 if(venue.track)scene.box([0,-.08,.2],[16,.06,9.8],'#985f52');
 for(let i=-9;i<9;i++)scene.box([i*.9,-.035,.3],[.82,.035,8.1],i%2?'#2e7947':'#388652');
 scene.box([0,-.015,.3],[.1,.035,8.1],'#edf2e8');
 const homeStart=-9.15,awayStart=1.95,step=.72;
 for(let i=0;i<11;i++){
  const hz=(1-arrival)*(5.5+(i%3)*.42),homeX=homeStart+i*step,awayX=awayStart+i*step;
  G.player(scene,homeX,hz,item.homeKit,walk+i*.31,0,.72,String(i+1),i===0,0);
  G.player(scene,awayX,hz+.25,item.awayKit,walk+i*.28,0,.72,String(i+1),i===0,0);
 }
 const refereeKit={shirt:'#f0c940',shorts:'#17202b',socks:'#f0c940'};
 for(const x of [-.62,0,.62])G.player(scene,x,(1-arrival)*4.5,refereeKit,walk,0,.77,'',false,0);
 if(stage===2){
  G.player(scene,-1.05,1.65*toss,item.homeKit,walk,0,.89,'C',false,0);
  G.player(scene,1.05,1.65*toss,item.awayKit,walk,0,.89,'C',false,0);
  G.player(scene,0,1.78*toss,refereeKit,walk,0,.9,'',false,0);
 }
 scene.flush();
 if(stage===2){
  const spin=item.tossRevealed?1:Math.max(.12,Math.abs(Math.cos(t*8))),cy=h*(portrait?.37:.29);
  ctx.fillStyle='#e8c65f';ctx.strokeStyle='#fff1ba';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(w/2,cy,13,13*spin,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(item.tossRevealed){ctx.fillStyle='#182236';ctx.font='900 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(item.coinFace==='heads'?'T':'C',w/2,cy)}
 }
 const ceremonialCaption=item.isNational
  ?`INNO NAZIONALE · ${sideName(item,t<5?'home':'away').toUpperCase()}`
  :item.key==='friendly'?'PRESENTAZIONE DELLE SQUADRE':`SIGLA · ${item.brand.name}`;
 const tossCaption=!item.coinCall?'LANCIO DELLA MONETA · SCEGLI TESTA O CROCE':!item.tossRevealed?'MONETA IN ARIA':`${item.coinFace==='heads'?'TESTA':'CROCE'} · ${sideName(item,item.tossWinner).toUpperCase()} VINCE IL SORTEGGIO`;
 const captions=[`INGRESSO IN CAMPO · ${item.stadium.toUpperCase()}`,ceremonialCaption,tossCaption];
 const caption=overlay.querySelector('.s9-intro-caption');if(caption.textContent!==captions[stage]&&!item.decision)caption.textContent=captions[stage];
 overlay.querySelectorAll('.s9-intro-progress span').forEach((el,i)=>el.classList.toggle('active',i<=stage));
 if(stage===1&&!item.soundPlayed){item.soundPlayed=true;ceremonialSound(item.isNational)}
 if(stage===2&&t>=8.25&&!item.callPrompted){
  item.callPrompted=true;
  if(item.controlledSide){overlay.querySelector('.s9-intro-call').hidden=false;if(innerWidth>600)overlay.querySelector('.s9-intro-heads').focus({preventScroll:true})}
  else callCoin(Math.random()<.5?'heads':'tails');
 }
 if(item.coinCall&&!item.tossRevealed&&now-item.callAt>1450)revealToss();
 if(item.decision&&now-item.decisionAt>1850){finish();return}
 if(active===item)frame=requestAnimationFrame(n=>paint(item,n));
}

async function play(options){
 if(active)finish();
 const h=options.h,a=options.a,key=options.key||S9Competition.key(),brand=S9Competition.definitions[key]||S9Competition.definitions.friendly;
 const controlledSide=career?.user===h?'home':career?.user===a?'away':null;
 const item={h,a,key,brand,stadium:options.stadium||S9Competition.stadium(),venueStyle:S9Competition.stadiumStyle(options.stadium||S9Competition.stadium()),isNational:national(h)&&national(a),controlledSide,callingSide:controlledSide||'away',coinCall:null,coinFace:null,callAt:0,callPrompted:false,tossWinner:null,tossRevealed:false,decision:null,decisionAt:0,soundPlayed:false,reduced:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,started:0};
 [item.homeKit,item.awayKit]=await Promise.all([G.loadKit(kitPath(h,selectedKits.home)),G.loadKit(kitPath(a,selectedKits.away))]);
 const home=T(h),away=T(a);overlay.style.setProperty('--intro-accent',brand.accent);overlay.querySelector('.s9-intro-kicker').textContent=`${brand.name} · ${item.stadium}`;
 overlay.querySelector('.s9-intro-home img').src=crest(h);overlay.querySelector('.s9-intro-home strong').textContent=teamLabel(h);
 overlay.querySelector('.s9-intro-away img').src=crest(a);overlay.querySelector('.s9-intro-away strong').textContent=teamLabel(a);
 overlay.querySelector('.s9-intro-home img').alt=`Stemma ${home.name}`;overlay.querySelector('.s9-intro-away img').alt=`Stemma ${away.name}`;
 overlay.querySelector('.s9-intro-call').hidden=true;overlay.querySelector('.s9-intro-choices').hidden=true;overlay.querySelector('.s9-intro-toss-result').hidden=true;overlay.querySelector('.s9-intro-toss-result').textContent='';
 overlay.querySelector('.s9-intro-skip').textContent=item.reduced?'CONTINUA ▶':'SALTA INTRO ▶';lastFocus=document.activeElement;
 window.scrollTo(0,0);item.started=performance.now();active=item;overlay.hidden=false;
 if(innerWidth>600)overlay.querySelector('.s9-intro-skip').focus({preventScroll:true});
 return new Promise(resolve=>{resolveActive=resolve;frame=requestAnimationFrame(n=>paint(item,n))});
}

function boot(){
 overlay=document.createElement('div');overlay.id='s9MatchIntro';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','s9IntroCaption');
 overlay.innerHTML=`<div class="s9-intro-shell"><div class="s9-intro-kicker"></div><div class="s9-intro-teams"><div class="s9-intro-team s9-intro-home"><img alt=""><strong></strong></div><div class="s9-intro-versus">MATCHDAY</div><div class="s9-intro-team s9-intro-away"><strong></strong><img alt=""></div></div><div class="s9-intro-progress" aria-hidden="true"><span>INGRESSO</span><span>CERIMONIALE</span><span>SORTEGGIO</span></div><div class="s9-intro-stage"><canvas role="img" aria-label="Squadre schierate con la terna arbitrale al centro"></canvas><div class="s9-intro-live">S9 90 <b>LIVE</b></div><div class="s9-intro-caption" id="s9IntroCaption" aria-live="polite"></div></div><div class="s9-intro-toss-result" hidden aria-live="polite"></div><div class="s9-intro-call" hidden><span>SCEGLI PRIMA DEL LANCIO</span><button type="button" class="s9-intro-heads">TESTA</button><button type="button" class="s9-intro-tails">CROCE</button></div><div class="s9-intro-choices" hidden><span>HAI VINTO IL SORTEGGIO. COSA SCEGLI?</span><button type="button" class="s9-intro-choice-ball">⚽ PALLA</button><button type="button" class="s9-intro-choice-field">◩ CAMPO</button></div><button type="button" class="s9-intro-skip">SALTA INTRO ▶</button></div>`;
 document.body.appendChild(overlay);canvas=overlay.querySelector('canvas');ctx=canvas.getContext('2d');
 overlay.querySelector('.s9-intro-skip').onclick=skip;overlay.querySelector('.s9-intro-heads').onclick=()=>callCoin('heads');overlay.querySelector('.s9-intro-tails').onclick=()=>callCoin('tails');overlay.querySelector('.s9-intro-choice-ball').onclick=()=>choose('ball');overlay.querySelector('.s9-intro-choice-field').onclick=()=>choose('field');
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();skip()}});
}
window.S9MatchIntro={play,get active(){return !!active},skip};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
