import {businessSettings} from './business-config.js?v=ca1c440043db';
// Local presentation data only; replace with validated, authorised backend data in phase 5.
// null = unconfirmed day, false = closed, true = open. ISO weekdays: Monday 1–Sunday 7.
// Opening hours are separate from reservation admission/capacity rules.
export const OPENING_HOURS = {
  status: 'layout-example',
  timeZone: 'Europe/Berlin',
  // Days are unconfirmed: repeat the owner's 19:00–02:00 placeholder for layout only.
  week: Array.from({length:7},(_,i)=>({day:i+1,open:true,intervals:[{start:'19:00',end:'02:00',endDayOffset:1}]}))
};

function applyBusinessHours(){if(!businessSettings)return;Object.assign(OPENING_HOURS,{status:businessSettings.configured?'configured':'layout-example',week:businessSettings.week.map(d=>({...d,intervals:[{start:d.start,end:d.end,endDayOffset:d.endDayOffset}]}))});}
applyBusinessHours();document.addEventListener('pendi:business-settings',applyBusinessHours);
