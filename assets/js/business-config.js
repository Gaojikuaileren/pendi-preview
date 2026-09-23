// Public rules only. No capacity inventory or permission to create a reservation.
export let businessSettings=null;
export async function refreshBusinessSettings(){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2200);
 try{
  const response=await fetch(new URL('../data/business.json',import.meta.url),{cache:'no-store',signal:controller.signal});
  if(!response.ok)return false;
  const data=await response.json();if(data.timeZone!=='Europe/Berlin'||!Array.isArray(data.week)||data.week.length!==7||!data.booking)return false;
  businessSettings=data;document.dispatchEvent(new CustomEvent('pendi:business-settings'));return true;
 }catch{return false;}finally{clearTimeout(timer);}
}
if(typeof document!=='undefined')await refreshBusinessSettings();
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshBusinessSettings();});
