import { assignmentAudienceFields } from './assignment-audience';
import { parseSriLanka,sriLankaInput,validateSchedule } from './assignment-scheduling';
import { addDays,validate } from './domain';
import type { Data,Row } from './domain';
import { practiceSeriesRecord } from './practice-schedule';

export function homeworkDeadline(date:string,time:string){
 return (time==='23:59'?addDays(date,1):date)+'T23:59';
}

export function timetableHomework(data:Data,id:string,values:Record<string,any>){
 const question=String(values.question||'').trim();
 if(!question)throw Error('Enter a homework question.');
 const series=practiceSeriesRecord(data,{...values,startDate:values.date,endDate:values.date,frequency:'once',kind:'assignment',questionCount:1,active:true},id);
 const deadlineAt=parseSriLanka(values.deadline);
 if(sriLankaInput(deadlineAt)!==values.deadline)throw Error('Choose a valid homework deadline.');
 const assignment=validate('assignments',{
  id:`PRACTICE-${id}-${values.date}`,courseId:series.courseId,...assignmentAudienceFields([series.batchId]),
  title:series.title,kind:'assignment',responseMode:'questions',instructions:'Type your answer below and submit it for review.',lessonId:'',worksheetUrl:'',
  maxMark:10,autoGrade:false,formQuestions:[{id:'question',type:'long',label:question,required:true,options:[]}],
  published:true,releaseAt:parseSriLanka(values.date+'T'+values.time),deadlineAt,dueDate:values.deadline.slice(0,10),allowLate:!!values.allowLate,
  practiceSeriesId:id,practiceDate:values.date,expectedQuestionCount:1,createdAt:new Date().toISOString(),
 }) as Row;
 validateSchedule(assignment);
 return {series,assignment};
}
