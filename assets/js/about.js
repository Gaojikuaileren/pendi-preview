import {cardVisual} from './card-media.js?v=1fdeb4acf428';
import {mountAboutReading} from './about-reading.js?v=1fdeb4acf428';
import './ui-icons.js?v=1fdeb4acf428';
const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
const iso=date=>date.toISOString().slice(0,10);
const civil=value=>new Date(value+'T12:00:00Z');
export function mountAbout(){
 const root=document.querySelector('[data-about-root]');if(!root)return;
 let config,text,events,active=0,month,opener,today,modalMotion=null,closing=false;
 const locale=()=>document.documentElement.lang==='en'?'en-GB':'de-DE';
 const paused=()=>document.querySelector('[data-motion-toggle]')?.classList.contains('is-paused');
 const dayLabel=value=>new Intl.DateTimeFormat(locale(),{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(civil(value));
 const range=event=>dayLabel(event.start)+' — '+dayLabel(event.end);
 const notify=()=>document.dispatchEvent(new Event('pendi:about'));
 const button=(label,work,cls='about-button')=>{const node=make('button',cls,label);node.type='button';node.addEventListener('click',work);return node;};
 const mail=(label,address,subject,cls='about-link')=>{const link=make('a',cls,label);link.href='mailto:'+address+'?subject='+encodeURIComponent(subject);return link;};
 const artwork=(event,cls)=>{
  if(!event.image&&!event.previewImage)return null;
  const img=make('img',cls);img.src=event.image?'/pendi-preview/assets/images/exhibitions/'+event.image+'.png':event.previewImage;img.alt=event.copy.imageAlt;img.decoding='async';img.loading='lazy';return img;
 };
 const tabs=make('div','about-tabs');tabs.setAttribute('role','tablist');
 const floating=make('div','about-floating about-artwork');
 const floats=[floating,...['collab','jobs'].map(key=>{const node=make('div','about-floating about-card');node.dataset.aboutCard=key;return node;})];root.closest('[data-scene]').prepend(...floats);
 // Available panels share a grid cell: the reading envelope and wave stay still.
 const stage=make('div','about-panels');
 const panels=[0,1,2].map(i=>{const p=make('section','about-panel');p.id='about-panel-'+i;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby','about-tab-'+i);p.tabIndex=0;stage.append(p);return p;});
 const tabButtons=panels.map((p,i)=>{const b=button('',()=>select(i),'about-tab');b.id='about-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',p.id);tabs.append(b);return b;});
 const reading=mountAboutReading(root,stage,panels,tabs,()=>document.documentElement.lang);
 function select(i){
  if(tabButtons[i].hidden)i=tabButtons.findIndex(b=>!b.hidden);
  active=i;
  reading.reset(i);
  root.classList.toggle('motion-paused',paused());
  panels.forEach((p,n)=>{p.classList.toggle('is-active',n===i);p.inert=n!==i;p.setAttribute('aria-hidden',String(n!==i));});
  tabButtons.forEach((b,n)=>{b.setAttribute('aria-selected',String(n===i));b.tabIndex=n===i?0:-1;});
  floats.forEach((node,n)=>{node.classList.toggle('is-active',i===n);node.classList.toggle('motion-paused',paused());node.inert=i!==n;node.setAttribute('aria-hidden',String(i!==n));});
 }
 tabs.addEventListener('keydown',e=>{
  const visible=tabButtons.filter(b=>!b.hidden);let i=visible.indexOf(document.activeElement);if(i<0||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();i=e.key==='Home'?0:e.key==='End'?visible.length-1:(i+(e.key==='ArrowRight'?1:visible.length-1))%visible.length;select(tabButtons.indexOf(visible[i]));visible[i].focus({preventScroll:true});
 });
 const dialog=make('dialog','exhibition-dialog');dialog.id='exhibition-calendar';dialog.setAttribute('aria-labelledby','exhibition-dialog-title');document.body.append(dialog);
 const heading=make('div','exhibition-dialog-heading'),title=make('h2');title.id='exhibition-dialog-title';
 const close=button('',requestClose,'exhibition-close');close.append(window.pendiUIIcon('close'));heading.append(title,close);const body=make('div','exhibition-dialog-body');dialog.append(heading,body);
 const motions=new Map();
 function fadeSwap(host,content,direction=1){
  motions.get(host)?.();const old=host.firstElementChild;
  if(!old||paused()){host.replaceChildren(content);return;}
  old.classList.add('exhibition-leaving');old.inert=true;old.setAttribute('aria-hidden','true');host.append(content);
  const a=old.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX('+(-direction*8)+'px)'}],{duration:180,easing:'ease-out',fill:'forwards'});
  const b=content.animate([{opacity:0,transform:'translateX('+(direction*8)+'px)'},{opacity:1,transform:'translateX(0)'}],{duration:320,easing:'cubic-bezier(.2,.7,.2,1)'});
  let done=false;const clean=()=>{if(done)return;done=true;a.cancel();b.cancel();old.remove();if(motions.get(host)===clean)motions.delete(host);};motions.set(host,clean);b.finished.then(clean,clean);
 }
 function requestClose(){
  if(!dialog.open||closing)return;closing=true;const visual=getComputedStyle(dialog),from={opacity:visual.opacity,transform:visual.transform};modalMotion?.cancel();dialog.dataset.closing='true';
  if(paused()){dialog.close();return;}
  modalMotion=dialog.animate([from,{opacity:0,transform:'translateY(22px)'}],{duration:220,easing:'ease-in',fill:'forwards'});
  modalMotion.finished.then(()=>dialog.close(),()=>{});
 }
 dialog.addEventListener('cancel',event=>{event.preventDefault();requestClose();});
 dialog.addEventListener('close',()=>{closing=false;delete dialog.dataset.closing;modalMotion?.cancel();modalMotion=null;for(const clean of [...motions.values()])clean();if(opener?.isConnected)opener.focus({preventScroll:true});});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)requestClose();}});
 function open(source){
  if(dialog.open)return;opener=source;month=today.slice(0,7);renderDialog();dialog.classList.toggle('motion-paused',paused());dialog.showModal();close.focus({preventScroll:true});
  if(!paused())modalMotion=dialog.animate([{opacity:0,transform:'translateY(32px)'},{opacity:1,transform:'translateY(0)'}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});
 }
 function calendarView(){
  const view=make('div','exhibition-calendar-view');view.append(make('p','exhibition-calendar-note',text.calendarNote));
  const tools=make('div','exhibition-month-tools'),label=make('h3');label.id='exhibition-month';label.setAttribute('aria-live','polite');
  const frame=make('div','exhibition-month-frame');
  function move(delta){const date=civil(month+'-01');date.setUTCMonth(date.getUTCMonth()+delta);const next=iso(date);if(next<'2000-01-01'||next>'2099-12-31')return;month=next.slice(0,7);paint(delta);}
  const prev=button('',()=>move(-1)),next=button('',()=>move(1));prev.append(window.pendiUIIcon('back'));next.append(window.pendiUIIcon('forward'));prev.dataset.prev='';next.dataset.next='';prev.setAttribute('aria-label',text.previous);next.setAttribute('aria-label',text.next);tools.append(prev,label,next);view.append(tools,frame);
  const footer=make('div','exhibition-calendar-footer');footer.append(make('span','exhibition-legend',text.legend),button(text.today,()=>{month=today.slice(0,7);paint(1);},'about-link'));view.append(footer);
  function paint(direction=1){
   label.textContent=new Intl.DateTimeFormat(locale(),{month:'long',year:'numeric',timeZone:'UTC'}).format(civil(month+'-01'));prev.disabled=month==='2000-01';next.disabled=month==='2099-12';
   const content=make('div','exhibition-month-content'),week=make('div','exhibition-week');week.setAttribute('aria-hidden','true');
   for(let i=0;i<7;i++)week.append(make('span','',new Intl.DateTimeFormat(locale(),{weekday:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,0,5+i)))));
   const grid=make('div','exhibition-days');grid.setAttribute('role','group');grid.setAttribute('aria-labelledby','exhibition-month');
   const start=civil(month+'-01'),offset=(start.getUTCDay()+6)%7,days=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0)).getUTCDate(),last=month+'-'+String(days);
   const listed=events.filter(e=>e.start<=last&&e.end>=month+'-01');
   // Six rows, including blanks. Plain dates are information, not booking controls.
   for(let cell=0;cell<42;cell++){
    const n=cell-offset+1,span=make('span','exhibition-day');if(n<1||n>days){span.setAttribute('aria-hidden','true');grid.append(span);continue;}
    const value=month+'-'+String(n).padStart(2,'0'),matches=listed.filter(e=>e.start<=value&&e.end>=value);span.textContent=String(n);span.classList.toggle('has-exhibition',matches.length>0);span.setAttribute('aria-label',dayLabel(value)+(matches.length?' · '+matches.map(e=>e.copy.title).join(', '):''));if(value===today)span.setAttribute('aria-current','date');grid.append(span);
   }
   const list=make('section','exhibition-month-list');list.setAttribute('aria-label',text.allDates);
   if(!listed.length)list.append(make('p','exhibition-schedule-empty',text.noMonth));
   for(const event of listed){const row=make('article','exhibition-schedule-row');row.append(make('strong','',event.copy.title),make('small','',event.copy.artist));list.append(row);}
   content.append(week,grid,list);fadeSwap(frame,content,direction);
  }
  paint();return view;
 }
 function renderDialog(){
  title.textContent=text.calendarTitle;close.setAttribute('aria-label',text.close);body.scrollTop=0;
  for(const clean of [...motions.values()])clean();body.replaceChildren(calendarView());
 }
 function feature(event){
  const content=make('article','exhibition-teaser');content.classList.toggle('without-art',!event.image&&!event.previewImage);
  content.append(make('h3','',event.copy.title),make('p','exhibition-artist',event.copy.artist),make('p','exhibition-dates',range(event)));
  const excerpt=[...(event.copy.summary?.trim()||event.copy.description).replace(/\s+/gu,' ').trim()];content.append(make('p','exhibition-excerpt',excerpt.slice(0,excerpt.length>160?159:160).join('')+(excerpt.length>160?'…':'')));
  // Only the exhibition's own URL; empty input has no button or fallback link.
  const artistUrl=typeof event.artistUrl==='string'?event.artistUrl.trim():'';
  if(artistUrl){try{const url=new URL(artistUrl);if(url.protocol==='https:'&&!url.username&&!url.password){const link=make('a','about-link exhibition-artist-link',text.artistWebsite);link.append(window.pendiUIIcon('external'));link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',text.artistWebsite+' · '+text.newTab);content.append(link);}}catch{}}
  return content;
 }
 function render(){
  config=JSON.parse(document.querySelector('[data-about-settings]').dataset.config);text=config.text;events=config.events.slice().sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());today=['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');
  tabs.setAttribute('aria-label',document.documentElement.lang==='en'?'About Pendi':'Über Pendi');tabButtons.forEach((b,i)=>b.textContent=text.tabs[i]);panels.forEach(p=>p.replaceChildren());
  const p=panels[0],current=events.find(e=>e.start<=today&&e.end>=today)||events.find(e=>e.start>today);
  floating.replaceChildren();const image=current?artwork(current,'exhibition-thumb'):make('img','exhibition-thumb');
  if(!current){image.src='/pendi-preview/assets/images/exhibition-invitation.svg';image.alt=document.documentElement.lang==='en'?'Pendi · A space for your art':'Pendi · Raum für Ihre Kunst';image.decoding='async';}
  if(image){const art=make('figure','exhibition-art-frame');art.append(image);floating.append(art);}floating.hidden=!image||config.exhibitionsEnabled===false;
  const topline=make('div','exhibition-topline');topline.append(make('p','exhibition-kicker',current?current.start>today?text.upcoming:text.current:text.calendarTitle));
  const calendar=button('',()=>open(calendar),'about-calendar-button');calendar.setAttribute('aria-label',text.calendar);calendar.title=text.calendar;calendar.setAttribute('aria-haspopup','dialog');calendar.setAttribute('aria-controls',dialog.id);
  const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');const path=document.createElementNS(icon.namespaceURI,'path');path.setAttribute('d','M7 3v4m10-4v4M4 10h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2 9h1m3 0h1m3 0h1m-9 3h1m3 0h1');icon.append(path);calendar.append(icon);topline.append(calendar);p.append(topline);
  if(current)p.append(feature(current));else{const empty=make('div','exhibition-empty');empty.append(make('h3','',text.emptyTitle),make('p','',text.space),make('p','',text.inviteBody));p.append(empty);}
  const invite=make('div','about-invite'),inquiry=make('button','about-inquiry',text.inviteAction);
  inquiry.type='button';inquiry.dataset.contactCardOpen='contact';inquiry.setAttribute('aria-haspopup','dialog');inquiry.setAttribute('aria-controls','contact-cards');
  inquiry.append(window.pendiUIIcon('external'));
  invite.append(make('p','',text.invite),inquiry);p.append(invite);
  for(const [i,key,email]of [[1,'collab',config.email],[2,'jobs',config.jobsEmail]]){
   panels[i].append(make('h3','about-topic-title',text[key+'Title']),make('p','about-topic-body',text[key+'Body']));
   const card=mail('',email,text[key+'Subject'],'about-card-link');card.setAttribute('aria-label',text[key+'Action']);card.title=text[key+'Action'];card.append(cardVisual(key,text.tabs[i]));floats[i].replaceChildren(card);
  }
  const enabled=config.exhibitionsEnabled!==false,jobsEnabled=config.jobsEnabled!==false;tabButtons[0].hidden=panels[0].hidden=!enabled;tabButtons[2].hidden=panels[2].hidden=!jobsEnabled;tabs.dataset.tabCount=String(tabButtons.filter(b=>!b.hidden).length);
  floats[2].hidden=!jobsEnabled;
  if(!enabled){panels[0].replaceChildren();if(dialog.open)dialog.close();}if(!jobsEnabled)panels[2].replaceChildren();
  reading.wrap();root.replaceChildren(tabs,stage,reading.controls);select(active);notify();if(dialog.open)renderDialog();
 }
 const pauseButton=document.querySelector('[data-motion-toggle]');if(pauseButton)new MutationObserver(()=>{root.classList.toggle('motion-paused',paused());floats.forEach(n=>n.classList.toggle('motion-paused',paused()));dialog.classList.toggle('motion-paused',paused());if(paused()){for(const clean of [...motions.values()])clean();if(closing)dialog.close();else modalMotion?.finish();}}).observe(pauseButton,{attributes:true,attributeFilter:['class']});
 document.addEventListener('pendi:language',render);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
 render();
}
