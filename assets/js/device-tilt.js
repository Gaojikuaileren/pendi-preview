// Optional decoration only. Never request permission or collect/send sensor data.
export function mountDeviceTilt(){
 const body=document.body,home=body.classList.contains('page-home');
 if(!home&&!body.classList.contains('page-drinks'))return;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),coarse=matchMedia('(pointer:coarse)');
 const film=document.querySelector('[data-scroll-video]'),pause=document.querySelector('[data-motion-toggle]');
 const connection=navigator.connection,visibleCards=new Set();
 let epoch=0,frame=0,timeout=0,stale=0,probeDone=null,ready=false,listening=false,unavailable=false,battery=null,batteryPromise=null;
 let neutral=null,samples=[],current=0,target=0,lastFrame=0,slowFrames=0,frames=0;
 const status=reason=>{body.dataset.deviceTilt=reason;};
 function reset(){for(const name of ['--device-text-x','--device-card-x','--device-home-x'])body.style.removeProperty(name);current=target=0;}
 function stop(reason){epoch++;ready=false;cancelAnimationFrame(frame);frame=0;probeDone?.(false);probeDone=null;clearTimeout(timeout);clearTimeout(stale);window.removeEventListener('deviceorientation',orient);listening=false;neutral=null;samples=[];reset();status(reason);}
 const powerBlocked=()=>connection?.saveData||(battery&&(!battery.charging&&battery.level<=.25));
 function eligible(){return !document.hidden&&!reduced.matches&&!pause?.classList.contains('is-paused')&&!powerBlocked()&&!document.querySelector('.card-route-veil')&&!document.documentElement.hasAttribute('data-card-arrival')&&(home?['0','1'].includes(film?.dataset.station)&&!document.querySelector('[data-deck]')?.dataset.transitioning&&!document.querySelector('#drinks.depth-large-type'):visibleCards.size>0);}
 function render(now){
  frame=0;if(!ready||!eligible()){sync();return;}
  const dt=lastFrame?now-lastFrame:16;lastFrame=now;
  if(++frames>=90){if(slowFrames>18){unavailable=true;stop('performance');return;}frames=slowFrames=0;}
  if(dt>40)slowFrames++;
  current+=(target-current)*(1-Math.exp(-Math.min(dt,50)/180));
  body.style.setProperty('--device-text-x',(current*2.5).toFixed(3)+'px');
  body.style.setProperty('--device-card-x',(current*3).toFixed(3)+'px');
  body.style.setProperty('--device-home-x',(current*2).toFixed(3)+'px');
  if(Math.abs(target-current)>.002)frame=requestAnimationFrame(render);
 }
 function orient(event){
  if(!eligible()){sync();return;}
  if(!Number.isFinite(event.gamma)||!Number.isFinite(event.beta)||Math.abs(event.gamma)>90||Math.abs(event.beta)>180)return;
  const angle=(screen.orientation?.angle||0)*Math.PI/180;
  const horizontal=event.gamma*Math.cos(angle)+event.beta*Math.sin(angle);
  clearTimeout(stale);stale=setTimeout(()=>stop('sensor-stale'),1800);
  if(neutral===null){samples.push(horizontal);if(samples.length<8)return;neutral=samples.reduce((a,b)=>a+b,0)/samples.length;clearTimeout(timeout);ready=true;status('active');}
  const offset=horizontal-neutral,next=Math.abs(offset)<1?0:Math.max(-1,Math.min(1,(offset-Math.sign(offset))/16));
  if(Math.abs(next-target)<.015)return;target=next;
  if(!frame){lastFrame=0;frame=requestAnimationFrame(render);}
 }
 async function power(){
  if(!navigator.getBattery)return null;
  if(!batteryPromise)batteryPromise=Promise.race([navigator.getBattery().catch(()=>null),new Promise(resolve=>setTimeout(()=>resolve(null),1200))]).then(value=>{
   if(value&&Number.isFinite(value.level)&&typeof value.charging==='boolean'){
    battery=value;value.addEventListener('levelchange',sync);value.addEventListener('chargingchange',sync);
   }return battery;
  });
  return batteryPromise;
 }
 function performanceReady(run){return new Promise(resolve=>{
  probeDone=resolve;
  const times=[];let start=null,last=null;
  const sample=now=>{
   if(run!==epoch){resolve(false);return;}
   if(start===null)start=now;if(last!==null)times.push(now-last);last=now;
   if(now-start>=900){times.sort((a,b)=>a-b);probeDone=null;resolve(times.length>=35&&times[Math.floor(times.length*.9)]<28);return;}
   frame=requestAnimationFrame(sample);
  };frame=requestAnimationFrame(sample);
 });}
 async function begin(){
  const run=++epoch;status('checking');
  const powerState=await power();if(run!==epoch)return;
  // Unknown battery state is deliberately static, not evidence of normal power.
  if(!powerState){unavailable=true;stop('power-unknown');return;}
  if(!eligible()){stop('suspended');return;}
  if(!await performanceReady(run)){if(run===epoch){unavailable=true;stop('performance');}return;}
  if(run!==epoch)return;
  frame=0;listening=true;neutral=null;samples=[];frames=slowFrames=0;
  status('waiting-sensor');window.addEventListener('deviceorientation',orient,{passive:true});
  // Listening never invokes requestPermission, including on iOS.
  timeout=setTimeout(()=>{unavailable=true;stop('sensor-unavailable');},5000);
 }
 function sync(){
  if(!eligible()){stop(powerBlocked()?'power-saving':'suspended');return;}
  if(unavailable||listening||body.dataset.deviceTilt==='checking')return;
  begin();
 }
 if(!window.isSecureContext||!('DeviceOrientationEvent' in window)||!coarse.matches||!navigator.maxTouchPoints||!CSS.supports('translate','1px 0')||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<4)||(navigator.deviceMemory&&navigator.deviceMemory<4)) {status('unsupported');return;}
 const policy=document.permissionsPolicy||document.featurePolicy;
 if(policy&&['accelerometer','gyroscope'].some(name=>!policy.allowsFeature(name))){status('policy-blocked');return;}
 if(!home){const observer=new IntersectionObserver(entries=>{for(const {target,isIntersecting} of entries){target.toggleAttribute('data-tilt-visible',isIntersecting);if(isIntersecting)visibleCards.add(target);else visibleCards.delete(target);}sync();});document.querySelectorAll('.specimen-slots > .specimen-card').forEach(n=>observer.observe(n));}
 if(film)new MutationObserver(sync).observe(film,{attributes:true,attributeFilter:['data-station']});
 const deck=document.querySelector('[data-deck]');if(deck)new MutationObserver(sync).observe(deck,{attributes:true,attributeFilter:['data-transitioning']});
 if(pause)new MutationObserver(sync).observe(pause,{attributes:true,attributeFilter:['class']});
 new MutationObserver(sync).observe(body,{childList:true});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);connection?.addEventListener('change',sync);
 screen.orientation?.addEventListener('change',()=>{stop('recalibrating');sync();});
 window.addEventListener('pagehide',()=>stop('suspended'));window.addEventListener('pageshow',sync);
 sync();
}
