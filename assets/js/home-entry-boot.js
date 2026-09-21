// Opt in before the body paints; no-JS pages and deep links remain untouched.
if((location.pathname==='/pendi-preview/'||location.pathname==='/pendi-preview/en/')&&(!location.hash||location.hash==='#home')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 document.documentElement.dataset.homeEntry='pending';
 // A missing module/slow asset must never leave the controls invisible.
 window.pendiEntryDeadline=setTimeout(()=>{if(document.documentElement.dataset.homeEntry==='pending')document.documentElement.dataset.homeEntry='complete';},2400);
}
