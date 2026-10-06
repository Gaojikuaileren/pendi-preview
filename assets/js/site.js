import {mountKeyboardCanvas} from './keyboard-canvas.js?v=e36b16075409';
import { mountIntegratedWave } from './wave-interaction.js?v=e36b16075409';
import { mountDeck } from './deck.js?v=e36b16075409';
import { mountMenuMotion } from './menu-motion.js?v=e36b16075409';
import { mountLanguageSwitch } from './language.js?v=e36b16075409';
import { mountHomeEntrance } from './home-entry.js?v=e36b16075409';
import { mountCardRoute } from './card-route.js?v=e36b16075409';
import { mountMenuCards } from './menu-cards.js?v=e36b16075409';
import { mountDeviceTilt } from './device-tilt.js?v=e36b16075409';
import {mountSceneReading} from './scene-reading.js?v=e36b16075409';
import {mountLocalAdminEntry} from './admin-entry.js?v=e36b16075409';
import {mountFilmTexture} from './film-texture.js?v=e36b16075409';
import './same-page.js?v=e36b16075409';
import './opening-hours.js?v=e36b16075409';
import './contact-cards.js?v=e36b16075409';
import {mountAbout} from './about.js?v=e36b16075409';

mountKeyboardCanvas();
const wave = document.querySelector('[data-wave]');
const controller = wave ? mountIntegratedWave(wave, document.querySelector('[data-motion-toggle]')) : null;
const deck = document.querySelector('[data-deck]');
if (deck) {mountAbout();mountDeck(deck, controller);mountSceneReading(deck);}

// Approved Phase 1 design is the default. Comparison controls stay opt-in.
if(deck) {
  const designReady=import('./menu-depth-preview.js?v=e36b16075409').then(({mountMenuDepthPreview})=>mountMenuDepthPreview());
  mountHomeEntrance(designReady);
}

const menu = document.querySelector('.mobile-menu');
const languageSwitch=document.querySelector('.language-switch');
if(languageSwitch){
 const current=document.documentElement.lang==='en'?'en':'de',next=current==='de'?'en':'de',alternate=languageSwitch.querySelector(`[lang=${next}]`);
 if(alternate){const flip=alternate.cloneNode(true);flip.classList.add('language-flip');flip.textContent=next.toUpperCase();flip.removeAttribute('aria-current');flip.dataset.languageNext=next;flip.setAttribute('hreflang',next);flip.setAttribute('aria-label',current==='de'?'Sprache wechseln: Englisch':'Switch language to German');flip.title=current==='de'?'Zu Englisch wechseln':'Switch to German';languageSwitch.replaceChildren(flip);}
}
const header=document.querySelector('.site-header');
if(header){
 const controls=header.querySelector('.mobile-menu summary');
 const updateHeader=()=>{
  if(!controls)return;
  const bounds=controls.getBoundingClientRect(),root=document.documentElement;
  root.style.setProperty('--header-controls-bottom',`${bounds.bottom+18}px`);
  root.style.setProperty('--menu-anchor-right',`${Math.max(0,root.clientWidth-bounds.right)}px`);
 };
 const observer=new ResizeObserver(updateHeader);
 for(const element of [header,controls,header.querySelector('.header-actions')])if(element)observer.observe(element);
 window.addEventListener('resize',updateHeader);
 document.fonts?.ready.then(updateHeader);
 updateHeader();
}
if (menu) mountMenuMotion(menu);
mountLanguageSwitch(document.querySelector('.language-flip'));
mountCardRoute();
mountMenuCards();
mountDeviceTilt();
mountLocalAdminEntry();
mountFilmTexture(document.querySelector('[data-scroll-video]'));
// Keep touch gestures on the composition from opening selection/callout UI.
const allowsSelection=target=>document.body.dataset.sceneActive==='contact'||target.closest('.scene-contact,input,textarea,[contenteditable="true"]');
for(const type of ['selectstart','contextmenu','dragstart'])document.addEventListener(type,event=>{
  if(!allowsSelection(event.target))event.preventDefault();
});
