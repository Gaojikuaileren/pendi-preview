import {cardSource,cardVisual} from './card-media.js?v=1fdeb4acf428';
import {reducedMotion} from './motion-policy.js?v=1fdeb4acf428';
const openers=[...document.querySelectorAll('[data-contact-card-open]')];
if(openers.length){
 let opener=openers[0];
 const t=(de,en)=>document.documentElement.lang==='en'?en:de;
 const svg=path=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
 const jobsAvailable=()=>{try{return JSON.parse(document.querySelector('[data-about-settings]')?.dataset.config||'{}').jobsEnabled!==false;}catch{return false;}};
 const dialog=document.createElement('dialog');dialog.id='contact-cards';dialog.className='hours-dialog contact-cards';dialog.setAttribute('aria-labelledby','contact-cards-title');
 dialog.innerHTML=`<header class="hours-heading"><div><p class="hours-eyebrow">PENDI · DÜSSELDORF</p><h2 id="contact-cards-title"></h2></div><button type="button" class="hours-close" autofocus>${svg('m6 6 12 12M18 6 6 18')}</button></header><div class="contact-card-switch" role="group"><button type="button" data-card-kind="contact" aria-pressed="true"></button><button type="button" data-card-kind="jobs" aria-pressed="false"></button></div><div class="contact-card-art"></div><div class="contact-card-actions"><button type="button" data-card-share>${svg('M12 16V3m-4 4 4-4 4 4M6 11H4v10h16V11h-2')}<span></span></button><button type="button" data-card-download>${svg('M12 3v13m-4-4 4 4 4-4M4 18v3h16v-3')}<span></span></button></div><p class="contact-card-status" role="status"></p>`;
 document.body.append(dialog);
 const notes=document.createElement('div');notes.className='contact-card-notes';
 dialog.querySelector('.contact-card-art').after(notes);
 const closeButton=dialog.querySelector('.hours-close'),preview=dialog.querySelector('.contact-card-art'),status=dialog.querySelector('[role=status]'),share=dialog.querySelector('[data-card-share]'),download=dialog.querySelector('[data-card-download]');
 const actions=dialog.querySelector('.contact-card-actions'),layers={},noteLayers={};
 for(const type of ['contact','jobs']){
  const layer=document.createElement('div');layer.className='contact-card-layer';layer.dataset.cardPreview=type;preview.append(layer);layers[type]=layer;
  const note=document.createElement('p');note.className='contact-card-note';note.dataset.cardNote=type;notes.append(note);noteLayers[type]=note;
 }
 let kind='contact',cards=null,version=0,closing=false,sharing=false;
 const reduced=()=>reducedMotion.matches;
 const selectKind=requested=>{kind=requested==='jobs'&&jobsAvailable()?'jobs':'contact';};
 function labels(){
  const jobsEnabled=jobsAvailable();selectKind(kind);
  dialog.querySelector('.hours-eyebrow').textContent='PENDI · '+(document.querySelector('[data-card-settings]')?.dataset.city||'Düsseldorf').toUpperCase();
  for(const trigger of openers){const jobsOnly=trigger.dataset.contactCardOpen==='jobs';trigger.hidden=trigger.disabled=jobsOnly&&!jobsEnabled;trigger.setAttribute('aria-label',jobsOnly?t('Teamkarte öffnen','Open team card'):jobsEnabled?t('Kontakt- und Teamkarte öffnen','Open contact and team cards'):t('Kontaktkarte öffnen','Open contact card'));trigger.title=trigger.getAttribute('aria-label');}
  dialog.querySelector('h2').textContent=t('Zum Mitnehmen.','Take us with you.');closeButton.setAttribute('aria-label',t('Schließen','Close'));
  dialog.querySelector('.contact-card-switch').setAttribute('aria-label',t('Karte auswählen','Choose a card'));
  dialog.querySelector('[data-card-kind=contact]').textContent=t('Kontakt','Contact');dialog.querySelector('[data-card-kind=jobs]').textContent=t('Team / Jobs','Team / Jobs');
  dialog.querySelector('[data-card-kind=jobs]').hidden=!jobsEnabled;dialog.querySelector('.contact-card-switch').hidden=!jobsEnabled;
  layers.jobs.hidden=noteLayers.jobs.hidden=!jobsEnabled;
  // With no uploaded card at all, there is no download row to reserve.
  actions.hidden=!cardSource('contact')&&!(jobsEnabled&&cardSource('jobs'));
  share.querySelector('span').textContent=t('Teilen','Share');download.querySelector('span').textContent=t('PNG speichern','Download PNG');
  const settings=document.querySelector('[data-card-settings]')?.dataset;
  noteLayers.contact.textContent=settings?.contactNote||t('Fragen, Ideen oder Feedback? Schreiben Sie uns an die E-Mail-Adresse auf der Karte. Wir freuen uns, von Ihnen zu hören.','Questions, ideas or feedback? Write to the email address on the card. We’d love to hear from you.');
  noteLayers.jobs.textContent=settings?.jobsNote||t('Schicken Sie uns Ihr Motivationsschreiben und Ihren Lebenslauf an die E-Mail-Adresse auf der Karte. Wir melden uns so bald wie möglich bei Ihnen.','Send your cover letter and CV to the email address on the card. We’ll get back to you as soon as possible.');
 }
 function show(){
  selectKind(kind);dialog.dataset.cardKind=kind;
  for(const button of dialog.querySelectorAll('[data-card-kind]'))button.setAttribute('aria-pressed',String(button.dataset.cardKind===kind));
  for(const type of ['contact','jobs'])for(const layer of [layers[type],noteLayers[type]]){const active=type===kind;layer.classList.toggle('is-active',active);layer.setAttribute('aria-hidden',String(!active));layer.inert=!active;}
  const card=cards?.[kind];share.disabled=download.disabled=!card||sharing;
  // Reserve the same footprint for loading and missing cards; never recenter on switch.
  actions.classList.toggle('is-unavailable',!card);actions.inert=!card;actions.setAttribute('aria-hidden',String(!card));
 }
 async function prepare(){
  const token=++version;const old=cards;cards=null;
  if(old)Object.values(old).forEach(card=>URL.revokeObjectURL(card.url));
  const types=jobsAvailable()?['contact','jobs']:['contact'];
  for(const type of ['contact','jobs'])layers[type].replaceChildren(...(types.includes(type)?[cardVisual(type,type==='jobs'?t('Pendi · Jobkarte','Pendi · Jobs card'):t('Pendi · Kontaktkarte','Pendi · Contact card'))]:[]));
  status.textContent='';show();
  const lang=document.documentElement.lang;
  const result=await Promise.allSettled(types.map(async type=>{const src=cardSource(type);if(!src)return null;const response=await fetch(src);if(!response.ok)throw Error('Card unavailable');const blob=await response.blob();if(blob.type!=='image/png')throw Error('Invalid card');return {type,blob};}));
  if(token!==version)return;
  cards=Object.fromEntries(result.filter(r=>r.status==='fulfilled'&&r.value).map(({value:card})=>[card.type,{...card,url:URL.createObjectURL(card.blob),file:new File([card.blob],`pendi-${card.type}-${lang}.png`,{type:'image/png'})}]));
  if(result.some(r=>r.status==='rejected'))status.textContent=t('Eine Karte konnte nicht geladen werden. Bitte erneut öffnen.','A card could not be loaded. Please reopen it.');
  show();
 }
 function close(){if(!dialog.open||closing)return;closing=true;dialog.classList.add('is-closing');setTimeout(()=>{dialog.close();dialog.classList.remove('is-closing');closing=false;opener.focus({preventScroll:true});},reduced()?0:180);}
 // About is rendered/retranslated after this module loads. Delegate all card
 // entries to the same dialog and return focus to the actual clicked button.
 document.addEventListener('click',event=>{const trigger=event.target.closest('[data-contact-card-open]');if(!trigger||dialog.open||trigger.disabled)return;event.preventDefault();opener=trigger;labels();selectKind(trigger.dataset.contactCardOpen);dialog.showModal();closeButton.focus({preventScroll:true});prepare();});
 dialog.querySelectorAll('[data-card-kind]').forEach(button=>button.addEventListener('click',()=>{if(button.hidden||button.dataset.cardKind==='jobs'&&!jobsAvailable())return;selectKind(button.dataset.cardKind);status.textContent='';show();}));
 function save(){const card=cards?.[kind];if(!card)return;const a=document.createElement('a');a.href=card.url;a.download=card.file.name;document.body.append(a);a.click();a.remove();}
 download.addEventListener('click',save);
 share.addEventListener('click',async()=>{
  const card=cards?.[kind];if(!card||sharing)return;
  status.textContent='';
  // Prepared File preserves transient activation: no render/fetch before share().
  if(!navigator.share||!navigator.canShare?.({files:[card.file]})){save();status.textContent=t('PNG zum Weitergeben heruntergeladen.','PNG downloaded so you can share it.');return;}
  sharing=true;show();
  try{await navigator.share({files:[card.file],title:kind==='jobs'?'Pendi · Team':'Pendi · Kontakt'});}
  catch(error){if(error.name!=='AbortError')status.textContent=t('Teilen nicht verfügbar. Bitte PNG speichern.','Sharing unavailable. Please download the PNG.');}
  finally{sharing=false;show();}
 });
 closeButton.addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))close();});
 dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const buttons=[...dialog.querySelectorAll('button:not(:disabled)')].filter(n=>!n.closest('[hidden],[inert]')&&getComputedStyle(n).visibility!=='hidden'),first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
 document.addEventListener('pendi:language',()=>{labels();if(dialog.open)prepare();});labels();show();
}
