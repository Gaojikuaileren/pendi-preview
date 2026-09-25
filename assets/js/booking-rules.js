import {businessSettings} from './business-config.js?v=ec35d2debdae';
// Local design configuration only. No live capacity, backend or trusted server clock.
export const BOOKING_PREVIEW = {advanceDays:7,startMinutes:1200,endMinutes:1440,stepMinutes:30,maxGuests:8,segments:12};
export function validateConfig(c) {
 if(c.segments!==12||!Number.isInteger(c.advanceDays)||c.advanceDays<1||c.advanceDays>12||!Number.isInteger(c.maxGuests)||c.maxGuests<1||c.maxGuests>12||c.stepMinutes!==30||!Number.isInteger(c.startMinutes)||!Number.isInteger(c.endMinutes)||c.startMinutes<0||c.startMinutes>=1440||c.endMinutes<c.startMinutes||c.endMinutes>=2880||c.startMinutes%30||c.endMinutes%30||(c.endMinutes-c.startMinutes)/30+1>12)throw new Error('Booking preview configuration does not fit the 12-segment dials');
 return c;
}
const applySettings=()=>{if(businessSettings){validateConfig(businessSettings.booking);Object.assign(BOOKING_PREVIEW,businessSettings.booking,{week:businessSettings.week,closedDates:businessSettings.closedDates});}};
applySettings();
if(typeof document!=='undefined')document.addEventListener('pendi:business-settings',applySettings);
validateConfig(BOOKING_PREVIEW);
export const addDay=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
export const timeLabel=minutes=>`${String(Math.floor(minutes/60)%24).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
const berlinClock=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function berlinNow(now=new Date()) {
 const p=Object.fromEntries(berlinClock.formatToParts(now).map(p=>[p.type,p.value]));
 return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}:${p.second}`};
}
export function arrivalFor(serviceDate,minutes){return{date:addDay(serviceDate,Math.floor(minutes/1440)),time:timeLabel(minutes)};}
const arrivalCache=new Map();
function uniqueArrival(date,time){
 const key=date+'T'+time;
 if(arrivalCache.has(key))return arrivalCache.get(key);
 // Berlin's current booking dates use CET or CEST. A wall-clock time must
 // resolve exactly once; skip the missing/repeated hour instead of guessing.
 const wall=Date.parse(key+':00Z'),candidates=[1,2].map(hours=>wall-hours*3600000).filter(at=>{const local=berlinNow(new Date(at));return local.date===date&&local.time===time+':00';});
 const result=candidates.length===1?candidates[0]:null;
 if(arrivalCache.size>=512)arrivalCache.clear();
 arrivalCache.set(key,result);return result;
}
export const bookingClockKey=(now=new Date(),c=BOOKING_PREVIEW)=>berlinNow(now).date+':'+(c.minimumNotice?Math.ceil((now.getTime()/1000+c.minimumNotice*60)/1800):Math.floor(now.getTime()/1800000));
export function previewSlots(serviceDate,c=BOOKING_PREVIEW,now=new Date()) {
 const current=berlinNow(now),inWindow=serviceDate>=current.date&&serviceDate<=addDay(current.date,c.advanceDays-1);
 const weekday=(new Date(serviceDate+'T12:00:00Z').getUTCDay()+6)%7,day=c.week?.[weekday];
 const minute=value=>Number(value.slice(0,2))*60+Number(value.slice(3));
 const hoursClear=!day||uniqueArrival(serviceDate,day.start)!==null&&uniqueArrival(addDay(serviceDate,day.endDayOffset),day.end)!==null;
 const allowed=!c.paused&&!c.closedDates?.includes(serviceDate)&&(!day||day.open)&&hoursClear;
 const threshold=now.getTime()+(c.minimumNotice||0)*60000;
 return Array.from({length:12},(_,index)=>{const minutes=c.startMinutes+index*c.stepMinutes,arrival=arrivalFor(serviceDate,minutes),at=uniqueArrival(arrival.date,arrival.time);return{index,minutes,...arrival,enabled:allowed&&inWindow&&(!day||(minutes>=minute(day.start)&&minutes<minute(day.end)+day.endDayOffset*1440))&&minutes<=c.endMinutes&&at!==null&&at>now.getTime()&&at>=threshold};});
}
