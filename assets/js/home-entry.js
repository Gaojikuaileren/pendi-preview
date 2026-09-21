export function mountHomeEntrance(designReady){
 const root=document.documentElement;
 if(root.dataset.homeEntry!=='pending')return;
 const film=document.querySelector('[data-scroll-video]'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let animations=[],observer,disposed=false,designLoaded=false,fontsLoaded=false;
 const inputEvents=['pointerdown','touchstart','wheel','keydown'];
 function finish(){
  if(disposed)return;disposed=true;clearTimeout(window.pendiEntryDeadline);
  root.dataset.homeEntry='complete';animations.forEach(a=>a.cancel());observer?.disconnect();
  inputEvents.forEach(type=>document.removeEventListener(type,finish,true));
  reduced.removeEventListener('change',finish);document.removeEventListener('visibilitychange',visibility);
 }
 function visibility(){if(document.hidden)finish();}
 function start(){
  if(disposed)return;
  if(root.dataset.homeEntry!=='pending'||reduced.matches||document.body.dataset.sceneActive!=='home'){finish();return;}
  if(!designLoaded||!fontsLoaded)return;
  if(film.dataset.displayMode==='error'){finish();return;}
  if(film.dataset.station!=='0'||!film.classList.contains('is-ready'))return;
  clearTimeout(window.pendiEntryDeadline);root.dataset.homeEntry='running';observer.disconnect();
  const layers=[
   // Fade photo, wave and opaque cream backing as one surface: separate
   // opacity layers would reveal a horizontal seam above the bottom strip.
   ['.experience',0,1100,0],
   ['.site-header',70,800,6],['#home .hero-content',140,1000,12],
   ['#home .cup-raster',190,1000,0],['#home .scroll-cue',240,900,10],
   ['.experience-strip',180,1000,10]
  ];
  animations=layers.flatMap(([selector,delay,duration,lift])=>{
   const node=document.querySelector(selector);if(!node)return [];
   const animation=node.animate([{opacity:0,translate:`0 ${lift}px`},{opacity:1,translate:'0 0'}],{delay,duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
   animation.id='home-entry';return [animation];
  });
  Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(finish);
 }
 inputEvents.forEach(type=>document.addEventListener(type,finish,{capture:true,passive:true}));
 reduced.addEventListener('change',finish);document.addEventListener('visibilitychange',visibility);
 observer=new MutationObserver(start);observer.observe(film,{attributes:true,attributeFilter:['class','data-station','data-display-mode']});
 observer.observe(root,{attributes:true,attributeFilter:['data-home-entry']});
 Promise.resolve(designReady).then(()=>{designLoaded=true;start();},finish);
 document.fonts.ready.then(()=>{fontsLoaded=true;start();});
}
