/* Render complete kit models; never display the damaged source sprite silhouettes. */
(function(){
'use strict';
const states=new WeakMap();
async function process(img){
 const src=img.getAttribute('src')||'';if(!/assets\/kits\/(national|foreign|italian)\/(home|away)\/[^/]+\.png(?:\?.*)?$/.test(src))return;
 if(states.get(img)?.src===src)return;
 const state={src,canvas:states.get(img)?.canvas};states.set(img,state);
 const kit=await S9Football3D.loadKit(src);
 if(states.get(img)!==state||img.getAttribute('src')!==src)return;
 const model=S9Football3D.preview(kit);model.className='s9-kit-model';model.setAttribute('role','img');model.setAttribute('aria-label',img.alt||'Divisa 3D');
 if(state.canvas?.isConnected)state.canvas.replaceWith(model);else img.after(model);
 state.canvas=model;img.classList.add('s9-kit-source');
}
function scan(){document.querySelectorAll('#kitHomeImg,#kitAwayImg,#teamHomeKit,#teamAwayKit,#v10PickerHome,#v10PickerAway,#homeKitHome,#homeKitAway,#awayKitHome,#awayKitAway').forEach(process)}
// FIX 2026-09 (52): questa funzione riusava il nome window.v7ProcessKits
// gia' assegnato da js/v7-release.js (che toglie via flood-fill lo sfondo
// chiaro dagli sprite storici nella schermata di scelta divise, #kits
// .kit-imgbox img) - caricando dopo, lo sovrascriveva del tutto invece di
// incatenarsi, e siccome renderKitScreen richiama window.v7ProcessKits
// per nome, il fix flood-fill smetteva silenziosamente di scattare.
// Nome distinto cosi' entrambe le funzioni restano vive.
window.S9KitModels=scan;
function boot(){scan();new MutationObserver(records=>{if(records.some(r=>r.type==='childList'||r.attributeName==='src'))scan()}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
