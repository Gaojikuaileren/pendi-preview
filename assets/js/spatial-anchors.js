// r4 home stop (frame 0), measured in the ORIGINAL 512 x 768 video.
// Layout calibration belongs here. Do not change the video to fix UI placement.
export const HOME_GLASS_ANCHORS={
 source:{width:512,height:768},
 base:{x:369.3547,y:456.9336},
 ring:{radius:84.35698,offsetY:21.96796,depth:33.3913},
 body:{x:294.6613,y:340.9428,width:149.3867,height:97.5378},
};
// CSS viewport groups, not hardware identities. Offsets are source pixels.
const textRingGeometry={radius:.57,depth:.18,rows:[.44]};
export const GLASS_LAYOUT_PRESETS={
 'phone-pro':{offsetX:0,offsetY:0,rings:{...textRingGeometry},minBodyWidth:116},
 'phone-compact':{offsetX:0,offsetY:0,rings:{...textRingGeometry},minBodyWidth:116},
 'portrait-large':{offsetX:0,offsetY:0,rings:{...textRingGeometry},minBodyWidth:128},
 'landscape':{offsetX:0,offsetY:0,rings:{...textRingGeometry},minBodyWidth:116},
 'desktop':{offsetX:0,offsetY:0,rings:{...textRingGeometry},minBodyWidth:128},
};
export function projectHomeGlass(video){
 const key=innerWidth>=900?'desktop':innerWidth>=600&&innerWidth>=innerHeight?'landscape':innerWidth>=600?'portrait-large':innerWidth>=380&&innerHeight>=700?'phone-pro':'phone-compact';
 const preset=GLASS_LAYOUT_PRESETS[key],a=HOME_GLASS_ANCHORS,r=video.getBoundingClientRect(),style=getComputedStyle(video);
 // Existing CSS uses percentage object-position; unsupported crops fall back.
 const position=style.objectPosition.split(/\s+/);if(style.objectFit!=='cover'||position.length!==2||position.some(p=>!/^\d+(\.\d+)?%$/.test(p)))return null;
 const scale=Math.max(r.width/a.source.width,r.height/a.source.height),left=r.left+(r.width-a.source.width*scale)*parseFloat(position[0])/100,top=r.top+(r.height-a.source.height*scale)*parseFloat(position[1])/100;
 const point=(x,y)=>({x:left+(x+preset.offsetX)*scale,y:top+(y+preset.offsetY)*scale});
 const base=point(a.base.x,a.base.y),corner=point(a.body.x,a.body.y);
 return{key,preset,base,scale,ring:{radius:a.ring.radius*scale,offsetY:a.ring.offsetY*scale,depth:a.ring.depth*scale},body:{left:corner.x,top:corner.y,width:a.body.width*scale,height:a.body.height*scale}};
}
