// Render once for both the on-screen preview and PNG file: the downloaded card
// is the exact artwork shown. No remote assets, uploads or screenshot library.
const logo=new Image();logo.src=new URL('../logo/pendi-wordmark.svg',import.meta.url).href;
const ready=Promise.all([logo.decode(),document.fonts.load('500 88px "Cormorant Garamond"'),document.fonts.load('400 32px "Manrope"')]);
// Keep asset failures handled even before a visitor opens the card dialog.
ready.catch(()=>{});
export async function createContactCard(kind,lang,data){
 await ready;
 const job=kind==='jobs',de=lang==='de',canvas=document.createElement('canvas');
 canvas.width=1200;canvas.height=760;
 const ctx=canvas.getContext('2d'),paper=job?'#29231f':'#ded3c0',ink=job?'#e6dbc7':'#2b2019';
 ctx.fillStyle=paper;ctx.fillRect(0,0,1200,760);
 // An offset terrain motif leaves the whole left reading column quiet.
 ctx.strokeStyle=job?'#a88b62':'#ad9472';ctx.lineWidth=2;
 for(let layer=0;layer<5;layer++){
  ctx.globalAlpha=.38;ctx.beginPath();
  for(let i=0;i<=180;i++){
   const a=i*Math.PI/90,r=125+layer*30+18*Math.sin(3*a)+10*Math.cos(5*a+layer*.17);
   const x=1050+Math.cos(a)*r,y=430+Math.sin(a)*r*1.2;
   if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }ctx.closePath();ctx.stroke();
 }ctx.globalAlpha=1;
 const mark=document.createElement('canvas');mark.width=300;mark.height=149;
 const mc=mark.getContext('2d');mc.drawImage(logo,0,0,300,149);mc.globalCompositeOperation='source-in';mc.fillStyle=ink;mc.fillRect(0,0,300,149);
 ctx.drawImage(mark,72,55,210,104);
 ctx.fillStyle=ink;
 const text=(value,x,y,size=32,family='Manrope',width=650)=>{ctx.font=`400 ${size}px "${family}"`;const fit=Math.min(size,size*width/Math.max(1,ctx.measureText(value).width));ctx.font=`400 ${fit}px "${family}"`;ctx.fillText(value,x,y);};
 text(job?(de?'TEAM · 02':'TEAM · 02'):(de?'KONTAKT · 01':'CONTACT · 01'),825,94,23);
 const title=(job?data.jobsTitle:data.contactTitle)?.split('\n').slice(0,2)??(job?(de?['Ihr Platz','im Team.']:['Your place','on the team.']):(de?['Bis bald,','Düsseldorf.']:['See you,','Düsseldorf.']));
 title.forEach((line,i)=>text(line,72,294+i*86,88,'Cormorant Garamond'));
 const tagline=(job?data.jobsTagline:data.contactTagline)??(job?(de?'Lassen Sie uns ins Gespräch kommen.':'Let’s start a conversation.'):(de?'Gute Drinks. Gute Gesellschaft.':'Good drinks. Good company.'));
 text(tagline,76,451,30);
 ctx.strokeStyle=job?'#a88b6266':'#ad947288';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(76,498);ctx.lineTo(715,498);ctx.stroke();
 // User-provided recruitment placeholder, separate from the general contact email.
 const lines=job?[data.jobsEmail||'job@pendibar.de',data.address+' · '+(data.city||'Düsseldorf')]:[data.address+' · '+(data.city||'Düsseldorf'),data.phone,data.email];
 lines.forEach((line,i)=>text(line,76,552+i*47,32));
 text('PENDI · '+(data.city||'Düsseldorf').toUpperCase(),76,711,20);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG unavailable')),'image/png'));
 return {blob,canvas,alt:['Pendi',...title,tagline,...lines].join(' · ')};
}
