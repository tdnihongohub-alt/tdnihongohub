import { addDays, validate } from './domain';
import type { Row } from './domain';

export type TimetableChange={before:Row;after:Row|null};
export function validDate(value:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const ms=Date.parse(value+'T12:00:00Z');
 return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===value;
}
export function daysBetween(from:string,to:string){
 if(!validDate(from)||!validDate(to))throw Error('Choose a valid date.');
 return Math.round((Date.parse(to+'T12:00:00Z')-Date.parse(from+'T12:00:00Z'))/86400000);
}
export function weekStart(date:string){const day=new Date(date+'T12:00:00Z').getUTCDay();return addDays(date,-((day+6)%7));}
export function sessionsInWeek(sessions:Row[],date:string,batchId=''){
 const start=weekStart(date),end=addDays(start,6);
 return sessions.filter(s=>s.date>=start&&s.date<=end&&(!batchId||s.batchId===batchId)).slice().sort((a,b)=>(a.date+a.time+a.id).localeCompare(b.date+b.time+b.id));
}
function canonical(value:any):any{
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>[k,canonical(value[k])]));
 return value;
}
export function sameSession(a:Row,b:Row){return JSON.stringify(canonical(a))===JSON.stringify(canonical(b));}
export function validateTimetableChanges(changes:TimetableChange[]){
 if(!changes.length||changes.length>200)throw Error('Select between 1 and 200 scheduled classes.');
 const ids=new Set<string>();
 for(const c of changes){
  if(!c.before?.id||ids.has(c.before.id))throw Error('Each scheduled class can be changed only once.');
  ids.add(c.before.id);
  if(c.after){if(c.after.id!==c.before.id)throw Error('A rescheduled class must keep its original ID.');validate('sessions',c.after);if(!validDate(c.after.date))throw Error('Choose a valid class date.');}
 }
}
export function timetableChanges(rows:Row[],options:{action:'move';firstDate:string;time?:string}|{action:'delete'}):TimetableChange[]{
 const sorted=rows.slice().sort((a,b)=>(a.date+a.time+a.id).localeCompare(b.date+b.time+b.id));
 if(!sorted.length)throw Error('Select at least one class.');
 if(options.action==='delete'){const changes=sorted.map(before=>({before,after:null}));validateTimetableChanges(changes);return changes;}
 const shift=daysBetween(sorted[0].date,options.firstDate);
 const changes=sorted.map(before=>({before,after:{...before,date:addDays(before.date,shift),time:options.time||before.time}}));
 validateTimetableChanges(changes);
 if(changes.every(c=>sameSession(c.before,c.after)))throw Error('Choose a different date or start time.');
 return changes;
}
