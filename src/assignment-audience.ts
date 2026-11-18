import type { Data, Row } from './domain';

export function assignmentForStudent(a:Row,data:Data,studentId:string){
 if(!a.batchId)return data.enrollments.some(e=>e.studentId===studentId&&e.courseId===a.courseId&&e.status==='active')||data.courseAccess.some(c=>c.studentId===studentId&&c.courseId===a.courseId&&c.active)||data.savedCourses.some(c=>c.courseId===a.courseId&&data.studentLinks.some(l=>l.studentId===studentId&&l.id===c.uid));
 return data.students.some(s=>s.id===studentId&&s.active)&&data.enrollments.some(e=>e.studentId===studentId&&e.batchId===a.batchId&&e.courseId===a.courseId&&e.status==='active');
}

export function validateAssignmentBatch(a:Row,data:Data){
 if(a.batchId&&!data.batches.some(b=>b.id===a.batchId&&b.courseId===a.courseId))throw Error('Choose a batch belonging to this course.');
}

export function assignmentLessonChoices(data:Data,courseId:string,batchId:string){
 return data.lessons.filter(l=>l.courseId===courseId&&(!l.batchId||l.batchId===batchId));
}

export function validateAssignmentLesson(a:Row,data:Data){
 if(a.lessonId&&!assignmentLessonChoices(data,a.courseId,a.batchId||'').some(l=>l.id===a.lessonId))throw Error('Choose a week from the selected course and batch.');
}
