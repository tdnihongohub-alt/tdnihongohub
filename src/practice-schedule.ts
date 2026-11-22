import { addDays } from './domain';
import type { Data,Row } from './domain';
import { assignmentAudienceFields } from './assignment-audience';
import { assignmentReleased,parseSriLanka } from './assignment-scheduling';
import { validDate } from './timetable-management';

export type PracticeSlot={id:string;series:Row;date:string;assignment?:Row};

export function practiceSeriesRecord(data:Data,values:Record<string,any>,id:string):Row{
 const module=data.batches.find(b=>b.id===values.batchId&&b.active);
 if(!module)throw Error('Choose an active module.');
 if(!validDate(values.startDate)||!validDate(values.endDate)||values.startDate>values.endDate)throw Error('Choose a valid first date and repeat-until date.');
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.time))throw Error('Choose a valid release time.');
 const count=Number(values.questionCount);
 if(!Number.isInteger(count)||count<1||count>20)throw Error('Choose 1 to 20 questions.');
 if(!String(values.title||'').trim())throw Error('Enter a practice title.');
 return {id,batchId:module.id,courseId:module.courseId,startDate:values.startDate,endDate:values.endDate,time:values.time,title:values.title.trim(),questionCount:count,kind:values.kind==='assignment'?'assignment':'form',active:values.active!==false};
}

export function practiceSlots(series:Row[],assignments:Row[],from:string,to:string):PracticeSlot[]{
 if(!validDate(from)||!validDate(to)||from>to)return [];
 const byId=new Map(assignments.map(row=>[row.id,row]));
 return series.flatMap(repeat=>{
  if(!repeat.active||!validDate(repeat.startDate)||!validDate(repeat.endDate))return [];
  const first=from>repeat.startDate?from:repeat.startDate;
  const last=to<repeat.endDate?to:repeat.endDate;
  const weekday=(day:string)=>new Date(day+'T12:00:00Z').getUTCDay();
  const slots:PracticeSlot[]=[];
  for(let date=addDays(first,(weekday(repeat.startDate)-weekday(first)+7)%7);date<=last;date=addDays(date,7)){
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
