// Carry only a short-lived visual handoff across real document navigation.
try{
 const raw=sessionStorage.getItem('pendi-card-arrival');
 if(raw){sessionStorage.removeItem('pendi-card-arrival');const data=JSON.parse(raw);
  if(Date.now()-data.time<12000&&data.path===location.pathname&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
   window.pendiCardArrival=data;document.documentElement.dataset.cardArrival=data.kind;
   window.pendiCardDeadline=setTimeout(()=>{delete document.documentElement.dataset.cardArrival;},3000);
  }
 }
}catch{/* Storage is optional; native links remain usable. */}
