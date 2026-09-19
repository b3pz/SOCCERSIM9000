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
  const right=side=>{
    const homeFirst=current?.coinToss?.homeAttacksRight??true;
    const homeRight=current?.half===2?!homeFirst:homeFirst;
    return side==='home'?homeRight:!homeRight;
  };
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
    if(api.attacking&&!realTime)ms*=1.4;
    targets.forEach(t=>{if(t.el)unique.set(t.el,t)});
    const motions=[...unique.values()].map(t=>({...t,start:pos(t.el),startLift:Math.max(0,-Number(/translateY\((-?[\d.]+)px\)/.exec(t.el.style.transform||'')?.[1]||0))}));
    motions.forEach(t=>{t.el.style.transition='none';if(t.pose){t.el.dataset.action=t.pose;t.el.dataset.actionDirection=t.direction||1}});
    await new Promise(resolve=>{
      let elapsed=0,last=null;
      function frame(now){
        if(current!==match||match._finished){resolve();return;}
        /* FIX 2026-09: il tetto alla velocità durante un'azione era applicato
           solo in modalità 3D (`window.S9Match3D?.mode!=='2d'`) - in 2D, con
           velocità 2x/4x, l'azione avanzava alla velocità piena e un
           tween di poche centinaia di ms si risolveva in 1-2 fotogrammi:
           esattamente il "palla avanti e un secondo dopo in porta" segnalato
           sui calci d'angolo. Il tetto ora vale per QUALSIASI modalità
           durante un'azione, non solo in 3D. */
        if(last!==null&&!paused&&!document.hidden)elapsed+=Math.min(50,now-last)*(realTime?1:api.attacking?(Number(speed)>=4?2:Number(speed)>=2?1.5:1):Math.max(1,speed));
        last=now;const progress=Math.min(1,elapsed/ms);
        motions.forEach(t=>{
          // La palla conserva una traiettoria regolare; i giocatori accelerano
          // e decelerano senza gli scatti lineari che spezzavano l'azione.
          const amount=t.el.id==='ball'?progress:progress*progress*(3-2*progress);if(t.pose)t.el.dataset.actionProgress=progress;
          t.el.style.left=(t.start.x+(t.x-t.start.x)*amount)+'%';
          t.el.style.top=(t.start.y+(t.y-t.start.y)*amount)+'%';
          if(t.el.id==='ball'){const lift=t.startLift*(1-progress)+(t.lift||0)*progress+(loft?Math.sin(progress*Math.PI)*35:0);t.el.style.transform=`translate(-50%,-50%) translateY(${-lift}px)`;}
        });
        if(progress<1)requestAnimationFrame(frame);
        else{motions.forEach(t=>{if(t.pose){delete t.el.dataset.action;delete t.el.dataset.actionProgress}});resolve();}
      }
      requestAnimationFrame(frame);
    });
  }
  /* FIX 2026-09 (30): "implementiamo l'IA" (pressing/possesso visibili nei
     movimenti, non solo nei numeri) - prima chi difendeva si muoveva con lo
     STESSO piccolo scarto proporzionale di chi attaccava, senza mai vedere
     davvero la palla: sembrava che la difesa "seguisse le linee" invece di
     pressare. Ora, quando la squadra non ha la palla, i giocatori vengono
     tirati verso la posizione REALE del pallone (non solo uno scarto), con
     un'intensita' legata all'atteggiamento tattico scelto (Offensivo preme
     alto e stretto, Difensivo resta piu' basso e compatto) - lo stesso
     campo st.mentality gia' usato dal motore per calcolare le probabilita'
     degli eventi, qui reso visibile nei movimenti. */
  function pressIntensity(team){
    const id=team==='home'?current?.h:current?.a;
    const m=(typeof career!=='undefined')?career?.teamStates?.[id]?.mentality:null;
    return m==='Offensivo'?1.4:m==='Difensivo'?.7:1;
  }
  function shape(side,target,exclude=[]){
    return ['home','away'].flatMap(team=>dots(team).filter(d=>!exclude.includes(d)).map(d=>{
      const base={x:+d.dataset.baseX,y:+d.dataset.baseY};
      const keeper=d.dataset.role==='GK';
      if(keeper)return {el:d,x:base.x,y:clamp(50+(target.y-50)*.12,43,57)};
      if(team===side)return {el:d,x:clamp(base.x+(target.x-50)*.22+(right(team)?5:-5)),y:clamp(base.y+(target.y-50)*.18,7,93)};
      const pull=clamp(.15*pressIntensity(team),.08,.42);
      return {el:d,x:clamp(base.x+(target.x-base.x)*pull),y:clamp(base.y+(target.y-base.y)*pull,7,93)};
    }));
  }
  /* FIX 2026-09: corners and free kicks used to move the defending team with the
     same weak, proportional drift as normal open-play circulation (shape()
     above), which barely nudges players — so during a corner the attacking
     side ran a full routine while the defence stayed close to its base
     formation, looking like it "wasn't reacting". Set pieces need the
     defending side to actually pack into its own box and mark near/far post,
     which is a different, much stronger movement than the general-purpose
     shape() offset, so this is a separate function rather than a tweak to it. */
  function setPieceShape(side,target,exclude=[]){
    const attackers=dots(side).filter(d=>!exclude.includes(d)).map(d=>{
      const base={x:+d.dataset.baseX,y:+d.dataset.baseY};
      const keeper=d.dataset.role==='GK';
      return {el:d,x:keeper?base.x:clamp(base.x+(target.x-50)*.22+(right(side)?5:-5)),y:keeper?clamp(50+(target.y-50)*.12,43,57):clamp(base.y+(target.y-50)*.18,7,93)};
    });
    const other=opposite(side),spread=[-16,-9,-3,3,9,16,-20,20];
    let marker=0;
    /* FIX 2026-09: i difensori devono convergere nella STESSA area di rigore
       verso cui vanno palla/attaccanti/bandierina d'angolo (il proprio
       portiere compreso) — quindi vanno espressi nel sistema di riferimento
       di 'side' (chi attacca), non in quello di 'other' (chi difende): con
       xFor(other,...) finivano specchiati nell'area opposta, quella che
       'other' sta ATTACCANDO, invece che in quella che sta DIFENDENDO. */
    const defenders=dots(other).filter(d=>!exclude.includes(d)).map(d=>{
      if(d.dataset.role==='GK')return {el:d,x:xFor(side,96),y:50};
      const i=marker++;
      const y=clamp(50+spread[i%spread.length]*.85+(target.y-50)*.35,10,90);
      const x=xFor(side,i<5?89-i%2*3:78);
      return {el:d,x,y};
    });
    return [...attackers,...defenders];
  }
  const baseSetup=setupPitch;
  setupPitch=function(){
    baseSetup();if(!current)return;
    carrier=null;
    const firstKick=current.coinToss?.kickoffSide||'home';
    possession=current.half===2?opposite(firstKick):firstKick;
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
      const team=T(teamId);item.append(swatch,document.createTextNode(`${team.name} ${team.season}`));legend.appendChild(item);
      const st=career.teamStates[side==='home'?current.h:current.a];
      // Gli undici slot restano stabili: chi entra occupa esattamente il
      // posto di chi esce, anche nel modello 3D e non solo nella lista.
      const players=st.lineup.map(id=>st.players.find(p=>p.id===id)).filter(Boolean);
      const rows=(st.formation||'4-4-2').split('-').map(Number);let cursor=0,gkSeen=false;
      /* FIX 2026-09 (30): "spesso sui calci d'angolo risulta esserci un
         altro portiere" - rete di sicurezza aggiuntiva oltre al fix in
         buildInitialLineup(): se per qualunque motivo la formazione
         contenesse comunque due giocatori con pos 'GK' (es. una rosa
         costruita altrove), solo il PRIMO viene trattato davvero da
         portiere (maglia gialla, piazzato tra i pali). Un eventuale
         secondo va comunque schierato in campo (nessun buco in formazione)
         ma come giocatore di movimento, cosi' non appare mai un secondo
         portiere durante corner/rigori/azioni normali. */
      for(const player of players){
        const d=find(side,player.id);if(!d)continue;
        const isKeeper=player.pos==='GK'&&!gkSeen;
        if(player.pos==='GK')gkSeen=true;
        let x=5,y=50;
        if(!isKeeper){
          let index=cursor++,row=0;
          while(row<rows.length-1&&index>=rows[row])index-=rows[row++];
          x=24+row*48/Math.max(1,rows.length-1);y=12+(index+1)*76/(rows[row]+1);
        }
        d.dataset.role=isKeeper?'GK':(player.pos==='GK'?'DF':player.pos);d.dataset.baseX=xFor(side,x);d.dataset.baseY=y;
        d.style.left=d.dataset.baseX+'%';d.style.top=y+'%';
        d.style.background=`linear-gradient(90deg,${primary} 0 50%,${secondary} 50% 100%)`;
        /* FIX 2026-09 (19): numero di maglia iconico per un pugno di
           giocatori riconoscibili (vedi S9_ICONIC_LOOKS in index.html),
           altrimenti resta l'indice in rosa come prima. Tonalita' di pelle
           calcolata dalla nazione della squadra, stabile per giocatore. */
        const shirt=(typeof s9SquadNumbers==='function'?s9SquadNumbers(st)[player.id]:null)||Math.max(1,st.players.findIndex(p=>p.id===player.id)+1);
        d.textContent=String(shirt);d.title=`N° ${shirt} · ${team.name} ${team.season} · ${player.name}`;
        d.setAttribute('aria-label',player.name);
        if(typeof s9SkinFor==='function')d.dataset.skin=s9SkinFor(team.country,player.id);
        {const look=(typeof S9_ICONIC_LOOKS!=='undefined'?S9_ICONIC_LOOKS[player.name]:null);if(look?.hair)d.dataset.hair=look.hair;else delete d.dataset.hair;}
      }
    }
    label('IN CAMPO');
  };
  async function pass(side,receiver,target,cross=false){
    const b=ball();if(!receiver||!b)return;
    let from=carrier&&dots(side).includes(carrier)?carrier:field(side)[0];
    if(from===receiver){label('CONDUZIONE');await move([...shape(side,target,[receiver]),{el:receiver,...target},{el:b,...target}],650);return;}
    if(!from)return;
    if(!carrier){const p=pos(from);b.style.left=p.x+'%';b.style.top=p.y+'%';}
    label(cross?'CROSS IN AREA':'PASSAGGIO');
    await move([...shape(side,target,[receiver,from]),{el:receiver,...target},{el:b,...target,lift:cross?22:0}],api.attacking?(cross?1100:900):2400,cross);
    carrier=receiver;possession=side;
  }
  api.openPlay=async function(minute){
    const side=possession,players=field(side);if(players.length<2)return;
    if(!carrier||!dots(side).includes(carrier)){
      carrier=players[(minute+1)%players.length];const start=pos(carrier);
      if(ball()){ball().style.left=start.x+'%';ball().style.top=start.y+'%';}
    }
    const options=players.filter(d=>d!==carrier),receiver=options[minute%options.length];
    const cross=false; // Quiet circulation reserves crosses and forward runs for highlights.
    if(cross){
      const winger=carrier||players[0],wide={x:xFor(side,74),y:minute%2?12:88};
      label('AZIONE SULLA FASCIA');
      await move([...shape(side,wide,[winger]),{el:winger,...wide},{el:ball(),...wide}],550);
      carrier=winger;
    }
    await pass(side,receiver,{x:xFor(side,cross?79:38+minute%4*9),y:cross?50:22+minute%5*14},cross);
    /* FIX 2026-09 (30): "implementiamo l'IA" - prima il possesso passava
       all'altra squadra a orario fisso (ogni 3 minuti, sempre), qualunque
       fosse la forza reale delle due squadre: il possesso "visibile" non
       aveva alcun legame con chi fosse davvero piu' forte. Ora la
       probabilita' di perdere palla in questo minuto dipende dal rapporto
       di forza tra chi ha palla e chi difende (usando la stessa
       lineupPower/mentalityMult gia' usate dal motore per gli eventi reali,
       vedi index.html) - una squadra nettamente piu' forte (o con
       atteggiamento piu' offensivo) tiene il possesso piu' a lungo e lo
       riconquista piu' spesso, invece di un turnover meccanico a orologio. */
    const other=opposite(side);
    const power=team=>{
      const id=team==='home'?current?.h:current?.a;
      if(typeof lineupPower!=='function'||!id)return 50;
      const m=(typeof career!=='undefined')?career?.teamStates?.[id]?.mentality:null;
      return lineupPower(id)*(typeof mentalityMult==='function'?mentalityMult(m):1);
    };
    const turnoverChance=clamp(.24+(power(other)-power(side))/110,.1,.48);
    if(Math.random()<turnoverChance){
      const p=pos(carrier);
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
  // Tratto finale condiviso tra azione aperta e palle inattive: rifinitura,
  // posizione del portiere e risoluzione dell'esito (gol/parata/palo/fuori).
  async function resolveShot(side,shooter,outcome,seed,at,match,firstTime=false){
    if(current!==match||match._finished)return;
    const keeper=dots(opposite(side)).find(d=>d.dataset.role==='GK');
    const nearest=field(opposite(side)).sort((a,b)=>Math.abs(pos(a).x-pos(shooter).x)-Math.abs(pos(b).x-pos(shooter).x)).slice(0,2);
    if(!firstTime){
      label('CONTROLLO E TIRO');
      await move(nearest.map((d,i)=>({el:d,x:pos(shooter).x+(right(side)?3:-3),y:pos(shooter).y+(i?4:-4)})),220);
    }
    // World goal mouth: z 30.34–37.66 (44.62–55.38 percent).
    const y=outcome==='miss'?(seed%2?35:65):outcome==='post'?44.62:47+(seed%7);
    const target=at(outcome==='save'?95:outcome==='goal'?101:100,y);
    const finish=api.event?.finish||(firstTime?(seed%11===0?'bicycle':seed%2?'header':'volley'):'shot');
    label(({header:'COLPO DI TESTA',bicycle:'ROVESCIATA',volley:'TIRO AL VOLO'})[finish]||'TIRO');
    // FIX 2026-09: la conclusione al volo/di testa da azione da fermo
    // (firstTime) partiva senza alcun arco - un filo di elevazione rende
    // il tocco credibile invece di un rettilineo palla-porta.
    await move([{el:keeper,...at(98,clamp(y,45,55)),pose:'dive',direction:y<50?-1:1},{el:shooter,...(firstTime?pos(shooter):{x:pos(shooter).x+(right(side)?1:-1)*2,y:pos(shooter).y}),pose:finish},{el:ball(),...target,lift:firstTime?10:0}],firstTime?620:650,firstTime);
    if(outcome==='save'){
      label('PARATA');await move([{el:ball(),...(keeper?pos(keeper):at(98,clamp(y,45,55)))}],300);possession=opposite(side);carrier=keeper||null;
    }else if(outcome==='post'){
      label('PALO');await move([{el:ball(),...at(91,39)}],450);carrier=null;
    }else{label(outcome==='goal'?'RETE!':'TIRO FUORI');carrier=null;}
    await move([],650);
  }
  animAttack=async function(side,outcome){
    const players=field(side);if(players.length<2)return;
    const e=api.event||{},match=current;
    const shooter=find(side,e.player?.id)||players[players.length-1];
    const seed=Array.from(String(e.player?.id||side)).reduce((n,c)=>n+c.charCodeAt(0),current.minute);
    const at=(x,y)=>({x:xFor(side,x),y});
    api.attacking=true;carrier=null;
    try{
      if(e.source==='penalty'){
        const keeper=dots(opposite(side)).find(d=>d.dataset.role==='GK'),spot=at(89.52,50);
        label('CALCIO DI RIGORE');
        /* FIX 2026-09 (32): "la squadra si mette tutta da una parte" -
           prima TUTTI i giocatori di ENTRAMBE le squadre (tranne portiere e
           tiratore) finivano nella stessa fascia stretta, sovrapposti gli
           uni sugli altri: l'indice usato per calcolare la posizione
           ripartiva da zero per ogni squadra dentro il flatMap, quindi casa
           e ospiti si sovrapponevano esattamente nella stessa zona. Ora i
           difendenti si dispongono lungo il bordo dell'area (come i veri
           calci di rigore) e gli attaccanti restano piu' arretrati, in
           attesa di un'eventuale ribattuta - due gruppi distinti invece di
           un unico ammasso indistinguibile.
        */
        const waitingDefenders=field(opposite(side)).filter(d=>d!==keeper);
        const waitingAttackers=field(side).filter(d=>d!==shooter);
        const spread=(list,x,yFrom,yTo)=>list.map((d,i)=>({el:d,...at(x,list.length>1?yFrom+i*((yTo-yFrom)/(list.length-1)):(yFrom+yTo)/2)}));
        await move([...spread(waitingDefenders,82,20,80),...spread(waitingAttackers,64,26,74),{el:keeper,...at(99.5,50)},{el:shooter,...at(86,50)},{el:ball(),...spot}],900);
        await move([],800);label('RINCORSA');await move([{el:shooter,...spot}],650);
        const y=outcome==='miss'?(seed%2?38:62):seed%2?46:54;
        label('TIRO DAL DISCHETTO');
        await move([{el:ball(),...at(outcome==='save'?98.5:102,y)},{el:keeper,...at(99,outcome==='save'?y:100-y),pose:'dive',direction:y<50?-1:1},{el:shooter,...spot,pose:'volley'}],650);
        if(outcome==='save'){possession=opposite(side);carrier=keeper||null;if(keeper)await move([{el:ball(),...pos(keeper)}],180);}
        label(outcome==='goal'?'GOL SU RIGORE':outcome==='save'?'RIGORE PARATO':'RIGORE FUORI');await move([],900);return;
      }
      // Palla inattiva: niente costruzione dal basso, la palla parte
      // direttamente dalla bandierina d'angolo o dal punto di punizione,
      // con il battitore designato dalla tattica della squadra.
      if(e.source==='corner'||e.source==='freekick'){
        const taker=find(side,e.taker?.id)||shooter;
        if(e.source==='corner'){
          const finisher=shooter!==taker?shooter:(players.filter(d=>d!==taker).slice(-1)[0]||shooter);
          const flag=at(100,seed%2?3:97);
          label('CALCIO D’ANGOLO');
          await move([...setPieceShape(side,flag,[taker]),{el:taker,...flag},{el:ball(),...flag}],700);
          carrier=taker;
          const box=at(88,47+seed%7);
          label('CROSS IN AREA');
          await move([...setPieceShape(side,box,[taker,finisher]),{el:finisher,...box},{el:ball(),...box,lift:22}],760,true);
          carrier=finisher;
          await resolveShot(side,finisher,outcome,seed,at,match,true);
          return;
        }else{
          const spot=at(78,seed%2?28:72);
          label('PUNIZIONE');
          await move([...setPieceShape(side,spot,[taker]),{el:taker,...spot},{el:ball(),...spot}],700);
          carrier=taker;await move([],350);
        }
        await resolveShot(side,shooter,outcome,seed,at,match);
        return;
      }
      const support=find(side,e.assist?.id)||players.find(d=>d!==shooter);
      const third=players.find(d=>d!==shooter&&d!==support)||support;
      const pattern=seed%4,wide=seed%2?20:80;
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
      if(pattern===0||pattern===3){
        const defender=field(opposite(side)).find(d=>d!==shooter),p=pos(shooter),dir=right(side)?1:-1;
        if(defender){
          label(pattern===0?'TUNNEL':'DRIBBLING');
          await move([{el:defender,x:p.x+dir*2,y:p.y},{el:ball(),x:p.x+dir*4,y:p.y}],350);
          await move([{el:shooter,x:p.x+dir*5,y:p.y+2},{el:ball(),x:p.x+dir*5,y:p.y+2},{el:defender,x:p.x+dir*2,y:p.y-2}],550);carrier=shooter;
        }
      }
      await resolveShot(side,shooter,outcome,seed,at,match,pattern===1||pattern===2);
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
      /* FIX 2026-09 (32): "sono tutti troppo veloci e non si capisce se alza
         la bandierina o no" - la sequenza durava meno di un secondo in
         tutto (300ms+600ms), la bandierina restava alzata solo 1000ms e
         nel frattempo la linea gialla spariva subito dopo: impossibile da
         leggere. Rallentata (450+750ms), la linea resta visibile un attimo
         in piu' dopo il fischio, e la bandierina resta alzata piu' a lungo
         e PRIMA che la linea sparisca, non in parallelo/dopo. */
      await move([{el:attacker,...target}],450);label('PASSAGGIO IN PROFONDITÀ');
      await move([{el:ball(),...target}],750);label('FUORIGIOCO');
      // FIX 2026-09 (30): "cos'altro potrebbero fare? il guardalinee..." -
      // il fuorigioco prima era segnalato solo dalla linea gialla a
      // schermo, senza alcun gesto fisico del guardalinee.
      window.S9Match3D?.linesmanFlag?.(1700);
      await new Promise(r=>setTimeout(r,900));
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
