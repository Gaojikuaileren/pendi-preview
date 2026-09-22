// Local interaction sample only. The production server must enforce its own clock/window.
export function mountBookingDials(root,{t}) {
 const form=root.querySelector('form'),fields=form.querySelector('.fields');
 root.classList.add('dial-booking');root.dataset.step='choose';
 const design=new URLSearchParams(location.search).get('design')==='1';
 root.querySelector('.scenario').hidden=!design;root.querySelector(':scope > .proto-link')?.remove();
 root.querySelector('.scenario [data-action=overnight]')?.remove();
 root.querySelector('.demo-banner').innerHTML=`${t('Vorschau · keine echte Buchung','Preview · no real booking')}`;
 root.querySelector('.steps').textContent=t('01 Wählen  ·  02 Prüfen  ·  03 Fertig','01 Choose  ·  02 Review  ·  03 Result');
 fields.hidden=true;form.querySelector('.meta').hidden=true;
 const dateInput=form.elements.date,timeInput=form.elements.time,guestInput=form.elements.guests;
 guestInput.innerHTML=Array.from({length:8},(_,i)=>`<option>${i+1}</option>`).join('');guestInput.value='2';
 const zone='Europe/Berlin',parts=stamp=>Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(stamp).map(p=>[p.type,p.value]));
 const dateString=p=>`${p.year}-${p.month}-${p.day}`,addDay=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
 // Calendar mode is a design default pending the user's precise three-day interpretation.
 const mode=root.dataset.windowMode||'calendar';
 function windowAt(now=new Date()) {const p=parts(now),first=dateString(p),last=mode==='rolling'?dateString(parts(new Date(+now+72*3600000))):addDay(first,2),end=mode==='rolling'?parts(new Date(+now+72*3600000)):null;
  const limits=date=>({min:date===first?Math.ceil((+p.hour*60+ +p.minute+(now.getSeconds()>0?1:0))/30):0,max:end&&date===last?Math.floor((+end.hour*60+ +end.minute)/30):47});
  const days=[];for(let d=first;d<=last;d=addDay(d,1)){const l=limits(d);if(l.min<=l.max)days.push(d);}return{first,last,days,limits};
 }
 let window=windowAt(),selectedDate=window.days[0],selectedTime=38,guests=2;
 const ui=document.createElement('div');ui.className='booking-dials';fields.before(ui);
 const contour=Array.from({length:5},(_,n)=>{let d='';for(let i=0;i<=72;i++){const a=i/72*Math.PI*2,r=(70-n*7)*(1+.025*Math.sin(a*3+n*.18)+.022*Math.cos(a*5));d+=`${i?'L':'M'}${(80+Math.cos(a)*r).toFixed(2)} ${(80+Math.sin(a)*r).toFixed(2)}`;}return`<path class="dial-contour" d="${d}Z"/>`;}).join('');
 const configs=[['date',t('Datum','Date'),t('Vorheriger Tag','Previous day'),t('Nächster Tag','Next day')],['time',t('Uhrzeit','Time'),t('Früher','Earlier'),t('Später','Later')],['guests',t('Personen','Guests'),t('Weniger Personen','Fewer guests'),t('Mehr Personen','More guests')]];
 ui.innerHTML=configs.map(([id,label,minus,plus])=>`<div class="dial-field"><span class="dial-label" id="dial-label-${id}">${label}</span><div class="basin-dial" data-dial="${id}" role="slider" tabindex="0" aria-labelledby="dial-label-${id}" aria-describedby="dial-help"><svg viewBox="0 0 160 160" aria-hidden="true">${contour}<g class="dial-needle"><circle cx="80" cy="10" r="5"/></g></svg><span class="dial-value" data-dial-value></span><span class="dial-unit" data-dial-unit></span></div><div class="dial-adjust"><button type="button" data-adjust="${id}:-1" aria-label="${minus}">−</button><button type="button" data-adjust="${id}:1" aria-label="${plus}">+</button></div></div>`).join('');
 const hint=document.createElement('p');hint.id='dial-help';hint.className='dial-help';hint.textContent=t('Drehen oder + / − tippen · nächste 3 Tage','Turn or tap + / − · next 3 days');ui.after(hint);
 const summary=document.createElement('p');summary.className='dial-selection';summary.setAttribute('aria-live','polite');summary.setAttribute('aria-atomic','true');hint.after(summary);
 const rules=document.createElement('a');rules.className='booking-rules-link';rules.dataset.policy='reservation-rules';rules.href=(document.documentElement.lang==='de'?'/rechtliches/':'/en/legal/')+'#reservation-rules';rules.textContent=t('Reservierungsregeln','Reservation rules');root.querySelector('[data-result]').after(rules);
 form.querySelector('[type=submit]').textContent=t('Auswahl prüfen','Review selection');
 const value=id=>id==='date'?window.days.indexOf(selectedDate):id==='time'?selectedTime:guests;
 const range=id=>id==='date'?{min:0,max:window.days.length-1}:id==='time'?window.limits(selectedDate):{min:1,max:8};
 const timeText=()=>`${String(Math.floor(selectedTime/2)).padStart(2,'0')}:${selectedTime%2?'30':'00'}`;
 const dateLabel=()=>new Intl.DateTimeFormat(document.documentElement.lang,{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(selectedDate+'T12:00:00Z'));
 function render(){const limit=window.limits(selectedDate);selectedTime=Math.max(limit.min,Math.min(limit.max,selectedTime));dateInput.min=window.first;dateInput.max=window.last;dateInput.value=selectedDate;timeInput.value=timeText();timeInput.min=`${String(Math.floor(limit.min/2)).padStart(2,'0')}:${limit.min%2?'30':'00'}`;timeInput.max=`${String(Math.floor(limit.max/2)).padStart(2,'0')}:${limit.max%2?'30':'00'}`;guestInput.value=guests;
  for(const [id] of configs){const dial=ui.querySelector(`[data-dial=${id}]`),r=range(id),v=value(id),text=id==='date'?dateLabel():id==='time'?timeText():String(guests);dial.setAttribute('aria-valuemin',r.min);dial.setAttribute('aria-valuemax',r.max);dial.setAttribute('aria-valuenow',v);dial.setAttribute('aria-valuetext',id==='date'?selectedDate:id==='time'?text:`${guests} ${t('Personen','guests')}`);dial.querySelector('[data-dial-value]').textContent=text;dial.querySelector('[data-dial-unit]').textContent=id==='date'?(selectedDate===window.first?t('heute','today'):t('Tag','day')):id==='time'?t('Uhr','Berlin'):t('Gäste','guests');dial.style.setProperty('--dial-angle',`${(v-r.min)/Math.max(1,r.max-r.min+1)*360}deg`);for(const sign of [-1,1])ui.querySelector(`[data-adjust="${id}:${sign}"]`).disabled=sign<0?v<=r.min:v>=r.max;}
  summary.textContent=`${dateLabel()} · ${timeText()} · ${guests} ${t('Personen','guests')}`;
 }
 function set(id,next){const r=range(id),v=Math.max(r.min,Math.min(r.max,next));if(id==='date')selectedDate=window.days[v];else if(id==='time')selectedTime=v;else guests=v;render();}
 ui.addEventListener('click',e=>{const b=e.target.closest('[data-adjust]');if(!b)return;const[id,n]=b.dataset.adjust.split(':');set(id,value(id)+Number(n));});
 ui.querySelectorAll('[data-dial]').forEach(dial=>{const id=dial.dataset.dial;let drag=null;const pointers=new Set();
  dial.addEventListener('keydown',e=>{const r=range(id),d=['ArrowRight','ArrowUp'].includes(e.key)?1:['ArrowLeft','ArrowDown'].includes(e.key)?-1:e.key==='PageUp'?4:e.key==='PageDown'?-4:0;if(!d&&!['Home','End'].includes(e.key))return;e.preventDefault();set(id,e.key==='Home'?r.min:e.key==='End'?r.max:value(id)+d);});
  const angle=e=>{const r=dial.getBoundingClientRect();return Math.atan2(e.clientY-r.y-r.height/2,e.clientX-r.x-r.width/2)*180/Math.PI;};
  dial.addEventListener('pointerdown',e=>{pointers.add(e.pointerId);delete dial.dataset.dialGesture;if(pointers.size>1||!e.isPrimary){drag=null;return;}drag={id:e.pointerId,x:e.clientX,y:e.clientY,last:angle(e),carry:0};dial.setPointerCapture(e.pointerId);});
  dial.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!dial.dataset.dialGesture){if(Math.hypot(dx,dy)<8)return;dial.dataset.dialGesture=Math.abs(dx)>Math.abs(dy)?'rotate':'page';}if(dial.dataset.dialGesture!=='rotate')return;dial.classList.add('is-turning');const a=angle(e);let d=a-drag.last;d=(d+540)%360-180;drag.last=a;drag.carry+=d;const r=range(id),step=360/Math.max(3,r.max-r.min+1);const count=Math.trunc(drag.carry/step);if(count){set(id,value(id)+count);drag.carry-=count*step;}});
  const end=e=>{pointers.delete(e.pointerId);drag=null;dial.classList.remove('is-turning');};dial.addEventListener('pointerup',end);dial.addEventListener('pointercancel',end);
 });
 form.addEventListener('submit',()=>{window=windowAt();dateInput.min=window.first;dateInput.max=window.last;const limits=window.limits(selectedDate);timeInput.setCustomValidity(selectedTime<limits.min||selectedTime>limits.max?t('Bitte eine zukünftige Uhrzeit wählen.','Choose a future time.'): '');},true);
 render();
 document.addEventListener('pendi:language',()=>{render();rules.href=(document.documentElement.lang==='de'?'/rechtliches/':'/en/legal/')+'#reservation-rules';});
 const largeType=()=>root.classList.toggle('large-dials',parseFloat(getComputedStyle(ui.querySelector('.dial-value')).fontSize)>26||parseFloat(getComputedStyle(ui.querySelector('.dial-label')).fontSize)>20);
 const typeObserver=new ResizeObserver(largeType);typeObserver.observe(ui.querySelector('.dial-value'));typeObserver.observe(ui.querySelector('.dial-label'));largeType();
}
