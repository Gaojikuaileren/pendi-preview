import {mountScrollVideo} from './scroll-video.js?v=e36b16075409';
import {syncMenuTableMotion} from './menu-table-plane.js?v=e36b16075409';
import {mountStripTransition} from './strip-transition.js?v=e36b16075409';
import {reducedMotion} from './motion-policy.js?v=e36b16075409';
// One paging owner: scripted transitions. No-JS keeps native scrolling; enhanced scenes use explicit reading controls.
export function mountDeck(deck, wave) {
  const scenes = [...deck.querySelectorAll('[data-scene]')];
  if(!scenes.length)return;
  const links = [...document.querySelectorAll('.scene-pagination a')];
  const reduced = reducedMotion;
  const curtain=document.querySelector('.scene-video-curtain');
  let jump=null;
  const updateStrip=mountStripTransition(deck,scenes.length-1);
  const film=mountScrollVideo(document.querySelector('[data-scroll-video]'),{onFrame(position){if(jump)return;const from=Math.min(scenes.length-1,Math.floor(position)),to=Math.min(scenes.length-1,from+1);wave?.setBlend(scenes[from].dataset.scene,scenes[to].dataset.scene,position-from);syncMenuTableMotion(scenes.find(scene=>scene.id==='drinks'),position,reduced.matches);}});
  let isReduced=reduced.matches;
  reduced.addEventListener('change',event=>{isReduced=event.matches;});
  let index = 0;
  let wheelTotal = 0;
  let wheelUntil = 0;
  let settleTimer;
  let updateFrame;
  let layoutHeight = deck.clientHeight;
  let transitionFrame=null;
  let queuedFragment=null,lastPosition=0;
  const boundedPosition=value=>Number.isFinite(value)?Math.max(0,Math.min(scenes.length-1,value)):index;
  const stopTransition=()=>{if(transitionFrame!==null)cancelAnimationFrame(transitionFrame);transitionFrame=null;jump=null;if(curtain)curtain.style.opacity='0';delete deck.dataset.transitioning;delete deck.dataset.transitionMode;deck.removeAttribute('aria-busy');};
  const go = (next, {navigation=false}={}) => {
    // Repeated flicks must not restart easing or change the destination mid-flight.
    if(transitionFrame!==null)return false;
    if(!Number.isFinite(next))return false;
    next=Math.max(0,Math.min(scenes.length-1,Math.round(next)));
    // A collapsed/loading layout has no valid progress denominator. Keep the
    // latest requested station, without starting a transition from Infinity.
    if(deck.clientHeight<=0){queuedFragment=next;return true;}
    stopTransition();
    index = Math.max(0, Math.min(scenes.length - 1, next));
    const start=boundedPosition(layoutHeight>0?deck.scrollTop/layoutHeight:lastPosition),destination=index,target=scenes[index].offsetTop;
    if(Math.abs(destination-start)<.0001)return true;
    const direct=navigation&&Math.abs(destination-Math.round(start))>1;
    if(isReduced){if(direct){film?.seekStation(destination);wave?.setBlend(scenes[destination].dataset.scene,scenes[destination].dataset.scene,0);}deck.scrollTo({top:target,behavior:'instant'});update();return true;}
    if(direct){
      const smooth=t=>{const p=Math.max(0,Math.min(1,t));return p*p*(3-2*p);};
      jump={from:Math.round(start),to:destination,mix:0,ink:1,switched:false,switchedAt:0,revealAt:null};
      index=jump.from;deck.dataset.transitioning='true';deck.dataset.transitionMode='direct';deck.setAttribute('aria-busy','true');
      const began=performance.now(),fadeOut=320,fadeIn=500;
      const animate=now=>{
        if(deck.clientHeight<=0){transitionFrame=requestAnimationFrame(animate);return;}
        if(isReduced){index=destination;film?.seekStation(destination);deck.scrollTo({top:scenes[destination].offsetTop,behavior:'instant'});stopTransition();wave?.setBlend(scenes[destination].dataset.scene,scenes[destination].dataset.scene,0);update();return;}
        if(!jump.switched){
          const p=smooth((now-began)/fadeOut);jump.mix=p*.5;jump.ink=1-p;if(curtain)curtain.style.opacity=String(p);
          if(now-began>=fadeOut){jump.switched=true;jump.switchedAt=now;index=destination;deck.scrollTo({top:scenes[destination].offsetTop,behavior:'instant'});film?.seekStation(destination);}
        }else{
          // Reveal only a decoded destination frame. A stalled/failed film must
          // not trap the page: after 2.6s its old frame stays hidden while ink returns.
          if(jump.revealAt===null&&now-jump.switchedAt>=80&&(!film||film.isSettled()||now-jump.switchedAt>=2600))jump.revealAt=now;
          const p=jump.revealAt===null?0:smooth((now-jump.revealAt)/fadeIn);jump.mix=.5+.5*p;jump.ink=p;if(curtain)curtain.style.opacity=String(1-p);
          if(p>=1){index=destination;stopTransition();wave?.setBlend(scenes[destination].dataset.scene,scenes[destination].dataset.scene,0);syncMenuTableMotion(scenes.find(scene=>scene.id==='drinks'),destination,isReduced);update();return;}
        }
        update();transitionFrame=requestAnimationFrame(animate);
      };
      transitionFrame=requestAnimationFrame(animate);update();return true;
    }
    deck.dataset.transitioning='true';const began=performance.now(),duration=1200;
    const animate=now=>{if(deck.clientHeight<=0){transitionFrame=requestAnimationFrame(animate);return;}const p=Math.min(1,(now-began)/duration),ease=p*p*(3-2*p);deck.scrollTo({top:(start+(destination-start)*ease)*deck.clientHeight,behavior:'instant'});if(p<1)transitionFrame=requestAnimationFrame(animate);else{stopTransition();update();}};
    transitionFrame=requestAnimationFrame(animate);
    return true;
  };
  const update = () => {
    updateFrame = null;
    // ResizeObserver can report zero while a viewport/layout is switching.
    // Preserve the last measured height and station until it becomes visible.
    if(deck.clientHeight<=0)return;
    // Read the previous station before interpreting a scroll offset against a
    // new height. Safari's toolbar, rotation and a fold can resize mid-scroll.
    if (deck.clientHeight !== layoutHeight) {
      const progress=boundedPosition(layoutHeight>0?deck.scrollTop/layoutHeight:lastPosition);
      layoutHeight = deck.clientHeight;
      deck.scrollTo({top: jump?scenes[jump.switched?jump.to:jump.from].offsetTop:transitionFrame!==null?progress*layoutHeight:scenes[index].offsetTop, behavior:'instant'});
    }
    // Focus/scrollIntoView inside a short form must not become a scene gesture.
    // Only go() owns station changes; native overflow alignment keeps this stop.
    const stationaryTop=scenes[jump?(jump.switched?jump.to:jump.from):index].offsetTop;
    if((jump||transitionFrame===null)&&Math.abs(deck.scrollTop-stationaryTop)>.5){
      deck.scrollTo({top:stationaryTop,behavior:'instant'});
    }
    let from = 0;
    while (from < scenes.length - 1 && deck.scrollTop >= scenes[from + 1].offsetTop) from += 1;
    const to = Math.min(from + 1, scenes.length - 1);
    const distance = scenes[to].offsetTop - scenes[from].offsetTop;
    const mix = distance > 0 ? Math.max(0, Math.min(1, (deck.scrollTop - scenes[from].offsetTop) / distance)) : 0;
    lastPosition=from+mix;
    updateStrip(from+mix,jump);
    if(jump){wave?.setBlend(scenes[jump.from].dataset.scene,scenes[jump.to].dataset.scene,jump.mix);syncMenuTableMotion(scenes.find(scene=>scene.id==='drinks'),jump.switched?jump.to:jump.from,isReduced,jump.ink);}
    else if(!film||document.querySelector('[data-scroll-video]').dataset.displayMode==='error'){wave?.setBlend(scenes[from].dataset.scene, scenes[to].dataset.scene, mix);syncMenuTableMotion(scenes.find(scene=>scene.id==='drinks'),from+mix,isReduced);}
    index = mix > 0.5 ? to : from;
    document.body.dataset.sceneActive=scenes[index].id;
    scenes.forEach((scene, i) => {
      scene.inert = !!jump || i !== index;
      const distance=(from+mix)-i;
      scene.style.setProperty('--scene-counter',`${deck.scrollTop-scene.offsetTop}px`);
      scene.style.setProperty('--scene-drift',`${isReduced?0:-distance*35}px`);
      scene.style.setProperty('--scene-opacity',String(Math.max(0,1-Math.abs(distance)*2.4)*(jump?jump.ink:1)));
    });
    links.forEach((link, i) => {link.style.setProperty('--nav-focus',String(jump?(i===jump.from?1-jump.mix:i===jump.to?jump.mix:0):Math.max(0,1-Math.abs(from+mix-i))));i === index ? link.setAttribute('aria-current','step') : link.removeAttribute('aria-current');});
    if(!jump)film?.setProgress(from+mix);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if(deck.clientHeight<=0)return;
      // Fragment navigation/font/safe-area layout can move an overflow-hidden
      // scroller by a few pixels after mount. Idle scenes must be exact anchors.
      if(transitionFrame===null&&Math.abs(deck.scrollTop-scenes[index].offsetTop)>.5){
        deck.scrollTo({top:scenes[index].offsetTop,behavior:'instant'});return;
      }
      const heading=scenes[index].querySelector('h1,h2');
      document.querySelector('[data-scene-status]').textContent = heading.getAttribute('aria-label')||heading.textContent;
      const focused = document.activeElement;
      if (focused?.closest('[data-scene]') && !scenes[index].contains(focused)) deck.focus({preventScroll:true});
    }, 160);
    if(transitionFrame===null&&queuedFragment!==null){
      const next=queuedFragment;queuedFragment=null;
      if(next!==index)go(next,{navigation:true});
    }
  };
  deck.addEventListener('scroll', () => {
    if (!updateFrame) updateFrame = requestAnimationFrame(update);
  }, {passive:true});
  const showPosition=()=>document.dispatchEvent(new CustomEvent('pendi:page-gesture'));
  deck.addEventListener('wheel', (event) => {
    if(document.querySelector('dialog[open]'))return;
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    showPosition();
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
  let swipe=null,suppressClickUntil=0;
  deck.addEventListener('touchstart',event=>{
    if(event.touches.length!==1||(window.visualViewport?.scale||1)>1.01||document.querySelector('dialog[open]')){swipe=null;return;}
    swipe={x:event.touches[0].clientX,y:event.touches[0].clientY,delta:0,captured:false,target:event.target,blocked:transitionFrame!==null};
  },{passive:true});
  deck.addEventListener('touchmove',event=>{
    if(!swipe||event.touches.length!==1){swipe=null;return;}
    const dx=event.touches[0].clientX-swipe.x,dy=swipe.y-event.touches[0].clientY;
    if(swipe.target.closest('.basin-dial')?.dataset.dialGesture==='rotate'){if(event.cancelable)event.preventDefault();return;}
    // Cancel from the first move, before Safari starts native pan / rubber-banding.
    if(event.cancelable)event.preventDefault();
    if(Math.abs(dy)>=12&&Math.abs(dy)>Math.abs(dx)){swipe.captured=true;swipe.delta=dy;showPosition();}
  },{passive:false});
  deck.addEventListener('touchend',()=>{if(swipe?.captured){suppressClickUntil=performance.now()+700;if(!swipe.blocked&&Math.abs(swipe.delta)>35)go(index+Math.sign(swipe.delta));}swipe=null;},{passive:true});
  deck.addEventListener('click',event=>{if(performance.now()<suppressClickUntil){event.preventDefault();event.stopPropagation();}},true);
  deck.addEventListener('touchcancel',()=>{swipe=null;},{passive:true});
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const next = scenes.findIndex(scene => '#' + scene.id === link.getAttribute('href'));
    if (next < 0) return;
    event.preventDefault();
    if(go(next,{navigation:!!link.closest('.scene-pagination')}))history.replaceState(history.state, '', '#' + scenes[next].id);
  });
  function followFragment(){
    const next=scenes.findIndex(scene=>'#'+scene.id===location.hash);
    if(next<0)return;
    // Browser fragment scrolling must not become a third station during a
    // locked transition. Queue history's latest target; ordinary repeat clicks
    // remain ignored. Do not create extra entries for the existing navigation.
    if(transitionFrame!==null){
      queuedFragment=next;
      deck.scrollTo({top:jump?scenes[jump.switched?jump.to:jump.from].offsetTop:lastPosition*deck.clientHeight,behavior:'instant'});
      return;
    }
    deck.scrollTo({top:scenes[index].offsetTop,behavior:'instant'});
    go(next,{navigation:true});
  }
  window.addEventListener('hashchange',followFragment);
  window.addEventListener('popstate',followFragment);
  document.addEventListener('keydown', (event) => {
    if(document.querySelector('dialog[open]')||event.target.closest('[data-inline-booking],[data-contact-info]'))return;
    if (event.target.closest('input,textarea,select,[contenteditable="true"]') || document.querySelector('.mobile-menu[open]:not([data-menu-auto=true])')) return;
    if (['ArrowDown','PageDown','ArrowUp','PageUp','Home','End'].includes(event.key)) {
      const delta = ['ArrowDown','PageDown','End'].includes(event.key) ? 1 : -1;
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
