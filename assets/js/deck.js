import {mountScrollVideo} from './scroll-video.js';
import {syncMenuTableMotion} from './menu-table-plane.js';
import {mountStripTransition} from './strip-transition.js';
// Native scrolling remains available for touch, keyboard and no-JS browsers.
export function mountDeck(deck, wave) {
  const scenes = [...deck.querySelectorAll('[data-scene]')];
  const links = [...document.querySelectorAll('.scene-pagination a')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const updateStrip=mountStripTransition(deck,scenes.length-1);
  const film=mountScrollVideo(document.querySelector('[data-scroll-video]'),{onFrame(position){const from=Math.min(scenes.length-1,Math.floor(position)),to=Math.min(scenes.length-1,from+1);wave?.setBlend(scenes[from].dataset.scene,scenes[to].dataset.scene,position-from);syncMenuTableMotion(scenes.find(scene=>scene.id==='drinks'),position,reduced.matches);}});
  let isReduced=reduced.matches;
  reduced.addEventListener('change',event=>{isReduced=event.matches;});
  let index = 0;
  let wheelTotal = 0;
  let wheelUntil = 0;
  let settleTimer;
  let updateFrame;
  let layoutHeight = deck.clientHeight;
  let transitionFrame=null;
  const stopTransition=()=>{if(transitionFrame!==null)cancelAnimationFrame(transitionFrame);transitionFrame=null;delete deck.dataset.transitioning;};
  const go = (next) => {
    stopTransition();
    index = Math.max(0, Math.min(scenes.length - 1, next));
    const start=deck.scrollTop,target=scenes[index].offsetTop;
    if(isReduced){deck.scrollTo({top:target,behavior:'instant'});return;}
    deck.dataset.transitioning='true';const began=performance.now(),duration=1200;
    const animate=now=>{const p=Math.min(1,(now-began)/duration),ease=p*p*(3-2*p);deck.scrollTo({top:start+(target-start)*ease,behavior:'instant'});if(p<1)transitionFrame=requestAnimationFrame(animate);else stopTransition();};
    transitionFrame=requestAnimationFrame(animate);
  };
  const update = () => {
    updateFrame = null;
    // Read the previous station before interpreting a scroll offset against a
    // new height. Safari's toolbar, rotation and a fold can resize mid-scroll.
    if (deck.clientHeight !== layoutHeight) {
      stopTransition();
      layoutHeight = deck.clientHeight;
      deck.scrollTo({top: scenes[index].offsetTop, behavior:'instant'});
    }
    let from = 0;
    while (from < scenes.length - 1 && deck.scrollTop >= scenes[from + 1].offsetTop) from += 1;
    const to = Math.min(from + 1, scenes.length - 1);
    const distance = scenes[to].offsetTop - scenes[from].offsetTop;
    const mix = distance > 0 ? Math.max(0, Math.min(1, (deck.scrollTop - scenes[from].offsetTop) / distance)) : 0;
    updateStrip(from+mix);
    if(!film||document.querySelector('[data-scroll-video]').dataset.displayMode==='error'){wave?.setBlend(scenes[from].dataset.scene, scenes[to].dataset.scene, mix);syncMenuTableMotion(scenes.find(scene=>scene.id==='drinks'),from+mix,isReduced);}
    index = mix > 0.5 ? to : from;
    document.body.dataset.sceneActive=scenes[index].id;
    scenes.forEach((scene, i) => {
      scene.inert = i !== index;
      const distance=(from+mix)-i;
      scene.style.setProperty('--scene-counter',`${deck.scrollTop-scene.offsetTop}px`);
      scene.style.setProperty('--scene-drift',`${isReduced?0:-distance*35}px`);
      scene.style.setProperty('--scene-opacity',String(Math.max(0,1-Math.abs(distance)*2.4)));
    });
    links.forEach((link, i) => i === index ? link.setAttribute('aria-current','step') : link.removeAttribute('aria-current'));
    film?.setProgress(from+mix);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const heading=scenes[index].querySelector('h1,h2');
      document.querySelector('[data-scene-status]').textContent = heading.getAttribute('aria-label')||heading.textContent;
      const focused = document.activeElement;
      if (focused?.closest('[data-scene]') && !scenes[index].contains(focused)) deck.focus({preventScroll:true});
    }, 160);
  };
  deck.addEventListener('scroll', () => {
    if (!updateFrame) updateFrame = requestAnimationFrame(update);
  }, {passive:true});
  const canScrollInside = (target, delta) => {
    const copy = target.closest('.scene-copy,.scene-note');
    const stack = target.closest('.scene-stack');
    return [copy, stack].some(el => el && getComputedStyle(el).overflowY === 'auto' && el.scrollHeight > el.clientHeight + 2 && ((delta > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 2) || (delta < 0 && el.scrollTop > 0)));
  };
  deck.addEventListener('wheel', (event) => {
    if(document.querySelector('dialog[open]')||event.target.closest('[data-inline-booking],[data-contact-info]'))return;
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || canScrollInside(event.target, event.deltaY)) return;
    event.preventDefault();
    const now = performance.now();
    if (now < wheelUntil) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? deck.clientHeight : 1);
    if (wheelTotal && Math.sign(delta) !== Math.sign(wheelTotal)) wheelTotal = 0;
    wheelTotal += delta;
    if (Math.abs(wheelTotal) >= 35) {
      go(index + Math.sign(wheelTotal));
      wheelTotal = 0;
      wheelUntil = now + 1300;
    }
  }, {passive:false});
  let swipe=null,suppressEntryClickUntil=0;
  deck.addEventListener('touchstart',event=>{if(event.touches.length!==1||event.target.closest('input,select,button,a:not([data-menu-entry]),details,[data-inline-booking],[data-contact-info]')){swipe=null;return;}swipe={x:event.touches[0].clientX,y:event.touches[0].clientY,delta:0,captured:false,target:event.target};},{passive:true});
  deck.addEventListener('touchmove',event=>{if(!swipe||event.touches.length!==1){swipe=null;return;}const dx=event.touches[0].clientX-swipe.x,dy=swipe.y-event.touches[0].clientY;if(Math.abs(dy)<12||Math.abs(dx)>Math.abs(dy)||canScrollInside(swipe.target,dy))return;event.preventDefault();swipe.captured=true;swipe.delta=dy;},{passive:false});
  deck.addEventListener('touchend',()=>{if(swipe?.captured){if(swipe.target.closest('[data-menu-entry]'))suppressEntryClickUntil=performance.now()+700;if(Math.abs(swipe.delta)>35)go(index+Math.sign(swipe.delta));}swipe=null;},{passive:true});
  deck.addEventListener('click',event=>{if(event.target.closest('[data-menu-entry]')&&performance.now()<suppressEntryClickUntil){event.preventDefault();event.stopPropagation();}},true);
  deck.addEventListener('touchcancel',()=>{swipe=null;},{passive:true});
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const next = scenes.findIndex(scene => '#' + scene.id === link.getAttribute('href'));
    if (next < 0) return;
    event.preventDefault();
    go(next);
    history.replaceState(null, '', '#' + scenes[next].id);
  });
  document.addEventListener('keydown', (event) => {
    if(document.querySelector('dialog[open]')||event.target.closest('[data-inline-booking],[data-contact-info]'))return;
    if (event.target.closest('input,textarea,select,[contenteditable="true"]') || document.querySelector('.mobile-menu[open]')) return;
    if (['ArrowDown','PageDown','ArrowUp','PageUp','Home','End'].includes(event.key)) {
      const delta = ['ArrowDown','PageDown','End'].includes(event.key) ? 1 : -1;
      if (canScrollInside(event.target, delta)) return;
      event.preventDefault();
      go(event.key === 'Home' ? 0 : event.key === 'End' ? scenes.length - 1 : index + delta);
    }
  });
  document.querySelectorAll('.site-header [data-scene-link]').forEach(link=>{
    link.href='#'+link.dataset.sceneLink;
  });
  const fragment = scenes.findIndex(scene => '#' + scene.id === location.hash);
  if (fragment >= 0) {
    // Set the initial station synchronously: a smooth scroll here races the
    // first update/ResizeObserver, which can otherwise reset the index to home.
    index = fragment;
    deck.scrollTo({top:scenes[index].offsetTop, behavior:'instant'});
  }
  new ResizeObserver(update).observe(deck);
  document.body.classList.add('experience-ready');
  update();
}
