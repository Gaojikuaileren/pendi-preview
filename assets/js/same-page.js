// UI only. No booking, contact values, persistence or service calls.
const sheet=document.querySelector('[data-policy-sheet]');
// Keep review controls out of the normal customer composition.
document.querySelectorAll('.appearance-preview').forEach(el=>{el.hidden=new URLSearchParams(location.search).get('design')!=='1';});
let opener=null,previousURL=null,ownsHistory=false,restoreFocus=null;
function closeSheet(fromHistory=false){
  if(!sheet?.open)return;
  sheet.close();opener?.focus({preventScroll:true});
  if(ownsHistory&&!fromHistory){ownsHistory=false;restoreFocus=opener;history.back();}else {ownsHistory=false;if(!fromHistory&&location.hash.startsWith('#legal-'))history.replaceState(null,'',location.pathname+location.search);}
}
function openSheet(chapter,source,push=true){
  if(!sheet?.showModal)return false;
  chapter=['impressum','privacy','reservation-rules'].includes(chapter)?chapter:'impressum';
  opener=source||document.activeElement;previousURL=location.href;
  sheet.showModal();
  sheet.querySelector('.sheet-body').scrollTop=0;
  if(chapter!=='impressum')sheet.querySelector('#sheet-'+chapter).scrollIntoView({block:'start',behavior:'instant'});
  sheet.querySelector('[data-sheet-close]').focus({preventScroll:true});
  if(push){history.pushState({pendiPolicy:true,returnTo:previousURL},'',`#legal-${chapter}`);ownsHistory=true;}
  else ownsHistory=history.state?.pendiPolicy===true;
  return true;
}
document.addEventListener('click',e=>{
  const link=e.target.closest('[data-policy]');
  if(link&&e.button===0&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&openSheet(link.dataset.policy,link))e.preventDefault();
});
sheet?.querySelector('[data-sheet-close]').addEventListener('click',()=>closeSheet());
sheet?.addEventListener('cancel',e=>{e.preventDefault();closeSheet();});
sheet?.querySelector('.policy-tabs').addEventListener('click',e=>{const link=e.target.closest('a');if(!link)return;e.preventDefault();sheet.querySelector(link.getAttribute('href')).scrollIntoView({block:'start',behavior:'instant'});});
window.addEventListener('popstate',()=>{if(sheet?.open){restoreFocus=opener;closeSheet(true);}else if(location.hash.startsWith('#legal-'))openSheet(location.hash.slice(7),null,false);if(restoreFocus){const target=restoreFocus;restoreFocus=null;requestAnimationFrame(()=>target.focus({preventScroll:true}));}});
const grip=sheet?.querySelector('[data-sheet-grip]');let drag=null;
grip?.addEventListener('click',()=>closeSheet());
grip?.addEventListener('pointerdown',e=>{if(!e.isPrimary)return;drag=e.clientY;grip.setPointerCapture(e.pointerId);});
grip?.addEventListener('pointerup',e=>{if(drag!==null&&e.clientY-drag>65)closeSheet();drag=null;});
grip?.addEventListener('pointercancel',()=>{drag=null;});
if(location.hash.startsWith('#legal-'))openSheet(location.hash.slice(7),null,false);
document.querySelector('[data-pride-preview]')?.addEventListener('change',e=>document.dispatchEvent(new CustomEvent('pendi:pride-preview',{detail:e.target.checked})));
document.querySelector('[data-contact-info]')?.addEventListener('click',async e=>{
  const button=e.target.closest('[data-copy-value]');
  if(!button||button.disabled||button.dataset.approved!=='true'||!button.dataset.copyValue.trim())return;
  const status=document.querySelector('[data-copy-status]');
  try{await navigator.clipboard.writeText(button.dataset.copyValue);status.textContent=status.dataset.copied;}
  catch{status.textContent=status.dataset.error;}
});
