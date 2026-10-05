// Fixed compositions: short canvases turn horizontal reading columns by button.
// CSS fragmentation respects text lines; it never slices a heading by scrollTop.
export function mountAboutReading(root,stage,panels,tabs,locale){
 const controls=document.createElement('nav');controls.className='about-reading';controls.hidden=true;
 const previous=document.createElement('button'),next=document.createElement('button'),status=document.createElement('span');
 previous.type=next.type='button';controls.append(previous,status,next);status.setAttribute('aria-live','polite');
 let active=0,page=0,pages=1,width=0,frame=0;
 const copy=root.closest('.about-copy');
 function show(value){page=Math.max(0,Math.min(pages-1,value));panels[active]?.style.setProperty('--about-page-offset',`${-page*(width+24)}px`);previous.disabled=page===0;next.disabled=page===pages-1;status.textContent=`${page+1} / ${pages}`;copy.scrollTop=copy.scrollLeft=stage.scrollLeft=0;}
 previous.addEventListener('click',()=>show(page-1));next.addEventListener('click',()=>show(page+1));
 function update(){
  frame=0;const oldPage=page;
  controls.hidden=true;stage.classList.remove('is-paged');stage.style.height='';
  const tracks=panels.map(p=>p.querySelector('.about-page-track'));
  if(tracks.some(t=>!t))return;
  const style=getComputedStyle(copy),tabStyle=getComputedStyle(tabs);
  const available=parseFloat(style.maxHeight)-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-tabs.offsetHeight-parseFloat(tabStyle.marginBottom);
  const natural=Math.max(...tracks.map((t,i)=>panels[i].hidden?0:t.getBoundingClientRect().height));
  const en=locale()==='en';controls.setAttribute('aria-label',en?'Reading sections':'Textabschnitte');previous.textContent=en?'Previous':'Zurück';next.textContent=en?'Next':'Weiter';
  if(natural<=available+1||!Number.isFinite(available)){pages=1;show(0);return;}
  controls.hidden=false;width=stage.clientWidth;
  const height=Math.max(60,available-52);
  stage.style.setProperty('--about-page-width',width+'px');stage.style.setProperty('--about-page-height',height+'px');stage.style.height=height+'px';stage.classList.add('is-paged');
  pages=Math.max(1,Math.ceil((tracks[active].scrollWidth+24)/(width+24)));
  show(oldPage);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 // Only external dimensions are observed, not the paginated track's own height.
 const observer=new ResizeObserver(schedule);observer.observe(copy.closest('[data-scene]'));observer.observe(tabs);
 const changes=new MutationObserver(schedule);changes.observe(copy.closest('[data-scene]'),{attributes:true,attributeFilter:['style']});
 document.fonts.ready.then(schedule);window.addEventListener('resize',schedule);
 root.addEventListener('focusin',event=>{if(!stage.classList.contains('is-paged')||!panels[active].contains(event.target))return;const r=event.target.getBoundingClientRect(),s=stage.getBoundingClientRect();if(r.left<s.left-1||r.right>s.right+1)show(page+Math.round((r.left-s.left)/(width+24)));});
 return{controls,reset(index){active=index;page=0;schedule();},wrap(){for(const panel of panels){const track=document.createElement('div');track.className='about-page-track';track.append(...panel.childNodes);panel.append(track);}schedule();}};
}
