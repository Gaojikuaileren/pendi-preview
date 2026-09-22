import {WAVE_SETTINGS,SCENE_PROFILES,COMPACT_PROFILES,WIDE_PROFILES,waveY} from './wave.js?v=4b9c965ff64e';
export function mountIntegratedWave(container,button){
 const svg=container.querySelector('svg'),front=container.querySelector('[data-wave-front]'),back=container.querySelector('[data-wave-back]');
 if(!svg||!front||!back||!button)return null;
 const NS='http://www.w3.org/2000/svg',make=(tag,attrs={})=>{const el=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,value);return el;};
 const subjects=make('g',{'aria-hidden':'true'});svg.prepend(subjects);
 const bands=[],lines=[];for(let i=0;i<6;i++){const band=make('path'),line=make('path',{fill:'none','stroke-width':'1','vector-effect':'non-scaling-stroke'});svg.append(band,line);bands.push(band);lines.push(line);}
 const arcs=Array.from({length:3},()=>{const p=make('path',{fill:'none','stroke-width':'.8','vector-effect':'non-scaling-stroke'});subjects.append(p);return p;});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),daily=['#805b3f','#a17a51','#b89465','#c6a77c','#d1b995','#dbccaf'],rainbow=['#b83e4c','#d87735','#dfb643','#488b69','#477fa3','#82639d'];
 const portrait={...SCENE_PROFILES,home:[835,870,865,800,725],drinks:[650,708,674,601,592],reservation:[265,285,300,270,245],contact:[415,465,475,425,395]};
 let profiles=portrait,topLimit=0,blend={from:'home',to:'home',mix:0},elapsed=0,frame=null,last=null,lastDraw=0,paused=false,visible=true,colorMix=0,pride=container.dataset.prideMode==='true',anchors=null;
 const lerp=(a,b,t)=>a+(b-a)*t;
 const color=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(lerp(parseInt(a.slice(i,i+2),16),parseInt(b.slice(i,i+2),16),t)).toString(16).padStart(2,'0')).join('');
 function y(u,off=0){const quiet=['reservation','contact'].includes(blend.mix<.5?blend.from:blend.to);return waveY(u,elapsed/1000,0,{...WAVE_SETTINGS,profiles,topLimit,amplitude:reduced.matches?0:quiet?.4:2.2},blend)+off*(.48+.72*Math.sin(Math.PI*u));}
 function curve(off,close=false){let d='';for(let i=0;i<=96;i++){const u=i/96;d+=`${i?'L':'M'}${(u*1440).toFixed(1)} ${y(u,off).toFixed(2)}`;}return d+(close?'L1440 1000L0 1000Z':'');}
 function draw(){
   const quiet=['reservation','contact'].includes(blend.mix<.5?blend.from:blend.to),m=reduced.matches||quiet?.25:(1-Math.cos(elapsed/24000*Math.PI*2))/2;
   const start=-24*m;front.setAttribute('d',curve(start,true));back.setAttribute('d',curve(start-3,true));back.style.fill='#ad8b62';back.style.opacity='.28';
   for(let i=0;i<6;i++){const a=lerp(2+i*8,-24+i*8,m),b=a+8*m;let d=curve(a);for(let j=96;j>=0;j--)d+=`L${(j/96*1440).toFixed(1)} ${y(j/96,b).toFixed(2)}`;bands[i].setAttribute('d',d+'Z');bands[i].setAttribute('fill',color(daily[i],rainbow[i],colorMix));lines[i].setAttribute('d',curve(a));lines[i].setAttribute('stroke',color(daily[i],rainbow[i],colorMix));lines[i].setAttribute('opacity',String((.6-i*.045)*(1-.4*m)));}
   const scene=blend.mix<.5?blend.from:blend.to,weight=blend.from===blend.to?1:blend.mix<.5?Math.max(0,1-blend.mix*5):Math.max(0,(blend.mix-.8)*5);
   if(anchors&&['home','drinks'].includes(scene)){
     const a=anchors[scene],radii=scene==='home'?[43,58,75]:[85,102,118];
     arcs.forEach((arc,i)=>{let d='';const r=radii[i],drift=reduced.matches?0:Math.sin(elapsed/6800+i*.5)*1.5;for(let k=0;k<=48;k++){const angle=(.04+.92*k/48)*Math.PI;const x=a.x+(r+drift)*Math.cos(angle)*a.sx,yy=a.y+(i*4+(r*.16+i*1.5)*Math.sin(angle))*a.sy;d+=`${k?'L':'M'}${x.toFixed(1)} ${yy.toFixed(2)}`;}arc.setAttribute('d',d);arc.setAttribute('stroke',color('#ddc399',rainbow[i*2],colorMix));arc.setAttribute('opacity',String(weight*(.38-i*.07)));});
   }else arcs.forEach(a=>a.setAttribute('opacity','0'));
   subjects.dataset.subjectScene=scene;
   container.dataset.prideMode=String(pride);container.dataset.displayProgress=`${blend.from}:${blend.to}:${blend.mix.toFixed(4)}`;
   if(document.querySelector('.mobile-menu[open]')){const box=container.getBoundingClientRect();document.querySelectorAll('.menu-panel a').forEach(link=>{const r=link.getBoundingClientRect(),u=Math.min(1,Math.max(0,((r.left+r.right)/2-box.left)/box.width));link.classList.toggle('over-paper',(r.top+r.bottom)/2-box.top>y(u)/1000*box.height);});}
 }
 function canRun(){return visible&&!document.hidden&&!reduced.matches&&(!paused||Math.abs(colorMix-Number(pride))>.001);}
 function tick(now){frame=null;if(!canRun())return;const dt=last===null?0:Math.min(now-last,80);last=now;if(!paused)elapsed+=dt;const target=Number(pride);colorMix+=Math.sign(target-colorMix)*Math.min(Math.abs(target-colorMix),dt/1400);if(now-lastDraw>32){draw();lastDraw=now;}frame=requestAnimationFrame(tick);}
 function sync(){button.disabled=reduced.matches;button.setAttribute('aria-label',reduced.matches?button.dataset.reduced:paused?button.dataset.play:button.dataset.pause);button.classList.toggle('is-paused',reduced.matches||paused);if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;if(reduced.matches)colorMix=Number(pride);draw();if(canRun())frame=requestAnimationFrame(tick);}
 function resize(){const layout=getComputedStyle(document.body).getPropertyValue('--wave-layout').trim();profiles=layout==='wide'?WIDE_PROFILES:layout==='compact'?{...COMPACT_PROFILES,reservation:[220,250,260,230,210],contact:[265,285,300,275,250]}:portrait;
   // Reference canvas: book left, sensory text right, menu title left below.
   // Keep the other scenes and deferred screen-size compositions intact.
   if(matchMedia('(min-width:375px) and (max-width:430px) and (min-height:601px) and (orientation:portrait)').matches)profiles={...profiles,drinks:[550,450,485,565,505]};
   topLimit=layout==='wide'?72/Math.max(container.clientHeight,1)*1000:0;container.dataset.waveLayout=layout;
   const film=document.querySelector('[data-scroll-video]'),vr=film?.getBoundingClientRect(),wr=container.getBoundingClientRect();anchors=null;
   if(vr?.width&&wr.width){const scale=Math.max(vr.width/512,vr.height/768),ref=874/768;const point=(x,y)=>{const sx=(x+(512*ref-402)/2)/ref,sy=y/ref;return{x:(vr.left-wr.left+sx*scale-(512*scale-vr.width)/2)/wr.width*1440,y:(vr.top-wr.top+sy*scale-(768*scale-vr.height)*(layout==='wide'||innerWidth>=500?0:.5))/wr.height*1000,sx:scale/ref/wr.width*1440,sy:scale/ref/wr.height*1000};};anchors={home:point(330,520),drinks:point(98,296)};}
   // Keep reading areas below the complete contour envelope, including its
   // widest morph phase. A fixed envelope prevents text bobbing with waves.
   for(const [id,selector]of [['about','.scene-copy'],['contact','.scene-copy'],['drinks','.scene-note']]){
     const scene=document.getElementById(id),copy=scene?.querySelector(selector);if(!copy)continue;
     const box=copy.getBoundingClientRect(),left=Math.max(0,(box.left-wr.left)/wr.width),right=Math.min(1,(box.right-wr.left)/wr.width);let bottom=0;
     for(let i=0;i<=48;i++){const u=left+(right-left)*i/48;bottom=Math.max(bottom,waveY(u,0,0,{...WAVE_SETTINGS,profiles,topLimit,amplitude:0},{from:id,to:id,mix:0})+64);}
     scene.style.setProperty('--paper-safe-top',`${Math.max(112,bottom/1000*wr.height+16).toFixed(1)}px`);
   }
   draw();}
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});observer.observe(container);
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);
 button.addEventListener('click',()=>{paused=!paused;sync();});reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
 document.querySelector('.mobile-menu')?.addEventListener('toggle',draw);
 document.addEventListener('pendi:pride-preview',event=>{pride=event.detail===true;sync();});
 container.hidden=false;button.hidden=false;resize();sync();
 return{setBlend(from,to,mix){blend={from,to,mix};draw();}};
}
