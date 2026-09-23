export async function mailQuotaReached(){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2500);
 try{
  // Same-origin path also works beneath a static preview's project prefix.
  const response=await fetch(new URL('../data/mail-availability.json',import.meta.url),{cache:'no-store',signal:controller.signal});
  if(!response.ok)return null;const value=await response.json();
  return value.mailQuotaReached===true||value.mailUnavailable===true?true:value.quotaKnown===true?false:null;
 }catch{return null;}finally{clearTimeout(timer);}
}
