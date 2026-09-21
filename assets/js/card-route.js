const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const ease='cubic-bezier(.22,1,.36,1)';
let busy=false,veil=null,running=[],recoveryTimer=null;
const trackers=new Set();
function clear(){clearTimeout(recoveryTimer);trackers.forEach(stop=>stop());running.forEach(a=>a.cancel());running=[];veil?.remove();veil=null;document.querySelector('.menu-card-pile')?.classList.remove('is-opening');document.querySelectorAll('[data-pile-lifted],[data-card-reveal]').forEach(n=>{n.style.removeProperty('visibility');delete n.dataset.pileLifted;delete n.dataset.cardReveal;});busy=false;delete document.documentElement.dataset.cardArrival;clearTimeout(window.pendiCardDeadline);}
function makeFlight(){
 veil=document.createElement('div');veil.className='card-route-veil';veil.setAttribute('aria-hidden','true');
 const card=document.createElement('div');card.className='card-route-flight';
 card.innerHTML='<div class="route-ink"><svg class="pile-back-pattern" viewBox="0 0 152 174" aria-hidden="true"><path d="M-18 148C8 93 30 150 62 95S105 23 170 48M-18 139C8 84 30 141 62 86S105 14 170 39M-18 130C8 75 30 132 62 77S105 5 170 30M-18 121C8 66 30 123 62 68S105-4 170 21M-18 112C8 57 30 114 62 59S105-13 170 12"/></svg></div>';
 veil.append(card);document.body.append(veil);return card;
}
const rectStyle=r=>({left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
const full=()=>({left:'-2px',top:'-2px',width:(innerWidth+4)+'px',height:(innerHeight+4)+'px',borderRadius:'0px',transform:'rotate(0deg)'});
function animate(node,frames,options){const a=node.animate(frames,{easing:ease,fill:'both',...options});a.id='card-route';running.push(a);return a.finished.catch(()=>{});}
// Measure every frame: scrolling, font reflow and picked-up card transforms
// can all move the destination while its front is still in flight.
function dock(card,target,duration,followOnly=false){
 const start=card.getBoundingClientRect(),began=performance.now();
 card.dataset.docking='';
 return new Promise(resolve=>{
  let frame;
  const stop=()=>{cancelAnimationFrame(frame);trackers.delete(stop);delete card.dataset.docking;resolve();};trackers.add(stop);
  const tick=now=>{
   if(!card.isConnected||!target.isConnected){stop();return;}
   const r=target.getBoundingClientRect(),style=getComputedStyle(target),m=new DOMMatrixReadOnly(style.transform==='none'?undefined:style.transform);
   const width=parseFloat(style.width),height=parseFloat(style.height);
   const end={left:r.left+r.width/2-width/2,top:r.top+r.height/2-height/2,width,height};
   const t=Math.min(1,(now-began)/duration),k=followOnly?1:1-Math.pow(1-t,3),mix=(a,b)=>a+(b-a)*k;
   const current=Object.fromEntries(['left','top','width','height'].map(key=>[key,mix(start[key],end[key])]));
   Object.assign(card.style,rectStyle(current),{transform:`matrix(${mix(1,m.a)},${m.b*k},${m.c*k},${mix(1,m.d)},0,0)`,borderRadius:style.borderRadius});
   if(t===1){stop();return;}frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);
 });
}
async function arrive(){
 const handoff=window.pendiCardArrival;if(!handoff||!document.documentElement.dataset.cardArrival)return;
 if(reduced.matches){clear();return;}
 busy=true;
 await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1800))]);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 if(!document.documentElement.dataset.cardArrival){clear();return;}
 const pileTarget=document.querySelector('#drinks [data-pile-front]');
 const target=handoff.kind==='open'?document.querySelector('.specimen-card'):(pileTarget?.getClientRects().length?pileTarget:document.querySelector('#drinks .menu-cover'));
 if(!target){clear();return;}
 if(handoff.kind==='open')history.replaceState({...history.state,pendiMenuFrom:handoff.from},'');
 const card=makeFlight(),r=target.getBoundingClientRect();Object.assign(card.style,full());
 delete document.documentElement.dataset.cardArrival;clearTimeout(window.pendiCardDeadline);
 const ink=card.querySelector('.route-ink');
 let flip=null;
 if(handoff.kind==='open'){
  flip=document.createElement('div');flip.className='card-route-flipper';
  const back=document.createElement('div');back.className='card-route-back';back.append(ink);
  const front=document.createElement('div');front.className='card-route-front';
  const preview=target.cloneNode(true);preview.inert=true;preview.removeAttribute('id');preview.removeAttribute('tabindex');preview.style.visibility='visible';preview.classList.remove('is-active','is-settling');
  preview.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
  preview.querySelectorAll('[data-l10n]').forEach(n=>n.removeAttribute('data-l10n'));
  front.append(preview);flip.append(back,front);card.append(flip);card.classList.add('has-flip');
  target.dataset.cardReveal='';target.style.visibility='hidden';
 }else ink.style.opacity='0';
 // The first drawn card becomes its real slot. Other cards settle behind it.
 const rest=[...document.querySelectorAll('.specimen-intro,.specimen-card')].filter(n=>n!==target&&!n.closest('.card-route-veil'));
 rest.forEach((n,i)=>animate(n,[{opacity:0,translate:'0 22px'},{opacity:1,translate:'0 0'}],{duration:650,delay:120+Math.min(i,3)*65}));
 const stage=flip?{left:Math.max(18,(innerWidth-target.offsetWidth)/2)+'px',top:Math.max(100,(innerHeight-Math.min(target.offsetHeight,innerHeight*.62))/2)+'px',width:Math.min(target.offsetWidth,innerWidth-36)+'px',height:target.offsetHeight+'px',borderRadius:'1px',transform:'rotate(0deg)'}:{...rectStyle(r),borderRadius:'1px',transform:'rotate(0deg)'};
 await animate(card,[full(),stage],{duration:570});
 if(!card.isConnected)return;
 Object.assign(card.style,stage);running.pop().cancel();
 if(flip){
  await animate(flip,[{transform:'rotateY(0deg)'},{transform:'rotateY(-180deg)'}],{duration:560});
  if(!card.isConnected)return;
  await dock(card,target,620);
  if(!card.isConnected)return;
  target.style.removeProperty('visibility');delete target.dataset.cardReveal;
 }
 await Promise.all([animate(card,[{opacity:1},{opacity:0}],{duration:170}),...(flip?[dock(card,target,170,true)]:[])]);
 await Promise.all(running.map(a=>a.finished.catch(()=>{})));veil?.remove();veil=null;
 clear();document.querySelector(handoff.kind==='open'?'#specimen-title':'#drinks-heading')?.focus({preventScroll:true});
}
export function mountCardRoute(){
 arrive();
 document.addEventListener('click',async event=>{
  const link=event.target.closest('.menu-cover,[data-menu-entry],[data-card-return]');
  if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||link.target==='_blank')return;
  if(reduced.matches||document.querySelector('[data-motion-toggle]')?.classList.contains('is-paused'))return;
  const url=new URL(link.href);if(url.origin!==location.origin)return;
  event.preventDefault();if(busy)return;busy=true;link.setAttribute('aria-busy','true');
  const kind=link.matches('.menu-cover,[data-menu-entry]')?'open':'return';
  const pileFront=document.querySelector('#drinks [data-pile-front]');
  const source=kind==='open'?(pileFront?.getClientRects().length?pileFront:link):([...document.querySelectorAll('.specimen-card')].find(n=>{const r=n.getBoundingClientRect();return r.top<innerHeight&&r.bottom>78;})||link);
  // Let the real pile regain its ink before replacing any card with a flight.
  // Previously the replacement immediately exposed a dark border and shadow.
  if(source.hasAttribute('data-pile-front')){
   source.closest('.menu-card-pile').classList.add('is-opening');
   await new Promise(resolve=>setTimeout(resolve,360));
   if(!busy||reduced.matches){link.removeAttribute('aria-busy');if(reduced.matches)location.assign(url.href);return;}
  }
  const r=source.getBoundingClientRect(),card=makeFlight(),ink=card.querySelector('.route-ink');
  const fromPile=source.hasAttribute('data-pile-front');
  const start={...rectStyle(r),transform:fromPile?'rotate(-5deg)':'translateY(28px) rotate(-3deg)',opacity:fromPile?1:0,...(fromPile?{backgroundColor:getComputedStyle(source).backgroundColor,color:getComputedStyle(source).color}:{})};
  Object.assign(card.style,start);
  if(fromPile){
   source.closest('.menu-card-pile').classList.add('is-opening');
   ink.innerHTML=source.innerHTML;
   source.dataset.pileLifted='';source.style.visibility='hidden';
   [...source.parentElement.children].filter(n=>n!==source).forEach((n,i)=>animate(n,[{translate:'0 0',opacity:1},{translate:`${i%2?100:-100}px -90px`,opacity:0}],{duration:550,delay:60+i*60}));
  }
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),4500);
  try{
   const ready=fetch(url,{signal:controller.signal,credentials:'same-origin'}).then(async response=>{
    if(!response.ok)throw new Error('Unavailable');const doc=new DOMParser().parseFromString(await response.text(),'text/html');
    if(!doc.body.classList.contains(kind==='open'?'page-drinks':'page-home'))throw new Error('Unexpected page');
   }).catch(error=>({error}));
   await animate(card,[start,{...rectStyle({left:24,top:Math.max(110,innerHeight*.18),width:innerWidth-48,height:Math.min(470,innerHeight*.64)}),opacity:1,backgroundColor:'#34312b',color:'#b5a17e',transform:'translateY(0) rotate(-1deg)'}],{duration:340});
   animate(ink,[{opacity:1},{opacity:0}],{duration:240});
   const [response]=await Promise.all([ready,animate(card,[{offset:0},{...full(),opacity:1}],{duration:420})]);
   if(response?.error)throw response.error;
   const handoff={kind,path:url.pathname,time:Date.now(),from:location.pathname+location.search+'#drinks'};
   try{sessionStorage.setItem('pendi-card-arrival',JSON.stringify(handoff));}catch{}
   location.assign(url.href);
   // Restore the source if navigation is cancelled or blocked by the browser.
   recoveryTimer=setTimeout(()=>{link.removeAttribute('aria-busy');clear();},2500);
  }catch{
   clear();link.removeAttribute('aria-busy');
   let status=document.querySelector('[data-card-status]');if(!status){status=document.createElement('p');status.dataset.cardStatus='';status.setAttribute('role','status');status.style.fontSize='12px';link.after(status);}
   status.textContent=document.documentElement.lang==='en'?'The menu could not be loaded. Please try again.':'Die Karte konnte nicht geladen werden. Bitte erneut versuchen.';
  }finally{clearTimeout(timeout);}
 });
 window.addEventListener('pageshow',event=>{if(event.persisted){clear();document.querySelectorAll('[aria-busy]').forEach(n=>n.removeAttribute('aria-busy'));}});
 reduced.addEventListener('change',()=>{if(reduced.matches)clear();});
}

