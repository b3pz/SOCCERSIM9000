/* One identity shared by match UI, stadium boards and trophy ceremony. */
(function(){
'use strict';
const definitions={
 friendly:{name:'AMICHEVOLE',accent:'#71c4b8',dark:'#153e43',trophy:'friendly'},
 seriea:{name:'SERIE A · SCUDETTO',accent:'#d5b35f',dark:'#142f57',trophy:'scudetto'},
 finaleight:{name:'SERIE A · FINAL EIGHT',accent:'#d5b35f',dark:'#142f57',trophy:'scudetto'},
 italia:{name:'COPPA ITALIA',accent:'#65bc91',dark:'#153c36',trophy:'italia'},
 cdc:{name:'COPPA DEI CAMPIONI',accent:'#a7c8ff',dark:'#101f55',trophy:'cdc'},
 uefa:{name:'COPPA UEFA',accent:'#eeb976',dark:'#423024',trophy:'uefa'},
 world:{name:'COPPA DEL MONDO · FRANCIA 98',accent:'#e2c467',dark:'#163d78',trophy:'world'},
 euro:{name:'EURO 2000',accent:'#82d4df',dark:'#173f55',trophy:'euro'},
 supercoppa:{name:'SUPERCOPPA ITALIANA',accent:'#d6adc9',dark:'#3c2850',trophy:'supercoppa'}
};
function key(){return S9V10.matchContext?.state?.key||'seriea'}
function active(){return definitions[key()]||definitions.seriea}
function stadium(){const ctx=S9V10.matchContext;return ctx?.stadium||teamMeta[current?.h]?.stadium||T(current?.h)?.stadium||'Stadio nazionale'}
function apply(){
 const brand=active(),k=key();
 for(const id of ['prematch','kits','match','halftime','postmatch']){
  const el=document.getElementById(id);if(!el)continue;
  el.dataset.competitionKey=k;el.style.setProperty('--competition-accent',brand.accent);el.style.setProperty('--competition-dark',brand.dark);
 }
 const label=document.getElementById('stadiumLabel');if(label&&current?.h)label.textContent='DIRETTA: '+stadium().toUpperCase();
 const strip=document.querySelector('#match .radio-strip > span:last-child');if(strip)strip.textContent=brand.name;
 const ctx=S9V10.matchContext;
 const stage=ctx?.mode==='friendly'?(ctx.final?'FINALE · ESIBIZIONE':'AMICHEVOLE'):ctx?.match?.stage||'CAMPIONATO';
 for(const id of ['prematch','kits','halftime','postmatch']){
  const root=document.getElementById(id);if(!root)continue;
  let banner=root.querySelector('.s9-competition-banner');if(!banner){banner=document.createElement('div');banner.className='s9-competition-banner';root.appendChild(banner)}
  banner.textContent=brand.name+' · '+stage+(ctx?.stadium?' · '+ctx.stadium:'');
 }
}
const stadiumHomes=[
 {test:/san siro|meazza/,clubs:['milan_0607','inter_9798']},
 {test:/franchi/,clubs:['fiorentina_9899']},
 {test:/ferraris/,clubs:['genoa_9091','samp_9091']},
 {test:/tardini/,clubs:['parma_9899']},
 {test:/delle alpi/,clubs:['juve_9798','torino_9293']},
 {test:/^(stadio )?olimpico$|olimpico di roma/,clubs:['roma_0001','lazio_9798']},
 {test:/friuli/,clubs:['udinese_9798']},
 {test:/bentegodi/,clubs:['chievo_0102']},
 {test:/rigamonti/,clubs:['brescia_0001']},
 {test:/renato curi|\bcuri\b/,clubs:['perugia_9900']},
 {test:/penzo/,clubs:['venezia_9899']},
 {test:/granillo/,clubs:['reggina_0203']},
 {test:/romeo menti|\bmenti\b/,clubs:['vicenza_9697']},
 {test:/zaccheria/,clubs:['foggia_9192']},
 {test:/san nicola/,clubs:['bari_9900']},
 {test:/castellani/,clubs:['empoli_0607']},
 {test:/barbera/,clubs:['palermo_0708']},
 {test:/old trafford/,clubs:['manutd_9899']},
 {test:/anfield/,clubs:['liverpool_0405']},
 {test:/highbury/,clubs:['arsenal_0304']},
 {test:/camp nou/,clubs:['barcelona_0506']},
 {test:/bernab/,clubs:['real_0203']},
 {test:/mestalla/,clubs:['valencia_9900']},
 {test:/de kuip|\bkuip\b/,clubs:['feyenoord_0102']},
 {test:/amsterdam|arena/,clubs:['ajax_9495']},
 {test:/wembley/,clubs:['england_1996']},
 {test:/stade de france/,clubs:['france_1998']}
];
function stadiumIdentity(stadiumName=stadium()){
 const venue=String(stadiumName||'Stadio').trim(),name=venue.toLowerCase();
 const found=stadiumHomes.find(item=>item.test.test(name));
 if(!found)return {venue,clubs:[]};
 const home=current?.h,homeTeam=home&&T(home),ids=[...found.clubs];
 // Se gioca una diversa edizione dello stesso club, nello stadio compare
 // lo stemma dell'edizione effettivamente in campo.
 if(homeTeam){
  const slot=ids.findIndex(id=>T(id)?.name===homeTeam.name);
  if(slot>=0)ids[slot]=home;
 }
 return {venue,clubs:ids.map(id=>({id,name:T(id)?.name||id,colors:teamMeta[id]?.colors||['#23344c','#e8edf2']}))};
}
function stadiumStyle(stadiumName=stadium()){
 const name=stadiumName.toLowerCase();
 const seed=Array.from(name).reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);
 const style={track:false,tiers:2+seed%3,seats:['#526985','#6b4149','#4b756b','#9b865b'][seed%4],roof:['partial','classic','open','steep'][seed%4],corners:seed%2?'open':'closed',profile:'classic',accent:'#d8dde5',endTiers:2+seed%2,setback:seed%3,lights:4};
 if(/san siro|meazza/.test(name))Object.assign(style,{tiers:5,seats:'#b83a3f',roof:'towers',profile:'sansi',accent:'#d7d9dc'});
 else if(/old trafford/.test(name))Object.assign(style,{tiers:5,seats:'#aa3138',roof:'continuous',profile:'english',accent:'#e4e4e4'});
 else if(/anfield/.test(name))Object.assign(style,{tiers:4,seats:'#a42d36',roof:'steep',profile:'english',accent:'#f0e6dc'});
 else if(/wembley/.test(name))Object.assign(style,{tiers:4,seats:'#8b1f2f',roof:'arch',profile:'wembley',accent:'#e9ecef'});
 else if(/olimpico/.test(name))Object.assign(style,{track:true,tiers:4,seats:'#3d67a4',roof:'ring',profile:'olympic',accent:'#d9dde8'});
 else if(/stade de france/.test(name))Object.assign(style,{track:true,tiers:4,seats:'#315d9b',roof:'ring',profile:'olympic',accent:'#e7e8ed'});
 else if(/san paolo|maradona/.test(name))Object.assign(style,{track:true,tiers:4,seats:'#4d7eb1',roof:'open',profile:'bowl',accent:'#d7d9df'});
 else if(/camp nou/.test(name))Object.assign(style,{tiers:5,seats:'#364f9b',roof:'open',profile:'bowl',accent:'#8f2637'});
 else if(/bernab/.test(name))Object.assign(style,{tiers:5,seats:'#728199',roof:'continuous',profile:'bowl',accent:'#e9edf2'});
 else if(/mestalla/.test(name))Object.assign(style,{tiers:4,seats:'#da8e2e',roof:'partial',profile:'steep',accent:'#262b37'});
 else if(/de kuip|kuip/.test(name))Object.assign(style,{tiers:4,seats:'#558087',roof:'continuous',profile:'oval',accent:'#d8dde1'});
 else if(/amsterdam|arena/.test(name))Object.assign(style,{tiers:4,seats:'#d33a42',roof:'closed',profile:'modern',accent:'#e8e8e8'});
 else if(/delle alpi/.test(name))Object.assign(style,{track:true,tiers:4,seats:'#5c6d8e',roof:'ring',profile:'olympic',accent:'#d9e0e9'});
 else if(/highbury/.test(name))Object.assign(style,{tiers:3,seats:'#8f2531',roof:'classic',profile:'english',accent:'#e7dfcf'});
 if(/franchi/.test(name))Object.assign(style,{tiers:3,endTiers:2,track:true,roof:'partial',seats:'#5e497b',profile:'florence',corners:'open',setback:3,landmark:'torre-maratona',landmarkHeight:30});
 else if(/ferraris/.test(name))Object.assign(style,{tiers:4,endTiers:4,roof:'towers',seats:'#954943',accent:'#b78069',profile:'genoa',corners:'closed',setback:0});
 else if(/tardini/.test(name))Object.assign(style,{tiers:3,endTiers:2,roof:'classic',seats:'#dab84a',accent:'#365c8c',corners:'open',setback:0});
 else if(/friuli/.test(name))Object.assign(style,{tiers:3,endTiers:2,roof:'arch',track:true,seats:'#748593',profile:'udine',corners:'open',setback:4});
 else if(/bentegodi/.test(name))Object.assign(style,{tiers:4,endTiers:4,roof:'ring',track:true,seats:'#b2a046',profile:'oval',corners:'closed',setback:3});
 else if(/rigamonti|granillo|menti|z accheria|zaccheria|curi|penzo/.test(name))Object.assign(style,{tiers:2,endTiers:2,roof:'partial',corners:'open',setback:1});
 style.endTiers=Math.min(style.tiers,style.endTiers);
 if(style.track)style.setback=Math.max(3,style.setback);
 return style;
}
function adBoardText(){
 const sponsors={friendly:'SERIEA 9000 SIM',seriea:'SERIE A TIM · OPEL',finaleight:'FINAL EIGHT · PLAYSTATION',italia:'COPPA ITALIA · TIM',cdc:'COPPA DEI CAMPIONI · PLAYSTATION',uefa:'COPPA UEFA · CANON',world:'FRANCIA 98 · ADIDAS',euro:'EURO 2000 · PHILIPS',supercoppa:'SUPERCOPPA · PERONI'};
 return sponsors[key()]||active().name;
}
window.S9Competition={definitions,key,active,stadium,stadiumIdentity,stadiumStyle,adBoardText,apply};
const originalScore=updateScore;updateScore=function(){const result=originalScore.apply(this,arguments);apply();return result};
const originalPrematch=openPrematch;openPrematch=function(){const result=originalPrematch.apply(this,arguments);apply();return result};
})();
