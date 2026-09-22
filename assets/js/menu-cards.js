import {mountFlavourMotion} from './flavour-motion.js?v=52358739f485';
export function mountMenuCards(){
 if(!document.body.classList.contains('page-drinks'))return;
 const stack=document.querySelector('.specimen-slots');if(!stack)return;
 const header=document.querySelector('.site-header'),categories=document.querySelector('.menu-category-bar');
 const measure=()=>{document.body.style.setProperty('--menu-header-height',header.getBoundingClientRect().height+'px');document.body.style.setProperty('--menu-category-height',categories.getBoundingClientRect().height+'px');};
 const navigationSize=new ResizeObserver(measure);navigationSize.observe(header);navigationSize.observe(categories);measure();
 const focusTerrain=mountFlavourMotion();
 let active=null;
 function select(card){
  if(card===active)return;
  if(active){const old=active;old.classList.remove('is-active');old.classList.add('is-settling');setTimeout(()=>old.classList.remove('is-settling'),380);}
  active=card;active?.classList.remove('is-settling');active?.classList.add('is-active');
  focusTerrain(active);
 }
 stack.classList.add('cards-interactive');
 stack.addEventListener('click',event=>select(event.target.closest('.specimen-card')));
 stack.addEventListener('focusin',event=>select(event.target.closest('.specimen-card')));
 stack.addEventListener('focusout',()=>queueMicrotask(()=>{if(active&&!active.contains(document.activeElement))select(null);}));
 stack.addEventListener('keydown',event=>{
  if(event.key==='Escape'){active?.querySelector('details')?.removeAttribute('open');select(null);}
  else if((event.key==='Enter'||event.key===' ')&&event.target.matches('.specimen-card')){event.preventDefault();select(event.target);}
 });
 document.addEventListener('click',event=>{if(!event.target.closest('.specimen-card'))select(null);});
 // Details occupy reserved trailing paper, never the icon or document flow.
}
