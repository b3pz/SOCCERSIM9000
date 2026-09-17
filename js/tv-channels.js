/* SerieA 9000 SIM — Canali TV parodia (V111)
   Prima ogni schermata "in diretta" mostrava sempre lo stesso badge
   "S9 90 LIVE". Ora per ogni partita viene scelto un canale finto (parodia
   dei canali sportivi/generalisti italiani anni '90-2000), con un piccolo
   "bollino" colorato/monogramma accanto al nome — non un logo vero (nessun
   marchio reale riprodotto), solo un blocco colorato con 1-2 lettere in
   stile "bug" da telegiornale, cosi' ogni canale si riconosce anche solo
   dal colore. Va caricato PRIMA di match-3d.js, match-intro.js e
   pitch-invasion.js (che lo usano), quindi resta vicino all'inizio del
   blocco di script del motore 3D in index.html. */
(function(){
'use strict';
const CHANNELS=[
 {name:'VAI 1',mark:'V1',bg:'#0e63b3',fg:'#fff'},
 {name:'VAI 2',mark:'V2',bg:'#1c8a4a',fg:'#fff'},
 {name:'VAI 3',mark:'V3',bg:'#c0392b',fg:'#fff'},
 {name:'VAI SPORT',mark:'VS',bg:'#e0a30b',fg:'#131313'},
 {name:'RETE 44',mark:'44',bg:'#7a1fa2',fg:'#fff'},
 {name:'CANALE 55',mark:'55',bg:'#1f9e9e',fg:'#fff'},
 {name:'ITALIA 1',mark:'I1',bg:'#e8622c',fg:'#fff'},
 {name:'STREAM',mark:'ST',bg:'#20264a',fg:'#f4c94b'},
 {name:'TELE 2',mark:'T2',bg:'#2c6e49',fg:'#fff'},
 {name:'TELE+',mark:'T+',bg:'#111318',fg:'#f4c94b'}
];
function pickChannel(){return CHANNELS[Math.floor(Math.random()*CHANNELS.length)]}
window.S9Channel=function(){return pickChannel().name};
// Restituisce l'oggetto completo (nome + bollino) per un nome canale gia'
// scelto, cosi' le 3 schermate di una stessa partita usano lo stesso
// colore/monogramma oltre che lo stesso nome.
window.S9ChannelInfo=function(name){return CHANNELS.find(c=>c.name===name)||pickChannel()};
window.S9ChannelBadge=function(name){
 const c=window.S9ChannelInfo(name);
 return `<span class="s9-ch-badge" style="background:${c.bg};color:${c.fg}">${c.mark}</span>${c.name}`;
};
})();
