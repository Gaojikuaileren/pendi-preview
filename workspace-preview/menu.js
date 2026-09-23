/* Static customer demo. All mutations stay in ctx.state; no server endpoints. */
const DEFAULT_COLORS = ['#39312a', '#302f28', '#34312b'];
const ARTS = ['tomate', 'kakao', 'gurke', 'mandarine', 'birne', 'reis'];
const AXES = ['acidity', 'sweetness', 'body', 'complexity', 'abv'];
const COPY = {
  de: {menu:'Karte',edit:'Karte bearbeiten',add:'Karte hinzufügen',save:'Speichern',close:'Schließen',copy:'Duplizieren',hide:'Einlagern',show:'Anzeigen',remove:'Löschen',confirm:'Erneut klicken zum Bestätigen',restore:'Wiederherstellen',purge:'Endgültig löschen',stored:'Eingelagert',visible:'Auf der Website',template:'Vorlage',image:'Vollständige Karte',categories:'Kategorien',category:'Kategorie',newCategory:'Neue Kategorie',destination:'Karten verschieben nach',assets:'Materialien',marks:'Karten-Markierungen',cards:'Vollständige Karten',upload:'PNG hinzufügen',empty:'Noch keine Materialien',used:'Verwendet',unused:'Nicht verwendet',number:'Nummer',order:'Reihenfolge',name:'Name',tags:'Tags',thought:'Die Spur',ingredients:'Zutaten',price:'Preis',profile:'Geschmacksprofil',pending:'Offen',confirmed:'Bestätigt',color:'Kartenfarbe',original:'Standardfarbe',preset:'Farbe speichern',rgb:'RGB',art:'Markierung',preview:'Vorschau',selectAll:'Auswahl',all:'Alle',search:'Nach Name oder Nummer suchen',batchMove:'Auswahl verschieben',deleted:'Gelöscht',saved:'In dieser Vorschau gespeichert.',invalid:'Bitte prüfen Sie die markierten Eingaben.',bothImages:'Bitte wählen Sie eine vollständige Karte für Deutsch und Englisch.',file:'Nur gültige PNG-Dateien bis 1 MB. Vollständige Karten: genau 1080 × 1680 px. Markierungen: höchstens 2048 × 2048 px.',budget:'Für diese Vorschau sind insgesamt 3 MB lokale Bilddaten möglich. Entfernen Sie unbenutzte Materialien.',storage:'Der Browserspeicher ist voll. Bitte entfernen Sie unbenutzte Bilder.',oneCategory:'Mindestens eine Kategorie muss bestehen bleiben.',usedAsset:'Dieses Material wird noch von einer Karte verwendet.',localNote:'Nur in diesem Browser · PNG bis 1 MB · keine Übertragung',move:'Ziehen zum Sortieren; Alt + Pfeiltasten für Tastatur',rename:'Kategorie umbenennen',count:'Karten',acidity:'Säure',sweetness:'Süße',body:'Körper',complexity:'Komplexität',abv:'ABV',reveal:'Die Spur lesen',newName:'Neue Karte',missing:'Bild auswählen',pricePreview:'Preis folgt',cancel:'Abbrechen'},
  en: {menu:'Menu',edit:'Edit card',add:'Add card',save:'Save',close:'Close',copy:'Duplicate',hide:'Store',show:'Show',remove:'Delete',confirm:'Click again to confirm',restore:'Restore',purge:'Delete permanently',stored:'Stored',visible:'On the website',template:'Template',image:'Complete card',categories:'Categories',category:'Category',newCategory:'New category',destination:'Move cards to',assets:'Materials',marks:'Card marks',cards:'Complete cards',upload:'Add PNG',empty:'No materials yet',used:'In use',unused:'Unused',number:'Number',order:'Order',name:'Name',tags:'Tags',thought:'The trail',ingredients:'Ingredients',price:'Price',profile:'Flavour profile',pending:'To fill',confirmed:'Confirmed',color:'Card colour',original:'Default colour',preset:'Save colour',rgb:'RGB',art:'Mark',preview:'Preview',selectAll:'Selection',all:'All',search:'Find by name or number',batchMove:'Move selection',deleted:'Deleted',saved:'Saved in this preview.',invalid:'Please check the highlighted fields.',bothImages:'Please select a complete card for both German and English.',file:'Only valid PNG files up to 1 MB. Complete cards: exactly 1080 × 1680 px. Marks: at most 2048 × 2048 px.',budget:'This preview allows 3 MB of local image data in total. Remove unused materials.',storage:'Browser storage is full. Please remove unused images.',oneCategory:'At least one category must remain.',usedAsset:'This material is still used by a card.',localNote:'Only in this browser · PNG up to 1 MB · no uploads',move:'Drag to reorder; Alt + arrow keys for keyboard',rename:'Rename category',count:'cards',acidity:'Acidity',sweetness:'Sweetness',body:'Body',complexity:'Complexity',abv:'ABV',reveal:'Read the trail',newName:'New card',missing:'Choose image',pricePreview:'Price to follow',cancel:'Cancel'},
  zh: {menu:'酒单',edit:'编辑卡牌',add:'新增卡牌',save:'保存',close:'关闭',copy:'复制',hide:'存储',show:'展示',remove:'删除',confirm:'再次点击确认',restore:'恢复',purge:'永久删除',stored:'后台存储',visible:'前台展示',template:'现有模板',image:'完整卡牌',categories:'分类',category:'分类',newCategory:'新增分类',destination:'将卡牌移至',assets:'素材',marks:'卡片 Mark',cards:'完整卡片',upload:'添加 PNG',empty:'暂无素材',used:'正在使用',unused:'未使用',number:'编号',order:'排序',name:'名称',tags:'Tags',thought:'短文',ingredients:'原料',price:'价格',profile:'风味',pending:'待填',confirmed:'确认',color:'卡片颜色',original:'默认颜色',preset:'加入预设',rgb:'RGB',art:'图标',preview:'预览',selectAll:'选择',all:'全部',search:'按名称或编号查找',batchMove:'移动所选卡牌',deleted:'已删除',saved:'已保存在此预览中。',invalid:'请检查标红的输入。',bothImages:'请分别选择德语和英语的完整卡片。',file:'仅支持有效 PNG，单张不超过 1 MB。完整卡片必须为 1080 × 1680 像素；Mark 最大 2048 × 2048 像素。',budget:'此预览最多保存 3 MB 本地图片数据，请先移除未使用素材。',storage:'浏览器存储已满，请移除未使用图片。',oneCategory:'至少需要保留一个分类。',usedAsset:'此素材仍被卡牌引用。',localNote:'仅当前浏览器 · PNG 单张 1 MB · 不上传',move:'拖动排序；键盘使用 Alt + 方向键',rename:'重命名分类',count:'张酒卡',acidity:'酸度',sweetness:'甜度',body:'酒体',complexity:'复杂度',abv:'酒精度',reveal:'阅读线索',newName:'新卡牌',missing:'选择图片',pricePreview:'价格待填',cancel:'取消'}
};
const clone = value => JSON.parse(JSON.stringify(value));
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = prefix => prefix + '-' + (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const icon = name => {
  const paths = {add:'M12 5v14M5 12h14',edit:'m4 16 12-12 4 4L8 20H4v-4Z M14 6l4 4',copy:'M8 8h12v12H8z M4 16H3V3h13v1',hide:'M3 5h18v4H3z M5 9v12h14V9 M10 13h4',show:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',remove:'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',save:'M4 3h13l4 4v14H3V3h1Z M7 3v6h10V3 M7 21v-8h10v8',close:'M5 5l14 14M19 5 5 19',check:'m4 12 5 5L20 6',restore:'M4 9a8 8 0 1 1 0 8 M4 3v6h6',categories:'M3 5h7l2 3h9v13H3V5Z M6 12h12 M6 16h9',assets:'M3 3h18v18H3z m1 15 5-6 4 4 3-3 5 6 M10 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0',move:'M4 4h6l2 3h8v6 M4 4v16h8 M15 16h7m-3-3 3 3-3 3',back:'M20 12H4m6-6-6 6 6 6',grip:'M8 5h1M15 5h1M8 12h1M15 12h1M8 19h1M15 19h1'};
  return `<svg class="admin-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.add}"/></svg>`;
};
const button = (action, label, glyph, extra = '') => `<button type="button" class="secondary icon-button" name="action" value="${esc(action)}" data-menu-action="${esc(action)}" title="${esc(label)}" aria-label="${esc(label)}" ${extra}>${icon(glyph || action)}</button>`;

function normalise(ctx) {
  if (!ctx.state.menu || !Array.isArray(ctx.state.menu.items)) {
    const source = ctx.data?.seed?.menu || {};
    ctx.state.menu = clone(source.menu || source);
  }
  const data = ctx.state.menu;
  data.categories = Array.isArray(data.categories) && data.categories.length ? data.categories : [{id:'main',name:{de:'main',en:'main'},order:10}];
  data.items = Array.isArray(data.items) ? data.items : [];
  data.deleted = Array.isArray(data.deleted) ? data.deleted : Object.values(data.deleted || {});
  data.assets = Array.isArray(data.assets) ? data.assets : [];
  data.colorPresets = [...new Set([...DEFAULT_COLORS, ...(data.colorPresets || ctx.data?.seed?.palette || [])])].filter(value => /^#[a-f\d]{6}$/i.test(value));
  for (const [index, item] of data.items.entries()) {
    item.category ||= data.categories[0].id;
    item.cardMode ||= 'template';
    item.number ||= 'PENDI / ' + String(index + 1).padStart(2, '0');
    item.order ??= (index + 1) * 10;
    item.art ||= ARTS[index % ARTS.length];
  }
  return data;
}

/** Mounts only the menu routes. Safe to call after every app-shell replacement. */
export function mountMenu(ctx) {
  const main = ctx.root;
  if (!main || !main.querySelector('.menu-list, .menu-editor, .menu-categories, .asset-library')) return;
  normalise(ctx);
  const lang = ['de','en','zh'].includes(ctx.lang) ? ctx.lang : 'de', t = COPY[lang], cardLang = lang === 'en' ? 'en' : 'de';
  const controller = new AbortController(), signal = controller.signal, dialogs = new Set(), timers = new Set();
  let alive = true, selected = new Set(), dragged = null, touchDrag = null, listPainted = false;
  ctx.signal?.addEventListener('abort', () => { alive=false;controller.abort(); }, {once:true,signal});
  const menu = () => ctx.state.menu;
  const catName = category => category?.name?.[cardLang] || category?.name?.de || category?.id || '';
  const itemName = item => item.cardMode === 'image' ? item.number : item.copy?.[cardLang]?.name || item.copy?.de?.name || item.number;
  const after = (fn, delay) => { const id = setTimeout(() => { timers.delete(id); if (alive) fn(); }, delay); timers.add(id); return id; };
  const say = message => ctx.notify(message || t.saved);
  const commit = (mutate, action = 'menu', detail = '') => {
    const before = clone(menu());
    mutate(menu());
    if (ctx.save() === false) { ctx.state.menu = before; return false; }
    ctx.record?.(action, detail);
    return true;
  };
  const categories = () => [...menu().categories].sort((a,b) => a.order - b.order);
  const items = () => [...menu().items].sort((a,b) => a.order - b.order);
  const choices = (current, blank = false) => (blank ? `<option value="">${esc(t.all)}</option>` : '') + categories().map(c => `<option value="${esc(c.id)}"${c.id === current ? ' selected' : ''}>${esc(catName(c))}</option>`).join('');
  const safeImage = value => {
    if (typeof value !== 'string') return '';
    if (/^data:image\/png;base64,[a-z\d+/=]+$/i.test(value)) return value;
    if (/^\/assets\/[a-z\d_./-]+$/i.test(value) && !value.includes('..')) return ctx.assetUrl(value);
    try { const u = new URL(value, location.href); if (u.origin === location.origin && u.pathname.includes('/assets/') && !u.pathname.includes('..')) return u.href; } catch {}
    return '';
  };
  const imageFor = (item, language) => {
    const id = item.imageAssets?.[language];
    return safeImage(menu().assets.find(a => a.id === id)?.src || item.cardImage?.[language]?.src || '');
  };
  function card(item, language = cardLang, interactive = false) {
    const c = item.copy?.[language] || item.copy?.de || {}, color = /^#[a-f\d]{6}$/i.test(item.color || '') ? item.color : DEFAULT_COLORS[ARTS.indexOf(item.art) % 3] || DEFAULT_COLORS[0];
    if (item.cardMode === 'image') {
      const source = imageFor(item, language);
      return `<div class="demo-card-art" style="background:${color}">${source ? `<img src="${esc(source)}" alt="${esc(item.number)}" width="1080" height="1680">` : `<span class="demo-card-missing">${esc(t.missing)}<br>${language.toUpperCase()} · 1080 × 1680</span>`}</div>`;
    }
    const rgb = color.slice(1).match(/../g).map(n => parseInt(n,16)), light = (rgb[0]*.299 + rgb[1]*.587 + rgb[2]*.114) > 150, ink = light ? '#282219' : '#e6dac3', pigment = light ? '#645139' : '#c6b699';
    const custom = menu().assets.find(a => a.id === item.markAsset), mark = safeImage(custom?.src || item.icon?.src), art = ARTS.includes(item.art) ? item.art : 'tomate';
    const profile = item.profile || item.previewProfile || {}, points = [[0,88], ...AXES.map((axis,i) => [32+i*64,88-clamp(profile[axis],0,axis==='abv'?60:5)/(axis==='abv'?60:5)*72]), [320,88]];
    const path = scale => points.map(([x,y],i) => i ? `C${(points[i-1][0]+x)/2} ${88-(88-points[i-1][1])*scale} ${(points[i-1][0]+x)/2} ${88-(88-y)*scale} ${x} ${88-(88-y)*scale}` : `M${x} ${y}`).join('');
    const wave = [.25,.5,.75,1].map(scale => `<path d="${path(scale)}"/>`).join('') + points.slice(1,-1).map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${pigment}"/>`).join('');
    const price = item.price ?? item.previewPrice;
    const formatted = Number.isFinite(Number(price)) && price !== null && price !== undefined ? new Intl.NumberFormat(language==='de'?'de-DE':'en-IE',{style:'currency',currency:'EUR'}).format(Number(price)) : COPY[language].pricePreview;
    const tags = Array.isArray(c.tags) ? c.tags.join(' · ') : c.tags || '';
    const fit = (value, max, size) => `<text x="27" y="${max}" font-size="${size}"${String(value).length>27?' textLength="302" lengthAdjust="spacingAndGlyphs"':''}>${esc(value)}</text>`;
    return `<div class="demo-card-art"><svg viewBox="0 0 360 560" role="img" aria-label="${esc(c.name || item.number)}" xmlns="http://www.w3.org/2000/svg">
      <rect width="360" height="560" fill="${color}"/><g fill="none" stroke="${pigment}" stroke-width=".65" opacity=".75"><path d="M16 264V16h144m40 0h144v248M16 296v248h144m40 0h144V296 M21 36V21h15M324 21h15v15M21 524v15h15M324 539h15v-15"/><path d="m180 11 5 5-5 5-5-5Z m0 528 5 5-5 5-5-5Z M16 275l4 5-4 5-4-5Z M344 275l4 5-4 5-4-5Z"/></g>
      <g fill="${ink}" font-family="Arial,sans-serif"><text x="31" y="34" font-size="8" letter-spacing="1.5">${esc(item.number)}</text><g fill="none" stroke="${pigment}" stroke-width="1"><path d="M326 25v14m-7-7h14m-12-5 10 10m0-10-10 10"/></g></g>
      ${mark ? `<image href="${esc(mark)}" x="90" y="50" width="180" height="110" preserveAspectRatio="xMidYMid meet"/>` : `<svg x="76" y="45" width="210" height="130" viewBox="0 0 300 190" color="${pigment}"><use href="${esc(ctx.assetUrl('/assets/images/menu-specimens.svg'))}#${art}"/></svg>`}
      <g fill="${ink}" font-family="Georgia,serif">${fit(c.name || t.newName,198,31)}</g><g fill="${pigment}" font-family="Arial,sans-serif">${fit(tags,222,10)}</g>
      <g transform="translate(20 235)" fill="none" stroke="${pigment}" stroke-width=".7"><path d="${path(1)}L320 96H0Z" fill="${pigment}" fill-opacity=".08" stroke="none"/>${wave}</g>
      <g fill="${pigment}" font-family="Arial,sans-serif" font-size="7">${AXES.map((axis,i) => `<text x="${52+i*64}" y="348" text-anchor="middle">${esc(COPY[language][axis])}</text>`).join('')}</g>
      <path d="M27 360h306" stroke="${pigment}" stroke-width=".5" stroke-dasharray="1 2"/><text x="27" y="386" fill="${ink}" font-family="Arial,sans-serif" font-size="10">${esc(COPY[language].reveal)}</text><path class="demo-spur-glyph" d="M249 377v10m-5-5h10" stroke="${ink}"/><text x="333" y="388" text-anchor="end" fill="${ink}" font-family="Georgia,serif" font-size="19">${esc(formatted)}</text>
    </svg>${interactive?`<button type="button" class="demo-card-reveal" aria-expanded="false" aria-label="${esc(COPY[language].reveal)}"></button><div class="demo-card-story" style="color:${ink}" aria-hidden="true"><p>${esc(c.thought)}</p><p>${esc(c.ingredients)}</p></div>`:''}</div>`;
  }
  function arm(target) {
    if (target.dataset.armed) { delete target.dataset.armed; return true; }
    target.dataset.armed = 'true';
    const oldTitle = target.title, oldLabel = target.getAttribute('aria-label');
    target.title = t.confirm; target.setAttribute('aria-label',t.confirm); target.innerHTML = icon('check');
    after(() => { delete target.dataset.armed; target.title=oldTitle; target.setAttribute('aria-label',oldLabel || oldTitle); target.innerHTML=icon('remove'); }, 4000);
    return false;
  }
  function animateRows(before) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    main.querySelectorAll('[data-menu-row]').forEach(row => { const old = before.get(row.dataset.id), now = row.getBoundingClientRect(); if(old && Math.abs(old.top-now.top)>1) row.animate([{transform:`translateY(${old.top-now.top}px)`},{transform:'translateY(0)'}],{duration:350,easing:'cubic-bezier(.2,.7,.2,1)'}); });
  }
  function listRender(highlight) {
    const list = main.querySelector('.menu-list'); if (!list) return;
    // Initial snapshots can differ from browser-local data. They must never be
    // used as animation start geometry during navigation or language changes.
    const before = listPainted ? new Map([...list.querySelectorAll('[data-menu-row]')].map(row => [row.dataset.id,row.getBoundingClientRect()])) : new Map();
    listPainted = true;
    list.innerHTML = categories().map(category => `<section class="menu-group" data-menu-group="${esc(category.id)}">
      <div class="menu-group-title" draggable="true" data-category-heading="${esc(category.id)}" title="${esc(t.move)}"><button type="button" class="category-name" draggable="true" data-menu-action="rename" data-category-id="${esc(category.id)}" aria-label="${esc(t.rename)}">${esc(catName(category))}</button><span class="demo-grip" aria-hidden="true">${icon('grip')}</span></div>
      <div class="menu-slots" data-drop-category="${esc(category.id)}">${items().filter(item => item.category===category.id).map(item => `<article class="menu-row${item.id===highlight?' is-updated':''}" data-menu-row data-id="${esc(item.id)}" data-category="${esc(category.id)}" draggable="true" tabindex="0" aria-label="${esc(itemName(item))}" title="${esc(t.move)}">
        <input class="row-select" type="checkbox" value="${esc(item.id)}" aria-label="${esc(itemName(item))}"${selected.has(item.id)?' checked':''}>
        <a class="menu-row-preview" href="/admin/menu/edit/?id=${encodeURIComponent(item.id)}" data-menu-action="edit" data-id="${esc(item.id)}" aria-label="${esc(t.edit)}">${card(item)}</a>
        <div class="menu-row-name"><div class="eyebrow">${esc(item.number)} · ${esc(t[item.cardMode==='image'?'image':'template'])}</div><h2><a href="/admin/menu/edit/?id=${encodeURIComponent(item.id)}" data-menu-action="edit" data-id="${esc(item.id)}">${esc(itemName(item))}</a></h2><span class="menu-status${item.visible?' is-visible':''}">${esc(t[item.visible?'visible':'stored'])} · ${esc(catName(category))}</span></div>
        <div class="menu-row-actions">${button('edit',t.edit,'edit')}${button('visibility',t[item.visible?'hide':'show'],item.visible?'hide':'show')}${button('duplicate',t.copy,'copy')}${button('delete',t.remove,'remove','data-confirm-delete')}</div>
      </article>`).join('')}<p class="menu-drop-empty">+</p></div></section>`).join('');
    const count = main.querySelector('.menu-list-tools>span'); if(count)count.textContent=menu().items.length+' '+t.count;
    for(const select of main.querySelectorAll('[data-category-filter],#menu-batch [name=destination]')) {const current=select.value;select.innerHTML=choices(current,select.hasAttribute('data-category-filter'));}
    let trash = main.querySelector('.menu-trash'); if(!trash){trash=document.createElement('details');trash.className='menu-trash';list.after(trash);}
    trash.hidden=!menu().deleted.length;
    trash.innerHTML=`<summary>${esc(t.deleted)} · ${menu().deleted.length}</summary>`+menu().deleted.map(item=>`<div class="menu-trash-row" data-id="${esc(item.id)}"><span>${esc(item.number)} · ${esc(itemName(item))}</span><div>${button('restore',t.restore,'restore')}${button('purge',t.purge,'remove','data-confirm-delete data-danger')}</div></div>`).join('');
    filter(); selection(); animateRows(before);
  }
  function filter() {
    const query=(main.querySelector('[data-menu-search]')?.value || '').toLocaleLowerCase(), category=main.querySelector('[data-category-filter]')?.value || '', status=main.querySelector('[data-status-filter]')?.value || '';
    for(const row of main.querySelectorAll('[data-menu-row]')) {const item=menu().items.find(i=>i.id===row.dataset.id);row.hidden=!!((query&&!`${item.number} ${item.copy?.de?.name||''} ${item.copy?.en?.name||''}`.toLocaleLowerCase().includes(query)) || (category&&item.category!==category) || (status&&status!==(item.visible?'visible':'stored')));}
    for(const group of main.querySelectorAll('[data-menu-group]'))group.hidden=!!category&&group.dataset.menuGroup!==category;
  }
  function selection() {const count=main.querySelector('[data-selection-count]');if(count)count.textContent=selected.size;main.querySelectorAll('#menu-batch button').forEach(b=>b.disabled=selected.size===0);const all=main.querySelector('[data-select-all]'),rows=[...main.querySelectorAll('[data-menu-row]:not([hidden])')];if(all){all.checked=rows.length>0&&rows.every(r=>selected.has(r.dataset.id));all.indeterminate=!all.checked&&rows.some(r=>selected.has(r.dataset.id));}}
  function openDialog(title, content) {
    const d=document.createElement('dialog');d.className='admin-menu-dialog workspace demo-menu-dialog';d.setAttribute('aria-label',title);
    d.innerHTML=`<div class="dialog-head"><h2>${esc(title)}</h2>${button('close',t.close,'close','data-dialog-close')}</div><div class="dialog-body"></div>`;
    d.querySelector('.dialog-body').append(content);document.body.append(d);dialogs.add(d);document.body.classList.add('has-menu-dialog');
    const close=()=>{d.close();d.remove();dialogs.delete(d);if(!dialogs.size)document.body.classList.remove('has-menu-dialog');};
    d.addEventListener('click',event=>{if(event.target.closest('[data-dialog-close]')){event.preventDefault();close();}}, {signal});
    d.addEventListener('cancel',event=>{event.preventDefault();close();},{signal});d.showModal();
    return {element:d,close};
  }
  function freshItem() {return {id:uid('card'),number:'PENDI / '+String(menu().items.length+menu().deleted.length+1).padStart(2,'0'),order:Math.max(0,...menu().items.map(i=>i.order))+10,category:categories()[0].id,visible:false,cardMode:'template',art:'tomate',color:DEFAULT_COLORS[0],copy:{de:{name:'',tags:[],thought:'',ingredients:''},en:{name:'',tags:[],thought:'',ingredients:''}},price:null,profile:null,previewPrice:14,previewProfile:{acidity:2.5,sweetness:2.5,body:2.5,complexity:2.5,abv:10}};}
  async function editor(id, inPlace = null) {
    const original=menu().items.find(i=>i.id===id),draft=clone(original || freshItem());let viewLang=cardLang,storyOpen=false;
    let form;
    if(inPlace){form=inPlace;}
    else {
      try {const html=await ctx.snapshot('/admin/menu/edit/',lang);if(!alive||ctx.signal?.aborted)return;const doc=new DOMParser().parseFromString(html,'text/html');form=doc.querySelector('.menu-editor');if(!form)throw Error('editor');}
      catch {say(t.invalid);return;}
    }
    form.querySelectorAll('iframe,script,[name=csrf],[name=menuRevision],.asset-link,.menu-icon-current,[name=clearIcon]').forEach(e=>e.remove());
    form.removeAttribute('action');form.removeAttribute('target');form.noValidate=true;
    const holder=document.createElement('div');if(!inPlace)holder.append(form);
    const dialog=inPlace?null:openDialog(original?t.edit:t.add,holder);
    const close=()=>dialog?dialog.close():ctx.navigate('/admin/menu/?lang='+lang,{preserveScroll:true});
    const field=name=>form.elements.namedItem(name),set=(name,value)=>{const e=field(name);if(e)e.value=value??'';};
    set('number',draft.number);set('order',draft.order);set('cardMode',draft.cardMode);field('category').innerHTML=choices(draft.category);field('visible').checked=!!draft.visible;
    set('cardColor',draft.color||'');
    for(const l of ['de','en']){const c=draft.copy?.[l]||{};for(const key of ['name','thought','ingredients'])set(l+'_'+key,c[key]);set(l+'_tags',Array.isArray(c.tags)?c.tags.join(', '):c.tags);}
    set('priceStatus',draft.price===null||draft.price===undefined?'pending':'confirmed');set('price',draft.price??draft.previewPrice??14);
    set('profileStatus',draft.profile?'confirmed':'pending');for(const a of AXES)set(a,draft.profile?.[a]??draft.previewProfile?.[a]??0);
    const priceInput=field('price');priceInput.type='range';priceInput.min='0';priceInput.max='100';priceInput.step='.1';priceInput.closest('label').classList.add('profile-slider');const priceOutput=document.createElement('output');priceOutput.dataset.priceOutput='';priceInput.before(priceOutput);
    const orderLabel=field('order')?.closest('label');if(orderLabel)orderLabel.hidden=true;
    const preview=form.querySelector('.menu-preview');let stage=preview.querySelector('.demo-preview-stage');if(!stage){stage=document.createElement('div');stage.className='demo-preview-stage';preview.append(stage);}
    form.querySelector('[data-preview-status]')?.remove();
    form.querySelectorAll('[name=cardlang]').forEach(b=>{b.type='button';b.removeAttribute('formaction');b.removeAttribute('formtarget');b.addEventListener('click',()=>{viewLang=b.value;update();},{signal});});
    form.querySelectorAll('.menu-save a').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();close();},{signal}));
    const fallbackColors=form.querySelector('.menu-colors');
    function colors() {
      const current=field('cardColor').value,wrap=fallbackColors.querySelector('.color-presets');
      wrap.innerHTML=button('default-color',t.original,'restore','data-card-color=""')+menu().colorPresets.map(color=>`<span class="color-preset"><button type="button" class="color-swatch" style="--swatch:${color}" data-card-color="${color}" aria-label="${color}" title="${color}" aria-pressed="${current===color}"></button>${DEFAULT_COLORS.includes(color)?'':`<button type="button" class="color-remove" data-remove-color="${color}" aria-label="${esc(t.remove+' '+color)}">${icon('close')}</button>`}</span>`).join('');
      const color=/^#[a-f\d]{6}$/i.test(current)?current:DEFAULT_COLORS[0];fallbackColors.querySelectorAll('[data-color-channel]').forEach((input,i)=>input.value=parseInt(color.slice(1+i*2,3+i*2),16));
    }
    function assetChoices() {
      const artPicker=form.querySelector('.menu-art-picker');
      artPicker.innerHTML=ARTS.map(art=>`<label class="menu-art-option"><input type="radio" name="art" value="${art}" aria-label="${art}"${!draft.markAsset&&draft.art===art?' checked':''}><svg viewBox="0 0 300 190" aria-hidden="true"><use href="${esc(ctx.assetUrl('/assets/images/menu-specimens.svg'))}#${art}"/></svg></label>`).join('')+menu().assets.filter(a=>a.kind==='menu-icons').map(a=>`<label class="menu-art-option"><input type="radio" name="art" value="mark:${esc(a.id)}" aria-label="${esc(a.name||'Mark')}"${draft.markAsset===a.id?' checked':''}><img src="${esc(safeImage(a.src))}" alt=""></label>`).join('');
      for(const l of ['de','en']){const select=field(l+'_asset');select.innerHTML='<option value="">—</option>'+menu().assets.filter(a=>a.kind==='menu-cards').map(a=>`<option value="${esc(a.id)}"${draft.imageAssets?.[l]===a.id?' selected':''}>${esc(a.name||a.id)} · 1080 × 1680</option>`).join('');}
    }
    function read() {
      draft.number=field('number').value.trim();draft.category=field('category').value;draft.visible=field('visible').checked;draft.cardMode=field('cardMode').value;draft.color=field('cardColor').value;
      draft.copy||={};for(const l of ['de','en']){draft.copy[l]={name:field(l+'_name').value.trim(),thought:field(l+'_thought').value.trim(),ingredients:field(l+'_ingredients').value.trim(),tags:field(l+'_tags').value.split(/[,，]/).map(v=>v.trim()).filter(Boolean)};const asset=field(l+'_asset').value;draft.imageAssets||={};draft.imageAssets[l]=asset;}
      const art=form.querySelector('[name=art]:checked')?.value||'tomate';if(art.startsWith('mark:')){draft.markAsset=art.slice(5);}else{draft.art=art;delete draft.markAsset;delete draft.icon;}
      draft.previewPrice=Number(field('price').value);draft.price=field('priceStatus').value==='confirmed'?draft.previewPrice:null;
      draft.previewProfile=Object.fromEntries(AXES.map(a=>[a,Number(field(a).value)]));draft.profile=field('profileStatus').value==='confirmed'?{...draft.previewProfile}:null;
    }
    function update() {
      read();
      form.querySelectorAll('[data-mode-section]').forEach(s=>{s.hidden=s.dataset.modeSection!==draft.cardMode;s.querySelectorAll('input,select,textarea').forEach(e=>e.disabled=s.hidden);});
      for(const name of ['price','profile'])form.querySelectorAll(`[data-status-value="${name}"]`).forEach(e=>e.disabled=draft.cardMode!=='template'||field(name+'Status').value!=='confirmed');
      form.querySelectorAll('[data-range-output]').forEach(o=>o.textContent=field(o.dataset.rangeOutput).value+(o.dataset.rangeOutput==='abv'?'%':''));
      priceOutput.textContent=Number(field('price').value).toFixed(2)+' €';
      stage.innerHTML=card(draft,viewLang,true);setStory();form.querySelectorAll('[name=cardlang]').forEach(b=>b.setAttribute('aria-pressed',String(b.value===viewLang)));
      form.querySelectorAll('.color-swatch').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cardColor===draft.color)));
    }
    colors();assetChoices();update();
    function setStory(){stage.querySelector('.demo-card-art')?.classList.toggle('is-story-open',storyOpen);stage.querySelector('.demo-card-reveal')?.setAttribute('aria-expanded',String(storyOpen));stage.querySelector('.demo-card-story')?.setAttribute('aria-hidden',String(!storyOpen));}
    stage.addEventListener('click',event=>{if(event.target.closest('.demo-card-reveal')){storyOpen=!storyOpen;setStory();}},{signal});
    form.addEventListener('input',event=>{event.target.removeAttribute('aria-invalid');if(event.target.matches('[data-color-channel]')){const values=[...fallbackColors.querySelectorAll('[data-color-channel]')].map(i=>Math.round(clamp(i.value,0,255)).toString(16).padStart(2,'0'));set('cardColor','#'+values.join(''));}if(event.target.type!=='file')update();},{signal});
    form.addEventListener('change',event=>{if(event.target.type!=='file')update();},{signal});
    form.addEventListener('click',event=>{
      const color=event.target.closest('[data-card-color]'),remove=event.target.closest('[data-remove-color]'),add=event.target.closest('[data-save-color]');
      if(color){event.preventDefault();set('cardColor',color.dataset.cardColor);colors();update();}
      if(remove){event.preventDefault();const value=remove.dataset.removeColor;if(!DEFAULT_COLORS.includes(value)&&commit(data=>data.colorPresets=data.colorPresets.filter(c=>c!==value),'menu.palette'))colors();}
      if(add){event.preventDefault();const color=field('cardColor').value;if(/^#[a-f\d]{6}$/i.test(color)&&!menu().colorPresets.includes(color)&&commit(data=>data.colorPresets.push(color),'menu.palette'))colors();}
    },{signal});
    form.querySelectorAll('input[type=file]').forEach(input=>input.addEventListener('change',async()=>{
      const file=input.files?.[0];if(!file)return;input.disabled=true;
      try {const asset=await loadPng(file,input.name==='icon'?'menu-icons':'menu-cards');if(!alive||!form.isConnected)return;if(!addAsset(asset))return;
        if(input.name==='icon'){draft.markAsset=asset.id;}else{draft.imageAssets||={};draft.imageAssets[input.name.slice(0,2)]=asset.id;}
        assetChoices();update();
      }catch(error){say(error.message||t.file);}finally{input.disabled=false;input.value='';}
    },{signal}));
    form.addEventListener('submit',event=>{
      event.preventDefault();read();let valid=true;
      const required=['number',...(draft.cardMode==='template'?['de_name','en_name','de_thought','en_thought','de_ingredients','en_ingredients']:[])];
      for(const name of required){const input=field(name),bad=!input.value.trim()||!input.checkValidity();if(bad)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid');if(bad)valid=false;}
      if(!valid){form.querySelector('[aria-invalid]')?.focus({preventScroll:true});say(t.invalid);return;}
      if(draft.cardMode==='image'&&(!imageFor(draft,'de')||!imageFor(draft,'en'))){say(t.bothImages);return;}
      if(commit(data=>{const index=data.items.findIndex(i=>i.id===draft.id);if(index<0)data.items.push(clone(draft));else data.items[index]=clone(draft);},original?'menu.edit':'menu.add',draft.number)){close();listRender(draft.id);say();}
    },{signal});
  }

  async function loadPng(file, kind) {
    if(file.size>1_048_576||file.size<33||!/^image\/png$/i.test(file.type)||!file.name.toLowerCase().endsWith('.png'))throw Error(t.file);
    const bytes=new Uint8Array(await file.arrayBuffer());
    if([137,80,78,71,13,10,26,10].some((n,i)=>bytes[i]!==n)||String.fromCharCode(...bytes.slice(12,16))!=='IHDR')throw Error(t.file);
    const view=new DataView(bytes.buffer),width=view.getUint32(16),height=view.getUint32(20);
    if(!width||!height||(kind==='menu-cards'?(width!==1080||height!==1680):(width>2048||height>2048)))throw Error(t.file);
    const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error(t.file));reader.readAsDataURL(file);});
    await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>img.naturalWidth===width&&img.naturalHeight===height?resolve():reject(Error(t.file));img.onerror=()=>reject(Error(t.file));img.src=src;});
    return {id:uid('asset'),kind,src,name:file.name.slice(0,100),width,height,size:file.size,createdAt:Date.now()};
  }
  function addAsset(asset) {
    const total=menu().assets.reduce((sum,a)=>sum+(a.src?.length||0),0)+asset.src.length;
    if(total>3_000_000){say(t.budget);return false;}
    return commit(data=>data.assets.push(asset),'menu.asset.add',asset.name);
  }
  function assetRefs(id) {return [...menu().items,...menu().deleted].filter(i=>i.markAsset===id||Object.values(i.imageAssets||{}).includes(id)).length;}
  function assetsPage(host) {
    host.innerHTML=['menu-icons','menu-cards'].map(kind=>`<section class="asset-kind" data-asset-kind="${kind}"><h2>${esc(t[kind==='menu-icons'?'marks':'cards'])}</h2><form class="asset-upload"><label>${esc(t.upload)}<input name="mark" type="file" accept="image/png" required></label><button class="icon-button" type="submit" aria-label="${esc(t.upload)}">${icon('add')}</button></form><p class="preview-action-note">${esc(t.localNote)} · ${kind==='menu-cards'?'1080 × 1680 px':'≤ 2048 × 2048 px'}</p><div class="asset-grid">${menu().assets.filter(a=>a.kind===kind).map(a=>{const refs=assetRefs(a.id);return `<article class="asset-tile" data-asset-id="${esc(a.id)}"><a href="${esc(safeImage(a.src))}" download="${esc(a.name||'card.png')}"><img src="${esc(safeImage(a.src))}" alt="${esc(a.name||'PNG')}"></a><div class="asset-meta"><strong>${esc(a.name||a.id)}</strong><span>${a.width} × ${a.height} · ${Math.ceil(a.size/1024)} KB</span><small>${esc(refs?t.used:t.unused)}${refs?' · '+refs:''}</small></div>${button('asset-delete',t.purge,'remove',`data-confirm-delete data-danger${refs?' disabled':''}`)}</article>`;}).join('')||`<p class="preview-action-note">${esc(t.empty)}</p>`}</div></section>`).join('');
  }
  function bindAssets(host) {
    assetsPage(host);
    host.addEventListener('submit',async event=>{event.preventDefault();const form=event.target.closest('.asset-upload');if(!form)return;const file=form.elements.mark.files?.[0];if(!file)return;const submit=form.querySelector('button');submit.disabled=true;
      try {const asset=await loadPng(file,form.closest('[data-asset-kind]').dataset.assetKind);if(alive&&host.isConnected&&addAsset(asset)){assetsPage(host);say();}}catch(error){say(error.message||t.file);}finally{submit.disabled=false;}
    },{signal});
    host.addEventListener('click',event=>{const b=event.target.closest('[data-menu-action="asset-delete"]');if(!b)return;event.preventDefault();const id=b.closest('[data-asset-id]').dataset.assetId;if(assetRefs(id)){say(t.usedAsset);return;}if(arm(b)&&commit(data=>data.assets=data.assets.filter(a=>a.id!==id),'menu.asset.delete'))assetsPage(host);},{signal});
  }
  function openAssets() {const host=document.createElement('section');host.className='asset-library';openDialog(t.assets,host);bindAssets(host);}
  function categoriesPage(host) {
    host.innerHTML=categories().map(c=>`<section class="category-editor" data-category-id="${esc(c.id)}" draggable="true"><h2>${esc(catName(c))}</h2><form data-category-form="${esc(c.id)}"><label>Deutsch<input name="categoryDe" value="${esc(c.name?.de)}" maxlength="32" required></label><label>English<input name="categoryEn" value="${esc(c.name?.en)}" maxlength="32" required></label><button type="submit" class="secondary icon-button" aria-label="${esc(t.save)}">${icon('save')}</button></form><div class="category-delete"><label>${esc(t.destination)}<select name="destination"><option value="">—</option>${categories().filter(o=>o.id!==c.id).map(o=>`<option value="${esc(o.id)}">${esc(catName(o))}</option>`).join('')}</select></label>${button('category-delete',t.remove,'remove',`data-confirm-delete data-danger${categories().length<2?' disabled':''}`)}</div></section>`).join('')+`<section class="category-editor" id="new-category"><h2>${esc(t.newCategory)}</h2><form data-category-form=""><label>Deutsch<input name="categoryDe" maxlength="32" required></label><label>English<input name="categoryEn" maxlength="32" required></label><button type="submit" class="icon-button" aria-label="${esc(t.add)}">${icon('add')}</button></form></section>`;
  }
  function bindCategories(host) {
    categoriesPage(host);
    host.addEventListener('submit',event=>{event.preventDefault();const f=event.target.closest('[data-category-form]');if(!f)return;const de=f.elements.categoryDe.value.trim(),en=f.elements.categoryEn.value.trim();if(!de||!en){say(t.invalid);return;}const id=f.dataset.categoryForm||uid('category');if(commit(data=>{const c=data.categories.find(c=>c.id===id);if(c)c.name={de,en};else data.categories.push({id,name:{de,en},order:Math.max(...data.categories.map(c=>c.order))+10});},'menu.category.save',de)){categoriesPage(host);listRender();say();}},{signal});
    host.addEventListener('click',event=>{const b=event.target.closest('[data-menu-action="category-delete"]');if(!b)return;event.preventDefault();if(categories().length<2){say(t.oneCategory);return;}const section=b.closest('[data-category-id]'),id=section.dataset.categoryId,destination=section.querySelector('[name=destination]').value;if(!destination){section.querySelector('select').focus();return;}if(arm(b)&&commit(data=>{data.categories=data.categories.filter(c=>c.id!==id);for(const item of [...data.items,...data.deleted])if(item.category===id)item.category=destination;},'menu.category.delete')){categoriesPage(host);listRender();}},{signal});
    host.addEventListener('dragstart',event=>{const c=event.target.closest('[data-category-id]');if(c&&!event.target.closest('input,select,button')){dragged={kind:'category',id:c.dataset.categoryId};event.dataTransfer.setData('text/plain',dragged.id);}},{signal});
    host.addEventListener('dragover',event=>{if(dragged?.kind==='category')event.preventDefault();},{signal});
    host.addEventListener('drop',event=>{const c=event.target.closest('[data-category-id]');if(c&&dragged?.kind==='category'){event.preventDefault();reorderCategory(dragged.id,c.dataset.categoryId);categoriesPage(host);dragged=null;}},{signal});
  }
  function openCategories() {const host=document.createElement('section');host.className='menu-categories';openDialog(t.categories,host);bindCategories(host);}
  function reorderCategory(id, target) {if(id===target)return;const list=categories(),from=list.findIndex(c=>c.id===id),to=list.findIndex(c=>c.id===target);if(from<0||to<0)return;list.splice(to,0,list.splice(from,1)[0]);if(commit(data=>{data.categories=list.map((c,i)=>({...c,order:(i+1)*10}));},'menu.category.reorder'))listRender();}
  function moveItem(id, category, targetId, afterTarget = false) {
    if(!menu().categories.some(c=>c.id===category)||targetId===id)return;
    const list=items(),item=list.find(i=>i.id===id);if(!item)return;const rest=list.filter(i=>i.id!==id);let at=targetId?rest.findIndex(i=>i.id===targetId):-1;if(at<0){at=rest.reduce((last,i,index)=>i.category===category?index+1:last,rest.length);}else if(afterTarget)at++;
    rest.splice(at,0,{...item,category});if(commit(data=>data.items=rest.map((i,index)=>({...i,order:(index+1)*10})),'menu.reorder',item.number))listRender(id);
  }
  function rename(id, target) {
    const category=menu().categories.find(c=>c.id===id);if(!category)return;
    const parent=target.parentElement;if(parent.querySelector('input'))return;const old=target.hidden;target.hidden=true;
    const form=document.createElement('form');form.className='category-rename';form.innerHTML=`<input name="name" value="${esc(catName(category))}" maxlength="32" required aria-label="${esc(t.rename)}"><button type="submit" class="secondary icon-button" aria-label="${esc(t.save)}">${icon('save')}</button>`;parent.append(form);form.elements.name.focus({preventScroll:true});
    form.addEventListener('submit',event=>{event.preventDefault();const value=form.elements.name.value.trim();if(value&&commit(data=>{data.categories.find(c=>c.id===id).name[cardLang]=value;},'menu.category.rename',value))listRender();},{signal});
    form.addEventListener('keydown',event=>{if(event.key==='Escape'){form.remove();target.hidden=old;}},{signal});
  }
  function action(event) {
    const target=event.target.closest('[data-menu-action]');
    if(!target){const a=event.target.closest('a[href]');if(!a)return;let url;try{url=new URL(a.getAttribute('href'),location.href);}catch{return;}if(url.pathname==='/admin/menu/edit/'){event.preventDefault();editor(url.searchParams.get('id'));}else if(url.pathname==='/admin/menu/categories/'){event.preventDefault();openCategories();}else if(url.pathname==='/admin/assets/'){event.preventDefault();openAssets();}return;}
    const name=target.dataset.menuAction,id=target.dataset.id||target.closest('[data-id]')?.dataset.id,item=menu().items.find(i=>i.id===id);
    if(['asset-delete','category-delete'].includes(name))return;
    event.preventDefault();
    if(name==='edit'){editor(id);return;}if(name==='rename'){rename(target.dataset.categoryId,target);return;}
    if(name==='visibility'&&item&&commit(data=>{data.items.find(i=>i.id===id).visible=!item.visible;},'menu.visibility',item.number)){listRender(id);return;}
    if(name==='duplicate'&&item){const copy=clone(item);copy.id=uid('card');copy.number=item.number+' · 2';copy.number=copy.number.slice(0,24);copy.order=item.order+.1;copy.visible=false;if(commit(data=>{data.items.push(copy);data.items.sort((a,b)=>a.order-b.order).forEach((i,index)=>i.order=(index+1)*10);},'menu.duplicate',item.number)){listRender(copy.id);say();}return;}
    if(name==='delete'&&item&&arm(target)){if(commit(data=>{data.deleted.push(data.items.find(i=>i.id===id));data.items=data.items.filter(i=>i.id!==id);},'menu.delete',item.number)){selected.delete(id);listRender();}return;}
    if(name==='restore'){const deleted=menu().deleted.find(i=>i.id===id);if(deleted&&commit(data=>{const restored=clone(deleted);if(!data.categories.some(c=>c.id===restored.category))restored.category=data.categories[0].id;data.items.push(restored);data.deleted=data.deleted.filter(i=>i.id!==id);},'menu.restore'))listRender(id);return;}
    if(name==='purge'&&arm(target)&&commit(data=>data.deleted=data.deleted.filter(i=>i.id!==id),'menu.purge'))listRender();
  }

  main.addEventListener('click',action,{signal});
  main.addEventListener('input',event=>{if(event.target.matches('[data-menu-search]')){filter();selection();}},{signal});
  main.addEventListener('change',event=>{
    const target=event.target;if(target.matches('[data-category-filter],[data-status-filter]')){filter();selection();}
    if(target.matches('.row-select')){target.checked?selected.add(target.value):selected.delete(target.value);selection();}
    if(target.matches('[data-select-all]')){main.querySelectorAll('[data-menu-row]:not([hidden]) .row-select').forEach(c=>{c.checked=target.checked;target.checked?selected.add(c.value):selected.delete(c.value);});selection();}
  },{signal});
  main.addEventListener('submit',event=>{
    if(event.target.id!=='menu-batch')return;event.preventDefault();const action=event.submitter?.value,destination=event.target.elements.destination.value;
    if(commit(data=>data.items.forEach(i=>{if(selected.has(i.id)){if(action==='batch_store')i.visible=false;else if(action==='batch_show')i.visible=true;else if(action==='batch_move')i.category=destination;}}),'menu.batch',action)){listRender();say();}
  },{signal});
  main.addEventListener('dragstart',event=>{
    if(event.target.closest('input,select,textarea,a,button:not([data-menu-action="rename"])')){event.preventDefault();return;}
    const row=event.target.closest('[data-menu-row]'),heading=event.target.closest('[data-category-heading]');
    if(row)dragged={kind:'card',id:row.dataset.id};else if(heading)dragged={kind:'category',id:heading.dataset.categoryHeading};else return;
    event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragged.id);event.target.classList.add('is-dragging');
  },{signal});
  main.addEventListener('dragover',event=>{if(dragged&&event.target.closest('[data-drop-category],[data-category-heading]')){event.preventDefault();event.dataTransfer.dropEffect='move';}},{signal});
  main.addEventListener('drop',event=>{
    if(!dragged)return;event.preventDefault();const group=event.target.closest('[data-menu-group]'),row=event.target.closest('[data-menu-row]');if(group){if(dragged.kind==='category')reorderCategory(dragged.id,group.dataset.menuGroup);else moveItem(dragged.id,group.dataset.menuGroup,row?.dataset.id,row?event.clientY>row.getBoundingClientRect().top+row.offsetHeight/2:false);}dragged=null;
  },{signal});
  main.addEventListener('dragend',()=>{dragged=null;main.querySelectorAll('.is-dragging').forEach(e=>e.classList.remove('is-dragging'));},{signal});
  main.addEventListener('keydown',event=>{
    const row=event.target.closest('[data-menu-row]');if(!row||event.target!==row||!event.altKey||!['ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const group=items().filter(i=>i.category===row.dataset.category),at=group.findIndex(i=>i.id===row.dataset.id),target=group[at+(event.key==='ArrowUp'?-1:1)];if(target){moveItem(row.dataset.id,row.dataset.category,target.id,event.key==='ArrowDown');main.querySelector(`[data-id="${CSS.escape(row.dataset.id)}"]`)?.focus({preventScroll:true});}
  },{signal});
  // On touch screens a deliberate hold starts sorting; an ordinary swipe remains scroll.
  main.addEventListener('pointerdown',event=>{if(event.pointerType!=='touch'||event.target.closest('button,input,select,textarea,a'))return;const row=event.target.closest('[data-menu-row]');if(!row)return;const active={id:row.dataset.id,x:event.clientX,y:event.clientY,pointerId:event.pointerId,ready:false};touchDrag=active;after(()=>{if(touchDrag===active){active.ready=true;row.classList.add('is-dragging');}},350);},{signal});
  main.addEventListener('pointermove',event=>{if(!touchDrag)return;if(!touchDrag.ready&&(Math.abs(event.clientX-touchDrag.x)+Math.abs(event.clientY-touchDrag.y)>10)){touchDrag=null;return;}if(touchDrag.ready&&event.cancelable)event.preventDefault();},{signal,passive:false});
  main.addEventListener('pointerup',event=>{const active=touchDrag;touchDrag=null;main.querySelectorAll('.is-dragging').forEach(e=>e.classList.remove('is-dragging'));if(!active?.ready)return;const target=document.elementFromPoint(event.clientX,event.clientY),group=target?.closest('[data-menu-group]'),row=target?.closest('[data-menu-row]');if(group)moveItem(active.id,group.dataset.menuGroup,row?.dataset.id,row?event.clientY>row.getBoundingClientRect().top+row.offsetHeight/2:false);},{signal});
  main.addEventListener('pointercancel',()=>{touchDrag=null;main.querySelectorAll('.is-dragging').forEach(e=>e.classList.remove('is-dragging'));},{signal});

  if(main.querySelector('.menu-list'))listRender();
  else if(main.querySelector('.menu-categories'))bindCategories(main.querySelector('.menu-categories'));
  else if(main.querySelector('.asset-library'))bindAssets(main.querySelector('.asset-library'));
  else if(main.querySelector('.menu-editor')){const form=main.querySelector('.menu-editor'),id=new URL(ctx.route,'https://preview.invalid').searchParams.get('id');editor(id,form);}
  return () => {alive=false;controller.abort();timers.forEach(clearTimeout);for(const d of dialogs){d.close();d.remove();}document.body.classList.remove('has-menu-dialog');};
}
