export function cardSource(kind){
 if(kind==='collab')kind='contact';
 try{const src=JSON.parse(document.querySelector('[data-card-settings]')?.dataset.images||'{}')[kind];return /^\/assets\/images\/business-cards\/[a-f0-9]{64}\.png$/.test(src||'')?src:'';}catch{return '';}
}
export function cardVisual(kind,alt){
 const src=cardSource(kind),node=document.createElement(src?'img':'span');
 node.className=src?'business-card-image':'business-card-blank';
 if(src){node.src=src;node.alt=alt;node.decoding='async';node.addEventListener('error',()=>{const blank=document.createElement('span');blank.className='business-card-blank';blank.setAttribute('role','img');blank.setAttribute('aria-label',alt);node.replaceWith(blank);},{once:true});}
 else {node.setAttribute('role','img');node.setAttribute('aria-label',alt);}
 return node;
}
