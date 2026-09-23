import {mountFlavourMotion} from './flavour-motion.js?v=2dc20be597d9';
export function mountMenuCards(){
 if(!document.body.classList.contains('page-drinks'))return;
 const stack=document.querySelector('.specimen-slots');if(!stack)return;
 const header=document.querySelector('.site-header'),categories=document.querySelector('.menu-category-bar');
 const sideNavigation=()=>getComputedStyle(document.body).getPropertyValue('--menu-navigation-layout').trim()==='side';
 const measure=()=>{const side=sideNavigation();document.body.style.setProperty('--menu-header-height',(side?0:header.getBoundingClientRect().height)+'px');document.body.style.setProperty('--menu-category-height',(side?0:categories.getBoundingClientRect().height)+'px');};
 const navigationSize=new ResizeObserver(measure);navigationSize.observe(header);navigationSize.observe(categories);measure();
 const terrainFocus=[mountFlavourMotion(),mountFlavourMotion()];
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
 let active=null,activeRow=[];
 function select(card){
  const columns=getComputedStyle(stack).gridTemplateColumns.split(' ').length;
  const siblings=card?cards.filter(item=>item.dataset.category===card.dataset.category):[];
  const start=card?Math.floor(siblings.indexOf(card)/columns)*columns:0;
  const row=card?siblings.slice(start,start+columns):[];
  if(card===active&&row.length===activeRow.length&&row.every((item,index)=>item===activeRow[index]))return;
  // Retarget from the visible frame if scrolling reverses during extraction.
  const changed=row.length!==activeRow.length||row.some((item,index)=>item!==activeRow[index]);
  for(const previous of activeRow)if(!row.includes(previous))move(previous,false);
  for(const next of row)if(!activeRow.includes(next))move(next,true);
  active=card;activeRow=row;
  if(changed)terrainFocus.forEach((focus,index)=>focus(row[index]||null));
  if(active?.dataset.category)for(const link of categories.querySelectorAll('[data-menu-category]')){
   if(link.dataset.menuCategory===active.dataset.category)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  }
 }
 stack.classList.add('cards-interactive');
 // Measure layout centres, never transformed rectangles: lifting a selected
 // card must not feed back into the next selection and make the stack chatter.
 const cards=[...stack.querySelectorAll(':scope > .specimen-card')];
 categories.addEventListener('click',event=>{
  const link=event.target.closest('[data-menu-category]');if(!link)return;
  const card=cards.find(item=>item.dataset.category===link.dataset.menuCategory);if(!card)return;
  event.preventDefault();
  const top=card.getBoundingClientRect().top+scrollY-(sideNavigation()?24:categories.getBoundingClientRect().bottom+24);
  window.scrollTo({top:Math.max(0,top),behavior:reduced.matches?'instant':'smooth'});
 });
 // One artwork size for template cards and uploaded full-card artwork.
 // Scaling lives inside the pickup surface, so scrolling/pickup never changes its ratio.
 const fitCards=()=>{
  const columns=getComputedStyle(stack).gridTemplateColumns.split(' ').length;
  const gap=parseFloat(getComputedStyle(stack).columnGap)||0;
  const available=(stack.clientWidth-8-gap*(columns-1))/columns-20;
  const viewportHeight=Math.min(innerHeight,window.visualViewport?.height||innerHeight);
  // Include the small resting rotation in the 70% height budget.
  const angle=Math.max(0,...cards.map(card=>Math.abs(parseFloat(getComputedStyle(card).getPropertyValue('--turn'))||0)))*Math.PI/180;
  const envelope=560*Math.cos(angle)+360*Math.sin(angle);
  const scale=Math.max(.01,Math.min(1,available/360,viewportHeight*.7/envelope));
  stack.style.setProperty('--card-scale',scale);
 };
 const cardSize=new ResizeObserver(fitCards);cardSize.observe(stack);fitCards();
 window.addEventListener('resize',fitCards,{passive:true});
 window.visualViewport?.addEventListener('resize',fitCards,{passive:true});
 let frame=0,keyboardCard=null;
 function centreFocus(){
  frame=0;
  const viewport=window.visualViewport,top=viewport?.offsetTop||0,bottom=top+(viewport?.height||innerHeight);
  // A side rail consumes width, not the top of the card reading viewport.
  const readingTop=sideNavigation()?top:Math.min(bottom,Math.max(top,categories.getBoundingClientRect().bottom));
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
  // Tab may scroll a card into view. Keep that keyboard-selected card in
  // front until deliberate scrolling resumes, including the second column.
  if(keyboardCard?.contains(document.activeElement)&&document.activeElement.matches(':focus-visible')){
   const r=keyboardCard.getBoundingClientRect();
   if(r.bottom>readingTop&&r.top<bottom)nearest=keyboardCard;
  }
  select(nearest);
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(centreFocus);};
 window.addEventListener('scroll',schedule,{passive:true});
 const resumeScrollFocus=()=>{keyboardCard=null;schedule();};
 window.addEventListener('wheel',resumeScrollFocus,{passive:true});
 window.addEventListener('touchstart',resumeScrollFocus,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('pageshow',schedule);
 window.visualViewport?.addEventListener('resize',schedule,{passive:true});
 window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
 const layout=new ResizeObserver(schedule);[stack,header,categories,...cards].forEach(node=>layout.observe(node));
 document.fonts.ready.then(schedule);document.addEventListener('pendi:language',schedule);
 stack.addEventListener('focusin',event=>{if(event.target.matches(':focus-visible')){keyboardCard=event.target.closest('.specimen-card');select(keyboardCard);}});
 stack.addEventListener('pointerdown',event=>{keyboardCard=null;select(event.target.closest('.specimen-card'));});
 stack.addEventListener('focusout',()=>queueMicrotask(()=>{if(!stack.contains(document.activeElement))schedule();}));
 stack.addEventListener('keydown',event=>{
  if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(event.key))resumeScrollFocus();
  if(event.key==='Escape'){activeRow.forEach(card=>card.querySelector('details')?.removeAttribute('open'));schedule();}
  else if((event.key==='Enter'||event.key===' ')&&event.target.matches('.specimen-card')){event.preventDefault();select(event.target);}
 });
 schedule();
 // Reserve the full description before opening it, including translated and
 // enlarged text. Opening a clue never resizes the card or hides its icon.
 let storyFrame=0;
 const fitStories=()=>{storyFrame=0;for(const card of cards){
  const story=card.querySelector('.specimen-story');if(!story||card.querySelector('.specimen-design'))continue;
  const probe=document.createElement('div');probe.className='specimen-clues';
  probe.setAttribute('aria-hidden','true');probe.inert=true;
  Object.assign(probe.style,{position:'absolute',visibility:'hidden',pointerEvents:'none',width:(card.clientWidth-40)+'px',margin:'0',border:'0'});
  const copy=story.cloneNode(true);copy.removeAttribute('id');copy.removeAttribute('tabindex');
  Object.assign(copy.style,{position:'static',height:'auto',animation:'none'});probe.append(copy);card.append(probe);
  const height=Math.max(90,Math.ceil(copy.getBoundingClientRect().height)+8);probe.remove();
  if(card.style.getPropertyValue('--story-space')!==height+'px')card.style.setProperty('--story-space',height+'px');
 }};
 const queueStories=()=>{if(!storyFrame)storyFrame=requestAnimationFrame(fitStories);};
 const storySize=new ResizeObserver(queueStories);cards.forEach(card=>{storySize.observe(card);card.querySelectorAll('.specimen-story p').forEach(p=>storySize.observe(p));});
 document.fonts.ready.then(queueStories);document.addEventListener('pendi:language',queueStories);queueStories();
}
