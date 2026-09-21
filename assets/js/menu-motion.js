// Keep native details as the no-JS fallback; defer closing until the panel retracts.
export function mountMenuMotion(menu) {
  const summary = menu.querySelector('summary');
  const panel = menu.querySelector('.menu-panel');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let expanded = menu.open;
  let animation = null;
  menu.dataset.menuState = expanded ? 'open' : 'closed';
  summary.setAttribute('aria-expanded', String(expanded));

  function finish() {
    menu.dataset.menuState = expanded ? 'open' : 'closed';
    menu.open = expanded;
    if (!expanded && animation) {
      animation.cancel();
      animation = null;
    }
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
    setExpanded(!expanded);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      setExpanded(false);
      summary.focus({preventScroll:true});
    }
  });
  document.addEventListener('click', event => {
    if (expanded && !menu.contains(event.target)) setExpanded(false);
  });
  panel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    setExpanded(false);
    summary.focus({preventScroll:true});
  }));
  reduced.addEventListener('change', () => { if (reduced.matches) setExpanded(expanded); });
}
