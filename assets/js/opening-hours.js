import {closurePlans,closureDateLabel,renderClosurePlans,berlinDate} from './closure-notice.js?v=2dc20be597d9';
import {businessSettings} from './business-config.js?v=2dc20be597d9';
import {OPENING_HOURS} from './opening-hours-config.js?v=2dc20be597d9';

const trigger=document.querySelector('[data-hours-open]');
if(trigger){
 const dialog=document.createElement('dialog');
 dialog.id='weekly-hours';dialog.className='hours-dialog';
 dialog.setAttribute('aria-labelledby','weekly-hours-title');
 dialog.innerHTML='<header class="hours-heading"><div><p class="hours-eyebrow">PENDI · DÜSSELDORF</p><h2 id="weekly-hours-title"></h2></div><button type="button" class="hours-close" autofocus><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><dl class="hours-week"></dl><p class="hours-note"></p>';
 document.body.append(dialog);
 const closeButton=dialog.querySelector('.hours-close'),list=dialog.querySelector('.hours-week');
 const exceptions=document.createElement('div');exceptions.className='hours-exceptions';list.after(exceptions);
 const t=(de,en)=>document.documentElement.lang==='en'?en:de;
 function render(){
  trigger.hidden=false;
  if(businessSettings?.configured){
   const now=new Date(),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),parts=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Berlin',weekday:'short'}).format(now),day=OPENING_HOURS.week[['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(parts)];
   const text=!day.open||businessSettings.closedDates.includes(today)?t('Heute geschlossen','Closed today'):day.intervals.map(i=>i.start+'–'+i.end+(i.endDayOffset?t(' (Folgetag)',' (next day)'):'')).join(' · ');
   const label=document.querySelector('[data-l10n=home-29]'),plans=closurePlans(),upcoming=[...plans.temporary,...plans.holidays].sort((a,b)=>a.start.localeCompare(b.start));
   const temporaryToday=businessSettings.temporaryClosure?.enabled&&businessSettings.temporaryClosure.dates.includes(today),holidayToday=businessSettings.holidays?.dates.includes(today);
   if(label)label.textContent=temporaryToday?t('Vorübergehend geschlossen','Temporarily closed'):holidayToday?t('Feiertag · geschlossen','Holiday · closed'):upcoming.length?(t('Pause: ','Closed: ')+closureDateLabel(upcoming[0],true)):text;
  }
  trigger.setAttribute('aria-label',t('Alle Öffnungszeiten anzeigen','Show weekly opening hours'));
  trigger.title=trigger.getAttribute('aria-label');
  dialog.querySelector('h2').textContent=t('Unsere Woche.','Our week.');
  closeButton.setAttribute('aria-label',t('Schließen','Close'));
  const format=new Intl.DateTimeFormat(document.documentElement.lang,{weekday:'long',timeZone:'UTC'});
  list.replaceChildren();
  for(const item of OPENING_HOURS.week){
   const row=document.createElement('div'),day=document.createElement('dt'),hours=document.createElement('dd');
   day.textContent=format.format(new Date(Date.UTC(2026,8,21+item.day-1)));
   row.dataset.open=String(item.open);
   if(item.open===null)hours.textContent=t('Wird ergänzt','To be added');
   else if(!item.open)hours.textContent=t('Geschlossen','Closed');
   else for(const interval of item.intervals){
    const line=document.createElement('span');line.textContent=interval.start+'–'+interval.end+(interval.endDayOffset===1?' ⁺¹':'');hours.append(line);
   }
   row.append(day,hours);list.append(row);
  }
  renderClosurePlans(exceptions);
  const overnight=OPENING_HOURS.week.some(day=>day.open&&day.intervals.some(i=>i.endDayOffset===1));
  const note=dialog.querySelector('.hours-note');note.hidden=!overnight;
  note.textContent=t('⁺¹ Bis in den nächsten Tag. Alle Zeiten: Berlin.','⁺¹ Into the following day. All times: Berlin.');
 }
 let closing=false;
 function close(){
  if(!dialog.open||closing)return;
  closing=true;dialog.classList.add('is-closing');
  setTimeout(()=>{dialog.close();dialog.classList.remove('is-closing');closing=false;trigger.focus({preventScroll:true});},matchMedia('(prefers-reduced-motion:reduce)').matches?0:180);
 }
 trigger.addEventListener('click',()=>{if(!dialog.open){render();dialog.showModal();closeButton.focus({preventScroll:true});}});
 closeButton.addEventListener('click',close);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 // This informational dialog has one control; keep keyboard focus on it.
 dialog.addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();closeButton.focus({preventScroll:true});}});
 dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))close();});
 document.addEventListener('pendi:language',render);
 document.addEventListener('pendi:business-settings',render);
 let renderedDay=berlinDate();setInterval(()=>{const today=berlinDate();if(today!==renderedDay){renderedDay=today;render();document.dispatchEvent(new Event('pendi:business-settings'));}},60000);
 render();
}
