/* Match presentation: one animation clock, live lineups and football actions. */
(function(){
  'use strict';
  const api=window.S9MatchVisual={event:null,attacking:false,get carrier(){return carrier}};
  const clamp=(n,a=3,b=97)=>Math.max(a,Math.min(b,n));
  const coordinate=value=>Number.isFinite(parseFloat(value))?parseFloat(value):50;
  const pos=el=>({x:coordinate(el.style.left),y:coordinate(el.style.top)});
  const ball=()=>document.getElementById('ball');
  const dots=side=>Array.from(document.querySelectorAll('#pitch .dot.'+side));
  const field=side=>dots(side).filter(d=>d.dataset.role!=='GK');
  const opposite=side=>side==='home'?'away':'home';
  const right=side=>(side==='home')!==(current.half===2);
  const xFor=(side,x)=>right(side)?x:100-x;
  const find=(side,id)=>dots(side).find(d=>d.dataset.pid===id);
  let possession='home',carrier=null;
  function label(text){
    let el=document.getElementById('matchAction');
    if(!el){el=document.createElement('div');el.id='matchAction';document.getElementById('pitch').appendChild(el);}
    el.textContent=text;
  }
  // Pause applies to players and ball, including a ball in flight.
  async function move(targets,ms=650,loft=false,realTime=false){
    const match=current,unique=new Map();
    targets.forEach(t=>{if(t.el)unique.set(t.el,t)});
    const motions=[...unique.values()].map(t=>({...t,start:pos(t.el)}));
    motions.forEach(t=>t.el.style.transition='none');
    await new Promise(resolve=>{
      let elapsed=0,last=null;
      function frame(now){
        if(current!==match||match._finished){resolve();return;}
        if(last!==null&&!paused)elapsed+=Math.min(50,now-last)*(realTime?1:api.attacking&&window.S9Match3D?.mode!=='2d'?(Number(speed)>=4?1:Number(speed)>=2?1.15:1):Math.max(1,speed));
        last=now;const progress=Math.min(1,elapsed/ms);
        motions.forEach(t=>{
          t.el.style.left=(t.start.x+(t.x-t.start.x)*progress)+'%';
          t.el.style.top=(t.start.y+(t.y-t.start.y)*progress)+'%';
          if(loft&&t.el.id==='ball')t.el.style.transform=`translate(-50%,-50%) translateY(${-Math.sin(progress*Math.PI)*35}px) scale(${1+Math.sin(progress*Math.PI)*.5})`;
        });
        if(progress<1)requestAnimationFrame(frame);
        else{if(ball())ball().style.transform='translate(-50%,-50%)';resolve();}
      }
      requestAnimationFrame(frame);
    });
  }
  function shape(side,target,exclude=[]){
    return ['home','away'].flatMap(team=>dots(team).filter(d=>!exclude.includes(d)).map(d=>{
      const base={x:+d.dataset.baseX,y:+d.dataset.baseY};
      const keeper=d.dataset.role==='GK';
      return {el:d,x:keeper?base.x:clamp(base.x+(target.x-50)*.22+(team===side?(right(team)?5:-5):0)),y:keeper?clamp(50+(target.y-50)*.12,43,57):clamp(base.y+(target.y-50)*.18,7,93)};
    }));
  }
  const baseSetup=setupPitch;
  setupPitch=function(){
    baseSetup();if(!current)return;
    carrier=null;possession='home';
    let legend=document.getElementById('pitchTeamLegend');
    if(!legend){legend=document.createElement('div');legend.id='pitchTeamLegend';document.getElementById('pitch').appendChild(legend);}
    legend.replaceChildren();
    for(const side of ['home','away']){
      const teamId=side==='home'?current.h:current.a;
      const colors=getTeamColors(teamId);
      const primary=colors[0]||'#254f99',secondary=colors[1]||'#ffffff';
      const item=document.createElement('span'),swatch=document.createElement('i');
      item.className='pitch-team-key '+side;swatch.className='pitch-team-swatch '+side;
      swatch.style.background=`linear-gradient(90deg,${primary} 0 50%,${secondary} 50% 100%)`;
      item.append(swatch,document.createTextNode(T(teamId).name));legend.appendChild(item);
      const st=career.teamStates[side==='home'?current.h:current.a];
      const rank={GK:0,DF:1,MF:2,AM:3,FW:4,ST:4};
      const players=st.lineup.map(id=>st.players.find(p=>p.id===id)).filter(Boolean).sort((a,b)=>(rank[a.pos]??2)-(rank[b.pos]??2));
      const rows=(st.formation||'4-4-2').split('-').map(Number);let cursor=0;
      for(const player of players){
        const d=find(side,player.id);if(!d)continue;
        let x=5,y=50;
        if(player.pos!=='GK'){
          let index=cursor++,row=0;
          while(row<rows.length-1&&index>=rows[row])index-=rows[row++];
          x=24+row*48/Math.max(1,rows.length-1);y=12+(index+1)*76/(rows[row]+1);
        }
        d.dataset.role=player.pos;d.dataset.baseX=xFor(side,x);d.dataset.baseY=y;
        d.style.left=d.dataset.baseX+'%';d.style.top=y+'%';
        d.style.background=`linear-gradient(90deg,${primary} 0 50%,${secondary} 50% 100%)`;
        d.textContent=String(st.lineup.indexOf(player.id)+1);d.title=T(teamId).name+' · '+player.name;
        if(player.pos==='GK')d.textContent='P';
        d.setAttribute('aria-label',player.name);
      }
    }
    label('IN CAMPO');
  };
  async function pass(side,receiver,target,cross=false){
    const b=ball();if(!receiver||!b)return;
    const from=carrier&&dots(side).includes(carrier)?carrier:field(side)[0];
    if(!from)return;
    if(!carrier){const p=pos(from);b.style.left=p.x+'%';b.style.top=p.y+'%';}
    label(cross?'CROSS IN AREA':'PASSAGGIO');
    await move([...shape(side,target,[receiver,from]),{el:receiver,...target},{el:b,...target}],api.attacking?(cross?1100:900):950,cross);
    carrier=receiver;possession=side;
  }
  api.openPlay=async function(minute){
    const side=possession,players=field(side);if(players.length<2)return;
    if(!carrier||!players.includes(carrier))carrier=null;
    const receiver=players.filter(d=>d!==carrier)[minute%(players.length-1)];
    const cross=false; // Quiet circulation reserves crosses and forward runs for highlights.
    if(cross){
      const winger=carrier||players[0],wide={x:xFor(side,74),y:minute%2?12:88};
      label('AZIONE SULLA FASCIA');
      await move([...shape(side,wide,[winger]),{el:winger,...wide},{el:ball(),...wide}],550);
      carrier=winger;
    }
    await pass(side,receiver,{x:xFor(side,cross?79:38+minute%4*9),y:cross?50:22+minute%5*14},cross);
    if(minute%3===0){
      const other=opposite(side),p=pos(carrier);
      const defender=field(other).sort((a,b)=>Math.hypot(pos(a).x-p.x,pos(a).y-p.y)-Math.hypot(pos(b).x-p.x,pos(b).y-p.y))[0];
      if(defender){
        label('CONTRASTO');await move([{el:defender,x:p.x+(right(other)?-2:2),y:p.y+1}],450);
        possession=other;carrier=defender;const recovery=pos(defender);
        await move([{el:ball(),...recovery}],160);label('PALLA RECUPERATA');
      }
    }
  };
  api.hold=async ms=>move([],ms,false,true);
  api.kickoff=async side=>{
    possession=side;carrier=null;
    const player=field(side).slice(-1)[0];if(!player)return;
    player.style.left=xFor(side,49)+'%';player.style.top='50%';
    if(ball()){ball().style.left='50%';ball().style.top='50%';}
    carrier=player;label('CALCIO D’INIZIO');await move([],450);
  };
  animAttack=async function(side,outcome){
    const players=field(side);if(players.length<2)return;
    const e=api.event||{},match=current;
    const shooter=find(side,e.player?.id)||players[players.length-1];
    const support=find(side,e.assist?.id)||players.find(d=>d!==shooter);
    const third=players.find(d=>d!==shooter&&d!==support)||support;
    const seed=Array.from(String(e.player?.id||side)).reduce((n,c)=>n+c.charCodeAt(0),current.minute);
    const pattern=seed%4,wide=seed%2?20:80;
    const at=(x,y)=>({x:xFor(side,x),y});
    api.attacking=true;carrier=null;
    try{
      label(['COSTRUZIONE CENTRALE','APERTURA SULLA FASCIA','RIPARTENZA','COMBINAZIONE AL LIMITE'][pattern]);
      const start=at(pattern===2?35:46,pattern===1?wide:52);
      await move([...shape(side,start,[third]),{el:third,...start},{el:ball(),...start}],850);
      carrier=third;await move([],250);
      if(pattern===0){
        await pass(side,support,at(62,42));await pass(side,shooter,at(76,51));
      }else if(pattern===1){
        await pass(side,support,at(66,wide));
        label('AVANZAMENTO SULLA FASCIA');await move([...shape(side,at(78,wide),[support]),{el:support,...at(78,wide)},{el:ball(),...at(78,wide)}],1000);
        await pass(side,shooter,at(84,50),true);
      }else if(pattern===2){
        await pass(side,support,at(58,65));
        label('INSERIMENTO');await move([{el:shooter,...at(75,48)}],600);
        await pass(side,shooter,at(82,48));
      }else{
        await pass(side,shooter,at(71,46));await pass(side,support,at(76,58));await pass(side,shooter,at(81,50));
      }
      if(current!==match||match._finished)return;
      const keeper=dots(opposite(side)).find(d=>d.dataset.role==='GK');
      const nearest=field(opposite(side)).sort((a,b)=>Math.abs(pos(a).x-pos(shooter).x)-Math.abs(pos(b).x-pos(shooter).x)).slice(0,2);
      label('PREPARA IL TIRO');
      await move(nearest.map((d,i)=>({el:d,x:pos(shooter).x+(right(side)?3:-3),y:pos(shooter).y+(i?4:-4)})),380);
      // World goal mouth: z 30.34–37.66 (44.62–55.38 percent).
      const y=outcome==='miss'?(seed%2?35:65):outcome==='post'?44.62:47+(seed%7);
      const target=at(outcome==='save'?95:outcome==='goal'?101:100,y);
      label('TIRO');
      await move([{el:keeper,...at(96,clamp(y,45,55))},{el:ball(),...target}],720);
      if(outcome==='save'){
        label('PARATA');await move([{el:ball(),...at(96,clamp(y,45,55))}],300);possession=opposite(side);carrier=null;
      }else if(outcome==='post'){
        label('PALO');await move([{el:ball(),...at(91,39)}],450);carrier=null;
      }else{label(outcome==='goal'?'RETE!':'TIRO FUORI');carrier=null;}
      await move([],650);
    }finally{api.attacking=false;}
  };
  api.offside=async function(e){
    const side=e.side,attacker=find(side,e.player?.id);if(!attacker)return;
    const defenders=dots(opposite(side)).map(d=>pos(d).x).sort((a,b)=>right(side)?b-a:a-b);
    const lineX=defenders[1]??xFor(side,75);
    const target={x:right(side)?Math.max(54,lineX+4):Math.min(46,lineX-4),y:pos(attacker).y};
    const line=document.createElement('div');line.className='offside-line';line.style.left=lineX+'%';document.getElementById('pitch').appendChild(line);
    try{
      const passer=field(side).find(d=>d!==attacker);if(!passer)return;
      const start=pos(passer);if(ball()){ball().style.left=start.x+'%';ball().style.top=start.y+'%';}
      await move([{el:attacker,...target}],300);label('PASSAGGIO IN PROFONDITÀ');
      await move([{el:ball(),...target}],600);label('FUORIGIOCO');
    }
    finally{line.remove();carrier=null;possession=opposite(side);}
  };
  function placeExit(){
    const button=document.querySelector('#match > .v104-menu-back');
    const controls=document.querySelector('#match .match-controls');
    if(button&&controls)controls.appendChild(button);
  }
  placeExit();window.addEventListener('load',placeExit,{once:true});
  goalNetSVG=()=>S9Popups.art('goal');
})();
