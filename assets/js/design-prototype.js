import {businessSettings,refreshBusinessSettings} from './business-config.js?v=2dc20be597d9';
import {mountBookingDials} from './booking-dials.js?v=2dc20be597d9';
import {t} from './language.js?v=2dc20be597d9';
import {mailQuotaReached} from './booking-mail-quota.js?v=2dc20be597d9';
import {bookingTransportEnabled,submitBooking} from './booking-client.js?v=2dc20be597d9';
// Stage 2 content on the approved Stage 1 flow. Local-only; no service or storage.
const isBooking = document.body.classList.contains('page-reservation');
const de = document.documentElement.lang === 'de';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button = (label, action, primary=false) => `<button type="button" data-action="${action}" class="${primary?'primary':''}">${label}</button>`;
const inlineBooking=document.querySelector('[data-inline-booking]');
if(inlineBooking)mountBooking(inlineBooking);
if (isBooking) {
  const root = document.createElement('section'); root.className='prototype';
  document.querySelector('.detail-page > .notice').after(root);
  document.querySelector('.detail-page').classList.add('prototype-ready');
  mountBooking(root);
}

function mountBooking(root) {
  const embedded=root.hasAttribute('data-inline-booking');
  const designMode=new URLSearchParams(location.search).get('design')==='1';
  root.innerHTML=`<div class="demo-banner"><strong>${t('Nur eine Simulation','Simulation only')}</strong><br>${t('Bitte keine persönlichen Daten eingeben. Nichts wird gespeichert oder versendet. Alle Zeiten und Regeln sind Beispiele.','Do not enter personal details. Nothing is saved or sent. All times and rules are examples.')}</div>
  <p class="steps">01 ${t('Besuch','Visit')} → 02 ${t('Prüfen','Review')} → 03 ${t('Ergebnis','Result')}</p>
  <form data-booking novalidate data-content-id="BOOK-FIELDS"><div data-errors class="error-summary" tabindex="-1" role="alert" hidden></div><div class="fields">
    <label for="booking-date">${t('Datum · Beispiel','Date · example')}<input id="booking-date" name="date" type="date" required value="2026-10-16" aria-describedby="date-help date-error"><span id="date-help" class="field-help">${t('Wählen Sie den Tag Ihrer Ankunft. Das Beispieldatum ist keine Aussage über Öffnungszeiten oder buchbare Tage.','Choose the day you would arrive. The sample date does not indicate opening days or availability.')}</span><span id="date-error" class="field-error visually-hidden" hidden></span></label>
    <label for="booking-time">${t('Ankunft','Arrival')}<input id="booking-time" name="time" type="time" required value="19:00" aria-describedby="time-help time-error"><span id="time-help" class="field-help">${t('Alle angezeigten Zeiten beziehen sich auf Europe/Berlin. Bei einem Aufenthalt über Mitternacht steht das Abreisedatum in der Übersicht.','Times are shown for Europe/Berlin. If a visit crosses midnight, the summary includes the departure date.')}</span><span id="time-error" class="field-error visually-hidden" hidden></span></label>
    <label class="full" for="booking-guests">${t('Personen · Beispielauswahl','Guests · example range')}<select id="booking-guests" name="guests" aria-describedby="guests-help"><option>2</option><option>3</option><option>4</option><option>6</option></select><span id="guests-help" class="field-help">${t('Zählen Sie alle Personen Ihrer Gruppe mit. Diese Auswahl ist ein Muster, keine bestätigte Gruppengröße oder Kapazitätsgrenze.','Include everyone in your party. These options are samples, not confirmed group-size or capacity limits.')}</span></label>
  </div><p class="meta">${t('Beispiel: 90 Min. Aufenthalt + 15 Min. Puffer. Keine bestätigten Betriebsregeln.','Example: 90-minute stay + 15-minute buffer. Not confirmed business rules.')} Europe/Berlin.</p>
  <div class="actions"><button type="submit" class="primary">${t('Weiter zur Prüfung · Demo','Review visit · demo')}</button></div></form>
  <div data-result class="result" tabindex="-1" aria-live="polite" hidden></div>
  <details class="scenario"><summary>${t('Designprüfung: Ergebnis auswählen','Design review: choose an outcome')}</summary><label>${t('Simuliertes Ergebnis','Simulated outcome')}<select data-scenario>
  ${[['confirmed','Bestätigt','Confirmed'],['full','Voll · andere Zeiten','Full · other times'],['none','Keine Alternative','No alternative'],['fault','Technischer Fehler','Technical failure'],['unknown','Ergebnis unbekannt','Result unknown'],['mail','Bestätigt · E-Mail fehlgeschlagen','Confirmed · email failed'],['paused','Buchungen pausiert','Bookings paused']].map(([v,a,b])=>`<option value="${v}">${t(a,b)}</option>`).join('')}</select></label><p class="meta">${t('Dies steuert nur die Demo, keine Live-Verfügbarkeit.','This controls the demo, not live availability.')}</p>${button(t('Textmuster über Mitternacht laden','Load an overnight example'),'overnight')}
  <div class="review-fields" data-content-id="BOOK-ERROR-SAMPLES"><strong>${t('Weitere Fehlermeldungen · Textmuster','More error messages · copy samples')}</strong><p>${t('Bitte geben Sie einen Namen an, unter dem wir Ihre Reservierung finden können.','Please enter a name we can use to find your reservation.')}</p><p>${t('Bitte prüfen Sie die E-Mail-Adresse. Sie muss vollständig sein, zum Beispiel name@example.invalid. In dieser Demo werden keine Kontaktdaten erfasst.','Please check the email address is complete, for example name@example.invalid. This demo does not collect contact details.')}</p><p>${t('Diese Gruppengröße kann nicht online angefragt werden. Bitte kontaktieren Sie das Team, statt mehrere getrennte Reservierungen anzulegen. Beispieltext; die tatsächliche Grenze ist noch offen.','This party size cannot be requested online. Please contact the team rather than making separate bookings. Sample wording; the actual limit is still undecided.')}</p></div></details>
  `;
  const form=root.querySelector('form'), result=root.querySelector('[data-result]');
  if(embedded)mountBookingDials(root,{t});
  let draft, selectedTime, selectedDate, request=0, pending=false;
  const contactForm=document.createElement('form');
  contactForm.dataset.bookingContact='';contactForm.noValidate=true;contactForm.hidden=true;
  if(embedded){contactForm.innerHTML=`<h3>${t('Wie dürfen wir Sie nennen?','What should we call you?')}</h3><label for="booking-name">${t('Name / Anrede','Your name')}<input id="booking-name" name="contactName" autocomplete="off" maxlength="80" required placeholder="Alex" aria-describedby="contact-name-error"><span id="contact-name-error" class="field-error visually-hidden" hidden></span></label><label for="booking-email">${t('E-Mail','Email')}<input id="booking-email" name="contactEmail" type="email" inputmode="email" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="254" required placeholder="name@example.invalid" aria-describedby="contact-email-help contact-email-error"><span id="contact-email-help" class="field-help">${t('Zur Bestätigung Ihrer Reservierung.','To confirm your reservation request.')}</span><span id="contact-email-error" class="field-error visually-hidden" hidden></span></label><div class="actions"><button type="submit" class="primary">${t('Link anfordern','Request confirmation link')}</button>${button(t('Zur Auswahl','Back to selection'),'edit')}</div>`;form.after(contactForm);}
  const quotaView=()=>{
    form.hidden=true;contactForm.hidden=true;result.dataset.contentId='BOOK-MAIL-LIMIT';
    show(t('Bitte reservieren Sie telefonisch.','Please book by phone.'),t('Online-Anfragen sind vorübergehend nicht möglich. Rufen Sie uns gerne an, um Ihren Besuch zu reservieren. Ihre Anfrage wurde nicht gesendet.','Online requests are temporarily unavailable. Please call us to arrange your visit. Your request has not been sent.'),edit()+contact());
  };
  const checkQuota=async()=>{
    pending=true;const controls=[...root.querySelectorAll('button[type=submit]')];const disabled=controls.map(control=>control.disabled);controls.forEach(control=>control.disabled=true);root.setAttribute('aria-busy','true');
    try{return await mailQuotaReached();}finally{pending=false;controls.forEach((control,index)=>control.disabled=disabled[index]);root.removeAttribute('aria-busy');}
  };
  const businessAllowed=async()=>{
    pending=true;let ready=false;try{ready=await refreshBusinessSettings();}finally{pending=false;}
    if(ready&&!businessSettings?.booking.paused&&root.bookingSelectionAvailable?.(draft)!==false)return true;
    form.hidden=true;contactForm.hidden=true;result.hidden=false;root.dataset.step='result';result.dataset.contentId='BOOK-RULES-UNAVAILABLE';
    result.innerHTML=`<h2>${t('Bitte wählen Sie einen anderen Termin.','Please choose another time.')}</h2><p>${t('Online ist dieser Termin nicht verfügbar. Rufen Sie uns gerne an.','This time is not available online. Please give us a call.')}</p><div class="actions">${button(t('Angaben ändern','Edit details'),'edit')}<a href="#contact">${t('Kontakt','Contact')}</a></div>`;return false;
  };
  const details=async()=>{if(pending)return;if(!await businessAllowed())return;if(await checkQuota()===true){quotaView();return;}form.hidden=true;result.hidden=true;contactForm.hidden=false;root.dataset.step='details';};
  if(embedded)contactForm.addEventListener('submit',async e=>{e.preventDefault();if(pending)return;const name=contactForm.elements.contactName,email=contactForm.elements.contactEmail;name.value=name.value.trim();email.value=email.value.trim();let invalid=null;for(const [field,errorId,message]of [[name,'contact-name-error',t('Bitte geben Sie eine Anrede oder einen Namen ein.','Enter a name or how you would like to be addressed.')],[email,'contact-email-error',t('Bitte geben Sie eine vollständige E-Mail-Adresse ein.','Enter a complete email address.')]]){const valid=field.validity.valid&&!!field.value;field.setAttribute('aria-invalid',String(!valid));const error=contactForm.querySelector('#'+errorId);error.hidden=valid;error.textContent=valid?'':message;if(!valid){shakeInvalid(field);if(!invalid)invalid=field;}}if(invalid){invalid.focus();return;}draft.contactName=name.value;draft.contactEmail=email.value;if(!await businessAllowed())return;if(await checkQuota()===true){quotaView();return;}
    if(bookingTransportEnabled()){
      pending=true;const submit=contactForm.querySelector('[type=submit]');submit.disabled=true;contactForm.setAttribute('aria-busy','true');
      try{
        const reply=await submitBooking(draft);
        if(reply.status!=='pending'){
          contactForm.hidden=true;root.dataset.step='result';
          show(reply.status==='confirmed'?t('Ihre Reservierung ist eingetragen.','Your reservation is registered.'):t('Diese Anfrage ist abgeschlossen.','This request has ended.'),esc(reply.reference),edit()+contact());return;
        }
      }catch(error){
        const field=error.message==='invalid_name'?name:error.message==='invalid_email'?email:null;
        if(field){field.setAttribute('aria-invalid','true');shakeInvalid(field);field.focus();return;}
        contactForm.hidden=true;root.dataset.step='result';
        show(t('Anfrage noch nicht bestätigt','Request not yet confirmed'),t('Ihre Angaben bleiben erhalten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns. Es sind noch keine Plätze reserviert.','Your details are kept. Please retry or contact us. No seats are reserved yet.'),button(t('Erneut versuchen','Try again'),'contact-edit')+edit()+contact());return;
      }finally{pending=false;submit.disabled=false;contactForm.removeAttribute('aria-busy');}
    }
    contactForm.hidden=true;awaitEmail();});
  const fieldMotions=new WeakMap();
  function shakeInvalid(field){
    fieldMotions.get(field)?.cancel();
    if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    const motion=field.animate([{transform:'translateX(0)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(-3px)'},{transform:'translateX(2px)'},{transform:'translateX(0)'}],{duration:360,easing:'ease-in-out'});
    fieldMotions.set(field,motion);
  }
  if(embedded)contactForm.addEventListener('input',e=>{
    const field=e.target;if(!field.matches('input[aria-invalid=true]')||!field.value.trim()||!field.validity.valid)return;
    field.setAttribute('aria-invalid','false');
    const error=contactForm.querySelector(field.name==='contactName'?'#contact-name-error':'#contact-email-error');
    error.hidden=true;error.textContent='';
  });
  // Ordinary preview remains visual. Isolated integration requests use the same
  // layout and keep their idempotency key on retry after a lost response.
  const awaitEmail=()=>{
    root.dataset.step='email';result.dataset.contentId='BOOK-AWAITING-EMAIL';result.hidden=false;
    if(document.body.dataset.clientPreview==='true'){
      result.innerHTML=`<h2>${t('Vorschau abgeschlossen.','Preview complete.')}</h2><p class="booking-email-copy">${t('Dies ist eine Website-Vorschau. Ihre Anfrage wurde nicht gespeichert und keine E-Mail versendet.','This is a website preview. Your request was not saved and no email was sent.')}</p><p class="booking-email-capacity">${t('Online-Reservierungen werden erst nach der Freigabe geöffnet.','Online reservations will open after the site has been approved.')}</p><div class="actions">${button(t('Angaben ändern','Edit details'),'contact-edit')+edit()}</div>`;
      result.focus({preventScroll:true});return;
    }
    result.innerHTML=`<h2>${t('Bitte prüfen Sie Ihr Postfach.','Please check your inbox.')}</h2><p class="booking-email-address">${esc(draft.contactEmail)}</p><p class="booking-email-copy">${t('Bestätigen Sie Ihre Anfrage über den Link in der E-Mail. Ohne Ihre Bestätigung wird die Reservierung nicht eingetragen.','Confirm your request using the link in the email. Your reservation will not be registered without your confirmation.')}</p><p class="booking-email-capacity">${t('Bis dahin halten wir keine Plätze frei. Bei Ihrer Bestätigung prüfen wir erneut; Ihr Wunschtermin kann inzwischen ausgebucht sein.','We do not hold seats while you wait. We check availability when you confirm; your preferred time may have become fully booked.')}</p><div class="actions">${button(t('E-Mail ändern','Change email'),'contact-edit')+edit()+(designMode?button(t('Design: Ergebnis nach E-Mail-Bestätigung','Design: outcome after email confirmation'),'preview-email-confirm'):'')}</div>`;
    result.focus({preventScroll:true});
  };
  // Calendar arithmetic only for a copy fixture; not a timezone/capacity engine.
  const endAt=minutes=>{const value=new Date(`${selectedDate||draft.date}T${selectedTime||draft.time}:00Z`);value.setUTCMinutes(value.getUTCMinutes()+minutes);return value.toISOString().slice(0,16).replace('T',' · ');};
  const summary=()=>embedded?`<div class="summary compact-summary"><strong>${esc(selectedDate || draft.date)} · ${esc(selectedTime || draft.time)} · ${esc(draft.guests)} ${t('Personen','guests')}</strong><p>${t('Abreise','Departure')}: ${esc(endAt(90))}</p></div>`:`<div class="summary" data-content-id="BOOK-SUMMARY"><p>${esc(selectedDate || draft.date)} · ${esc(selectedTime || draft.time)} · ${esc(draft.guests)} ${t('Personen','guests')}</p><p>${t('Vorgesehene Abreise','Planned departure')}: ${esc(endAt(90))}<br>${t('Belegung mit Puffer bis','Occupancy including buffer until')}: ${esc(endAt(105))}</p><p>${t('90 Min. Aufenthalt + 15 Min. Puffer · nur Beispiel. Keine Zusage zu Öffnung, Sitzplatzanordnung oder Verfügbarkeit.','90-minute stay + 15-minute buffer · example only. No promise of opening hours, seating arrangements or availability.')} Europe/Berlin.</p></div>`;
  const show=(heading,body,actions='')=>{
    if(embedded){
      const state=result.dataset.contentId?.replace('BOOK-STATE-','').toLowerCase();
      const compact={
        confirmed:t('Nur Vorschau: Es wurde keine Reservierung gespeichert und keine E-Mail versendet.','Preview only: no reservation was saved and no email was sent.'),
        mail:t('Simuliert: Die Reservierung bliebe gültig, auch wenn die E-Mail nicht ankommt. Bitte nicht erneut buchen.','Simulated: the booking would remain valid even if its email failed. Please do not book again.'),
        full:t('Für den ganzen Aufenthalt fehlen Plätze. Diese Beispielzeiten halten keine Plätze frei und werden nach Ihrer Wahl erneut geprüft.','There is not enough room for the whole visit. These sample alternatives hold no seats and must be checked again after selection.'),
        none:t('Keine passende Alternative im gewählten Tag gefunden. Wählen Sie einen anderen Termin oder kontaktieren Sie uns. Keine automatische Warteliste.','No suitable alternative on the selected date. Choose another date or contact us. You have not joined a waiting list.'),
        fault:t('Diese Demo-Anfrage wurde noch nicht übermittelt. Ihre Auswahl bleibt erhalten. Versuchen Sie es erneut.','This demo request has not been submitted. Your selection is kept. Please try again.'),
        unknown:t('Ob die Anfrage gespeichert wurde, ist unklar. Bitte nicht erneut buchen. Prüfen Sie dieselbe Anfrage oder kontaktieren Sie uns mit der Referenz.','It is not yet known whether the request was saved. Do not rebook. Check the same request or contact us with its reference.'),
        paused:t('Neue Online-Anfragen sind pausiert. Das sagt nichts über freie Plätze vor Ort aus. Bestehende Buchungen bleiben gültig.','New online requests are paused. This does not indicate space at the venue. Existing bookings remain valid.')
      };
      if(compact[state]){body=compact[state]+(state==='unknown'?'<p class="meta">Demo-ID: UI-'+request+'</p>':'');if(['none','unknown','paused'].includes(state))actions+=contact();if(state==='full'&&!actions.includes('choose-'))body=t('Für diesen Tag gibt es in der Vorschau keine spätere Alternative. Bitte wählen Sie einen anderen Tag.','This preview has no later alternative on that date. Please choose another day.');}
      root.dataset.step=result.dataset.contentId==='BOOK-REVIEW'?'review':'result';
    }
    result.hidden=false;result.innerHTML=`${embedded&&!designMode?'':`<p class="meta">${t('SIMULIERT · KEINE ECHTE RESERVIERUNG','SIMULATED · NO REAL RESERVATION')}</p>`}<h2>${heading}</h2>${summary()}<div class="result-copy">${body}</div><div class="actions">${actions}</div>`;result.focus();
  };
  const edit=()=>button(t('Angaben ändern','Edit details'),'edit');
  const contact=()=>embedded?`<a class="proto-link" href="#contact">${t('Kontakt','Contact')}</a>`:`<p class="meta">${t('Telefonberatung: Nummer noch nicht freigegeben.','Phone assistance: number awaiting approval.')}</p><a class="proto-link" href="${embedded?'#contact':de?'/pendi-preview/#contact':'/pendi-preview/en/#contact'}">${t('Kontaktinformationen','Contact information')}</a>`;
  const detailedReview=()=>{result.dataset.contentId='BOOK-REVIEW';show(t('Ihr Besuch im Überblick','Review your visit'),`<p>${t('Prüfen Sie Ankunft, Abreise und Personenzahl. Erst eine dauerhaft gespeicherte Reservierung würde Plätze bestätigen. Ein Versandhinweis allein ist keine Buchungsbestätigung.','Check arrival, departure and party size. Seats would only be confirmed once the reservation is stored. An email sending notice alone does not confirm a booking.')}</p><div class="review-fields"><p><strong>${t('Name für die Reservierung','Booking name')}:</strong> Demo Guest</p><p><strong>${t('E-Mail für Rückmeldungen','Email for booking updates')}:</strong> guest@example.invalid</p><p class="meta">${t('Nur Beispieldaten, nicht bearbeitbar. Pflichtfelder, Telefonangabe, Datenschutzhinweise und Änderungs- oder Stornierungsregeln sind noch abzustimmen. Hier keine echten Kontaktdaten eingeben.','Read-only sample details. Required fields, phone details, privacy wording and change or cancellation rules are still to be agreed. Do not enter real contact details here.')}</p></div>`,button(t('Verbindlich anfragen · nur Demo','Submit request · demo only'),'submit',true)+edit());};
  const review=()=>{if(!embedded){detailedReview();return;}result.dataset.contentId='BOOK-REVIEW';show(t('Alles richtig?','Everything right?'),t('Prüfen Sie Datum, Uhrzeit und Personenzahl.','Check the date, time and party size.')+`<p class="booking-contact-summary">${esc(draft.contactName)}<br>${esc(draft.contactEmail)}</p>`,button(t('Reservierung anfragen','Request reservation'),'submit',true)+button(t('Kontaktdaten ändern','Edit contact details'),'contact-edit')+edit());};
  form.addEventListener('submit',e=>{
    e.preventDefault();if(pending)return;if(embedded&&(businessSettings?.booking.paused||root.bookingSelectionAvailable?.(Object.fromEntries(new FormData(form)))===false)){draft=Object.fromEntries(new FormData(form));businessAllowed();return;}const messages=[];
    for(const name of ['date','time']) {const field=form.elements[name],error=root.querySelector(`#${name}-error`);const invalid=!field.value||!field.validity.valid;field.setAttribute('aria-invalid',String(invalid));error.hidden=!invalid;error.textContent=invalid?(name==='date'?t('Bitte wählen Sie ein vollständiges, gültiges Ankunftsdatum. Ihre anderen Angaben bleiben erhalten.','Choose a complete, valid arrival date. Your other details are kept.'):t('Bitte wählen Sie eine gültige Ankunftszeit, damit wir den gesamten Aufenthalt anzeigen können.','Choose a valid arrival time so the full visit can be shown.')):'';if(invalid)messages.push(error.textContent);}
    if(embedded)for(const name of ['date','time']){const dial=root.querySelector(`[data-dial=${name}]`);dial.setAttribute('aria-invalid',form.elements[name].getAttribute('aria-invalid'));dial.setAttribute('aria-describedby',messages.length?'dial-help booking-errors':'dial-help');}
    const errors=root.querySelector('[data-errors]');errors.id='booking-errors';errors.hidden=!messages.length;
    if(messages.length){errors.innerHTML=`<strong>${t('Bitte prüfen Sie Ihre Angaben','Please check your details')}</strong><ul>${messages.map(m=>`<li>${esc(m)}</li>`).join('')}</ul>`;errors.focus();return;}
    draft=Object.fromEntries(new FormData(form));selectedTime=null;selectedDate=null;if(embedded)details();else{form.hidden=true;review();}
  });
  const outcome=()=>{
    const scenario=root.querySelector('[data-scenario]').value;
    result.dataset.contentId='BOOK-STATE-'+scenario.toUpperCase();
    pending=false;
    if(scenario==='full') {
      const alternatives=embedded?root.bookingAlternatives(draft):(draft.time==='23:30'?['22:30','23:00','23:45']:['18:30','19:30','20:00']).map(time=>({date:draft.date,time}));
      show(t('Diese Zeit ist voll','This time is full'),t('Für den gesamten angefragten Aufenthalt gibt es in diesem Beispiel nicht genügend Plätze. Diese Alternativen behalten Personenzahl und Dauer bei. Sie sind nicht vorgemerkt und können bis zur erneuten Abgabe vergriffen sein.','In this example, there is not enough room for the whole requested visit. These alternatives keep the same party size and duration. No seats are held, and an option may become unavailable before you submit it.'),alternatives.map(v=>button((v.date!==draft.date?v.date+' · ':'')+v.time,'choose-'+v.date+'T'+v.time)).join('')+edit()+contact());
    } else if(scenario==='none') show(t('Keine Alternative gefunden','No alternative found'),t('Für die gewählte Personenzahl und Aufenthaltsdauer wurde im Beispiel keine Alternative gefunden. Geprüfter Bereich: das angegebene Ankunftsdatum. Wählen Sie ein anderes Datum oder fragen Sie beim Team nach; Sie stehen nicht automatisch auf einer Warteliste.','No alternative was found in this example for your party size and visit length. Search range: the selected arrival date. Choose another date or ask the team for help. You have not been added to a waiting list.')+contact(),edit());
    else if(scenario==='fault') show(t('Prüfung nicht verfügbar','Check unavailable'),t('Die Prüfung ist momentan nicht erreichbar. In diesem Beispielszenario wurde die Anfrage noch nicht übermittelt. Das bedeutet nicht, dass alle Plätze belegt sind. Ihre Angaben bleiben erhalten; versuchen Sie es später erneut oder kontaktieren Sie das Team.','The check is currently unavailable. In this example, your request has not yet been submitted. This does not mean the venue is full. Your details are kept; try again later or contact the team.'),button(t('Erneut versuchen · Demo','Try again · demo'),'submit',true)+edit());
    else if(scenario==='unknown') show(t('Ergebnis noch unklar','Result not yet known'),t('Wir haben keine eindeutige Antwort auf diese Anfrage erhalten. Es ist noch unklar, ob sie gespeichert wurde. Bitte starten Sie keine zweite Buchung. Prüfen Sie zuerst den Status dieser Anfrage oder klären Sie das Ergebnis mit dem Team unter Angabe der Referenz.','We have not received a clear response to this request, so it is not yet known whether it was saved. Please do not make a second booking. Check this request’s status first, or contact the team with the reference to clarify the outcome.')+`<p class="meta">Demo-ID: UI-${request}</p>`+contact(),button(t('Status derselben Anfrage prüfen · Demo','Check same request · demo'),'check',true));
    else if(scenario==='paused') show(t('Online-Buchung pausiert','Online booking paused'),t('Neue Online-Anfragen sind in diesem Beispiel vorübergehend pausiert. Das ist keine Aussage darüber, ob im Lokal Plätze frei sind. Bestehende Reservierungen bleiben erhalten. Ein Zeitpunkt für die Wiederaufnahme wird hier nicht zugesagt.','New online requests are temporarily paused in this example. This does not tell you whether there is space at the venue. Existing reservations remain valid. No reopening time is promised here.')+contact(),edit());
    else show(t('So sähe eine Bestätigung aus','This is a confirmation preview'),t('Bestätigungsmuster: Ihr Besuch ist für die oben genannte Personenzahl und den vollständigen Zeitraum bestätigt. Diese Aussage dürfte erst nach dauerhafter Speicherung erscheinen. Hier ist sie ausschließlich ein Textmuster: Es wurde keine echte Reservierung angelegt.','Confirmation sample: your visit is confirmed for the party size and full period shown above. This wording may only be used after the reservation has been stored. Here it is draft copy only: no real booking has been made.')+`<p>${scenario==='mail'?t('Benachrichtigung fehlgeschlagen (simuliert): Die gespeicherte Reservierung bliebe gültig, auch wenn die Bestätigungsmail noch nicht zugestellt wurde. Bewahren Sie die Referenz auf und buchen Sie nicht erneut. Im echten System wird der Versand getrennt bearbeitet.','Notification failed (simulated): a stored reservation would remain valid even if its email had not arrived. Keep the reference and do not book again. Delivery is handled separately in the real system.'):t('E-Mail: Versandstatus separat anzeigen (simuliert). Es wurde nichts versendet.','Email: delivery status shown separately (simulated). Nothing was sent.')}</p>`,button(t('Neue Demo starten','Start a new demo'),'edit'));
  };
  root.addEventListener('click',e=>{
    const action=e.target.closest('[data-action]')?.dataset.action;if(!action||pending)return;
    if(action==='preview-email-confirm'&&embedded&&designMode){outcome();}
    if(action==='contact-edit'&&embedded){details();}
    if(action==='edit'){contactForm.hidden=true;result.hidden=true;form.hidden=false;root.dataset.step='choose';(embedded?root.querySelector('[data-dial=date]'):form.elements.date).focus();}
    if(action==='overnight'){result.hidden=true;form.hidden=false;form.elements.date.value='2026-10-16';form.elements.time.value='23:30';form.elements.guests.value='4';form.elements.date.focus();}
    if(action?.startsWith('choose-')){[selectedDate,selectedTime]=action.slice(7).split('T');review();}
    if(action==='check'){show(t('Noch keine verlässliche Antwort','Still no reliable response'),t('Dieselbe Demo-Anfrage bleibt offen. Nicht erneut buchen; telefonisch klären. In dieser Demo erfolgt keine Serverabfrage.','The same demo request remains unresolved. Do not rebook; clarify by phone. This demo does not query a server.')+`<p class="meta">Demo-ID: UI-${request}</p>`+contact(),button(t('Status erneut prüfen · Demo','Check status again · demo'),'check'));}
    if(action==='submit'&&embedded&&!designMode){result.dataset.contentId='BOOK-UNAVAILABLE';show(t('Anfrage nicht gesendet','Request not sent'),t('Die Online-Reservierung ist noch nicht geöffnet. Es wurde nichts gespeichert oder versendet. Bitte kontaktieren Sie uns direkt.','Online reservations are not open yet. Nothing was saved or sent. Please contact us directly.'),edit()+contact());return;}
    if(action==='submit'){pending=true;request++;result.dataset.contentId='BOOK-PENDING';show(t('Wird geprüft …','Checking …'),t('Simulierter Übergang. Keine Verbindung zu einem Buchungssystem.','Simulated transition. No connection to a booking system.'));setTimeout(outcome,450);}
  });
}
