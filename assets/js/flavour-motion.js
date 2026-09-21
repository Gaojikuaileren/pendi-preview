// Only the active, visible card breathes. Sampled flavour anchors never move.
export function mountFlavourMotion(){
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let active=null,visible=false,frame=0,began=0,paths=[],points=[];
 const restore=()=>paths.forEach(({node,d})=>node.setAttribute('d',d));
 const stop=()=>{cancelAnimationFrame(frame);frame=0;restore();};
 function tick(now){
  if(!active||!visible||document.hidden||reduced.matches){stop();return;}
  const elapsed=(now-began)/1000,entry=Math.min(1,elapsed/.8);
  const envelope=entry*entry*(3-2*entry);
  paths.forEach(({node,scale,fill})=>{
   const anchors=points.map(([x,y])=>[x,88-(88-y)*scale]);
   const d=anchors.reduce((result,[x,y],i)=>{
    if(!i)return `M${x} ${y}`;
    const [px,py]=anchors[i-1],span=x-px;
    // Constant-phase crests advance left to right. Horizontal handles stay
    // fixed: no backtracking of the curve on its x axis or sideways pulling.
    const phase=i*.85-elapsed*1.3;
    const mid=px+span*.5;
    // A nonzero bowed midpoint prevents a taut straight span, even for equal
    // adjacent values. Both anchors and the joined midpoint stay C1 smooth.
    const bow=(2.2+Math.sin(phase)*.45)*scale*envelope;
    const my=(py+y)/2-bow,slope=(y-py)/span*(2-.5*envelope);
    const left=(mid-px)/3,right=(x-mid)/3;
    // At zero envelope this is the exact de Casteljau split of the static
    // path, so activating a card does not pop to a different initial shape.
    const innerLeft=span/8+(left-span/8)*envelope,innerRight=span/8+(right-span/8)*envelope;
    const outerLeft=span/4+(left-span/4)*envelope,outerRight=span/4+(right-span/4)*envelope;
    return result+`C${px+outerLeft} ${py} ${mid-innerLeft} ${my-slope*innerLeft} ${mid} ${my}`+
     `C${mid+innerRight} ${my+slope*innerRight} ${x-outerRight} ${y} ${x} ${y}`;
   },'');
   node.setAttribute('d',d+(fill?'L320 96H0Z':''));
  });
  frame=requestAnimationFrame(tick);
 }
 function resume(){stop();if(active&&visible&&!document.hidden&&!reduced.matches){began=performance.now();frame=requestAnimationFrame(tick);}}
 const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.target===active){visible=e.isIntersecting;resume();}});
 document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
 return card=>{
  stop();if(active)observer.unobserve(active);active=card;paths=[];points=[];visible=false;
  if(!card)return;
  const svg=card.querySelector('.specimen-terrain'),dots=[...svg.querySelectorAll('circle')];
  if(dots.length!==5)return;
  points=[[0,88],...dots.map(n=>[+n.getAttribute('cx'),+n.getAttribute('cy')]),[320,88]];
  paths=[...svg.querySelectorAll('path')].map((node,i)=>({node,d:node.getAttribute('d'),fill:node.classList.contains('terrain-fill'),scale:i===0?1:i/4}));
  observer.observe(card);
 };
}
