import {mountFlavourMotion} from './flavour-motion.js?v=4b9c965ff64e';
export function mountMenuCards(){
 if(!document.body.classList.contains('page-drinks'))return;
 const stack=document.querySelector('.specimen-slots');if(!stack)return;
 const header=document.querySelector('.site-header'),categories=document.querySelector('.menu-category-bar');
 const measure=()=>{document.body.style.setProperty('--menu-header-height',header.getBoundingClientRect().height+'px');document.body.style.setProperty('--menu-category-height',categories.getBoundingClientRect().height+'px');};
 const navigationSize=new ResizeObserver(measure);navigationSize.observe(header);navigationSize.observe(categories);measure();
 const focusTerrain=mountFlavourMotion();
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),motions=new Map();
 function move(card,picked){
  if(!card)return;
  const start=getComputedStyle(card).transform;
  motions.get(card)?.cancel();motions.delete(card);
  card.classList.toggle('is-active',picked);
  if(reduced.matches||!card.animate)return;
  const end=getComputedStyle(card).transform;
  const frames=[{transform:start,easing:'cubic-bezier(.4,0,.2,1)'},{transform:end}];
  if(picked){
   const room=Math.max(0,innerWidth-card.getBoundingClientRect().right-7),pull=Math.min(22,room);
   frames.splice(1,0,{offset:.45,transform:`translate(${pull}px,-4px) rotate(.7deg)`,easing:'cubic-bezier(.4,0,.2,1)'});
  }
  const animation=card.animate(frames,{duration:1000,fill:'none'});motions.set(card,animation);
  animation.onfinish=()=>{if(motions.get(card)===animation)motions.delete(card);};
 }
 reduced.addEventListener('change',()=>{if(reduced.matches){motions.forEach(a=>a.cancel());motions.clear();}});
 let active=null;
 function select(card){
  if(card===active)return;
  // Retarget from the visible frame if scrolling reverses during extraction.
  move(active,false);active=card;move(active,true);
  focusTerrain(active);
 }
 stack.classList.add('cards-interactive');
 // Measure layout centres, never transformed rectangles: lifting a selected
 // card must not feed back into the next selection and make the stack chatter.
 const cards=[...stack.querySelectorAll(':scope > .specimen-card')];
 let frame=0;
 function centreFocus(){
  frame=0;
  const viewport=window.visualViewport,top=viewport?.offsetTop||0,bottom=top+(viewport?.height||innerHeight);
  const readingTop=Math.min(bottom,Math.max(top,categories.getBoundingClientRect().bottom));
  const centre=(readingTop+bottom)/2;
  let nearest=null,distance=Infinity;
  for(const card of cards){
   if(!card.getClientRects().length)continue;
   let y=0;for(let node=card;node;node=node.offsetParent)y+=node.offsetTop;
   y-=scrollY;
   if(y+card.offsetHeight<=readingTop||y>=bottom)continue;
   const delta=Math.abs(y+card.offsetHeight/2-centre);
   if(delta<distance){nearest=card;distance=delta;}
  }
  select(nearest);
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(centreFocus);};
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('pageshow',schedule);
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});
 window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
 const layout=new ResizeObserver(schedule);[stack,header,categories,...cards].forEach(node=>layout.observe(node));
 document.fonts.ready.then(schedule);document.addEventListener('pendi:language',schedule);
 stack.addEventListener('focusin',event=>{if(event.target.matches(':focus-visible'))select(event.target.closest('.specimen-card'));});
 stack.addEventListener('focusout',()=>queueMicrotask(()=>{if(!stack.contains(document.activeElement))schedule();}));
 stack.addEventListener('keydown',event=>{
  if(event.key==='Escape'){active?.querySelector('details')?.removeAttribute('open');schedule();}
  else if((event.key==='Enter'||event.key===' ')&&event.target.matches('.specimen-card')){event.preventDefault();select(event.target);}
 });
 schedule();
 // Details occupy reserved trailing paper, never the icon or document flow.
}
