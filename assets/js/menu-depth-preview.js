import {mountHomeCupPreview} from './home-cup-rings.js?v=ca1c440043db';
import {t} from './language.js?v=ca1c440043db';
import {projectMenuType} from './menu-table-plane.js?v=ca1c440043db';
import {mountMenuTypewriter} from './menu-typewriter.js?v=ca1c440043db';
// Mainline visual treatment; optional local comparison, no service integration.
export function mountMenuDepthPreview(){
 const scene=document.getElementById('drinks'),copy=scene?.querySelector('.scene-copy'),cover=scene?.querySelector('.menu-cover');
 if(!copy||!cover)return;
 const comparison=new URLSearchParams(location.search).has('menu-depth');
 {
  const ink=document.createElement('div');ink.className='menu-ink-plane';while(copy.firstChild)ink.append(copy.firstChild);copy.append(ink);
  const controls=document.createElement('div');controls.className='menu-depth-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label',t('Gestaltung vergleichen','Compare designs'));
  controls.innerHTML=`<span>${t('DESIGNVERGLEICH','DESIGN COMPARISON')}</span><button type="button" data-depth="flat">A · ${t('Flach','Flat')}</button><button type="button" data-depth="space">B · ${t('Raum & Licht','Space & light')}</button>`;if(comparison)scene.append(controls);
  scene.classList.add('menu-depth-preview');
  mountMenuTypewriter(scene);
  let homePreview;
  const set=mode=>{scene.dataset.menuDepth=mode;controls.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.depth===mode)));homePreview?.setMode(mode);requestAnimationFrame(()=>reflow());};
  controls.addEventListener('click',e=>{const b=e.target.closest('[data-depth]');if(b)set(b.dataset.depth);});
  homePreview=mountHomeCupPreview({onMode:set,t,comparison});
  set(new URLSearchParams(location.search).get('menu-depth')==='flat'?'flat':'space');
  // Explicit large-font fallback, supplementing the existing stacked layout.
  const reflow=()=>{const title=cover.querySelector('.menu-cover-title');scene.classList.toggle('depth-large-type',parseFloat(getComputedStyle(title).fontSize)>102||parseFloat(getComputedStyle(copy.querySelector('.menu-descriptor')).fontSize)>51);const top=parseFloat(getComputedStyle(copy).top);if(Number.isFinite(top))scene.style.setProperty('--depth-note-top',`${top+copy.clientHeight+16}px`);projectMenuType(scene);};
  const observer=new ResizeObserver(reflow);observer.observe(cover.querySelector('.menu-cover-title'));observer.observe(copy.querySelector('.menu-descriptor'));window.addEventListener('resize',reflow);document.addEventListener('pendi:language',reflow);reflow();document.fonts.ready.then(reflow);
 }
}
