/* SerieA 9000 SIM — Nomi parodia (V111)
   Il gioco usava i nomi veri dei calciatori. Su richiesta, ogni giocatore
   in rosa (tutte le squadre: italiane, estere V10, nazionali) viene
   rinominato a caricamento con un nome "parodia" in stile giochi non
   ufficiali anni '90/inizio 2000: riconoscibile a colpo d'occhio ma
   volutamente storpiato (una lettera cambiata, un cognome scambiato,
   un doppio senso). Per le stelle piu' note c'e' un nome scritto a mano
   (piu' divertente), per tutti gli altri centinaia di giocatori c'e' una
   trasformazione automatica ma deterministica: stesso giocatore, stesso
   nome parodia, ad ogni partita/sessione (cambia solo se cambia il nome
   originale nei dati). Non tocca id/overall/stats: solo il campo "name"
   mostrato a schermo. Va caricato DOPO tutti gli script che popolano
   l'array globale "teams" (V4, V10 incluso) quindi e' l'ultimo file
   dell'elenco in index.html. */
(function(){
'use strict';

// Nomi scritti a mano per le stelle piu' riconoscibili del database.
// FIX 2026-09: su richiesta, per i giocatori davvero iconici (quelli con
// un soprannome noto: "Il Fenomeno", "Zizou", "Pinturicchio"...) il nome
// non e' piu' una variazione minima (una lettera cambiata) ma un'invenzione
// vera e propria, ispirata al soprannome/tratto del giocatore ma con nome
// E cognome diversi da quelli reali - piu' distanza, piu' comica. Per tutti
// gli altri (centinaia di giocatori non da copertina) resta la
// trasformazione automatica piu' leggera qui sotto.
const STAR_MAP={
 // FIX 2026-09 (2): il tester ha fatto notare che "Uberto Codino" non ha
 // senso - Baggio ha un soprannome vero e notissimo ("Il Divin Codino"),
 // quindi qui usiamo direttamente quello invece di un'invenzione a caso.
 // Ripassati anche gli altri: dove esiste un soprannome italiano davvero
 // iconico lo usiamo (o lo richiamiamo da vicino), altrimenti resta
 // un'invenzione a tema sul nome/ruolo del giocatore.
 "Roberto Baggio":"Divin Codino",
 "Dino Baggio":"Nino Baggetti",
 "Paolo Maldini":"Paolo Muraglia",
 "Alessandro Del Piero":"Alessandro Pinturicchio",
 "Alessandro Nesta":"Alessandro Marmo",
 "Francesco Totti":"Francesco Pupone",
 "Gianluigi Buffon":"Gianluigi Guantone",
 "Fabio Cannavaro":"Fabio Corazza",
 "Filippo Inzaghi":"SuperPippo Inzaghi",
 "Christian Vieri":"Bobo Bombardo",
 "Javier Zanetti":"Pupi Trattore",
 "Cristiano Zanetti":"Cristiano Zanardi",
 "Cristiano Ronaldo":"Cristiano Settebello",
 "Ronaldo":"Rolando Fenomeno",
 "Ronaldinho":"Ronaldino Sorriso",
 "Zinedine Zidane":"Zizou Testadoro",
 "Zinédine Zidane":"Zizou Testadoro",
 "David Beckham":"David Piedidoro",
 "Thierry Henry":"Titi Velocista",
 "Luís Figo":"Luís Serpente",
 "Didier Deschamps":"Didier Acquaiolo",
 "Peter Schmeichel":"Peter Vichingo",
 "Oliver Kahn":"Oliver Titano",
 "Rio Ferdinand":"Rio Fortino",
 "Les Ferdinand":"Les Fortezza",
 "Michael Owen":"Michael Saetta",
 "Owen Hargreaves":"Owen Lavoratore",
 "Patrick Vieira":"Patrick Gigante",
 "Hernán Crespo":"Hernán Vulcano",
 "Cafu":"Kafù Pendolino",
 "Gianluca Vialli":"Gianluca Vulcanico",
 "Roberto Mancini":"Roberto Manciotto",
 "Francesco Mancini":"Francesco Mancione",
 "Angelo Peruzzi":"Angelo Portone",
 "Francesco Toldo":"Francesco Paratutto",
 "Marco Materazzi":"Marco Materasso",
 "Gabriel Batistuta":"Gabriel Batigol",
 "Diego Simeone":"Cholo Grintoso",
 "Taribo West":"Taribo Treccine",
 "Gianluca Pagliuca":"Gianluca Paglietta",
 "Giuseppe Bergomi":"Giuseppe Zione",
 "Aron Winter":"Aron Vincitore",
 "Francesco Moriero":"Francesco Moretto"
};

// Allenatori: stessa idea, versione ridotta per i piu' noti; il resto
// passa dalla trasformazione automatica (vedi applyParodyCoaches sotto).
const COACH_STAR_MAP={
 "Arrigo Sacchi":"Arrigo Sacchetti",
 "Giovanni Trapattoni":"Giovanni Trapiantoni",
 "Fabio Capello":"Fabio Cappello",
 "Marcello Lippi":"Marcello Lippone",
 "Carlo Ancelotti":"Carletto Ancellotti",
 "Claudio Ranieri":"Claudio Ranierotto",
 "José Mourinho":"José Misterioso",
 "Franz Beckenbauer":"Franz Kaiserbauer",
 "Sven-Göran Eriksson":"Svennis Ericsson",
 "Jürgen Klinsmann":"Jürgen Klingsmann",
 "Dino Zoff":"Dino Zaffo",
 "Vicente del Bosque":"Vicente del Bosco",
 "Otto Rehhagel":"Re Otto Rehagel",
 "Terry Venables":"Tel Venabile"
};
// Etichette generiche presenti nel database che NON sono nomi propri di
// persona: vanno lasciate esattamente come sono.
const COACH_SKIP=new Set(["Allenatore storico"]);

/* FIX 2026-09: la trasformazione automatica (per tutti i giocatori non in
   STAR_MAP) tagliava il cognome e ci incollava un suffisso finto-italiano -
   ogni tanto il risultato collideva con una parola vera (es. un portiere di
   riserva finiva rinominato in qualcosa che si leggeva come "Riserve"),
   confondendo piu' che facendo sorridere. Il tester ha chiesto di tornare
   allo stile dei primi giochi non ufficiali (ISS Pro e affini): si cambia
   una vocale, o al massimo una lettera, il nome resta chiaramente
   riconoscibile. Tolti i modi "taglia+suffisso" e "scambia due lettere":
   restano solo le due varianti piu' leggere. */
const VOWEL_SWAP={a:'o',e:'i',i:'e',o:'u',u:'a'};

function hashStr(s){
 let h=0;
 for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;
 return h;
}

function mangleWord(w,seed){
 if(w.length<3)return w;
 const h=hashStr(w+seed);
 const mode=h%2;
 if(mode===0){
  // Sostituisce una vocale con una "vicina" (Ronaldo -> Runaldo, Maldini -> Malduni).
  let out='',done=false;
  for(let i=w.length-1;i>=0;i--){
   const c=w[i],lc=c.toLowerCase();
   if(!done&&VOWEL_SWAP[lc]){
    const rep=VOWEL_SWAP[lc];
    out=w.slice(0,i)+(c===lc?rep:rep.toUpperCase())+w.slice(i+1);
    done=true;
   }
  }
  return done?out:w;
 }
 // mode===1: raddoppia una consonante centrale (Kahn -> Kahnn, Maldini -> Malldini).
 const mid=Math.max(1,Math.min(w.length-2,Math.floor(w.length/2)));
 return w.slice(0,mid)+w[mid]+w.slice(mid);
}

function parodyName(original){
 if(!original)return original;
 if(STAR_MAP[original])return STAR_MAP[original];
 const parts=original.split(' ').filter(Boolean);
 if(parts.length>=2){
  // Storpia solo il cognome (l'ultima parola): il nome resta riconoscibile,
  // la firma "legale" (cognome) cambia sempre.
  const first=parts.slice(0,-1).join(' ');
  const last=parts[parts.length-1];
  return `${first} ${mangleWord(last,original)}`;
 }
 return mangleWord(parts[0]||original,original);
}

function parodyCoach(original){
 if(!original||COACH_SKIP.has(original))return original;
 if(COACH_STAR_MAP[original])return COACH_STAR_MAP[original];
 return parodyName(original);
}

function applyParodyNames(){
 /* FIX 2026-09: "teams" e' dichiarato con "const" nello scope top-level di
    index.html (const DB={...}, teams=DB.teams, ...). Un let/const a livello
    di script NON diventa una proprieta' di window, quindi va letto come
    variabile bare (funziona: gli script <script src> classici condividono
    la stessa scope lessicale di primo livello), non come window.teams
    (che sarebbe sempre undefined). */
 if(typeof teams==='undefined'||!Array.isArray(teams))return;
 let count=0,coaches=0;
 for(const team of teams){
  for(const p of team.players||[]){
   if(p.__parodied)continue;
   p.realName=p.name;
   p.name=parodyName(p.name);
   p.__parodied=true;
   count++;
  }
  if(team.coach&&!team.__coachParodied){
   team.realCoach=team.coach;
   team.coach=parodyCoach(team.coach);
   team.__coachParodied=true;
   coaches++;
  }
 }
 console.info(`[SerieA 9000] Nomi parodia applicati a ${count} giocatori e ${coaches} allenatori.`);
}

// index.html usa la variabile globale non dichiarata "teams" (window.teams
// funziona lo stesso in scope globale non-module). Eseguito subito: a
// questo punto dello script loading (ultimo file caricato) l'array e'
// gia' completo di squadre italiane + V4 + V10 estere/nazionali.
try{applyParodyNames();}catch(e){console.warn('Nomi parodia non applicati',e);}
window.S9ApplyParodyNames=applyParodyNames;
})();
