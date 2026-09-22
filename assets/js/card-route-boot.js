// A deliberate menu entry starts at the top, independently of its animation.
// Stop resetting immediately on user input; scrolling during the flip is valid.
try{
 const raw=sessionStorage.getItem('pendi-menu-entry');
 if(raw){sessionStorage.removeItem('pendi-menu-entry');const entry=JSON.parse(raw);
  if(Date.now()-entry.time<12000&&entry.path===location.pathname){
   window.pendiMenuEntry=entry;
   const previous=history.scrollRestoration;history.scrollRestoration='manual';
   let done=false;
   const reset=()=>{if(!done)window.scrollTo({top:0,left:0,behavior:'instant'});};
   const finish=()=>{done=true;history.scrollRestoration=previous;for(const type of ['touchstart','pointerdown','wheel','keydown'])window.removeEventListener(type,finish,true);};
   for(const type of ['touchstart','pointerdown','wheel','keydown'])window.addEventListener(type,finish,{capture:true,passive:true});
   document.addEventListener('DOMContentLoaded',reset,{once:true});
   window.addEventListener('pageshow',()=>{reset();requestAnimationFrame(()=>{reset();finish();});},{once:true});
   reset();
  }
 }
}catch{/* Native navigation remains available without storage. */}
// Carry only a short-lived visual handoff across real document navigation.
try{
 const raw=sessionStorage.getItem('pendi-card-arrival');
 if(raw){sessionStorage.removeItem('pendi-card-arrival');const data=JSON.parse(raw);
  if(Date.now()-data.time<12000&&data.path===location.pathname&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
   window.pendiCardArrival=data;document.documentElement.dataset.cardArrival=data.kind;
   window.pendiCardDeadline=setTimeout(()=>{delete document.documentElement.dataset.cardArrival;},3000);
  }
 }
}catch{/* Storage is optional; native links remain usable. */}
