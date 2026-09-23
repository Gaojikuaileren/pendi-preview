import {BOOKING_PREVIEW as config,addDay,berlinNow,previewSlots} from './booking-rules.js?v=ca1c440043db';
// Interaction sample only: production must revalidate with its own rules and clock.
export function mountBookingDials(root,{t}) {
 const form=root.querySelector('form'),fields=form.querySelector('.fields'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 root.classList.add('dial-booking');root.dataset.step='choose';
 root.querySelector('.scenario').hidden=new URLSearchParams(location.search).get('design')!=='1';
 root.querySelector(':scope > .proto-link')?.remove();root.querySelector('.scenario [data-action=overnight]')?.remove();
 root.querySelector('.demo-banner').remove();
 const steps=root.querySelector('.steps');
 steps.innerHTML=[['choose',t('Wählen','Choose')],['details',t('Kontakt','Contact')],['email',t('E-Mail','Email')]].map(([id,label],i)=>`<span data-booking-step="${id}"><span class="booking-step-number">0${i+1}</span> ${label}</span>`).join('');
 const updateStep=()=>steps.querySelectorAll('[data-booking-step]').forEach(n=>{if(n.dataset.bookingStep===(['result','review'].includes(root.dataset.step)?'email':root.dataset.step))n.setAttribute('aria-current','step');else n.removeAttribute('aria-current');});
 new MutationObserver(updateStep).observe(root,{attributes:true,attributeFilter:['data-step']});updateStep();
 fields.hidden=true;form.querySelector('.meta').hidden=true;
 const dateInput=form.elements.date,timeInput=form.elements.time,guestInput=form.elements.guests;
 guestInput.innerHTML=Array.from({length:config.maxGuests},(_,i)=>`<option>${i+1}</option>`).join('');
 const serviceInput=document.createElement('input');serviceInput.type='hidden';serviceInput.name='serviceDate';form.append(serviceInput);
 let first=berlinNow().date,selected={date:0,time:0,guests:1};
 const serviceDate=()=>addDay(first,selected.date),slots=()=>previewSlots(serviceDate()),selectedSlot=()=>slots()[selected.time];
 const options=id=>{const times=id==='time'?slots():null;return Array.from({length:12},(_,i)=>({index:i,enabled:id==='date'?i<config.advanceDays&&previewSlots(addDay(first,i)).some(s=>s.enabled):id==='time'?times[i].enabled:i<config.maxGuests}));};
 const enabled=id=>options(id).filter(o=>o.enabled).map(o=>o.index);
 const ui=document.createElement('div');ui.className='booking-dials';fields.before(ui);
 // Three stable terrain fields. Each ray interpolates monotonically between
 // a quiet central basin and a more articulated ridge: contours cannot cross.
 const terrain={date:.7,time:2.1,guests:4.2};
 const point=(id,radius,angle)=>{
  const a=angle*Math.PI/180,phase=terrain[id];
  const basin=47+2*Math.cos(a*2+phase)+1.5*Math.sin(a*3-phase);
  const ridge=65+6*Math.cos(a*2+phase)+4*Math.sin(a*3+phase)+2*Math.cos(a*5-phase)+Math.sin(a*7+phase);
  const slope=.85+.6*(.5+.5*Math.sin(a+phase))+.12*Math.sin(a*2-phase);
  const level=(radius-48)/22;
  const r=level<0?basin+radius-48:basin+(ridge-basin)*Math.pow(level,slope);
  return [(80+Math.sin(a)*r).toFixed(3),(80-Math.cos(a)*r).toFixed(3)];
 };
 const arc=(id,radius,from,to)=>Array.from({length:25},(_,i)=>point(id,radius,from+(to-from)*i/24).join(' '));
 // Fine intermediate contours and stronger index contours suggest a terrain map.
 const contour=id=>[0,.3,.66,1].map((level,n)=>'<path class="dial-contour" style="stroke-width:'+([1.05,.55,.75,.9][n])+';opacity:'+([.68,.46,.52,.58][n])+'" d="M'+Array.from({length:181},(_,i)=>point(id,48+22*level,i*2).join(' ')).join('L')+'Z"/>').join('');
 // The twelve logical sectors retain availability tint, without radial dividers.
 const segments=id=>Array.from({length:12},(_,i)=>{const a=i*30-15,b=a+30,outer=arc(id,70,a,b),inner=arc(id,48,b,a);return `<g data-segment="${i}"><path class="dial-sector" d="M${outer.join('L')}L${inner.join('L')}Z"/></g>`;}).join('');
 const configs=[['date',t('Datum','Date')],['time',t('Uhrzeit','Time')],['guests',t('Personen','Guests')]];
 ui.innerHTML=configs.map(([id,label])=>`<div class="dial-field" data-dial-field="${id}"><span class="dial-label" id="dial-label-${id}">${label}</span><div class="basin-dial" data-dial="${id}" role="slider" tabindex="0" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End" aria-labelledby="dial-label-${id}" aria-describedby="dial-help"><svg viewBox="0 0 160 160" aria-hidden="true">${segments(id)}${contour(id)}<g class="dial-needle"><circle cx="0" cy="0" r="2.5"/></g></svg><span class="dial-value" data-dial-value></span><span class="dial-unit" data-dial-unit></span></div></div>`).join('');
 const hint=document.createElement('p');hint.id='dial-help';hint.className='dial-help';ui.after(hint);
 const helpCopy=document.createElement('span');helpCopy.className='dial-help-copy';hint.append(helpCopy);
 const coach=document.createElement('span');coach.className='dial-coach';coach.setAttribute('role','status');coach.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 12a11 11 0 0 1 18-6m-5-1 6 1-1 6M12 27l-3-7q-1-3 2-3l3 3V10q0-3 3-3t3 3v7l4-1q3 0 3 3l-2 9"/></svg><span></span>';hint.append(coach);
 const summary=document.createElement('p');summary.className='dial-selection';summary.setAttribute('aria-live','polite');summary.setAttribute('aria-atomic','true');hint.after(summary);
 const rules=document.createElement('a');rules.className='booking-rules-link';rules.dataset.policy='reservation-rules';rules.href=(document.documentElement.lang==='de'?'/pendi-preview/rechtliches/':'/pendi-preview/en/legal/')+'#reservation-rules';rules.textContent=t('Reservierungsregeln','Booking information');root.querySelector('[data-result]').after(rules);
 form.querySelector('[type=submit]').textContent=t('Ihre Angaben','Your details');
 const dateLabel=date=>new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-GB':'de-DE',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
 const weekdayLabel=date=>new Intl.DateTimeFormat(document.documentElement.lang,{weekday:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
 function render(){
  const dates=enabled('date');if(!dates.includes(selected.date))selected.date=dates[0]??0;
  selected.guests=Math.min(selected.guests,config.maxGuests-1);
  if(guestInput.options.length!==config.maxGuests)guestInput.innerHTML=Array.from({length:config.maxGuests},(_,i)=>`<option>${i+1}</option>`).join('');
  const available=enabled('time');if(!available.includes(selected.time))selected.time=available[0]??0;
  const slot=selectedSlot();dateInput.min=first;dateInput.max=addDay(first,config.advanceDays-1+Math.floor(config.endMinutes/1440));dateInput.value=slot.date;timeInput.value=slot.time;timeInput.removeAttribute('min');timeInput.removeAttribute('max');timeInput.step=1800;guestInput.value=selected.guests+1;serviceInput.value=serviceDate();
  for(const[id]of configs){const dial=ui.querySelector(`[data-dial=${id}]`),values=enabled(id),index=selected[id],text=id==='date'?dateLabel(serviceDate()):id==='time'?slot.time:String(index+1);
   dial.setAttribute('aria-valuemin',(values[0]??0)+1);dial.setAttribute('aria-valuemax',(values.at(-1)??0)+1);dial.setAttribute('aria-valuenow',index+1);dial.setAttribute('aria-disabled',String(!values.length));dial.setAttribute('aria-valuetext',id==='date'?serviceDate():id==='time'?`${slot.date} ${slot.time}`:`${index+1} ${t('Personen','guests')}`);
   const valueNode=dial.querySelector('[data-dial-value]'),changed=valueNode.textContent&&valueNode.textContent!==text;valueNode.textContent=text;
   if(changed&&!reduced.matches){valueNode.getAnimations().forEach(a=>a.cancel());valueNode.animate([{opacity:.35,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});}
   dial.querySelector('[data-dial-unit]').textContent=id==='date'?(selected.date===0?t('heute','today'):selected.date===1?t('morgen','tomorrow'):weekdayLabel(serviceDate())):id==='time'?(slot.date!==serviceDate()?t('Folgetag','next day'):t('Uhr','Berlin')):t('Gäste','guests');
   const [needleX,needleY]=point(id,44,index*30);dial.style.setProperty('--needle-x',needleX+'px');dial.style.setProperty('--needle-y',needleY+'px');
   for(const option of options(id)){const g=dial.querySelector(`[data-segment="${option.index}"]`);g.dataset.disabled=String(!option.enabled);g.dataset.selected=String(option.index===index);g.querySelector('.dial-sector').style.fill=option.enabled?'':'#a5a29b55';}
  }
  helpCopy.textContent=t('Nichts Passendes dabei? Rufen Sie uns gerne an.','Can’t find what you need? Give us a call.');
  const summaryText=`${dateLabel(slot.date)} · ${slot.time}${slot.date!==serviceDate()?' '+t('(Folgetag)','(next day)'):''} · ${selected.guests+1} ${t('Personen','guests')}`;if(summary.textContent!==summaryText)summary.textContent=summaryText;
  dateInput.setCustomValidity('');timeInput.setCustomValidity('');
 }
 function set(id,next){if(!enabled(id).includes(next))return;selected[id]=next;render();}
 function step(id,direction){const list=enabled(id),index=list.indexOf(selected[id]);set(id,list[Math.max(0,Math.min(list.length-1,index+direction))]);}
 ui.querySelectorAll('[data-dial]').forEach(dial=>{const id=dial.dataset.dial;let drag=null;const pointers=new Set();
  dial.addEventListener('keydown',e=>{const d=['ArrowRight','ArrowUp'].includes(e.key)?1:['ArrowLeft','ArrowDown'].includes(e.key)?-1:e.key==='PageUp'?4:e.key==='PageDown'?-4:0;if(!d&&!['Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();interact();if(e.key==='Home'||e.key==='End')set(id,e.key==='Home'?enabled(id)[0]:enabled(id).at(-1));else step(id,d);});
  const angle=e=>{const r=dial.getBoundingClientRect();return Math.atan2(e.clientY-r.y-r.height/2,e.clientX-r.x-r.width/2)*180/Math.PI;};
  dial.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;pointers.add(e.pointerId);delete dial.dataset.dialGesture;if(pointers.size>1||!e.isPrimary){drag=null;return;}const r=dial.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,cx:r.x+r.width/2,cy:r.y+r.height/2,radius:r.width/2,carry:0,moved:false};dial.dataset.dialGesture='rotate';dial.setPointerCapture(e.pointerId);});
  dial.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;
   if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5)return;
   drag.moved=true;dial.classList.add('is-turning');
   const px=drag.lastX-drag.cx,py=drag.lastY-drag.cy,nx=e.clientX-drag.cx,ny=e.clientY-drag.cy,dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY;
   // Across the centre an angle is undefined: use a gentle directional drag,
   // then resume signed angular movement once the finger is off the centre.
   const nearCentre=Math.min(Math.hypot(px,py),Math.hypot(nx,ny))<drag.radius*.28;
   let delta=nearCentre?(Math.abs(dx)>=Math.abs(dy)?dx:-dy)/drag.radius*65:Math.atan2(px*ny-py*nx,px*nx+py*ny)*180/Math.PI;
   if(Math.abs(delta)>.2)interact();
   delta=Math.max(-40,Math.min(40,delta));drag.lastX=e.clientX;drag.lastY=e.clientY;drag.carry+=delta;
   const count=Math.trunc(drag.carry/30);if(count){step(id,count);drag.carry-=count*30;}
  });
  const end=e=>{if(drag&&e.type==='pointerup'&&!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8){const r=dial.getBoundingClientRect(),distance=Math.hypot(e.clientX-r.x-r.width/2,e.clientY-r.y-r.height/2);if(distance>=r.width*.29)set(id,Math.round((angle(e)+90+360)%360/30)%12);}pointers.delete(e.pointerId);drag=null;dial.classList.remove('is-turning');};
  dial.addEventListener('pointerup',end);dial.addEventListener('pointercancel',end);
 });
 // Recheck current clock and actual arrival; never silently change a submitted date.
 form.addEventListener('submit',()=>{const candidates=previewSlots(serviceInput.value),valid=candidates.some(s=>s.enabled&&s.date===dateInput.value&&s.time===timeInput.value);dateInput.setCustomValidity(serviceInput.value<berlinNow().date||serviceInput.value>addDay(berlinNow().date,config.advanceDays-1)?t('Bitte einen verfügbaren Tag wählen.','Choose an available day.'):'');timeInput.setCustomValidity(valid?'':t('Bitte eine verfügbare Uhrzeit wählen.','Choose an available time.'));},true);
 root.bookingSelectionAvailable=draft=>Number(draft.guests)>=1&&Number(draft.guests)<=config.maxGuests&&previewSlots(draft.serviceDate).some(slot=>slot.enabled&&slot.date===draft.date&&slot.time===draft.time);
 root.bookingAlternatives=draft=>previewSlots(draft.serviceDate).filter(s=>s.enabled&&`${s.date}T${s.time}`>`${draft.date}T${draft.time}`).slice(0,3);
 let lastClockKey='';
 const refreshClock=()=>{if(document.hidden||root.dataset.step!=='choose')return;const now=berlinNow(),[h,m,s]=now.time.split(':').map(Number),key=now.date+':'+Math.ceil((h*3600+m*60+s)/1800);if(key===lastClockKey)return;lastClockKey=key;if(now.date!==first){first=now.date;selected.date=0;}render();};
 document.addEventListener('visibilitychange',refreshClock);
 document.addEventListener('pendi:business-settings',()=>{lastClockKey='';refreshClock();});
 document.addEventListener('pendi:business-settings',()=>{lastClockKey='';refreshClock();});
 // One-second tick only while choosing this scene: expired half-hours grey immediately.
 setInterval(()=>{if(document.body.dataset.sceneActive==='reservation')refreshClock();},1000);
 new MutationObserver(()=>{if(document.body.dataset.sceneActive==='reservation')refreshClock();}).observe(document.body,{attributes:true,attributeFilter:['data-scene-active']});
 // Show on every entry; dismiss only after turning (or equivalent keyboard input).
 let coachActive=false;
 const eligible=()=>document.body.dataset.sceneActive==='reservation'&&root.dataset.step==='choose'&&!document.hidden;
 const interact=()=>{if(coachActive)hint.classList.remove('is-coaching');};
 const syncCoach=()=>{const active=eligible();if(active===coachActive)return;coachActive=active;hint.classList.toggle('is-coaching',active);if(active)coach.querySelector('span').textContent=matchMedia('(pointer:coarse)').matches?t('Finger auflegen und drehen','Touch and turn the dial'):t('Ziehen oder Pfeiltasten nutzen','Drag or use the arrow keys');};
 new MutationObserver(syncCoach).observe(document.body,{attributes:true,attributeFilter:['data-scene-active']});
 new MutationObserver(syncCoach).observe(root,{attributes:true,attributeFilter:['data-step']});
 const deck=document.querySelector('[data-deck]');if(deck)new MutationObserver(syncCoach).observe(deck,{attributes:true,attributeFilter:['data-transitioning']});
 document.addEventListener('visibilitychange',syncCoach);syncCoach();
 render();
 reduced.addEventListener('change',()=>{if(reduced.matches)ui.querySelectorAll('[data-dial-value]').forEach(n=>n.getAnimations().forEach(a=>a.cancel()));});
 document.addEventListener('pendi:language',()=>{render();rules.href=(document.documentElement.lang==='de'?'/pendi-preview/rechtliches/':'/pendi-preview/en/legal/')+'#reservation-rules';});
 const largeType=()=>root.classList.toggle('large-dials',parseFloat(getComputedStyle(ui.querySelector('.dial-value')).fontSize)>26||parseFloat(getComputedStyle(ui.querySelector('.dial-label')).fontSize)>20);
 const observer=new ResizeObserver(largeType);observer.observe(ui.querySelector('.dial-value'));observer.observe(ui.querySelector('.dial-label'));largeType();
}
