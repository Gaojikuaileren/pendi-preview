// Sensory copy samples, not claims about the actual menu or ingredients.
const thoughts={
 de:['samtig','frisch','herb','würzig','rauchig','weich'],
 en:['velvety','fresh','bitter','spiced','smoky','soft']
};
const endings=['...','?','...?'];
export function mountMenuTypewriter(scene){
 const heading=scene.querySelector('.menu-descriptor'),pause=document.querySelector('[data-motion-toggle]'),film=document.querySelector('[data-scroll-video]'),flip=document.querySelector('.language-flip');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 heading.dataset.menuTypewriter='';heading.classList.add('menu-typewriter');
 const ink=document.createElement('span');ink.className='menu-type-ink';ink.setAttribute('aria-hidden','true');heading.replaceChildren(ink);
 let index=-1,ending='',bag=[],count=0,phase='typing',elapsed=0,last=null,frame=null,clock=0;
 const letters=[];
 const phrases=()=>document.querySelector('[data-menu-words]')?.dataset.words?.split('\n').filter(Boolean)||thoughts[document.documentElement.lang==='en'?'en':'de'];
 const phrase=()=>phrases()[index]+ending;
 function nextThought(){
  // A fresh shuffled bag gives every adjective a turn, without a fixed cycle.
  if(!bag.length){
   bag=phrases().map((_,i)=>i);
   for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
   if(bag.length>1&&bag.at(-1)===index)[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];
  }
  index=bag.pop();ending=endings[Math.floor(Math.random()*endings.length)];
 }
 nextThought();
 function show(text){
  // Each new glyph fades on the same paused clock as the typewriter. Inline
  // spans preserve the baseline; no translation, scale or blinking cursor.
  const glyphs=[...text];
  const existing=letters.map(x=>x.node.textContent).join('');
  if(!text.startsWith(existing)){ink.replaceChildren();letters.length=0;}
  for(let i=letters.length;i<glyphs.length;i++){
   const node=document.createElement('span');node.textContent=glyphs[i];
   node.style.opacity=phase==='typing'?'0':'1';ink.append(node);letters.push({node,born:clock});
  }
  if(phase!=='typing')letters.forEach(x=>{x.node.style.opacity='1';x.born=clock-480;});
  heading.dataset.typePhase=phase;heading.dataset.thoughtIndex=String(index);
 }
 function labels(){
  heading.setAttribute('aria-label',document.documentElement.lang==='en'?'Explore aromas and flavours':'Aromen und Geschmack entdecken');
  // A constant ink-height sample prevents the shadow jumping with each glyph.
  heading.dataset.projectionSample=phrases().join(' ')+' ...?';
 }
 const staticMode=()=>reduced.matches||pause?.classList.contains('is-paused')||scene.classList.contains('depth-large-type');
 const active=()=>!document.hidden&&film?.dataset.station==='1'&&!staticMode()&&!flip?.hasAttribute('aria-busy');
 function tick(now){
  frame=null;if(!active()){last=null;return;}
  const delta=last===null?0:Math.min(64,now-last);elapsed+=delta;clock+=delta;last=now;
  for(const glyph of letters){const progress=Math.min(1,(clock-glyph.born)/480);glyph.node.style.opacity=String(1-Math.pow(1-progress,3));}
  if(phase==='typing'){
   const characters=[...phrase()];
   const delay=count===0?550:/[.?]/.test(characters[count])?420:170;
   if(elapsed>=delay){elapsed=0;count++;show(characters.slice(0,count).join(''));if(count===characters.length){phase='hold';heading.dataset.typePhase=phase;}}
  }else if(phase==='hold'&&elapsed>=3800){phase='fade';elapsed=0;heading.dataset.typePhase=phase;}
  else if(phase==='fade'){
   ink.style.opacity=String(Math.max(0,1-elapsed/600));
   if(elapsed>=600){nextThought();count=0;phase='typing';elapsed=0;show('');ink.style.opacity='1';}
  }
  frame=requestAnimationFrame(tick);
 }
 function sync(){
  if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;
  if(staticMode()){count=[...phrase()].length;phase='hold';elapsed=0;ink.style.opacity='1';show(phrase());}
  if(active())frame=requestAnimationFrame(tick);
 }
 labels();show('');
 new MutationObserver(sync).observe(film,{attributes:true,attributeFilter:['data-station']});
 if(pause)new MutationObserver(sync).observe(pause,{attributes:true,attributeFilter:['class']});
 if(flip)new MutationObserver(sync).observe(flip,{attributes:true,attributeFilter:['aria-busy']});
 new MutationObserver(sync).observe(scene,{attributes:true,attributeFilter:['class']});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 document.addEventListener('pendi:language',()=>{bag=[];index=-1;nextThought();labels();count=[...phrase()].length;phase='hold';elapsed=0;ink.style.opacity='1';show(phrase());sync();});
 sync();
}
