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
const OFFSIDE=[
 "{p} parte troppo presto: fuorigioco netto, altro che millimetrico.",
 "Il guardalinee alza la bandiera su {p}: partenza anticipata, classica.",
 "{p} in fuorigioco: aveva già iniziato a esultare, peccato.",
 "Fuorigioco di {p}: l'orologio del centravanti va sempre avanti."
];
const SUB=[
 "Cambio: dentro energie fresche, fuori chi ha dato tutto.",
 "Il mister muove la panchina: si cambia qualcosa lì davanti.",
 "Cambio tattico: vedremo se paga.",
 "Sostituzione: applausi per chi esce, curiosità per chi entra."
];
const FILLER=[
 ["Bel ritmo in questa fase, eh?","Vero, ma serve più lucidità sotto porta."],
 ["Il pubblico spinge parecchio stasera.","Si sente da qui, altro che."],
 ["Partita maschia a centrocampo.","Tanti duelli, poche cose per gli occhi finora."],
 ["Occhio ai cambi di gioco, qui si può aprire spazio.","Se lo trovano, guai."],
 ["Il campo regge bene nonostante tutto.","Sì, stasera scivola poco."],
 ["Manca ancora un po' di qualità nell'ultimo passaggio.","Concordo, tutto un po' impreciso."],
 ["Difesa alta, rischio fuorigioco costante.","Rischiano grosso, ma finora ha funzionato."],
 ["Bella pressione appena persa la palla.","Squadre ben organizzate, si vede il lavoro in settimana."],
 ["Un minuto di stanca, capita.","Succede, la partita è ancora lunga."],
 ["Il pallone gira bene tra le linee.","Manca solo l'ultimo tocco, per ora."],
 ["Tifosi sul pezzo anche in questa fase morta.","Meritano spettacolo, prima o poi arriva."],
 ["Questa squadra ama impostare da dietro.","Rischioso, ma quando funziona è bello da vedere."],
 ["Attenzione ai cross dalla fascia, lì c'è pericolo.","Vero, serve raddoppio di marcatura."],
 ["Ritmo che sta salendo, si sente.","Le gambe cominciano a girare meglio."],
 ["Un po' di nervosismo in campo, normale.","Partita che conta, si capisce dai falli."],
 ["Buona gestione del pallone in questa fase.","Sì, stanno abbassando i ritmi apposta."],
 ["L'arbitro lascia correre, si gioca.","Meglio così, la partita ne guadagna."],
 ["Panchine che parlano parecchio in questi minuti.","Normale, si preparano le prossime mosse."],
 ["Bella densità di uomini a centrocampo.","Difficile trovare spazi, per ora."],
 ["Il portiere sta a guardare, tutto tranquillo lì davanti.","Per ora, poi in questo sport non si sa mai."],
 ["Buon momento per rifiatare un attimo.","Ne approfittano entrambe le squadre, mi pare."],
 ["Qualche fischio dagli spalti, i tifosi vogliono più ritmo.","Capisco, ma la pazienza qui paga."],
 ["Squadre lunghe in questo momento.","Vero, ci sono spazi enormi in mezzo al campo."],
 ["Fase di studio reciproco, direi.","Normale a questo punto della gara."],
 ["Il pubblico di casa spinge, si sente forte.","Aiuta parecchio in momenti come questo."],
 ["Buona rotazione del pallone da un lato all'altro.","Cercano il varco giusto, prima o poi arriva."],
 ["Bel controllo orientato, si vede la qualità.","Dettagli che fanno la differenza, questi."],
 ["Intensità che cala un attimo, fisiologico.","Torneranno a spingere tra poco, vedrai."],
 ["Bel gesto tecnico, applausi anche dagli avversari.","Roba da vero campionato questo."],
 /* FIX 2026-09 (28): "aggiorna i dialoghi falli piu' fluidi possibili,
    l'altro che gli da del coglione praticamente ma si vogliono bene" -
    aggiunte alcune battute di riempimento con un po' di stuzzicatura
    affettuosa tra i due, senza mai essere cattivi: si punzecchiano come
    due vecchi amici, non come due che litigano davvero. */
 ["Io a questo ritmo un pronostico ce l\'avrei.","Ce l\'hai sempre, e sbagli sempre: vai tranquillo."],
 ["Certi cambi di modulo li vedo solo io, evidentemente.","O forse dormivi durante l\'ultima sostituzione, chi lo sa."],
 ["Bella lettura tattica quella, se posso dirlo.","Puoi dirlo, ogni tanto ci prendi pure tu."],
 ["Io un po\' di fame comincio ad averla, lo confesso.","Come sempre al minuto trenta: sei un orologio, non un telecronista."],
 ["Questa squadra mi sta piacendo parecchio stasera.","Ti piace sempre chi sta vincendo, diciamocelo con affetto."],
 ["Ho visto un dettaglio che nessuno ha notato.","Come ogni volta che ti addormenti e poi ti risvegli di scatto."]
];
const KICKOFF=[
 "Si comincia! {h} contro {a}, e qui stasera se ne vedranno delle belle (forse).",
 "Fischio d'inizio tra {h} e {a}: spegnete la TV di cucina, si gioca sul serio.",
 "{h} contro {a}: 22 uomini, un pallone, e un telecronista che ha già fame di panino.",
 "Si parte! {h} - {a}, chiudete WhatsApp e godetevi lo spettacolo."
];
/* FIX 2026-09 (10): "in caso di derby dovrebbero esaltare la cosa o se sono
   tipo inter vs inter" - due situazioni speciali al calcio d'inizio: derby
   di città vera (stessa città, es. Milano/Roma/Genova/Torino) e sfida tra
   due epoche dello stesso club (es. Inter 97/98 contro Inter 09/10). In
   entrambi i casi la battuta di apertura e' garantita (niente probabilità)
   e cambia registro: molto più carica per il derby, ironica/nostalgica per
   lo specchio nel tempo. */
const DERBY=[
 "{nick}! {h} contro {a}, qui stasera l'aria è diversa: non è una partita come le altre.",
 "Si scalda tutto per {nick}: {h} - {a}, tifoserie sugli spalti e telecronisti già con la voce tesa.",
 "{nick} stasera! {h} contro {a}: punteggio pieno di orgoglio cittadino, altro che tre punti.",
 "Sentite che silenzio prima del fischio? È {nick}, {h} contro {a}: qui non si scherza."
];
const SAME_CLUB=[
 "Curiosità della serata: {h} contro {a}. Stessa maglia, epoche diverse: stasera la storia gioca contro sé stessa.",
 "{h} contro {a}: praticamente uno specchio nel tempo, con la stessa maglia da due lati opposti del campo.",
 "Che stranezza bella: {h} sfida {a}. Sarà un derby in famiglia, tifosi divisi solo dal calendario.",
 "{h} contro {a}: stesso stemma, decenni diversi. Stasera vince solo il tempo che passa."
];
const DERBY_NICK={"Milano":"DERBY DELLA MADONNINA","Roma":"DERBY DELLA CAPITALE","Genova":"DERBY DELLA LANTERNA","Torino":"DERBY DELLA MOLE"};
const clubPrefix=id=>typeof id==='string'?id.replace(/_[0-9][0-9a-z]*$/,''):null;
const FULLTIME=[
 "Finisce qui: {h} {sh} - {sa} {a}. Il bar sotto casa apre comunque per il commento post-partita.",
 "Triplice fischio: {h} {sh} - {sa} {a}. Si torna a casa, chi contento e chi già a cercare scuse.",
 "Fine partita, {h} {sh} - {sa} {a}: la telecronaca chiude qui, il divano vi aspetta.",
 "90 minuti più recupero: {h} {sh} - {sa} {a}. Domani si ricomincia a discutere al bar."
];

const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
const fill=(tpl,vars)=>tpl.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??'');

/* FIX 2026-09 (6): "voglio tantissimo commento durante le partite" - le
   soglie di probabilita' erano troppo basse e la telecronaca risultava rada.
   Alzate decisamente (quasi sempre presente sugli episodi veri), e aggiunta
   chiacchiera di riempimento (FILLER, vedi filler() sotto) nei minuti senza
   eventi, cosi' i due telecronisti commentano in continuazione e non solo
   su gol/tiri/cartellini. */
function chanceMiss(player){
 if(!player||Math.random()>.7)return null;
 return fill(pick(CHANCE_MISS),{p:player.name});
}
function chanceSave(player){
 if(!player||Math.random()>.7)return null;
 return fill(pick(CHANCE_SAVE),{p:player.name});
}
function goal(player){
 if(!player)return null;
 return fill(pick(GOAL),{p:player.name});
}
function card(player){
 if(!player||Math.random()>.75)return null;
 return fill(pick(CARD),{p:player.name});
}
function offside(player){
 if(!player||Math.random()>.55)return null;
 return fill(pick(OFFSIDE),{p:player.name});
}
function sub(outp,inp){
 if(Math.random()>.55)return null;
 return fill(pick(SUB),{});
}
function kickoff(h,a,hid,aid){
 if(hid&&aid){
  if(clubPrefix(hid)&&clubPrefix(hid)===clubPrefix(aid))return fill(pick(SAME_CLUB),{h,a});
  const meta=typeof teamMeta!=='undefined'?teamMeta:null;
  const cityH=meta?.[hid]?.city,cityA=meta?.[aid]?.city;
  if(cityH&&cityA&&cityH===cityA)return fill(pick(DERBY),{h,a,nick:DERBY_NICK[cityH]||`DERBY DI ${cityH.toUpperCase()}`});
 }
 if(Math.random()>.9)return null;
 return fill(pick(KICKOFF),{h,a});
}
function fulltime(h,a,sh,sa){
 // Sempre presente: e' la battuta di chiusura, un piccolo "sipario".
 return fill(pick(FULLTIME),{h,a,sh,sa});
}
function filler(a1,a2){
 const lines=pick(FILLER);
 return [`${a1}: ${lines[0]}`,`${a2}: ${lines[1]}`];
}

window.S9Commentary={chanceMiss,chanceSave,goal,card,offside,sub,kickoff,fulltime,filler};
})();
