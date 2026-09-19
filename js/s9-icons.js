/* SerieA 9000 SIM — Icone uniformi (FIX 2026-09 (51): "non ci devono essere
   icone o emoji da AI ma tutto dev'essere uniformato"). Il gioco usava
   emoji Unicode sparse (🎙️📣🏆🎲🎤🏟️ + meteo + cartellini...) che
   arrivano da font diversi a seconda del dispositivo/OS - risultato non
   uniforme e "da chatbot", non da broadcast anni '90/2000. S9Icon(name)
   restituisce un piccolo SVG inline, stesso stile a contorno piatto per
   tutte (stroke=currentColor, 1.3px, angoli arrotondati), eredita il
   colore del testo intorno e la dimensione del font (vedi .s9-icon in
   game.css). Nessuna dipendenza da font/emoji esterni. Ogni icona e' un
   <g> di forme SEMPLICI (linee/cerchi/rettangoli) apposta: piu' facili da
   tenere coerenti fra loro di percorsi disegnati a mano. */
(function(){
'use strict';
const F='fill="currentColor"'; // solo per gli elementi VOLUTAMENTE pieni
const ICONS={
 music:`<circle cx="4.6" cy="12" r="1.8" ${F} stroke="none"/><circle cx="11.4" cy="10.6" r="1.8" ${F} stroke="none"/><path d="M6.4 12V3.6L13.2 2.4V10.6"/>`,
 check:'<path d="M2.5 8.5l3.5 3.5 7.5-8"/>',
 gear:'<circle cx="8" cy="8" r="2.1"/><path d="M8 1.4v2M8 12.6v2M2.6 4.6l1.4 1.4M12 10l1.4 1.4M1.4 8h2M12.6 8h2M2.6 11.4l1.4-1.4M12 6l1.4-1.4"/>',
 megaphone:'<path d="M2 6.3v3.4l1.8.3v2.4a1 1 0 0 0 1.7.7l.4-.5 6.6 1.9V2.7L5.9 4.6l-.4-.5A1 1 0 0 0 3.8 4.8v1.2z" stroke-linejoin="round"/><path d="M12.1 6.2c1 .5 1 3.1 0 3.6"/>',
 mic:`<rect x="6" y="1.5" width="4" height="7.2" rx="2" ${F} stroke="none"/><path d="M4 7.3a4 4 0 0 0 8 0"/><path d="M8 11.4v3M6 14.4h4"/>`,
 sun:'<circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M12.9 3.1l-1.4 1.4M4.5 11.5L3.1 12.9"/>',
 cloudsun:'<circle cx="5" cy="5" r="2.1"/><path d="M5 1.2v1.2M1.2 5H2.4M2.4 2.4l.8.8M7.6 2.4l-.8.8"/><path d="M6.2 13.4h5.6a2.2 2.2 0 0 0 .4-4.4 3 3 0 0 0-5.7-1 2.5 2.5 0 0 0-2.5 2.4c0 .2 0 .4.1.6a2 2 0 0 0 .2 3.9z" stroke-linejoin="round"/>',
 rain:'<path d="M4 9h7.6a2.2 2.2 0 0 0 .4-4.4 3 3 0 0 0-5.7-1A2.5 2.5 0 0 0 3 6a2 2 0 0 0 1 3z" stroke-linejoin="round"/><path d="M5 11.2l-1 2.2M8 11.2l-1 2.2M11 11.2l-1 2.2"/>',
 wind:'<path d="M1.4 5.4h8.1a1.7 1.7 0 1 0-1.4-2.7"/><path d="M1.4 8.5h10.7a1.9 1.9 0 1 1-1.5 3.1"/><path d="M1.4 11.5h6.2"/>',
 fog:'<path d="M2 5.3h12M1 8h12.5M2.5 10.7h11M4 13.3h8"/>',
 heat:`<rect x="6.7" y="1.4" width="2.6" height="7.3" rx="1.3"/><circle cx="8" cy="11.6" r="2.2" ${F} stroke="none"/><path d="M7.3 4v5"/>`,
 snow:'<path d="M8 1.3v13.4M2.4 4.7l11.2 6.6M13.6 4.7L2.4 11.3"/><path d="M5.5 2.6l2.5 2 2.5-2M5.5 13.4l2.5-2 2.5 2"/>',
 moon:'<path d="M13.2 9.7A5.6 5.6 0 1 1 6.3 2.8a4.6 4.6 0 0 0 6.9 6.9z" stroke-linejoin="round"/>',
 chat:'<path d="M2 3h12v7.2H6.6L3.6 13v-2.8H2z" stroke-linejoin="round"/>',
 trophy:'<path d="M5 2h6v4a3 3 0 0 1-6 0V2z" stroke-linejoin="round"/><path d="M5 3H2.7a2 2 0 0 0 2 3M11 3h2.3a2 2 0 0 1-2 3"/><path d="M8 9v2.2M5.6 13.6h4.8l-.6-1.4H6.2z" stroke-linejoin="round"/>',
 plane:'<path d="M9.2 2.2L2 8.6l2.2.4 1 2 .9-1.9 1.3 3.3.9-.4-.3-3.5 4.3-4.5c.8-.9.3-2-.9-1.8z" stroke-linejoin="round"/>',
 muscle:`<rect x="1.3" y="6" width="2.1" height="4" rx=".6" ${F} stroke="none"/><rect x="12.6" y="6" width="2.1" height="4" rx=".6" ${F} stroke="none"/><rect x="3.3" y="5" width="1.5" height="6" rx=".5" ${F} stroke="none"/><rect x="11.2" y="5" width="1.5" height="6" rx=".5" ${F} stroke="none"/><rect x="4.9" y="7" width="6.2" height="2" rx=".4" ${F} stroke="none"/>`,
 flame:'<path d="M8 1.4c.6 1.9 2.7 2.6 2.7 5.2a2.7 2.7 0 0 1-5.4 0c0-1 .5-1.6 1-2.1-.1 1 .3 1.5.9 1.5.8 0 .4-1.3.3-2C7 2.8 7.5 2 8 1.4z" stroke-linejoin="round"/><path d="M8 14.6a3.4 3.4 0 0 0 3.4-3.4c0-1.1-.5-1.9-1.1-2.5.1 1.2-.5 1.9-1.2 1.9-1 0-.7-1-.4-1.8-1.6.7-3.3 1.9-3.3 3.4A2.6 2.6 0 0 0 8 14.6z" stroke-linejoin="round"/>',
 ice:'<path d="M2.2 2.6h5.1L10.8 6v5.1L7.3 14.6H2.2V9.5L5.7 6z" stroke-linejoin="round"/><path d="M5.7 6l3 1.2M5.7 6L4.3 9M5.7 6l1.6 3"/>',
 warning:`<path d="M8 1.8l6.6 11.6H1.4z" stroke-linejoin="round"/><path d="M8 6.2v3.2"/><circle cx="8" cy="11.4" r=".85" ${F} stroke="none"/>`,
 newspaper:'<rect x="1.5" y="3" width="10" height="10.2" rx=".6"/><path d="M11.5 5.2h1.8a1 1 0 0 1 1 1v6.2a1 1 0 0 1-1 1h-1.8"/><path d="M3.3 5.4h4M3.3 7h4M3.3 9h6.2M3.3 10.6h6.2M3.3 12.2h6.2"/>',
 controller:'<path d="M4.3 5.6h7.4a2.6 2.6 0 0 1 2.5 3.2l-.5 2a1.7 1.7 0 0 1-3.1.7l-1-1.4H6.4l-1 1.4a1.7 1.7 0 0 1-3.1-.7l-.5-2a2.6 2.6 0 0 1 2.5-3.2z" stroke-linejoin="round"/><path d="M4.7 7.6h1.8M5.6 6.7v1.8"/><circle cx="11.1" cy="7.3" r=".55" fill="currentColor" stroke="none"/><circle cx="12.2" cy="8.6" r=".55" fill="currentColor" stroke="none"/>',
 dice:`<rect x="2" y="2" width="12" height="12" rx="2.2"/><circle cx="5.4" cy="5.4" r=".9" ${F} stroke="none"/><circle cx="10.6" cy="5.4" r=".9" ${F} stroke="none"/><circle cx="8" cy="8" r=".9" ${F} stroke="none"/><circle cx="5.4" cy="10.6" r=".9" ${F} stroke="none"/><circle cx="10.6" cy="10.6" r=".9" ${F} stroke="none"/>`,
 run:`<circle cx="10.3" cy="2.7" r="1.4" ${F} stroke="none"/><path d="M9 5.1L6.5 7l1 2.3L4.9 13M9 5.1l2.9 1.1-.5 2.9M6.5 7.1l3.2-.4 1.5 2.3-1.9 3.4" stroke-linejoin="round"/>`,
 cardred:`<rect x="3" y="1.5" width="10" height="13" rx="1.3" ${F} stroke="none"/>`,
 cardyellow:`<rect x="3" y="1.5" width="10" height="13" rx="1.3" ${F} stroke="none"/>`,
 plus:'<path d="M8 3v10M3 8h10" stroke-width="2"/>',
 close:'<path d="M3 3l10 10M13 3L3 13" stroke-width="1.8"/>',
 stadium:'<path d="M1.5 10C1.5 6.9 4.4 4.5 8 4.5s6.5 2.4 6.5 5.5"/><rect x="2.6" y="9.5" width="10.8" height="4.3" rx="1.3"/><path d="M8 4.5V2.2M6.7 2.2h2.6"/>',
 pencil:'<path d="M10.6 2.3l3.1 3.1-8 8-3.4.6.6-3.4z" stroke-linejoin="round"/><path d="M9.4 3.5l3.1 3.1"/>',
 ball:'<circle cx="8" cy="8" r="6.4"/><path d="M8 4.7l2.4 1.7-.9 2.8h-3l-.9-2.8z" stroke-linejoin="round"/><path d="M8 4.7V2.5M6.5 9.2l-3.2 2.3M9.5 9.2l3.2 2.3M4.5 5.6L2.2 4.9M11.5 5.6l2.3-.7"/>'
};
function S9Icon(name,opts){
 opts=opts||{};
 const body=ICONS[name];
 if(!body)return '';
 const extra=name==='cardred'?' s9-icon-cardred':name==='cardyellow'?' s9-icon-cardyellow':'';
 const cls='s9-icon'+(opts.cls?' '+opts.cls:'')+extra;
 const style=opts.color?` style="color:${opts.color}"`:'';
 return `<svg class="${cls}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"${style}>${body}</svg>`;
}
window.S9Icon=S9Icon;
})();
