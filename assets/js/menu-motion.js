// Keep native details as the no-JS fallback; defer closing until the panel retracts.
export function mountMenuMotion(menu) {
  const summary = menu.querySelector('summary');
  const panel = menu.querySelector('.menu-panel');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let expanded = menu.open;
  let animation = null;
  let automatic=false,hideTimer=null;
  const manual=()=>{clearTimeout(hideTimer);automatic=false;delete menu.dataset.menuAuto;};
  const scheduleHide=()=>{clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(automatic){setExpanded(false);automatic=false;}},1800);};
  menu.dataset.menuState = expanded ? 'open' : 'closed';
  summary.setAttribute('aria-expanded', String(expanded));

  function finish() {
    menu.dataset.menuState = expanded ? 'open' : 'closed';
    menu.open = expanded;
    if (!expanded && animation) {
      animation.cancel();
      animation = null;
    }
    if(!expanded)delete menu.dataset.menuAuto;
  }

  function setExpanded(next) {
    expanded = next;
    summary.setAttribute('aria-expanded', String(next));
    if (!next && panel.contains(document.activeElement)) summary.focus({preventScroll:true});
    panel.inert = !next;
    if (reduced.matches || !panel.animate) {
      animation?.cancel();
      animation = null;
      finish();
      return;
    }
    // A single reversible timeline prevents a jump on repeated quick clicks.
    if (!animation) {
      menu.open = true;
      animation = panel.animate([
        {opacity:0, transform:'translateY(-18px)', clipPath:'inset(0 0 100% 0)'},
        {opacity:1, transform:'translateY(0)', clipPath:'inset(0 0 0% 0)'}
      ], {duration:460, easing:'cubic-bezier(.4, 0, .2, 1)', fill:'both'});
      animation.pause();
      animation.currentTime = next ? 0 : 460;
      animation.onfinish = finish;
    }
    menu.dataset.menuState = next ? 'opening' : 'closing';
    animation.updatePlaybackRate(next ? 1 : -460 / 300);
    animation.play();
  }

  summary.addEventListener('click', event => {
    event.preventDefault();
    // Clicking the button during a hint pins it open instead of dismissing it.
    if(automatic){manual();setExpanded(true);return;}
    manual();
    setExpanded(!expanded);
  });
  document.addEventListener('pendi:page-gesture',()=>{
    if(!document.body.classList.contains('page-home')||document.querySelector('dialog[open]')||(expanded&&!automatic))return;
    automatic=true;menu.dataset.menuAuto='true';
    if(!expanded)setExpanded(true);
    scheduleHide();
  });
  panel.addEventListener('pointerenter',()=>{if(automatic)clearTimeout(hideTimer);});
  panel.addEventListener('pointerleave',()=>{if(automatic)scheduleHide();});
  panel.addEventListener('focusin',manual);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      manual();
      setExpanded(false);
      summary.focus({preventScroll:true});
    }
  });
  document.addEventListener('click', event => {
    if (expanded && !menu.contains(event.target)) {manual();setExpanded(false);}
  });
  panel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    manual();
    setExpanded(false);
    summary.focus({preventScroll:true});
  }));
  reduced.addEventListener('change', () => { if (reduced.matches) setExpanded(expanded); });
}
