/* SerieA 9000 SIM — Canali TV parodia (V111 / V113)
   Prima ogni schermata "in diretta" mostrava sempre lo stesso badge
   "S9 90 LIVE". Ora per ogni partita viene scelto un nome di canale finto
   (parodia dei canali sportivi/generalisti italiani anni '90-2000), cosi'
   varia: il tabellino della partita, l'ingresso in campo e l'invasione di
   campo mostrano lo stesso canale per tutta la durata della partita (vedi
   matchChannel in index.html).
   Va caricato PRIMA di match-3d.js, match-intro.js e pitch-invasion.js (che
   lo usano), quindi resta vicino all'inizio del blocco di script del motore
   3D in index.html.

   FIX 2026-09 (6): "un logo della tv che richiami quello originale di
   RAI/Stream/Sky/Mediaset anni 90-2000" - un tentativo precedente con un
   monogramma colorato era stato tolto perche' risultava confuso (badge
   troppo carico, sovrapposto al resto dell'HUD). Questa volta il bollino e'
   volutamente minimale e originale (nessun logo reale copiato): una singola
   forma geometrica a tinta unita con 1-2 caratteri, piccola, semitrasparente,
   in un angolo dedicato lontano dal resto dell'HUD - esattamente come i veri
   "bug" televisivi dell'epoca, mai un logo elaborato. */
(function(){
'use strict';
const CHANNELS=['VAI 1','VAI 2','VAI 3','VAI SPORT','RETE 44','CANALE 55','ITALIA 1','STREAM','TELE 2','TELE+'];
window.S9Channel=function(){return CHANNELS[Math.floor(Math.random()*CHANNELS.length)]};

// Forma + colore + sigla per ciascun canale: coerente per tutta la partita
// (stesso canale = stesso bollino), diverso da canale a canale.
const BUG={
 'VAI 1':{shape:'circle',color:'#1f6fb0',glyph:'1'},
 'VAI 2':{shape:'circle',color:'#1f9d55',glyph:'2'},
 'VAI 3':{shape:'circle',color:'#b23324',glyph:'3'},
 'VAI SPORT':{shape:'circle',color:'#dd7d17',glyph:'VS'},
 'RETE 44':{shape:'diamond',color:'#c2185b',glyph:'44'},
 'CANALE 55':{shape:'diamond',color:'#6a3fb5',glyph:'55'},
 'ITALIA 1':{shape:'hex',color:'#119aa8',glyph:'i1'},
 'STREAM':{shape:'hex',color:'#16375e',glyph:'S'},
 'TELE 2':{shape:'rounded',color:'#c9a316',glyph:'2'},
 'TELE+':{shape:'rounded',color:'#20242b',glyph:'+'}
};
const SHAPES={
 circle:'<circle cx="16" cy="16" r="14"/>',
 diamond:'<rect x="5" y="5" width="22" height="22" rx="3" transform="rotate(45 16 16)"/>',
 hex:'<polygon points="16,2 29,9 29,23 16,30 3,23 3,9"/>',
 rounded:'<rect x="2" y="2" width="28" height="28" rx="9"/>'
};
window.S9ChannelBug=function(name){
 const cfg=BUG[name]||{shape:'circle',color:'#1f6fb0',glyph:(name||'S9')[0]};
 const fs=cfg.glyph.length>1?11:15;
 return `<svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true" focusable="false">`+
  `<g fill="${cfg.color}" fill-opacity=".92" stroke="#fff" stroke-opacity=".85" stroke-width="1.3">${SHAPES[cfg.shape]||SHAPES.circle}</g>`+
  `<text x="16" y="21" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="${fs}" fill="#fff">${cfg.glyph}</text>`+
  `</svg>`;
};
})();
