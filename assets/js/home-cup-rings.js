import {projectHomeGlass} from './spatial-anchors.js?v=009beca07823';
// One continuous 2D text belt. A single RAF owns phase, speed and reveal.
export function mountHomeCupPreview({onMode,t,comparison=false}) {
 const home=document.getElementById('home'),source=home?.querySelector('.hero-subline span'),film=document.querySelector('[data-scroll-video]');
 if(!home||!source||!film)return null;
 const company=home.querySelector('.hero-subline span:nth-child(2)'),intro=home.querySelector('.hero-intro'),pause=document.querySelector('[data-motion-toggle]'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let originalCompany=company.textContent;
 let phrase=[source.textContent,originalCompany].map(s=>s.trim().replace(/[.!]+$/,'')).join(' · ')+' · ';
 home.classList.add('home-cup-preview');[source,company,intro].forEach(n=>n.classList.add('cup-orbit-source'));
 const ns='http://www.w3.org/2000/svg',make=(tag,attrs={})=>{const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
 const svg=make('svg',{'class':'cup-rings','aria-hidden':'true',focusable:'false'}),group=make('g',{'class':'cup-text-ring','data-text':phrase.toLocaleUpperCase(document.documentElement.lang)});svg.append(group);home.append(svg);
 let chars=[...group.dataset.text].map(char=>{const n=make('g',{'data-glyph':char});group.append(n);return{n,char};});
 const raster=document.createElement('canvas');raster.className='cup-raster';raster.setAttribute('aria-hidden','true');home.append(raster);const paint=raster.getContext('2d');let rasterX=0,rasterY=0;
 const measure=document.createElement('canvas').getContext('2d');
 let points=[],length=0,eligible=false,phase=0,frame=null,last=null,speed=1,reveal=0,arrivalAge=Infinity,armed=false,lastStation=null;
 const alpha=()=>Math.max(0,Math.min(1,Number(home.style.getPropertyValue('--scene-opacity')||1)));
 const paused=()=>pause?.classList.contains('is-paused');
 function point(distance){
  const target=((distance%length)+length)%length;let lo=0,hi=points.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(points[mid].s<target)lo=mid;else hi=mid;}
  const a=points[lo],b=points[hi],f=(target-a.s)/Math.max(.001,b.s-a.s);
  return{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,front:a.front+(b.front-a.front)*f};
 }
 const smooth=x=>x*x*(3-2*x);
 // Two rear gradients: centre 0%, midpoint 5%, both edges 30%.
 // The rim brightens only on
 // its front-facing side, so crossing the silhouette never causes a jump.
 const glyphOpacity=depth=>depth<=-.5?.05*smooth((1+depth)*2):depth<=0?.05+.25*smooth((depth+.5)*2):depth<.24?.3+.4*smooth(depth/.24):.7+.3*smooth(Math.min(1,(depth-.24)/.5));
 function draw(){
  paint.clearRect(0,0,raster.width,raster.height);
  if(length)for(const glyph of chars){const q=point((.08+phase)*length+glyph.offset),opacity=glyphOpacity(q.front);glyph.n.setAttribute('transform',`translate(${q.x.toFixed(3)} ${q.y.toFixed(3)})`);glyph.n.style.opacity=String(opacity);glyph.n.dataset.side=q.front>=0?'front':'back';glyph.n.dataset.depth=q.front.toFixed(4);if(glyph.sprite){paint.globalAlpha=opacity;paint.drawImage(glyph.sprite,q.x-rasterX+glyph.inkX,q.y-rasterY+glyph.inkY,glyph.sprite.width/glyph.density,glyph.sprite.height/glyph.density);}}
  raster.style.setProperty('--cup-presence',String(reveal));
  svg.style.setProperty('--cup-presence',String(reveal));svg.dataset.orbitTime=String(phase*42000);svg.dataset.speed=speed.toFixed(4);svg.dataset.reveal=reveal.toFixed(4);
 }
 function available(){return eligible&&home.dataset.cupMode==='space'&&!document.hidden&&!reduced.matches;}
 function shouldRun(){return available()&&alpha()>0&&armed&&(!paused()||arrivalAge<900);}
 function tick(now){
  frame=null;if(!shouldRun()){last=null;return;}
  const dt=last===null?0:Math.min(now-last,64);last=now;
  arrivalAge+=dt;
  // At arrival: a smooth 900 ms reveal while speed eases from 4x to 1x.
  const inProgress=Math.min(1,arrivalAge/900);reveal=inProgress*inProgress*(3-2*inProgress);
  const arrivalBoost=1+3*Math.pow(1-Math.min(1,arrivalAge/1200),2);
  // At departure: opacity decreases with scene progress, so rotation accelerates.
  const exitBoost=1+9*Math.pow(1-alpha(),1.25),target=Math.max(arrivalBoost,exitBoost);
  const nextSpeed=speed+(target-speed)*(1-Math.exp(-dt/100));
  if(!paused())phase+=dt*(speed+nextSpeed)/2/42000;
  speed=nextSpeed;draw();frame=requestAnimationFrame(tick);
 }
 function sync(){
  const station=film.dataset.station;
  if(station==='0'&&lastStation!=='0'&&(!armed||alpha()>.99)){
   // Never reset phase on entering a station or rebuilding geometry.
   if(!armed){armed=true;arrivalAge=0;reveal=0;speed=4;}
  }
  lastStation=station;
  if(alpha()===0||film.dataset.displayMode!=='video'){armed=false;reveal=0;arrivalAge=Infinity;}
  if(shouldRun()){if(frame===null){last=null;frame=requestAnimationFrame(tick);}}
  else if(frame!==null){cancelAnimationFrame(frame);frame=null;last=null;}
  draw();
 }
 const controls=document.createElement('div');controls.className='menu-depth-controls home-cup-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label',t('Text am Glas vergleichen','Compare text around the glass'));
 controls.innerHTML=`<span>${t('TEXT AM GLAS','TEXT & GLASS')}</span><button type="button" data-depth="flat">A · Original</button><button type="button" data-depth="space">B · ${t('Textfluss','Text flow')}</button>`;if(comparison)home.append(controls);
 controls.addEventListener('click',e=>{const b=e.target.closest('[data-depth]');if(b)onMode(b.dataset.depth);});
 function layout(){
  const anchor=projectHomeGlass(film);if(!anchor){eligible=false;home.classList.remove('cup-ready');sync();return;}
  const {base:cup,body,preset,key}=anchor;home.dataset.anchorPreset=key;svg.setAttribute('viewBox',`0 0 ${home.clientWidth} ${home.clientHeight}`);
  const rx=Math.min(body.width*preset.rings.radius,cup.x-14,innerWidth-cup.x-14),ry=Math.max(16,body.height*preset.rings.depth),cy=body.top+body.height*preset.rings.rows[0];
  rasterX=cup.x-rx-24;rasterY=cy-ry-24;const rasterWidth=rx*2+48,rasterHeight=ry*2+48,rasterDensity=Math.min(4,Math.max(3,devicePixelRatio||1));raster.width=Math.ceil(rasterWidth*rasterDensity);raster.height=Math.ceil(rasterHeight*rasterDensity);Object.assign(raster.style,{left:rasterX+'px',top:rasterY+'px',width:rasterWidth+'px',height:rasterHeight+'px'});paint.setTransform(rasterDensity,0,0,rasterDensity,0,0);paint.imageSmoothingEnabled=true;paint.imageSmoothingQuality='high';
  points=[];length=0;
  for(let j=0;j<=2048;j++){const angle=Math.PI-j/2048*Math.PI*2,q={x:cup.x+Math.cos(angle)*rx,y:cy+Math.sin(angle)*ry,front:Math.sin(angle),s:0};if(j){const prev=points[j-1];length+=Math.hypot(q.x-prev.x,q.y-prev.y);}q.s=length;points.push(q);}
  const style=getComputedStyle(company),font=parseFloat(style.fontSize);measure.font=`${style.fontWeight} ${font}px ${style.fontFamily}`;group.style.fontFamily=style.fontFamily;group.style.fontSize=font+'px';group.style.fontWeight=style.fontWeight;
  const metrics=chars.map(g=>measure.measureText(g.char)),widths=metrics.map(m=>m.width),natural=widths.reduce((a,b)=>a+b,0),tracking=(length-natural)/chars.length;
  // Rasterize each glyph once at high resolution. Moving native SVG text
  // re-hints thin strokes at each fractional baseline, causing visible hops.
  // Move the cached ink instead, with its INK CENTER fixed at the path point.
  const density=Math.min(4,Math.max(3,devicePixelRatio||1)),pad=2;
  chars.forEach((g,i)=>{
   const m=metrics[i],inkWidth=m.actualBoundingBoxLeft+m.actualBoundingBoxRight,inkHeight=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;
   const sprite=document.createElement('canvas');sprite.width=Math.max(1,Math.ceil((inkWidth+pad*2)*density));sprite.height=Math.max(1,Math.ceil((inkHeight+pad*2)*density));
   const ctx=sprite.getContext('2d');ctx.scale(density,density);ctx.font=measure.font;ctx.fillStyle='#f5e7cc';ctx.fillText(g.char,pad+m.actualBoundingBoxLeft,pad+m.actualBoundingBoxAscent);
   g.sprite=sprite;g.density=density;g.inkX=-pad-inkWidth/2;g.inkY=-pad-inkHeight/2;g.n.setAttribute('x',String(g.inkX));g.n.setAttribute('y',String(g.inkY));g.n.dataset.inkWidth=String(inkWidth);g.n.dataset.inkHeight=String(inkHeight);g.n.dataset.inkPad=String(pad);
  });
  let advance=0;chars.forEach((g,i)=>{g.offset=advance+widths[i]/2;advance+=widths[i]+tracking;});
  // The last-to-first advance is identical to every other gap: no empty tail,
  // duplicated glyph, squeezed font or reset when phase crosses the seam.
  group.dataset.pathLength=String(length);group.dataset.beltLength=String(advance);group.dataset.tracking=String(tracking);
  eligible=body.width>=preset.minBodyWidth&&body.left>=4&&body.top>=100&&body.top+body.height<home.clientHeight-80&&film.dataset.displayMode==='video'&&font<=18&&tracking>=.65;
  home.classList.toggle('cup-ready',eligible);home.dataset.anchorFallback=eligible?'none':'readability-crop-or-frame';sync();
 }
 const observer=new ResizeObserver(layout);observer.observe(film);observer.observe(company);window.addEventListener('resize',layout);document.fonts.ready.then(layout);
 // Scene/video mutations are frequent during a seek. They must not cancel and
 // restart the animation clock or remeasure the path on every decoded frame.
 new MutationObserver(sync).observe(home,{attributes:true,attributeFilter:['style']});
 if(pause)new MutationObserver(sync).observe(pause,{attributes:true,attributeFilter:['class']});
 let mediaMode=film.dataset.displayMode;
 new MutationObserver(()=>{if(mediaMode!==film.dataset.displayMode){mediaMode=film.dataset.displayMode;layout();}else sync();}).observe(film,{attributes:true,attributeFilter:['data-display-mode','data-station']});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 const hero=home.querySelector('.hero-content'),cue=home.querySelector('.scroll-cue'),cueNext=cue.nextSibling;
 layout();
 document.addEventListener('pendi:language',()=>{
  originalCompany=company.textContent;
  phrase=[source.textContent,originalCompany].map(s=>s.trim().replace(/[.!]+$/,'')).join(' · ')+' · ';
  group.dataset.text=phrase.toLocaleUpperCase(document.documentElement.lang);group.replaceChildren();
  chars=[...group.dataset.text].map(char=>{const n=make('g',{'data-glyph':char});group.append(n);return{n,char};});
  if(home.dataset.cupMode==='space')company.textContent=phrase.trim().replace(/ ·$/,'');
  layout();
 });
 return{setMode(mode){home.dataset.cupMode=mode;company.textContent=mode==='space'?phrase.trim().replace(/ ·$/,''):originalCompany;if(mode==='space')hero.append(cue);else home.insertBefore(cue,cueNext);controls.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.depth===mode)));layout();}};
}
