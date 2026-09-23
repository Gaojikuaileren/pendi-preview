import {businessSettings} from './business-config.js?v=ca1c440043db';

export function berlinDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function closureRanges(dates,today=berlinDate()){
 const groups=[];
 for(const date of [...new Set(dates||[])].sort()){
  const last=groups.at(-1),next=last?new Date(last.end+'T12:00:00Z'):null;
  if(next)next.setUTCDate(next.getUTCDate()+1);
  if(last&&next.toISOString().slice(0,10)===date)last.end=date;else groups.push({start:date,end:date});
 }
 return groups.filter(range=>range.end>=today);
}
export function closureDateLabel(range,short=false){
 const format=new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'de-DE',{day:'2-digit',month:short?'2-digit':'short',...(short?{}:{year:'numeric'}),timeZone:'UTC'});
 const label=date=>format.format(new Date(date+'T12:00:00Z'));
 return range.start===range.end?label(range.start):label(range.start)+' – '+label(range.end);
}
const t=(de,en)=>document.documentElement.lang==='en'?en:de;
export function closurePlans(){
 const temp=businessSettings?.temporaryClosure;
 return {temporary:temp?.enabled?closureRanges(temp.dates):[],holidays:closureRanges(businessSettings?.holidays?.dates),reason:temp?.enabled?(temp.reason?.[document.documentElement.lang==='en'?'en':'de']||temp.reason?.de||''):''};
}
export function renderClosurePlans(container){
 const plans=closurePlans();container.replaceChildren();
 for(const [key,title] of [['temporary',t('Unsere Betriebspause','Our temporary closure')],['holidays',t('Geschlossen an Feiertagen','Holiday closures')]]){
  if(!plans[key].length)continue;
  const section=document.createElement('section'),heading=document.createElement('h3'),dates=document.createElement('p');
  heading.textContent=title;dates.className='closure-dates';dates.textContent=plans[key].map(range=>closureDateLabel(range)).join(', ');section.append(heading,dates);
  if(key==='temporary'&&plans.reason){const reason=document.createElement('p');reason.className='closure-reason';reason.textContent=plans.reason;section.append(reason);}
  container.append(section);
 }
 container.hidden=!container.childElementCount;
}

// One announcement per main-page visit; scene swipes and language changes do not reopen it.
if(document.querySelector('[data-hours-open]')){
 let shown=false,dialog=null;
 const update=()=>{
  const plans=closurePlans();
  if(!plans.temporary.length){if(dialog?.open)dialog.close();return;}
  if(!dialog){
   dialog=document.createElement('dialog');dialog.id='closure-notice';dialog.className='hours-dialog closure-notice';dialog.setAttribute('aria-labelledby','closure-title');
   dialog.innerHTML='<header class="hours-heading"><div><p class="hours-eyebrow">PENDI · DÜSSELDORF</p><h2 id="closure-title"></h2></div><button class="hours-close" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><p class="closure-dates"></p><p class="closure-reason"></p><button class="closure-ack" type="button" autofocus></button>';
   document.body.append(dialog);
   const close=()=>{if(!dialog.open||dialog.classList.contains('is-closing'))return;dialog.classList.add('is-closing');setTimeout(()=>{dialog.close();dialog.classList.remove('is-closing');},matchMedia('(prefers-reduced-motion:reduce)').matches?0:180);};
   dialog.querySelectorAll('button').forEach(button=>button.addEventListener('click',close));dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  }
  dialog.querySelector('h2').textContent=t('Eine kleine Pause.','A short pause.');
  dialog.querySelector('.hours-close').setAttribute('aria-label',t('Schließen','Close'));
  dialog.querySelector('.closure-dates').textContent=plans.temporary.map(range=>closureDateLabel(range)).join(', ');
  dialog.querySelector('.closure-reason').textContent=plans.reason;
  dialog.querySelector('.closure-ack').textContent=t('Verstanden','Got it');
  if(!shown&&!document.hidden&&!document.querySelector('dialog[open]')){shown=true;dialog.showModal();}
 };
 document.addEventListener('pendi:language',update);document.addEventListener('pendi:business-settings',update);document.addEventListener('visibilitychange',update);
 document.addEventListener('close',()=>{if(!shown)update();},true);
 update();
}
