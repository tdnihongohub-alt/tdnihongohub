import { learningTasks,taskDone } from './learning-tasks';
import { canOpenModule } from './course-enrollment';
import { assignmentReleased } from './assignment-scheduling';
import { assignmentForStudent } from './assignment-audience';
import type { Data, Row } from './domain';
import { feeBalance } from './domain';

export function studentDashboard(data:Data,uid:string,studentId:string,now=Date.now()){
 const courseIds=new Set([...data.courseAccess.filter(a=>a.studentId===studentId&&a.active).map(a=>a.courseId),...data.savedCourses.filter(c=>c.uid===uid).map(c=>c.courseId)]);
 const courses=data.courses.filter(c=>courseIds.has(c.id));
 const lessons=data.lessons.filter(l=>courseIds.has(l.courseId)&&l.published&&assignmentForStudent(l,data,studentId)).sort((a,b)=>`${a.courseId}|${a.module}|${a.title}`.localeCompare(`${b.courseId}|${b.module}|${b.title}`));
 const completed=new Set(data.progress.filter(p=>p.uid===uid&&p.complete).map(p=>p.lessonId));
 const activeBatches=new Set(data.batches.filter(b=>canOpenModule(data,studentId,b)).map(b=>b.id));
 const sessions=data.sessions.filter(s=>activeBatches.has(s.batchId)&&s.status!=='cancelled'&&new Date(`${s.date}T${s.time}:00+05:30`).getTime()+Number(s.duration)*60000>now).sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
 const assignments=data.assignments.filter(a=>courseIds.has(a.courseId)&&assignmentForStudent(a,data,studentId)&&assignmentReleased(a,now));
 const submissions=data.submissions.filter(s=>s.studentId===studentId);
 const homework=assignments.map<Row & {submission?:Row}>(a=>({...a,submission:submissions.find(s=>s.assignmentId===a.id)})).filter(a=>!a.submission||['draft','returned'].includes(a.submission.status)).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 const feedback=submissions.filter(s=>s.feedback&&['returned','reviewed'].includes(s.status)).sort((a,b)=>String(b.reviewedAt||b.submittedAt||'').localeCompare(String(a.reviewedAt||a.submittedAt||'')));
 const fees=data.feeMonths.filter(f=>f.studentId===studentId);
 const payments=data.payments.filter(p=>p.studentId===studentId);
 const activityTasks=[...activeBatches].flatMap(batchId=>{const module=data.batches.find(b=>b.id===batchId)!;return learningTasks(data,module.courseId,batchId,studentId);});
 const activityComplete=activityTasks.filter(t=>taskDone(data,uid,studentId,t)).length;
 return {activityTotal:activityTasks.length,activityComplete,courses,lessons,completed,completedCount:lessons.filter(l=>completed.has(l.id)).length,next:sessions[0] as Row|undefined,continueLesson:lessons.find(l=>!completed.has(l.id))||lessons[0],homework,feedback,announcements:data.announcements.filter(a=>activeBatches.has(a.batchId)).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))),owed:fees.reduce((n,f)=>n+feeBalance(f,payments).pending,0),feeCount:fees.length,pendingClaims:data.paymentClaims.filter(p=>p.studentId===studentId&&!['confirmed','rejected'].includes(p.status)).length};
}
