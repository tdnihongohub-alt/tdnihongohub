import type { Data, Row } from './domain';

export function assignmentForStudent(a:Row,data:Data,studentId:string){
 if(!a.batchId)return true; // Existing course-wide work keeps its audience.
 return data.students.some(s=>s.id===studentId&&s.active)&&data.enrollments.some(e=>e.studentId===studentId&&e.batchId===a.batchId&&e.courseId===a.courseId&&e.status==='active');
}

export function validateAssignmentBatch(a:Row,data:Data){
 if(a.batchId&&!data.batches.some(b=>b.id===a.batchId&&b.courseId===a.courseId))throw Error('Choose a batch belonging to this course.');
}
