import { addDays } from './domain';
import type { Data,Row } from './domain';
import { assignmentAudienceFields } from './assignment-audience';
import { assignmentReleased,parseSriLanka } from './assignment-scheduling';
import { validDate } from './timetable-management';

export const practiceFrequencies=[{value:'once',label:'One time'},{value:'daily',label:'Daily'},{value:'weekly',label:'Weekly'},{value:'monthly',label:'Monthly'}];
export const practiceWeekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const weekday=(date:string)=>new Date(date+'T12:00:00Z').getUTCDay();

export type PracticeSlot={id:string;series:Row;date:string;assignment?:Row};

export function practiceSeriesRecord(data:Data,values:Record<string,any>,id:string):Row{
 const module=data.batches.find(b=>b.id===values.batchId&&b.active);
 if(!module)throw Error('Choose an active module.');
 const frequency=values.frequency??'weekly';
 if(!practiceFrequencies.some(option=>option.value===frequency))throw Error('Choose a repeat option.');
 const endDate=frequency==='once'?values.startDate:values.endDate;
 if(!validDate(values.startDate)||!validDate(endDate)||values.startDate>endDate)throw Error('Choose a valid first date and repeat-until date.');
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.time))throw Error('Choose a valid release time.');
 const weekdays:unknown[]=frequency==='weekly'&&Array.isArray(values.weekdays)?[...new Set<unknown>(values.weekdays)]:[];
 if(weekdays.some(day=>typeof day!=='number'||!Number.isInteger(day)||day<0||day>6))throw Error('Choose valid weekdays.');
 const count=Number(values.questionCount);
 if(!Number.isInteger(count)||count<1||count>20)throw Error('Choose 1 to 20 questions.');
 if(!String(values.title||'').trim())throw Error('Enter a practice title.');
 return {id,batchId:module.id,courseId:module.courseId,startDate:values.startDate,endDate,frequency,weekdays,time:values.time,title:values.title.trim(),questionCount:count,kind:values.kind==='assignment'?'assignment':'form',active:values.active!==false};
}

export function practiceSlots(series:Row[],assignments:Row[],from:string,to:string):PracticeSlot[]{
 if(!validDate(from)||!validDate(to)||from>to)return [];
 const byId=new Map(assignments.map(row=>[row.id,row]));
 return series.flatMap(repeat=>{
  if(!repeat.active||!validDate(repeat.startDate)||!validDate(repeat.endDate))return [];
  const first=from>repeat.startDate?from:repeat.startDate;
  const last=to<repeat.endDate?to:repeat.endDate;
  const dates=new Set<string>();
  const frequency=repeat.frequency||'weekly';
  const weekdays=repeat.weekdays?.length?repeat.weekdays:[weekday(repeat.startDate)];
  for(let date=first;date<=last;date=addDays(date,1)){
   if(frequency==='once'?date===repeat.startDate:frequency==='daily'||(frequency==='monthly'?date.slice(-2)===repeat.startDate.slice(-2):weekdays.includes(weekday(date))))dates.add(date);
  }
  // Keep already prepared work on its original date when the repeat pattern changes.
  for(const assignment of assignments){
   const date=assignment.practiceDate;
   if(assignment.practiceSeriesId===repeat.id&&assignment.id===`PRACTICE-${repeat.id}-${date}`&&validDate(date||'')&&date>=from&&date<=to)dates.add(date);
  }
  const slots:PracticeSlot[]=[];
  for(const date of dates){
   const id=`PRACTICE-${repeat.id}-${date}`;
   slots.push({id,series:repeat,date,assignment:byId.get(id)});
  }
  return slots;
 }).sort((a,b)=>(a.date+a.series.time).localeCompare(b.date+b.series.time));
}

export function practiceTemplate(slot:PracticeSlot){
 const {series,date,id}=slot;
 return {id,...assignmentAudienceFields([series.batchId]),courseId:series.courseId,title:series.title,kind:series.kind,responseMode:'questions',instructions:`Answer all ${series.questionCount} ${series.questionCount===1?'question':'questions'}.`,maxMark:series.kind==='assignment'?10:series.questionCount,autoGrade:series.kind==='form',published:true,releaseAt:parseSriLanka(date+'T'+series.time),deadlineAt:parseSriLanka((series.time==='23:59'?addDays(date,1):date)+'T23:59'),allowLate:true,practiceSeriesId:series.id,practiceDate:date,expectedQuestionCount:series.questionCount,...(series.kind==='assignment'?{formQuestions:Array.from({length:series.questionCount},(_,i)=>({id:'question-'+(i+1),label:'',type:'long',required:true,options:[]}))}:{})};
}

export function practiceStatus(slot:PracticeSlot,now=Date.now()){
 if(!slot.assignment?.published)return 'Questions needed';
 return assignmentReleased(slot.assignment,now)?'Available':'Scheduled';
}
