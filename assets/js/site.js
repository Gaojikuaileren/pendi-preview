import { mountIntegratedWave } from './wave-interaction.js?v=dd1931f9b3a7';
import { mountDeck } from './deck.js?v=dd1931f9b3a7';
import { mountMenuMotion } from './menu-motion.js?v=dd1931f9b3a7';
import { mountLanguageSwitch } from './language.js?v=dd1931f9b3a7';
import { mountHomeEntrance } from './home-entry.js?v=dd1931f9b3a7';
import { mountCardRoute } from './card-route.js?v=dd1931f9b3a7';
import { mountMenuCards } from './menu-cards.js?v=dd1931f9b3a7';
import { mountDeviceTilt } from './device-tilt.js?v=dd1931f9b3a7';
import {mountSceneReading} from './scene-reading.js?v=dd1931f9b3a7';
import './same-page.js?v=dd1931f9b3a7';

const wave = document.querySelector('[data-wave]');
const controller = wave ? mountIntegratedWave(wave, document.querySelector('[data-motion-toggle]')) : null;
const deck = document.querySelector('[data-deck]');
if (deck) {mountDeck(deck, controller);mountSceneReading(deck);}

// Approved Phase 1 design is the default. Comparison controls stay opt-in.
if(deck) {
  const designReady=import('./menu-depth-preview.js?v=dd1931f9b3a7').then(({mountMenuDepthPreview})=>mountMenuDepthPreview());
  mountHomeEntrance(designReady);
}

const menu = document.querySelector('.mobile-menu');
const languageSwitch=document.querySelector('.language-switch');
if(languageSwitch){
 const current=document.documentElement.lang==='en'?'en':'de',next=current==='de'?'en':'de',alternate=languageSwitch.querySelector(`[lang=${next}]`);
 if(alternate){const flip=alternate.cloneNode(true);flip.classList.add('language-flip');flip.textContent=next.toUpperCase();flip.removeAttribute('aria-current');flip.dataset.languageNext=next;flip.setAttribute('hreflang',next);flip.setAttribute('aria-label',current==='de'?'Sprache wechseln: Englisch':'Switch language to German');flip.title=current==='de'?'Zu Englisch wechseln':'Switch to German';languageSwitch.replaceChildren(flip);}
}
const header=document.querySelector('.site-header');
if(header){const updateHeader=()=>{const controls=header.querySelector('.mobile-menu summary');if(controls)document.documentElement.style.setProperty('--header-controls-bottom',`${controls.getBoundingClientRect().bottom+18}px`);};new ResizeObserver(updateHeader).observe(header);window.addEventListener('resize',updateHeader);updateHeader();}
if (menu) mountMenuMotion(menu);
mountLanguageSwitch(document.querySelector('.language-flip'));
mountCardRoute();
mountMenuCards();
mountDeviceTilt();
// Keep touch gestures on the composition from opening selection/callout UI.
const allowsSelection=target=>document.body.dataset.sceneActive==='contact'||target.closest('.scene-contact,input,textarea,[contenteditable="true"]');
for(const type of ['selectstart','contextmenu','dragstart'])document.addEventListener(type,event=>{
  if(!allowsSelection(event.target))event.preventDefault();
});
