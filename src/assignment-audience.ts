import { canOpenModule } from './course-enrollment';
import type { Data, Row } from './domain';

export function assignmentBatchIds(a:Row):string[]{return Array.isArray(a.batchIds)?a.batchIds: a.batchId&&a.batchId!=='__multiple__'?[a.batchId]:[];}
export function assignmentBatchScoped(a:Row){return a.audience==='batches'||assignmentBatchIds(a).length>0||a.batchId==='__multiple__';}
export function assignmentAudienceFields(ids:string[],all=false){
 const batchIds=[...new Set(ids)];
 if(!all&&!batchIds.length)throw Error('Select at least one batch, or choose all course students.');
 return all?{audience:'course',batchIds:[],batchId:''}:{audience:'batches',batchIds,batchId:batchIds.length===1?batchIds[0]:'__multiple__'};
}
export function assignmentAppliesToBatch(a:Row,batchId:string){return !assignmentBatchScoped(a)||assignmentBatchIds(a).includes(batchId);}
export function assignmentBatchLabel(a:Row,data:Data){return assignmentBatchScoped(a)?assignmentBatchIds(a).map(id=>data.batches.find(b=>b.id===id)?.name||id).join(' · '):'All course students';}

export function assignmentForStudent(a:Row,data:Data,studentId:string){
 const grant=data.courseAccess.find(c=>c.studentId===studentId&&c.courseId===a.courseId&&c.allModules);
 if(grant&&!grant.active)return false;
 if(!assignmentBatchScoped(a))return data.enrollments.some(e=>e.studentId===studentId&&e.courseId===a.courseId&&e.status==='active')||data.courseAccess.some(c=>c.studentId===studentId&&c.courseId===a.courseId&&c.active)||data.savedCourses.some(c=>c.courseId===a.courseId&&data.studentLinks.some(l=>l.studentId===studentId&&l.id===c.uid));
 return data.batches.some(b=>b.courseId===a.courseId&&assignmentBatchIds(a).includes(b.id)&&canOpenModule(data,studentId,b))||assignmentBatchIds(a).some(id=>!data.batches.some(b=>b.id===id)&&canOpenModule(data,studentId,{id,courseId:a.courseId}));
}

export function validateAssignmentBatch(a:Row,data:Data){
 if(a.batchIds!==undefined&&(!Array.isArray(a.batchIds)||a.batchIds.length>20||a.batchIds.some((id:unknown)=>typeof id!=='string'||!id)))throw Error('Choose up to 20 valid batches.');
 if(assignmentBatchScoped(a)&&!assignmentBatchIds(a).length)throw Error('Select at least one batch.');
 if(assignmentBatchIds(a).some(id=>!data.batches.some(b=>b.id===id&&b.courseId===a.courseId)))throw Error('Choose a batch belonging to this course.');
}

export function assignmentLessonChoices(data:Data,courseId:string,batchId:string|string[]){
 const ids=typeof batchId==='string'?[batchId]:batchId;
 return data.lessons.filter(l=>l.courseId===courseId&&(!l.batchId||ids.length===1&&l.batchId===ids[0]));
}

export function validateAssignmentLesson(a:Row,data:Data){
 if(a.lessonId&&!assignmentLessonChoices(data,a.courseId,assignmentBatchIds(a)).some(l=>l.id===a.lessonId))throw Error('Choose a week from the selected course and batch. For multiple batches, use a shared course week or leave the linked lesson empty.');
}
