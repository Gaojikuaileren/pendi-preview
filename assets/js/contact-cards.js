import {createContactCard} from './contact-card-art.js?v=2dc20be597d9';
const openers=[...document.querySelectorAll('[data-contact-card-open]')];
if(openers.length){
 let opener=openers[0];
 const t=(de,en)=>document.documentElement.lang==='en'?en:de;
 const svg=path=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
 const dialog=document.createElement('dialog');dialog.id='contact-cards';dialog.className='hours-dialog contact-cards';dialog.setAttribute('aria-labelledby','contact-cards-title');
 dialog.innerHTML=`<header class="hours-heading"><div><p class="hours-eyebrow">PENDI · DÜSSELDORF</p><h2 id="contact-cards-title"></h2></div><button type="button" class="hours-close" autofocus>${svg('m6 6 12 12M18 6 6 18')}</button></header><div class="contact-card-switch" role="group"><button type="button" data-card-kind="contact" aria-pressed="true"></button><button type="button" data-card-kind="jobs" aria-pressed="false"></button></div><div class="contact-card-art"><canvas data-card-preview width="1200" height="760" role="img" hidden></canvas></div><div class="contact-card-actions"><button type="button" data-card-share>${svg('M12 16V3m-4 4 4-4 4 4M6 11H4v10h16V11h-2')}<span></span></button><button type="button" data-card-download>${svg('M12 3v13m-4-4 4 4 4-4M4 18v3h16v-3')}<span></span></button></div><p class="contact-card-status" role="status"></p>`;
 document.body.append(dialog);
 const cardNote=document.createElement('p');cardNote.className='contact-card-note';
 dialog.querySelector('.contact-card-art').after(cardNote);
 const closeButton=dialog.querySelector('.hours-close'),preview=dialog.querySelector('[data-card-preview]'),status=dialog.querySelector('[role=status]'),share=dialog.querySelector('[data-card-share]'),download=dialog.querySelector('[data-card-download]');
 let kind='contact',cards=null,version=0,closing=false,sharing=false;
 const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
 function labels(){
  dialog.querySelector('.hours-eyebrow').textContent='PENDI · '+(document.querySelector('[data-card-settings]')?.dataset.city||'Düsseldorf').toUpperCase();
  for(const trigger of openers){trigger.hidden=false;trigger.disabled=false;trigger.setAttribute('aria-label',trigger.dataset.contactCardOpen==='jobs'?t('Teamkarte öffnen','Open team card'):t('Kontakt- und Teamkarte öffnen','Open contact and team cards'));trigger.title=trigger.getAttribute('aria-label');}
  dialog.querySelector('h2').textContent=t('Zum Mitnehmen.','Take us with you.');closeButton.setAttribute('aria-label',t('Schließen','Close'));
  dialog.querySelector('.contact-card-switch').setAttribute('aria-label',t('Karte auswählen','Choose a card'));
  dialog.querySelector('[data-card-kind=contact]').textContent=t('Kontakt','Contact');dialog.querySelector('[data-card-kind=jobs]').textContent=t('Team / Jobs','Team / Jobs');
  share.querySelector('span').textContent=t('Teilen','Share');download.querySelector('span').textContent=t('PNG speichern','Download PNG');
 }
 function show(animate=false){
  cardNote.textContent=kind==='jobs'?t('Schicken Sie uns Ihr Motivationsschreiben und Ihren Lebenslauf an die E-Mail-Adresse auf der Karte. Wir melden uns so bald wie möglich bei Ihnen.','Send your cover letter and CV to the email address on the card. We’ll get back to you as soon as possible.'):t('Fragen, Ideen oder Feedback? Schreiben Sie uns an die E-Mail-Adresse auf der Karte. Wir freuen uns, von Ihnen zu hören.','Questions, ideas or feedback? Write to the email address on the card. We’d love to hear from you.');
  const configuredNote=document.querySelector('[data-card-settings]')?.dataset[kind==='jobs'?'jobsNote':'contactNote'];if(configuredNote)cardNote.textContent=configuredNote;
  for(const button of dialog.querySelectorAll('[data-card-kind]'))button.setAttribute('aria-pressed',String(button.dataset.cardKind===kind));
  const card=cards?.[kind];share.disabled=download.disabled=!card||sharing;
  if(!card)return;
  preview.getContext('2d').drawImage(card.canvas,0,0);preview.setAttribute('aria-label',card.alt);preview.hidden=false;
  if(animate&&!reduced()){preview.getAnimations().forEach(a=>a.cancel());preview.animate([{opacity:.2,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'});}
 }
 async function prepare(){
  const token=++version;const old=cards;cards=null;show();preview.hidden=true;
  if(old)Object.values(old).forEach(card=>URL.revokeObjectURL(card.url));
  status.textContent=t('Karten werden vorbereitet …','Preparing cards …');
  const lang=document.documentElement.lang;
  const data={address:document.querySelector('[data-l10n=home-26]').textContent.trim(),phone:document.querySelector('[data-l10n=home-31]').textContent.trim(),email:document.querySelector('[data-l10n=home-34]').textContent.trim()};
  Object.assign(data,document.querySelector('[data-card-settings]')?.dataset||{});
  try{
   const result=await Promise.all(['contact','jobs'].map(async type=>{const art=await createContactCard(type,lang,data);return {type,...art};}));
   if(token!==version)return;
   cards=Object.fromEntries(result.map(card=>[card.type,{...card,url:URL.createObjectURL(card.blob),file:new File([card.blob],`pendi-${card.type}-${lang}.png`,{type:'image/png'})}]));
   status.textContent='';show();
  }catch{if(token===version)status.textContent=t('Die Karte konnte nicht geladen werden. Bitte erneut öffnen.','The card could not be loaded. Please reopen it.');}
 }
 function close(){if(!dialog.open||closing)return;closing=true;dialog.classList.add('is-closing');setTimeout(()=>{dialog.close();dialog.classList.remove('is-closing');closing=false;opener.focus({preventScroll:true});},reduced()?0:180);}
 openers.forEach(trigger=>trigger.addEventListener('click',()=>{if(dialog.open)return;opener=trigger;labels();kind=trigger.dataset.contactCardOpen==='jobs'?'jobs':'contact';dialog.showModal();closeButton.focus({preventScroll:true});prepare();}));
 dialog.querySelectorAll('[data-card-kind]').forEach(button=>button.addEventListener('click',()=>{kind=button.dataset.cardKind;status.textContent='';show(true);}));
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
 dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const buttons=[...dialog.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
 document.addEventListener('pendi:language',()=>{labels();if(dialog.open)prepare();});labels();
}
