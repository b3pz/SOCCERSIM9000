/* Dependency-free 3D geometry projected onto Canvas. Shared by kits and live match. */
(function(){
'use strict';
const cache=new Map(),numberCache=new Map();
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n)};
function camera(eye,target,w,h,fov=46){
 const forward=unit(sub(target,eye)),right=unit(cross(forward,[0,1,0])),up=cross(right,forward),f=h/(2*Math.tan(fov*Math.PI/360));
 return p=>{const v=sub(p,eye),z=dot(v,forward);return {x:w/2+dot(v,right)*f/z,y:h/2-dot(v,up)*f/z,z}};
}
function polygon(ctx,points,fill,stroke){
 if(points.some(p=>p.z<=0))return;
 ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
 if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}
}
function scene(ctx,project){
 const faces=[];
 function face(vertices,color,texture,shade=0){const points=vertices.map(project);faces.push({points,color,texture,shade,depth:points.reduce((n,p)=>n+p.z,0)/points.length})}
 function box(center,size,color,angle=0,texture=null,lean=0){
  const [x,y,z]=center,[w,h,d]=size,c=Math.cos(angle),s=Math.sin(angle);
  const vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,e])=>{const xx=a*w/2,yy=b*h/2,zz=e*d/2+yy*lean;return[x+xx*c+zz*s,y+yy,z-xx*s+zz*c]});
  [[0,1,2,3],[4,5,6,7],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]].forEach((indices,i)=>face(indices.map(j=>vertices[j]),color,i===1?texture:null,[.24,0,.17,.08,0,.3][i]));
 }
 function flush(){
  faces.sort((a,b)=>b.depth-a.depth);
  for(const f of faces){polygon(ctx,f.points,f.color);if(f.texture)textureQuad(ctx,f.texture,f.points);if(f.shade)polygon(ctx,f.points,`rgba(0,0,0,${f.shade})`);}
 }
 return {face,box,flush};
}
function textureQuad(ctx,texture,p){
 // Two affine triangles map the shirt panel onto its projected 3D face.
 const [a,b,c,d]=p,w=texture.width,h=texture.height;
 function triangle(points,matrix){ctx.save();polygon(ctx,points);ctx.clip();ctx.transform(...matrix);ctx.drawImage(texture,0,0);ctx.restore()}
 triangle([d,c,b],[(c.x-d.x)/w,(c.y-d.y)/w,(b.x-c.x)/h,(b.y-c.y)/h,d.x,d.y]);
 triangle([d,b,a],[(b.x-a.x)/w,(b.y-a.y)/w,(a.x-d.x)/h,(a.y-d.y)/h,d.x,d.y]);
}
function player(s,x,z,kit,phase=0,angle=0,scale=1,number='',keeper=false,celebration=0){
 const skin='#c88f68',shirt=keeper?'#e9b637':kit.shirt,shorts=keeper?'#202d36':kit.shorts,socks=keeper?'#e9b637':kit.socks;
 const c=Math.cos(angle),sn=Math.sin(angle);
 const box=(dx,y,dz,w,h,d,color,texture,lean=0)=>s.box([x+(dx*c+dz*sn)*scale,y*scale,z+(-dx*sn+dz*c)*scale],[w*scale,h*scale,d*scale],color,angle,texture,lean);
 const stride=Math.sin(phase)*.22;
 box(0,1.24,0,.52,.58,.3,shirt,keeper?null:kit.front);
 box(0,.86,0,.48,.22,.29,shorts);
 for(const sign of [-1,1]){
  box(sign*.15,.64,sign*stride,.19,.3,.2,skin,null,sign*stride);
  box(sign*.15,.34,sign*stride*1.5,.17,.34,.18,socks,null,-sign*stride);
  box(sign*.15,.09,sign*stride*1.5+.06,.2,.15,.35,'#172027');
  box(sign*(.34+celebration*.04),1.32+celebration*.4,-sign*stride*.5,.19,.28,.23,shirt);
  box(sign*(.39-celebration*.1),1.07+celebration*1.13,-sign*stride+celebration*.13,.15,.3,.16,skin,null,sign*stride);
 }
 box(0,1.59,0,.16,.14,.17,skin);box(0,1.78,0,.3,.32,.29,skin);
 box(0,1.96,-.02,.32,.09,.3,'#30231e');box(0,1.81,-.14,.31,.25,.06,'#30231e');
 // The back carries the live lineup number rather than the source sprite number.
 if(number){const key=shirt+':'+number;let n=numberCache.get(key);if(!n){n=document.createElement('canvas');n.width=64;n.height=80;const nc=n.getContext('2d');nc.fillStyle=shirt;nc.fillRect(0,0,64,80);nc.fillStyle='#fff';nc.strokeStyle='#14212d';nc.lineWidth=3;nc.font='bold 44px Arial';nc.textAlign='center';nc.strokeText(number,32,55);nc.fillText(number,32,55);numberCache.set(key,n);}
  const points=[[-.26,.95,-.156],[.26,.95,-.156],[.26,1.53,-.156],[-.26,1.53,-.156]].map(([dx,y,dz])=>[x+(dx*c+dz*sn)*scale,y*scale,z+(-dx*sn+dz*c)*scale]);s.face(points,shirt,n);
 }
}
function loadKit(src){
 if(cache.has(src))return cache.get(src);
 const task=new Promise(resolve=>{
  const profile=window.S9KitProfiles?.[src];
  const fallback={shirt:profile?.shirt||'#436b9b',shorts:profile?.shorts||'#e8e8dd',socks:profile?.socks||'#436b9b',source:src};
  const img=new Image();img.onload=()=>{
   if(!profile){resolve({...fallback,error:true});return}
   const front=document.createElement('canvas');front.width=128;front.height=144;
   front.getContext('2d').drawImage(img,...profile.panel,0,0,128,144);
   resolve({...fallback,front});
  };img.onerror=()=>resolve({...fallback,error:true});img.src=src;
 });cache.set(src,task);return task;
}
function preview(kit){
 const c=document.createElement('canvas');c.width=360;c.height=440;const ctx=c.getContext('2d');
 const p=camera([3.1,2.7,6.6],[0,1.02,0],360,440,24),s=scene(ctx,p);
 s.box([0,-.05,0],[1.3,.08,1.2],'#15253c');player(s,0,0,kit,0,-.12);s.flush();return c;
}
window.S9Football3D={camera,scene,player,polygon,loadKit,preview};
})();
