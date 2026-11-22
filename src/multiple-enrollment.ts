import { manualEnrollmentChange } from './student-access-policy';
import { key, monthNow, today } from './domain';
import type { Data, Row, Table } from './domain';
export function additionalEnrollments(data:Data,studentId:string,batchIds:string[]):{table:Table;row:Row}[]{
 if(!data.students.some(s=>s.id===studentId&&s.active&&!s.deleted))throw Error('Choose an active student.');
 if(!batchIds.length)throw Error('Choose at least one batch.');
 const changes:{table:Table;row:Row}[]=[];
 for(const batchId of new Set(batchIds)){
  const b=data.batches.find(b=>b.id===batchId&&b.active);if(!b)throw Error('Choose active batches.');
  const existing=data.enrollments.find(e=>e.studentId===studentId&&e.batchId===batchId);
  if(existing?.status==='active')continue;
  if(data.enrollments.filter(e=>e.batchId===batchId&&e.id!==existing?.id&&(e.status==='active'||e.autoPaymentSuspended)).length>=Number(b.capacity))throw Error(`${b.name} is full.`);
  changes.push({table:'enrollments',row:manualEnrollmentChange({...existing,id:key(studentId,batchId),studentId,batchId,courseId:b.courseId,status:'active',...(!existing?{joinedOn:today(),billingStartMonth:monthNow()}: {})})});
  if(!changes.some(c=>c.table==='courseAccess'&&c.row.courseId===b.courseId))changes.push({table:'courseAccess',row:{...data.courseAccess.find(a=>a.studentId===studentId&&a.courseId===b.courseId),id:key(studentId,b.courseId),studentId,courseId:b.courseId,active:true,autoPaymentBlocked:false}});
 }
 return changes;
}
