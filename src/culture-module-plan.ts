import type { Data,Row } from './domain';
import { cultureQuizzes,cultureQuizTemplate } from './culture-quizzes';
import { assignmentAudienceFields,assignmentBatchIds } from './assignment-audience';
export function cultureModulePlan(data:Data,batchId:string,now=Date.now()){
 const batch=data.batches.find(b=>b.id===batchId);if(!batch)throw Error('Culture batch not found.');
 return cultureQuizzes.map(q=>{
  const lessons=data.lessons.filter(l=>l.courseId===batch.courseId&&l.batchId===batchId&&Number(l.weekNumber)===q.week).sort((a,b)=>Number(b.published)-Number(a.published)||a.id.localeCompare(b.id));
  if(!lessons.length)throw Error(`Week ${q.week} is missing. No changes should be saved.`);
  const existing=data.assignments.filter(a=>a.sourceQuizId===q.id&&a.courseId===batch.courseId&&(assignmentBatchIds(a).includes(batchId)||!a.batchId&&!assignmentBatchIds(a).length));
  if(existing.length>1)throw Error(`Multiple saved copies of ${q.id} need review.`);
  const old=existing[0],scope=assignmentAudienceFields([batchId]);
  const link={...scope,lessonId:lessons[0].id};
  if(old)return {table:'assignments' as const,row:{...old,...link},before:old,patch:link};
  const row:Row={...cultureQuizTemplate(q,batch.courseId),...link,id:`CUL-${batchId}-${q.id}`,worksheetUrl:'',timeLimitMinutes:0,releaseAt:0,deadlineAt:now+30*86400000,dueDate:new Date(now+30*86400000+19800000).toISOString().slice(0,10),createdAt:new Date(now).toISOString()};
  return {table:'assignments' as const,row,before:undefined,patch:row};
 });
}
