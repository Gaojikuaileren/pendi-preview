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
const copyTimers=new WeakMap();
const copyAnnouncement=document.createElement('p');
copyAnnouncement.className='visually-hidden';
copyAnnouncement.setAttribute('role','status');
document.querySelector('[data-contact-info]')?.append(copyAnnouncement);
document.querySelectorAll('[data-contact-info] [data-copy-value]').forEach(button=>{
  button.querySelector('svg')?.classList.add('copy-original');
  const check=document.createElementNS('http://www.w3.org/2000/svg','svg');
  check.setAttribute('viewBox','0 0 24 24');check.setAttribute('aria-hidden','true');
  check.setAttribute('focusable','false');check.classList.add('copy-check');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d','M5 12.5 9.5 17 19 7');check.append(path);button.append(check);
});
document.querySelector('[data-contact-info]')?.addEventListener('click',async e=>{
  const button=e.target.closest('[data-copy-value]');
  if(!button||button.disabled||button.hasAttribute('aria-busy')||button.dataset.approved!=='true'||!button.dataset.copyValue.trim())return;
  const status=document.querySelector('[data-copy-status]');
  button.setAttribute('aria-busy','true');
  try{
    await navigator.clipboard.writeText(button.dataset.copyValue);
    status.textContent='';
    clearTimeout(copyTimers.get(button));
    button.classList.add('is-copied');
    copyAnnouncement.textContent='';
    requestAnimationFrame(()=>{copyAnnouncement.textContent=status.dataset.copied;});
    copyTimers.set(button,setTimeout(()=>{button.classList.remove('is-copied');copyTimers.delete(button);},2000));
  }catch{
    clearTimeout(copyTimers.get(button));copyTimers.delete(button);
    button.classList.remove('is-copied');copyAnnouncement.textContent='';
    status.textContent=status.dataset.error;
  }finally{button.removeAttribute('aria-busy');}
});
