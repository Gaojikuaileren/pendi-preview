// Tie the strip to deck progress so interrupted/reversed paging stays continuous.
import {reducedMotion} from './motion-policy.js?v=e36b16075409';
export function mountStripTransition(deck,lastScene){
 const strip=document.querySelector('.experience-strip');
 if(!strip)return ()=>{};
 const reduced=reducedMotion;
 const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
 document.body.classList.add('strip-transition-ready');
 return (position,blend=null)=>{
  const distance=Math.min(position,lastScene-position);
  const envelope=(p,range)=>{const d=Math.min(p,lastScene-p);return reduced.matches?(d<.5?1:0):1-smooth(d/range);};
  const interpolate=range=>blend?envelope(blend.from,range)*(1-blend.mix)+envelope(blend.to,range)*blend.mix:envelope(position,range);
  const amount=interpolate(.48),space=interpolate(.72);
  document.body.style.setProperty('--strip-height',`calc((var(--strip-rest-height,80px) + var(--safe-bottom)) * ${space})`);
  strip.style.opacity=String(amount);
  strip.style.transform=`translateY(${reduced.matches?0:(1-amount)*18}px)`;
  strip.style.visibility=amount<=.0001?'hidden':'visible';
  strip.inert=!!blend||distance>.02;
  if(strip.inert&&strip.contains(document.activeElement))deck.focus({preventScroll:true});
 };
}
