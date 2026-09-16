/* Dependency-free 3D geometry projected onto Canvas. Shared by kits and live match. */
(function(){
'use strict';
const cache=new Map(),numberCache=new Map();
const NEAR=.1;
// Clip in camera space before projecting: a near-plane crossing must not
// remove an entire pitch, stand or shirt panel for a single frame.
function clipNear(points){
 const output=[];
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],inside=a.z>=NEAR;
  if(inside)output.push(a);
  if(inside!==(b.z>=NEAR)){
   const t=(NEAR-a.z)/(b.z-a.z),q={};
   for(const key of ['z','nx','ny','cx','cy','u','v'])if(Number.isFinite(a[key])&&Number.isFinite(b[key]))q[key]=a[key]+(b[key]-a[key])*t;
   q.z=NEAR;q.x=q.cx+q.nx/NEAR;q.y=q.cy+q.ny/NEAR;
   if(Number.isFinite(q.x)&&Number.isFinite(q.y))output.push(q);
  }
 }
 return output;
}

const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n)};
function camera(eye,target,w,h,fov=46){
 const forward=unit(sub(target,eye)),right=unit(cross(forward,[0,1,0])),up=cross(right,forward),f=h/(2*Math.tan(fov*Math.PI/360));
 return p=>{const v=sub(p,eye),z=dot(v,forward),nx=dot(v,right)*f,ny=-dot(v,up)*f;return {x:w/2+nx/(z||1e-9),y:h/2+ny/(z||1e-9),z,nx,ny,cx:w/2,cy:h/2}};
}
function polygon(ctx,points,fill,stroke){
 points=clipNear(points);if(points.length<3)return;
 ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
 if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}
}
function scene(ctx,project){
 const faces=[];
 function face(vertices,color,texture,shade=0){const points=vertices.map(project);faces.push({points,color,texture,shade,depth:points.reduce((n,p)=>n+p.z,0)/points.length})}
 function box(center,size,color,angle=0,texture=null,lean=0,vertexTransform=null){
  const [x,y,z]=center,[w,h,d]=size,c=Math.cos(angle),s=Math.sin(angle);
  const vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,e])=>{const xx=a*w/2,yy=b*h/2,zz=e*d/2+yy*lean;return[x+xx*c+zz*s,y+yy,z-xx*s+zz*c]});
  [[0,1,2,3],[4,5,6,7],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]].forEach((indices,i)=>face(indices.map(j=>vertexTransform?vertexTransform(vertices[j]):vertices[j]),color,i===1?texture:null,[.24,0,.17,.08,0,.3][i]));
 }
 function flush(){
  faces.sort((a,b)=>b.depth-a.depth);
  for(const f of faces){polygon(ctx,f.points,f.color);if(f.texture)textureQuad(ctx,f.texture,f.points);if(f.shade)polygon(ctx,f.points,`rgba(0,0,0,${f.shade})`);}
 }
 return {face,box,flush};
}
function textureQuad(ctx,texture,p){
 if(p.every(v=>v.z<NEAR))return;
 const visible=clipNear(p);if(visible.length<3)return;
 const area=visible.reduce((sum,v,i)=>{const next=visible[(i+1)%visible.length];return sum+v.x*next.y-next.x*v.y},0);
 if(Math.abs(area)<.1)return;
 const w=texture.width,h=texture.height;
 const uv=area>0?[[w,h],[0,h],[0,0],[w,0]]:[[0,h],[w,h],[w,0],[0,0]];
 const points=p.map((v,i)=>({...v,u:uv[i][0],v:uv[i][1]}));
 function triangle(a,b,c){
  const du=b.u-a.u,dv=b.v-a.v,eu=c.u-a.u,ev=c.v-a.v,det=du*ev-eu*dv;
  if(Math.abs(det)<1e-8)return;
  const ax=((b.x-a.x)*ev-(c.x-a.x)*dv)/det,ay=((b.y-a.y)*ev-(c.y-a.y)*dv)/det;
  const bx=(du*(c.x-a.x)-eu*(b.x-a.x))/det,by=(du*(c.y-a.y)-eu*(b.y-a.y))/det;
  ctx.save();polygon(ctx,[a,b,c]);ctx.clip();
  ctx.transform(ax,ay,bx,by,a.x-ax*a.u-bx*a.v,a.y-ay*a.u-by*a.v);ctx.drawImage(texture,0,0);ctx.restore();
 }
 for(const indices of [[3,2,1],[3,1,0]]){
  const clipped=clipNear(indices.map(i=>points[i]));
  for(let i=1;i<clipped.length-1;i++)triangle(clipped[0],clipped[i],clipped[i+1]);
 }
}
// Stable planar layers for close cinematic cameras; no overlapping thin boxes.
function pitchSurface(ctx,project,x,z,width,depth,stripWidth){
 const layer=(left,right,color)=>polygon(ctx,[[left,0,z],[right,0,z],[right,0,z+depth],[left,0,z+depth]].map(project),color);
 layer(x,x+width,'#347f4d');
 for(let i=0;i<Math.ceil(width/stripWidth);i++)layer(x+i*stripWidth,Math.min(x+width,x+(i+1)*stripWidth),i%2?'rgba(222,240,179,.045)':'rgba(0,24,7,.055)');
 layer(-.045,.045,'#e2eddb');
}
function player(s,x,z,kit,phase=0,angle=0,scale=1,number='',keeper=false,celebration=0,pose=null){
 const skin='#c88f68',shirt=keeper?'#e9b637':kit.shirt,shorts=keeper?'#202d36':kit.shorts,socks=keeper?'#e9b637':kit.socks;
 const c=Math.cos(angle),sn=Math.sin(angle);
 const box=(dx,y,dz,w,h,d,color,texture,lean=0)=>s.box([x+(dx*c+dz*sn)*scale,y*scale,z+(-dx*sn+dz*c)*scale],[w*scale,h*scale,d*scale],color,angle,texture,lean,posed);
 const action=pose?.kind,progress=pose?.progress||0,arc=Math.sin(progress*Math.PI);
 function posed(v){
  if(!action)return v;
  const dx=(v[0]-x)/scale,dz=(v[2]-z)/scale;
  let lx=dx*c-dz*sn,ly=v[1]/scale,lz=dx*sn+dz*c;
  if(action==='header')ly+=arc*.65;
  if(action==='bicycle'){
   const a=-arc*2.35,yy=ly-.95,zz=lz;
   ly=.95+yy*Math.cos(a)-zz*Math.sin(a)+arc*.4;lz=yy*Math.sin(a)+zz*Math.cos(a);
  }
  if(action==='dive'){
   const a=(pose.direction||1)*arc*1.35,xx=lx,yy=ly-.9;
   lx=xx*Math.cos(a)-yy*Math.sin(a);ly=.9+xx*Math.sin(a)+yy*Math.cos(a)-arc*.25;
  }
  return [x+(lx*c+lz*sn)*scale,ly*scale,z+(-lx*sn+lz*c)*scale];
 }
 function limb(a,b,width,depth,color){
  const direction=unit(sub(b,a)),side=unit(cross(direction,[0,0,1])),front=cross(side,direction);
  const vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([u,v,w])=>{
   const origin=v<0?a:b,local=origin.map((n,i)=>n+side[i]*u*width/2+front[i]*w*depth/2);
   return posed([x+(local[0]*c+local[2]*sn)*scale,local[1]*scale,z+(-local[0]*sn+local[2]*c)*scale]);
  });
  [[0,1,2,3],[4,5,6,7],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]].forEach(face=>s.face(face.map(i=>vertices[i]),color));
 }
 const stride=Math.sin(action==='bicycle'||action==='volley'?progress*Math.PI:phase)*(action==='bicycle'||action==='volley'?.55:.22);
 box(0,1.24,0,.52,.58,.3,shirt,keeper?null:kit.front);
 box(0,.86,0,.48,.22,.29,shorts);
 for(const sign of [-1,1]){
  box(sign*.15,.64,sign*stride,.19,.3,.2,skin,null,sign*stride);
  box(sign*.15,.34,sign*stride*1.5,.17,.34,.18,socks,null,-sign*stride);
  box(sign*.15,.09,sign*stride*1.5+.06,.2,.15,.35,'#172027');
  const shoulder=[sign*.30,1.47,0],elbow=[sign*(.44+.12*celebration),1.15+.65*celebration,-sign*stride*.4],hand=[sign*(.44+.05*celebration),.96+1.36*celebration,-sign*stride*.7];
  limb(shoulder,elbow,.19,.22,shirt);limb(elbow,hand,.15,.17,skin);
 }
 box(0,1.59,0,.16,.14,.17,skin);box(0,1.78,0,.3,.32,.29,skin);
 box(0,1.96,-.02,.32,.09,.3,'#30231e');box(0,1.81,-.14,.31,.25,.06,'#30231e');
 // The back carries the live lineup number rather than the source sprite number.
 if(number){const key=shirt+':'+number;let n=numberCache.get(key);if(!n){n=document.createElement('canvas');n.width=64;n.height=80;const nc=n.getContext('2d');nc.fillStyle=shirt;nc.fillRect(0,0,64,80);const hex=shirt.replace('#',''),rgb=hex.length===3?hex.split('').map(c=>parseInt(c+c,16)):[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
 const light=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>145;
 nc.fillStyle=light?'#07101c':'#ffffff';nc.strokeStyle=light?'#ffffff':'#07101c';nc.lineWidth=5;nc.lineJoin='round';nc.font='900 48px Arial';nc.textAlign='center';nc.strokeText(number,32,55);nc.fillText(number,32,55);numberCache.set(key,n);}
  const points=[[-.26,.95,-.156],[.26,.95,-.156],[.26,1.53,-.156],[-.26,1.53,-.156]].map(([dx,y,dz])=>[x+(dx*c+dz*sn)*scale,y*scale,z+(-dx*sn+dz*c)*scale]);s.face(points.map(posed),shirt,n);
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
   const fctx=front.getContext('2d');fctx.drawImage(img,...profile.panel,0,0,128,144);
   /* FIX 2026-09: national-team kit source images have a fixed "10" printed on the
      front of the shirt (a leftover from how these assets were generated) — every
      player wearing the kit showed the same wrong front number, even though the
      back correctly shows each player's real number. Club kit images don't have
      this. Repainting this fixed region with the shirt's own colour erases the
      baked-in digits without needing to touch 76 source image files individually;
      the region was measured to clear the number on several national kits without
      touching the crest or sponsor logo above it. */
   if(/\/kits\/national\//.test(src)){
    const rx=128*0.24,ry=144*0.44,rw=128*(0.70-0.24),rh=144*(0.92-0.44);
    /* Sample the shirt's actual pixels just above the number rather than the
       declared profile colour, which is often an average sampled elsewhere on
       the shirt and can look like a faint patch against the real local shade. */
    let fill=fallback.shirt;
    try{
     const strip=fctx.getImageData(rx,Math.max(0,ry-4),rw,3).data;
     let r=0,g=0,b=0,n=0;
     for(let i=0;i<strip.length;i+=4){r+=strip[i];g+=strip[i+1];b+=strip[i+2];n++}
     if(n)fill=`rgb(${Math.round(r/n)},${Math.round(g/n)},${Math.round(b/n)})`;
    }catch(_e){}
    fctx.fillStyle=fill;
    fctx.fillRect(rx,ry,rw,rh);
   }
   resolve({...fallback,front});
  };img.onerror=()=>resolve({...fallback,error:true});img.src=src;
 });cache.set(src,task);return task;
}
function preview(kit){
 const c=document.createElement('canvas');c.width=360;c.height=440;const ctx=c.getContext('2d');
 const p=camera([3.1,2.7,6.6],[0,1.02,0],360,440,24),s=scene(ctx,p);
 s.box([0,-.05,0],[1.3,.08,1.2],'#15253c');player(s,0,0,kit,0,-.12);s.flush();return c;
}
window.S9Football3D={camera,scene,player,polygon,clipNear,pitchSurface,loadKit,preview};
})();
