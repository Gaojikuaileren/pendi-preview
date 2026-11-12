import {mountMenu} from './menu.js?v=ec35d2debdae';
import {mountOperations} from './operations.js?v=ec35d2debdae';
import {mountStaffPresentation} from './staff-layout.js?v=ec35d2debdae';

const STORAGE='pendi-admin-preview-v1',entry=new URL('./',import.meta.url),site=new URL('../',entry);
const shell=document.querySelector('#preview-shell'),toast=document.querySelector('.preview-toast'),resetDialog=document.querySelector('.preview-reset-dialog');
const words={
 de:{title:'Interaktive Vorschau',note:'Beispieldaten · Nur in diesem Browser gespeichert · Kein E-Mail-Versand',reset:'Zurücksetzen',resetTitle:'Vorschau zurücksetzen?',resetNote:'Nur Ihre Änderungen an dieser Vorschau werden gelöscht.',cancel:'Abbrechen',saved:'In dieser Vorschau gespeichert.',limited:'Diese Aktion ist nur eine Vorschau. Es wird nichts versendet.',storage:'Der Browserspeicher ist voll oder gesperrt. Diese Änderung bleibt nur bis zum Neuladen erhalten.',error:'Die Vorschau konnte nicht geladen werden. Bitte laden Sie die Seite erneut.'},
 en:{title:'Interactive preview',note:'Sample data · Saved only in this browser · No emails sent',reset:'Reset preview',resetTitle:'Reset this preview?',resetNote:'Only your changes to this preview will be removed.',cancel:'Cancel',saved:'Saved in this preview.',limited:'This is a preview action. Nothing is sent.',storage:'Browser storage is full or unavailable. This change lasts until you reload.',error:'The preview could not be loaded. Please reload the page.'},
 zh:{title:'后台交互预览',note:'演示数据 · 仅保存在当前浏览器 · 不发送邮件',reset:'重置预览',resetTitle:'重置此预览？',resetNote:'只会清除您在本浏览器中进行的演示修改。',cancel:'取消',saved:'已保存在此预览中。',limited:'此操作仅供预览，不会发送任何通知。',storage:'浏览器存储已满或被禁用，此次修改仅保留到刷新前。',error:'预览加载失败，请刷新页面重试。'}
};
let payload,state={},lang='de',route='/admin/',cleanup=[],sequence=0,toastTimer,renderController;
try{const value=JSON.parse(localStorage.getItem(STORAGE)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))state=value;}catch{}
function assetUrl(value){
 if(!value)return value;
 if(value.startsWith('data:')||value.startsWith('blob:'))return value;
 if(value.startsWith('/assets/')){const u=new URL(value.slice(1),site);if(payload?.generatedAt)u.searchParams.set('v',payload.generatedAt);return u.href;}
 return value;
}
function logical(value,language=lang){
 const u=new URL(value||'/admin/','https://preview.invalid');
 if(!/^\/admin(?:\/|$)/.test(u.pathname))return '/admin/?lang='+language;
 if(!u.pathname.endsWith('/'))u.pathname+='/';
 u.searchParams.delete('csrf');u.searchParams.delete('menuRevision');
 u.searchParams.set('lang',language);
 return u.pathname+u.search;
}
function cleanDocument(html){
 const doc=new DOMParser().parseFromString(html,'text/html');
 doc.querySelectorAll('script,base,meta[http-equiv],noscript,.auth-session-notice').forEach(node=>node.remove());
 for(const node of doc.querySelectorAll('*')){
  for(const attribute of [...node.attributes]){
   if(/^on/i.test(attribute.name))node.removeAttribute(attribute.name);
   if(['href','src','poster','action','data-src'].includes(attribute.name)){
    let value=attribute.value;
    if(/^\s*(?:javascript|vbscript):/i.test(value)){node.removeAttribute(attribute.name);continue;}
    if(value.startsWith('/assets/'))node.setAttribute(attribute.name,assetUrl(value));
    else if(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(value)&&!value.includes('/admin/'))node.setAttribute(attribute.name,new URL(value.includes('/en/')?'en/':'',site).href);
    else if(attribute.name==='href'&&(value==='/'||value==='/en/')){node.setAttribute('href',new URL(value.slice(1),site).href);node.setAttribute('target','_blank');node.setAttribute('rel','noopener');}
   }
  }
 }
 doc.querySelectorAll('[name=csrf]').forEach(input=>input.value='preview-only');
 for(const frame of doc.querySelectorAll('iframe')){
  const source=frame.getAttribute('src')||'';frame.removeAttribute('src');frame.setAttribute('sandbox','allow-same-origin');
  if(source.includes('/admin/menu/preview/')){
   const u=new URL(source,'https://preview.invalid'),id=u.searchParams.get('id'),cardLang=u.searchParams.get('cardlang')||'de';
   const card=payload?.cards?.[cardLang]?.[id];
   if(card)frame.srcdoc=cleanDocument(card).documentElement.outerHTML;
  }
 }
 return doc;
}
function findSnapshot(value,language){
 const u=new URL(logical(value,language),'https://preview.invalid');u.searchParams.delete('lang');
 const pages=payload.pages[language],key=u.pathname+u.search;
 let html=pages[key];
 if(!html){const matches=Object.keys(pages).filter(candidate=>{const v=new URL(candidate,'https://preview.invalid');return v.pathname===u.pathname&&[...v.searchParams].every(([name,value])=>u.searchParams.get(name)===value);}).sort((a,b)=>b.length-a.length);html=pages[matches[0]];}
 if(!html)throw Error('Missing preview page');
 return cleanDocument(html).documentElement.outerHTML;
}
function notify(message=words[lang].saved){
 toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,3800);
}
function save(){
 try{const value=JSON.stringify(state);if(value.length>4_000_000)throw Error('Preview storage limit');localStorage.setItem(STORAGE,value);return true;}catch{notify(words[lang].storage);return false;}
}
function navigate(value,options={}){
 const u=new URL(value||'/admin/','https://preview.invalid');const nextLang=['zh','de','en'].includes(u.searchParams.get('lang'))?u.searchParams.get('lang'):lang;
 const next=logical(value,nextLang),hash='#'+next;
 if(location.hash===hash){render(next,{preserveScroll:options.preserveScroll??true});return;}
 history.pushState({},'',hash);render(next,options);
}
async function render(value,{preserveScroll=false}={}){
 const current=++sequence,scroll=window.scrollY;
 renderController?.abort();renderController=new AbortController();const signal=renderController.signal;
 for(const dispose of cleanup.splice(0))if(typeof dispose==='function')dispose();
 const u=new URL(value,'https://preview.invalid');lang=['de','en','zh'].includes(u.searchParams.get('lang'))?u.searchParams.get('lang'):lang;route=logical(value,lang);
 const t=words[lang];document.documentElement.lang=lang==='zh'?'zh-CN':lang;document.title='Pendi · '+t.title;
 document.querySelector('[data-preview-title]').textContent=t.title;document.querySelector('[data-preview-note]').textContent=t.note;document.querySelector('[data-preview-reset]').textContent=t.reset;
 document.querySelector('#preview-reset-title').textContent=t.resetTitle;document.querySelector('[data-preview-reset-note]').textContent=t.resetNote;document.querySelector('[data-preview-cancel]').textContent=t.cancel;document.querySelector('[data-preview-confirm]').textContent=t.reset;
 try{
  const doc=new DOMParser().parseFromString(findSnapshot(route,lang),'text/html');
  if(current!==sequence)return;
  shell.replaceChildren(...[...doc.body.childNodes].map(node=>document.importNode(node,true)));shell.removeAttribute('aria-busy');
  document.body.dataset.adminBase='/admin';document.body.dataset.previewRoute=u.pathname;
  const ctx={root:shell.querySelector('main'),lang,route,state,signal,save,notify,navigate,assetUrl,data:payload,rerender:()=>render(route,{preserveScroll:true}),snapshot:async(value,language=lang)=>findSnapshot(value,language),record:(action,detail='')=>{state.previewLog??=[];state.previewLog.unshift({at:Date.now(),action,detail});state.previewLog=state.previewLog.slice(0,100);save();}};
  for(const mount of [mountMenu,mountOperations]){const result=await mount(ctx);if(current!==sequence){if(typeof result==='function')result();return;}if(typeof result==='function')cleanup.push(result);}
  const staff=shell.querySelector('[data-staff]');if(staff){state.staffPresentation??={};cleanup.push(mountStaffPresentation(staff,state.staffPresentation));}
  window.scrollTo({top:preserveScroll?scroll:0,behavior:'instant'});
 }catch(error){if(current!==sequence)return;shell.removeAttribute('aria-busy');shell.textContent=t.error;notify(t.error);console.error('Preview rendering failed',error);}
}
// No native submission is permitted in a static preview. Module handlers can
// still process the event locally; no password or genuine server API is used.
document.addEventListener('submit',event=>event.preventDefault(),true);
document.addEventListener('click',event=>{
 if(event.defaultPrevented)return;const link=event.target.closest('a[href]');if(!link)return;
 const href=link.getAttribute('href');
 if(new URL(href,location.href).pathname.startsWith('/api/')){event.preventDefault();notify(words[lang].limited);return;}
 if(href.startsWith('/admin')||new URL(href,location.href).pathname.startsWith('/admin/')){event.preventDefault();navigate(href,{preserveScroll:link.hasAttribute('lang')});}
},false);
document.querySelector('[data-preview-reset]').addEventListener('click',()=>resetDialog.showModal());
document.querySelector('[data-preview-cancel]').addEventListener('click',()=>resetDialog.close());
document.querySelector('[data-preview-confirm]').addEventListener('click',()=>{state={};try{localStorage.removeItem(STORAGE);}catch{}resetDialog.close();render(route,{preserveScroll:true});});
window.addEventListener('popstate',()=>{if(location.hash.slice(1)!==route)render(location.hash.slice(1)||'/admin/');});
window.addEventListener('hashchange',()=>{if(location.hash.slice(1)!==route)render(location.hash.slice(1)||'/admin/');});
try{
 const response=await fetch(new URL('snapshots.json',entry),{cache:'no-cache'});if(!response.ok)throw Error('snapshot');payload=await response.json();
 if(payload.mode!=='admin-preview'||!payload.pages)throw Error('Invalid preview bundle');
 await render(location.hash.slice(1)||'/admin/?lang=de');
}catch{shell.textContent=words[lang].error;shell.removeAttribute('aria-busy');}
