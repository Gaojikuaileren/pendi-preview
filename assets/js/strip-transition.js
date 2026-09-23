// Tie the strip to deck progress so interrupted/reversed paging stays continuous.
export function mountStripTransition(deck,lastScene){
 const strip=document.querySelector('.experience-strip');
 if(!strip)return ()=>{};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
 document.body.classList.add('strip-transition-ready');
 return position=>{
  const distance=Math.min(position,lastScene-position);
  const amount=reduced.matches?(distance<.5?1:0):1-smooth(distance/.48);
  const space=reduced.matches?amount:1-smooth(distance/.72);
  document.body.style.setProperty('--strip-height',`calc((var(--strip-rest-height,80px) + var(--safe-bottom)) * ${space})`);
  strip.style.opacity=String(amount);
  strip.style.transform=`translateY(${reduced.matches?0:(1-amount)*18}px)`;
  strip.style.visibility=amount<=.0001?'hidden':'visible';
  strip.inert=distance>.02;
  if(strip.inert&&strip.contains(document.activeElement))deck.focus({preventScroll:true});
 };
}
