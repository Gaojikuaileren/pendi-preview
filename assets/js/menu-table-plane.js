// Measured cover corners at the approved r4 menu stop, in 512 x 768 source
// pixels: far-left, far-right, near-right, near-left. These are visual anchors,
// not camera calibration. The text shares both sets of converging edge lines.
const cover=[{x:100.5,y:107.3},{x:238.9,y:113.7},{x:224.9,y:254.2},{x:59.7,y:246.7}];
// r4: the tabletop settles from the lower right, then departs to the lower
// right toward the next scene. Follow decoded video progress, not wheel speed.
export function syncMenuTableMotion(scene,position,reduced=false){
 if(!scene)return;
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 const entry=smooth((position-.78)/.22),exit=smooth((position-1)/.22);
 const scale=Math.min(1.2,scene.clientWidth/402);
 const x=reduced?0:(position<=1?150*(1-entry):160*exit)*scale;
 const y=reduced?0:(position<=1?110*(1-entry):90*exit)*scale;
 const opacity=reduced?(Math.round(position)===1?1:0):position<=1?entry:1-exit;
 scene.style.setProperty('--menu-type-x',`${x}px`);scene.style.setProperty('--menu-type-y',`${y}px`);
 scene.style.setProperty('--menu-type-opacity',String(opacity));scene.dataset.tableFrame=position.toFixed(4);
 const travel=position<=1?1-entry:exit;
 scene.style.setProperty('--menu-pile-x',`${reduced?0:(scene.clientWidth+160)*travel}px`);
 scene.style.setProperty('--menu-pile-y',`${reduced?0:120*travel}px`);
}
const line=(a,b)=>({a:a.y-b.y,b:b.x-a.x,c:a.x*b.y-b.x*a.y});
function crossing(u,v){const d=u.a*v.b-v.a*u.b;return Math.abs(d)<1e-8?null:{x:(u.b*v.c-v.b*u.c)/d,y:(u.c*v.a-v.c*u.a)/d};}
function matrix(points,width,height){
 const [p0,p1,p2,p3]=points;
 const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
 const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
 const denominator=dx1*dy2-dx2*dy1;
 const g=(dx3*dy2-dx2*dy3)/denominator,h=(dx1*dy3-dx3*dy1)/denominator;
 const a=p1.x-p0.x+g*p1.x,b=p3.x-p0.x+h*p3.x,d=p1.y-p0.y+g*p1.y,e=p3.y-p0.y+h*p3.y;
 return [a/width,d/width,0,g/width,b/height,e/height,0,h/height,0,0,1,0,p0.x,p0.y,0,1];
}
export function projectMenuType(scene){
 const film=document.querySelector('[data-scroll-video]'),copy=scene.querySelector('.scene-copy'),ink=scene.querySelector('.menu-ink-plane');
 if(!film||!ink||!ink.offsetWidth||!ink.offsetHeight)return;
 const r=film.getBoundingClientRect(),style=getComputedStyle(film),position=style.objectPosition.split(/\s+/).map(parseFloat);
 const measure=document.createElement('canvas').getContext('2d');
 for(const text of ink.querySelectorAll('.menu-descriptor,.eyebrow')){
  const type=getComputedStyle(text);measure.font=`${type.fontStyle} ${type.fontWeight} ${type.fontSize} ${type.fontFamily}`;
  const metrics=measure.measureText(text.dataset.projectionSample||text.textContent.trim());
  const height=metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent;
  // Moving the shadow by 3/4 of the ink height leaves about 1/4 overlap.
  text.style.setProperty('--menu-shadow-y',`${(height*.75).toFixed(2)}px`);
 }
 const scale=Math.max(r.width/512,r.height/768),left=r.left+(r.width-512*scale)*position[0]/100,top=r.top+(r.height-768*scale)*position[1]/100;
 const book=cover.map(p=>({x:left+p.x*scale,y:top+p.y*scale}));
 const hit=scene.querySelector('.menu-book-entry');
 if(hit){
  const minX=Math.min(...book.map(p=>p.x)),minY=Math.min(...book.map(p=>p.y)),w=Math.max(...book.map(p=>p.x))-minX,h=Math.max(...book.map(p=>p.y))-minY;
  Object.assign(hit.style,{left:minX+'px',top:minY+'px',width:w+'px',height:h+'px',clipPath:`polygon(${book.map(p=>`${(p.x-minX)/w*100}% ${(p.y-minY)/h*100}%`).join(',')})`});
 }
 const horizontal=crossing(line(book[0],book[1]),line(book[3],book[2]));
 const depth=crossing(line(book[0],book[3]),line(book[1],book[2]));
 if(!horizontal||!depth)return;
 const origin={x:copy.offsetLeft,y:copy.offsetTop};
 const farLeft={x:origin.x+12,y:origin.y+3};
 // Preserve the reference text scale when its column moves/narrows.
 const baseline=line(farLeft,horizontal),farRight={x:farLeft.x+ink.offsetWidth*(1-32/354),y:0};
 farRight.y=-(baseline.a*farRight.x+baseline.c)/baseline.b;
 // A restrained 10% height reduction retains readable letter shapes. The
 // convergence/direction come from the image, not from stacked CSS rotations.
 const nearLeft={x:0,y:farLeft.y+ink.offsetHeight*.9};
 const side=line(farLeft,depth);nearLeft.x=-(side.b*nearLeft.y+side.c)/side.a;
 const nearRight=crossing(line(nearLeft,horizontal),line(farRight,depth));if(!nearRight)return;
 const quad=[farLeft,farRight,nearRight,nearLeft],local=quad.map(p=>({x:p.x-origin.x,y:p.y-origin.y}));
 const values=matrix(local,ink.offsetWidth,ink.offsetHeight);if(!values.every(Number.isFinite))return;
 ink.style.setProperty('--menu-table-transform',`matrix3d(${values.join(',')})`);
 ink.dataset.tableQuad=JSON.stringify(quad);ink.dataset.coverQuad=JSON.stringify(book);
}
