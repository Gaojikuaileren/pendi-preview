// Manual navigation and passive swipe hints have independent state.
export function mountMenuMotion(menu) {
 const summary=menu.querySelector('summary'),panel=menu.querySelector('.menu-panel');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let manualOpen=menu.open,hintVisible=false,visible=menu.open,animation=null,timer=null;
 function finish(){menu.dataset.menuState=visible?'open':'closed';menu.open=visible;if(!visible){animation?.cancel();animation=null;}}
 function render(){
  const next=manualOpen||hintVisible;
  menu.dataset.menuManual=String(manualOpen);
  if(hintVisible&&!manualOpen)menu.dataset.menuAuto='true';else delete menu.dataset.menuAuto;
  summary.setAttribute('aria-expanded',String(manualOpen));panel.inert=!next;
  if(!menu.dataset.menuState){visible=next;finish();return;}
  if(next===visible&&menu.dataset.menuState)return;
  visible=next;
  if(reduced.matches||!panel.animate){animation?.cancel();animation=null;finish();return;}
  if(!animation){menu.open=true;const horizontal=getComputedStyle(panel).getPropertyValue('--nav-layout').trim()==='horizontal';animation=panel.animate([{opacity:0,transform:horizontal?'translateX(18px)':'translateY(-18px)',clipPath:horizontal?'inset(0 0 0 100%)':'inset(0 0 100% 0)'},{opacity:1,transform:'translate(0,0)',clipPath:'inset(0 0 0 0)'}],{duration:460,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'});animation.pause();animation.currentTime=next?0:460;animation.onfinish=finish;}
  menu.dataset.menuState=next?'opening':'closing';animation.updatePlaybackRate(next?1:-460/300);animation.play();
 }
 function close(){clearTimeout(timer);manualOpen=false;hintVisible=false;render();}
 function openManual(){clearTimeout(timer);hintVisible=false;manualOpen=true;render();}
 summary.addEventListener('click',e=>{e.preventDefault();if(manualOpen)close();else openManual();});
 document.addEventListener('pendi:page-gesture',()=>{
  if(manualOpen||!document.body.classList.contains('page-home')||document.querySelector('dialog[open]'))return;
  clearTimeout(timer);hintVisible=true;render();timer=setTimeout(()=>{hintVisible=false;render();},1800);
 });
 panel.addEventListener('focusin',openManual);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&visible){const returnFocus=manualOpen;close();if(returnFocus)summary.focus({preventScroll:true});}});
 document.addEventListener('click',e=>{if(visible&&!menu.contains(e.target))close();});
 panel.querySelectorAll('a').forEach(link=>link.addEventListener('click',e=>{close();if(e.detail===0)summary.focus({preventScroll:true});else if(menu.contains(document.activeElement))document.activeElement.blur();}));
 reduced.addEventListener('change',()=>{if(reduced.matches){animation?.cancel();animation=null;finish();}});
 render();
}
