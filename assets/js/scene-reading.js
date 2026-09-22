import {t} from './language.js?v=22b6a14700d9';
// Overflow is read with explicit buttons; a vertical gesture always belongs to the deck.
export function mountSceneReading(deck){
 const regions=[...deck.querySelectorAll('.scene-copy,.scene-note,.scene-stack')].filter(n=>!n.matches('#drinks .scene-copy,#drinks .scene-note'));
 const entries=regions.map(region=>{
  const controls=document.createElement('nav');controls.className='scene-reading-controls';controls.hidden=true;
  const before=document.createElement('button'),status=document.createElement('span'),after=document.createElement('button');
  before.type=after.type='button';controls.append(before,status,after);region.closest('[data-scene]').append(controls);
  const entry={region,controls,before,status,after,page:0,pages:1,step:0,maxHeight:region.style.maxHeight};
  function show(page){entry.page=Math.max(0,Math.min(entry.pages-1,page));region.scrollTop=entry.page*entry.step;before.disabled=entry.page===0;after.disabled=entry.page===entry.pages-1;status.textContent=`${entry.page+1} / ${entry.pages}`;}
  before.addEventListener('click',()=>show(entry.page-1));after.addEventListener('click',()=>show(entry.page+1));entry.show=show;
  region.addEventListener('focusin',e=>{if(entry.pages<2)return;const r=region.getBoundingClientRect(),a=e.target.getBoundingClientRect();if(a.top<r.top||a.bottom>r.bottom)show(Math.floor((a.top-r.top+region.scrollTop)/entry.step));});
  return entry;
 });
 let frame;
 function update(){frame=null;for(const e of entries){const {region:r,controls:c}=e;r.style.maxHeight=e.maxHeight;delete r.dataset.readingPages;c.hidden=true;
   const stack=r.closest('.scene-stack');if(getComputedStyle(r).display==='contents'||r.clientHeight<1||(stack&&stack!==r&&getComputedStyle(stack).display!=='contents'))continue;
   const height=r.clientHeight;if(r.scrollHeight<=height+8){e.pages=1;e.show(0);continue;}
   r.style.maxHeight=Math.max(80,height-50)+'px';r.dataset.readingPages='true';
   e.step=Math.max(40,r.clientHeight-24);e.pages=1+Math.ceil(Math.max(0,r.scrollHeight-r.clientHeight)/e.step);
   c.hidden=false;Object.assign(c.style,{left:r.offsetLeft+'px',top:(r.offsetTop+r.offsetHeight+4)+'px',width:r.offsetWidth+'px'});
   c.setAttribute('aria-label',t('Textabschnitte','Reading sections'));e.before.textContent=t('Zurück','Previous');e.after.textContent=t('Weiter','Next');e.show(e.page);
  }}
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 const observer=new ResizeObserver(schedule);observer.observe(deck);for(const {region}of entries)for(const child of region.children)observer.observe(child);
 const changes=new MutationObserver(records=>{if(records.some(r=>!r.target.parentElement?.closest('[data-menu-typewriter],.menu-typewriter,.scene-reading-controls')))schedule();});
 for(const {region}of entries)changes.observe(region,{childList:true,subtree:true,characterData:true});
 document.addEventListener('pendi:language',schedule);document.fonts.ready.then(schedule);schedule();
}
