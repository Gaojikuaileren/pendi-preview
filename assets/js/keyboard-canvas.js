// Browser toolbars are handled by dvh. A keyboard may resize only the visual
// viewport: use that height while editing, but never counteract pinch zoom.
export function mountKeyboardCanvas(){
 const viewport=window.visualViewport;if(!viewport)return;
 const root=document.documentElement;
 const update=()=>{
  const editing=document.activeElement?.matches('input:not([type=hidden]),textarea');
  const keyboard=editing&&viewport.scale<=1.01&&viewport.height<innerHeight-100;
  if(keyboard){root.style.setProperty('--view-height',Math.round(viewport.height)+'px');root.dataset.keyboardCanvas='true';}
  else if(root.dataset.keyboardCanvas){root.style.removeProperty('--view-height');delete root.dataset.keyboardCanvas;}
 };
 viewport.addEventListener('resize',update,{passive:true});document.addEventListener('focusin',update);document.addEventListener('focusout',()=>requestAnimationFrame(update));
}
