import { key } from './domain';
import type { Data, Row } from './domain';

export function courseEnrollment(data:Data,studentId:string,courseId:string){
 return data.courseAccess.find(a=>a.studentId===studentId&&a.courseId===courseId);
}

export function canOpenModule(data:Data,studentId:string,module:Row){
 if(!data.students.some(s=>s.id===studentId&&s.active&&!s.deleted))return false;
 const access=courseEnrollment(data,studentId,module.courseId);
 if(access?.allModules)return access.active===true&&module.active!==false;
 return data.enrollments.some(e=>e.studentId===studentId&&e.batchId===module.id&&e.status==='active');
}

export function courseEnrollmentRow(data:Data,studentId:string,courseId:string,active=true):Row{
 if(!data.students.some(s=>s.id===studentId&&s.active&&!s.deleted))throw Error('Choose an active student.');
 if(!data.courses.some(c=>c.id===courseId&&c.active!==false))throw Error('Choose an active course.');
 const previous=courseEnrollment(data,studentId,courseId);
 if(active&&data.enrollments.some(e=>e.studentId===studentId&&e.courseId===courseId&&e.autoPaymentSuspended))throw Error('Resolve the payment hold before restoring course access.');
 return {...previous,id:key(studentId,courseId),studentId,courseId,allModules:true,active,autoPaymentBlocked:false};
}
