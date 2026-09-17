/* SerieA 9000 SIM — Telecronaca parodia (V111)
   Battute da telecronista da bar sport, agganciate agli eventi reali della
   partita (calcio d'inizio, tiro fuori, parata, gol, ammonizione, fine
   partita). Usa il nome del giocatore cosi' com'e' in quel momento, quindi
   se js/parody-names.js ha gia' girato le battute citano automaticamente
   il nome-parodia ("il Fenomenale sbaglia un gol che neanche al calcetto
   del mercoledi'!"). Non e' invadente: non commenta ogni singolo episodio,
   solo una percentuale, cosi' il tabellino resta leggibile. Le linee
   restituite vengono passate a log() da index.html con lo stesso stile
   delle altre righe di cronaca, non serve CSS nuovo. */
(function(){
'use strict';

const CHANCE_MISS=[
 "{p} spara alto: gliel'avrebbe fatta gol pure il portiere.",
 "{p} calcia fuori: neanche al calcetto del mercoledì la sbaglia così.",
 "{p} manda la palla in curva: salutava qualcuno, sicuro.",
 "Occasionissima per {p}... e occasione sprecatissima.",
 "{p} tira a giro. Troppo giro: è finita in tribuna stampa.",
 "{p} controlla, si gira, calcia... e sveglia i piccioni sul tetto.",
 "Errore clamoroso di {p}: la porta era più larga del portone di casa sua.",
 "{p} ci prova di prima intenzione: la seconda intenzione era meglio."
];
const CHANCE_SAVE=[
 "Gran parata! {p} ci aveva creduto davvero tanto.",
 "{p} calcia bene ma il portiere vola: applausi a entrambi.",
 "Il portiere dice no a {p}. Con le buone maniere, ma dice no.",
 "{p} ci prova, il portiere risponde presente: si figuri.",
 "Tiro potente di {p}: il portiere lo ferma e si sfrega le mani, letteralmente."
];
const GOAL=[
 "GOOOL di {p}! Al bar sotto casa stasera offre lui.",
 "{p} la mette dentro! Roba da mettere in cornice, con tanto di vetro antiproiettile.",
 "GOL di {p}! Il portiere è ancora lì che si chiede cosa sia successo.",
 "Che gol di {p}! Altro che calcetto del mercoledì, quello è da Nazionale.",
 "{p} segna e corre verso la curva come se avesse vinto lui la lotteria di Capodanno.",
 "GOOOL! {p} ringrazia il palo, la traversa e soprattutto sé stesso.",
 "{p} in gol! Statua in piazza, minimo.",
 "Freddezza glaciale di {p} davanti al portiere: altro che frigorifero di casa."
];
const CARD=[
 "Ammonito {p}: l'arbitro non ha gradito la sceneggiata.",
 "Giallo a {p}, che protesta come se avesse vinto lui il pallone d'oro.",
 "{p} entra duro e si becca il cartellino: la nonna avrebbe fatto lo stesso fallo, ma piano.",
 "Cartellino per {p}: l'arbitro ha gli occhi buoni, altro che."
];
const KICKOFF=[
 "Si comincia! {h} contro {a}, e qui stasera se ne vedranno delle belle (forse).",
 "Fischio d'inizio tra {h} e {a}: spegnete la TV di cucina, si gioca sul serio.",
 "{h} contro {a}: 22 uomini, un pallone, e un telecronista che ha già fame di panino.",
 "Si parte! {h} - {a}, chiudete WhatsApp e godetevi lo spettacolo."
];
const FULLTIME=[
 "Finisce qui: {h} {sh} - {sa} {a}. Il bar sotto casa apre comunque per il commento post-partita.",
 "Triplice fischio: {h} {sh} - {sa} {a}. Si torna a casa, chi contento e chi già a cercare scuse.",
 "Fine partita, {h} {sh} - {sa} {a}: la telecronaca chiude qui, il divano vi aspetta.",
 "90 minuti più recupero: {h} {sh} - {sa} {a}. Domani si ricomincia a discutere al bar."
];

const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
const fill=(tpl,vars)=>tpl.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'');

function chanceMiss(player){
 if(!player||Math.random()>.3)return null;
 return fill(pick(CHANCE_MISS),{p:player.name});
}
function chanceSave(player){
 if(!player||Math.random()>.3)return null;
 return fill(pick(CHANCE_SAVE),{p:player.name});
}
function goal(player){
 if(!player||Math.random()>.5)return null;
 return fill(pick(GOAL),{p:player.name});
}
function card(player){
 if(!player||Math.random()>.35)return null;
 return fill(pick(CARD),{p:player.name});
}
function kickoff(h,a){
 if(Math.random()>.6)return null;
 return fill(pick(KICKOFF),{h,a});
}
function fulltime(h,a,sh,sa){
 // Sempre presente: e' la battuta di chiusura, un piccolo "sipario".
 return fill(pick(FULLTIME),{h,a,sh,sa});
}

window.S9Commentary={chanceMiss,chanceSave,goal,card,kickoff,fulltime};
})();
