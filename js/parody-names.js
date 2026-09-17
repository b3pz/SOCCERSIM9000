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
const STAR_MAP={
 "Roberto Baggio":"Umberto Braggio",
 "Dino Baggio":"Dino Baggino",
 "Paolo Maldini":"Paolo Baldini",
 "Alessandro Del Piero":"Alessandro Del Nero",
 "Alessandro Nesta":"Alessandro Testa",
 "Francesco Totti":"Francesco Totta",
 "Gianluigi Buffon":"Gianluigi Buffoni",
 "Fabio Cannavaro":"Fabio Cannavaccio",
 "Filippo Inzaghi":"Filippo Spinzaghi",
 "Christian Vieri":"Christian Vierotto",
 "Javier Zanetti":"Xavier Zanotti",
 "Cristiano Zanetti":"Cristiano Zanotti",
 "Cristiano Ronaldo":"Cristiano Ronaldho",
 "Ronaldo":"Ronaldho \"Il Fenomenale\"",
 "Ronaldinho":"Ronaldhino",
 "Zinedine Zidane":"Zizinho Zizanne",
 "Zinédine Zidane":"Zizinho Zizanne",
 "David Beckham":"David Beckam",
 "Thierry Henry":"Thierry Enrico",
 "Luís Figo":"Luís Fico",
 "Didier Deschamps":"Didier Descampi",
 "Peter Schmeichel":"Peter Schmeicholo",
 "Oliver Kahn":"Oliver Kahnnone",
 "Rio Ferdinand":"Rio Fernandez",
 "Les Ferdinand":"Les Fernandino",
 "Michael Owen":"Michael Owens",
 "Owen Hargreaves":"Owen Hargraves",
 "Patrick Vieira":"Patrick Vieirao",
 "Hernán Crespo":"Hernán Crespotto",
 "Cafu":"Kafù",
 "Gianluca Vialli":"Gianluca Viallino",
 "Roberto Mancini":"Roberto Manciniello",
 "Francesco Mancini":"Francesco Mancinotti",
 "Angelo Peruzzi":"Angelo Peruzzone",
 "Francesco Toldo":"Francesco Toldino",
 "Marco Materazzi":"Marco Materazzoni",
 "Gabriel Batistuta":"Gabriel Batigolo",
 "Diego Simeone":"Diego Cimeone",
 "Taribo West":"Taribo Ovest",
 "Gianluca Pagliuca":"Gianluca Pagliucci",
 "Giuseppe Bergomi":"Giuseppe Bergami",
 "Aron Winter":"Aron Winner",
 "Francesco Moriero":"Francesco Muriero"
};

// Suffissi "da parodia italiana" usati quando il cognome non e' gia' in
// STAR_MAP. Scelti in modo deterministico dal nome originale, cosi' lo
// stesso giocatore ha sempre la stessa parodia.
const SUFFIXES=["ozzi","etti","ini","oni","ucci","ello","otto","assi","olo"];
const VOWEL_SWAP={a:'o',e:'i',i:'e',o:'u',u:'a'};

function hashStr(s){
 let h=0;
 for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;
 return h;
}

function mangleWord(w,seed){
 if(w.length<3)return w;
 const h=hashStr(w+seed);
 const mode=h%4;
 const lower=w.toLowerCase();
 if(mode===0){
  // Taglia il cognome a una radice corta e aggiunge un suffisso comico
  // "all'italiana" (Beckham -> Beckozzi, non Beckhametti-lunghissimo).
  const suf=SUFFIXES[h%SUFFIXES.length];
  let stem=lower.replace(/[aeiouy]+$/,'').replace(/[^a-zàèéìòù]+$/,'');
  if(stem.length<3)stem=lower;
  if(stem.length>6)stem=stem.slice(0,6);
  return capitalize(stem+suf);
 }
 if(mode===1){
  // Scambia due lettere adiacenti a meta' parola (classico "refuso" da
  // gioco non ufficiale: nome riconoscibile ma leggermente diverso).
  const mid=Math.max(1,Math.min(w.length-2,Math.floor(w.length/2)));
  const arr=w.split('');
  const tmp=arr[mid];arr[mid]=arr[mid+1]||tmp;arr[mid+1]=tmp;
  return arr.join('');
 }
 if(mode===2){
  // Sostituisce una vocale con una "vicina" (Ronaldo -> Runaldo).
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
 // mode===3: raddoppia una consonante centrale (Kahn -> Kahnn, Maldini -> Malldini).
 const mid=Math.max(1,Math.min(w.length-2,Math.floor(w.length/2)));
 return w.slice(0,mid)+w[mid]+w.slice(mid);
}
function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1)}

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

function applyParodyNames(){
 /* FIX 2026-09: "teams" e' dichiarato con "const" nello scope top-level di
    index.html (const DB={...}, teams=DB.teams, ...). Un let/const a livello
    di script NON diventa una proprieta' di window, quindi va letto come
    variabile bare (funziona: gli script <script src> classici condividono
    la stessa scope lessicale di primo livello), non come window.teams
    (che sarebbe sempre undefined). */
 if(typeof teams==='undefined'||!Array.isArray(teams))return;
 let count=0;
 for(const team of teams){
  for(const p of team.players||[]){
   if(p.__parodied)continue;
   p.realName=p.name;
   p.name=parodyName(p.name);
   p.__parodied=true;
   count++;
  }
 }
 console.info(`[SerieA 9000] Nomi parodia applicati a ${count} giocatori.`);
}

// index.html usa la variabile globale non dichiarata "teams" (window.teams
// funziona lo stesso in scope globale non-module). Eseguito subito: a
// questo punto dello script loading (ultimo file caricato) l'array e'
// gia' completo di squadre italiane + V4 + V10 estere/nazionali.
try{applyParodyNames();}catch(e){console.warn('Nomi parodia non applicati',e);}
window.S9ApplyParodyNames=applyParodyNames;
})();
