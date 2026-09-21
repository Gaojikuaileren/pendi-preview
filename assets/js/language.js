// Update translated copy in place, preserving the film, waves, focus and draft.
// Stable template markers bind to the server-rendered alternate language.
const pairs = new Map();
export function t(de, en) {
  pairs.set(de, en);
  return document.documentElement.lang === 'en' ? en : de;
}

// Text alone may fade. Never animate the opacity of a card, button or banner:
// their opaque surfaces must keep covering the photograph beneath them.
function textNodes(node) {
  return [...node.childNodes].flatMap(child=>child.nodeType===Node.TEXT_NODE?[child]:
    child.nodeType===Node.ELEMENT_NODE&&child.hasAttribute('data-language-copy')?[...child.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE):[]);
}
function copyLayers(isDeck) {
  const roots=[...document.querySelectorAll(isDeck?'[data-scene]:not([inert]),.experience-strip':'.detail-page,.site-footer,.menu-legal-banner')];
  const layers=[];
  for(const root of roots){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()){
      const node=walker.currentNode,parent=node.parentElement;
      if(node.nodeValue.trim()&&parent?.closest('[data-l10n-text],[data-inline-booking]')&&
        !parent.closest('svg,script,style,option,textarea,[hidden],.visually-hidden')&&parent.getClientRects().length)nodes.push(node);
    }
    for(const node of nodes){
      let layer=node.parentElement;
      if(!layer.hasAttribute('data-language-copy')){
        layer=document.createElement('span');layer.dataset.languageCopy='';node.replaceWith(layer);layer.append(node);
      }
      layers.push(layer);
    }
  }
  return layers;
}

function translatePrototype(previous) {
  const translations = new Map([...pairs].map(([de,en]) => previous === 'de' ? [de,en] : [en,de]));
  const escaped = [...translations.keys()].filter(Boolean).sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const pattern = new RegExp('(?<![\\p{L}\\p{N}])(?:'+escaped.join('|')+')(?![\\p{L}\\p{N}])','gu');
  const replace = value => value.replace(pattern, match=>translations.get(match));
  document.querySelectorAll('[data-inline-booking],.menu-depth-controls').forEach(root=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) walker.currentNode.nodeValue=replace(walker.currentNode.nodeValue);
    root.querySelectorAll('*').forEach(node=>{
      for(const name of ['aria-label','aria-valuetext','title']) if(node.hasAttribute(name)) node.setAttribute(name,replace(node.getAttribute(name)));
    });
  });
}

export function mountLanguageSwitch(link) {
  if (!document.body.matches('.page-home,.page-drinks,.page-policy') || !link) return;
  const isDeck=!!document.querySelector('[data-deck]');
  let status=document.querySelector('[data-scene-status]');
  if(!status){status=document.createElement('p');status.className='visually-hidden';status.setAttribute('role','status');document.body.append(status);}
  let busy=false,queued=null;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  async function change(url, push=true) {
    if(busy){queued={url,push};return;}
    busy=true;link.setAttribute('aria-busy','true');
    let fades=[];
    try {
      const response=await fetch(url,{credentials:'same-origin'});
      if(!response.ok)throw new Error('Language response unavailable');
      const next=new DOMParser().parseFromString(await response.text(),'text/html');
      const language=next.documentElement.lang;
      const pageClass=[...document.body.classList].find(name=>name.startsWith('page-'));
      if(!['de','en'].includes(language)||!next.body.classList.contains(pageClass))throw new Error('Invalid language page');
      // Keep all surfaces mounted and opaque; fade only isolated text ink.
      const areas=copyLayers(isDeck);
      const ring=document.querySelector('[data-scene]:not([inert]) .cup-raster');
      if(ring)areas.push(ring);
      const anchor=!isDeck?[...document.querySelectorAll('.detail-page [data-l10n-text]')].find(n=>n.getBoundingClientRect().top>=0&&n.getBoundingClientRect().top<innerHeight):null;
      const anchorTop=anchor?.getBoundingClientRect().top;
      const fade=(from,to,duration)=>areas.map(n=>n.animate([{opacity:from},{opacity:to}],{duration:reduced.matches?0:duration,fill:'both',easing:'ease-in-out'}));
      fades=fade(1,0,120);await Promise.all(fades.map(a=>a.finished));
      const previous=document.documentElement.lang;
      document.querySelectorAll('[data-l10n]').forEach(node=>{
        if(node.closest('[data-inline-booking],.language-switch,[data-menu-typewriter]'))return;
        const source=next.querySelector(`[data-l10n="${node.dataset.l10n}"]`);if(!source)return;
        if(node.hasAttribute('data-l10n-text')){
          const text=textNodes(source);
          textNodes(node).forEach((n,i)=>{if(text[i])n.nodeValue=text[i].nodeValue;});
        }
        for(const name of (node.dataset.l10nAttrs||'').split(' ').filter(Boolean)){
          if(isDeck&&node.hasAttribute('data-scene-link')&&name==='href')continue;
          node.setAttribute(name,source.getAttribute(name));
        }
      });
      document.documentElement.lang=language;
      translatePrototype(previous);
      const target=language==='de'?'en':'de';
      link.href=next.querySelector(`link[hreflang="${target}"]`).href;
      link.textContent=target.toUpperCase();link.lang=target;link.hreflang=target;link.dataset.languageNext=target;
      link.setAttribute('aria-label',language==='de'?'Sprache wechseln: Englisch':'Switch language to German');
      link.title=language==='de'?'Zu Englisch wechseln':'Switch to German';
      link.parentElement.setAttribute('aria-label',next.querySelector('.language-switch').getAttribute('aria-label'));
      url.hash=location.hash||(isDeck?'#'+document.body.dataset.sceneActive:'');
      if(push)history.pushState({...history.state,pendiLanguage:language},'',url);
      document.dispatchEvent(new CustomEvent('pendi:language',{detail:{language,previous}}));
      const pause=document.querySelector('[data-motion-toggle]');
      const label=reduced.matches?pause.dataset.reduced:pause.classList.contains('is-paused')?pause.dataset.play:pause.dataset.pause;
      pause.setAttribute('aria-label',label);pause.title=label;
      const heading=document.body.classList.contains('page-drinks')?document.querySelector('#specimen-title'):document.querySelector('[data-scene]:not([inert]) h1,[data-scene]:not([inert]) h2,.detail-page h1');
      status.textContent=heading?.getAttribute('aria-label')||heading?.textContent||'';
      const feedback=document.querySelector('[data-media-feedback]');
      if(feedback&&!feedback.hidden)feedback.textContent=feedback.dataset[document.querySelector('[data-scroll-video]').dataset.displayMode==='error'?'error':'loading'];
      if(anchor)window.scrollBy({top:anchor.getBoundingClientRect().top-anchorTop,behavior:'instant'});
      fades.forEach(a=>a.cancel());fades=fade(0,1,180);await Promise.all(fades.map(a=>a.finished));
    } catch(error) {
      // A failed fetch must not throw away the current scene/draft in a reload.
      status.textContent=t('Sprache konnte nicht geladen werden. Bitte erneut versuchen.','The language could not be loaded. Please try again.');
      console.warn('Language switch:',error.message);
    } finally { fades.forEach(a=>a.cancel());busy=false;link.removeAttribute('aria-busy');if(queued){const pending=queued;queued=null;change(pending.url,pending.push);} }
  }
  link.addEventListener('click',event=>{
    if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();const url=new URL(link.href);url.search=location.search;change(url);
  });
  window.addEventListener('popstate',()=>{
    const language=location.pathname.startsWith('/pendi-preview/en/')?'en':'de';
    if(language!==document.documentElement.lang)change(new URL(location.href),false);
  });
}
