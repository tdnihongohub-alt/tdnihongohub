import type { Data, Row } from './domain';
import { submissionNeedsReview } from './auto-quiz';
import { batchName, courseName, feeBalance, lkr, studentName } from './domain';

export type AttentionKind='payment'|'homework'|'access'|'recording'|'task';
export type AttentionItem={id:string;kind:AttentionKind;title:string;detail:string;to:string;urgent:boolean;date:string};
export const sessionStart=(s:Row)=>new Date(`${s.date}T${s.time}:00+05:30`).getTime();
export const sessionEnd=(s:Row)=>sessionStart(s)+Number(s.duration)*60000;
export function teacherDashboard(data:Data,now=Date.now()){
 const date=new Date(now+19800000).toISOString().slice(0,10);
 const sessions=data.sessions.filter(s=>s.status!=='cancelled').sort((a,b)=>sessionStart(a)-sessionStart(b));
 const todaySessions=sessions.filter(s=>s.date===date);
 const next=sessions.find(s=>sessionEnd(s)>now);
 const missing=[...new Map(sessions.filter(s=>sessionEnd(s)<=now&&s.lessonId&&data.lessons.some(l=>l.id===s.lessonId&&!l.recordingUrl)).map(s=>[s.lessonId,s])).values()];
 const due=data.feeMonths.map<Row & {balance:ReturnType<typeof feeBalance>}>(f=>({...f,balance:feeBalance(f,data.payments)})).filter(f=>f.balance.pending>0);
 const queue:AttentionItem[]=[
  ...data.paymentClaims.filter(c=>['awaiting_review','clarification_requested'].includes(c.status)).map(c=>({id:`claim-${c.id}`,kind:'payment' as const,title:`Check payment · ${studentName(data,c.studentId)}`,detail:`${lkr(c.amount)} · ${batchName(data,c.batchId)} · ${c.status==='clarification_requested'?'Clarification requested':'Awaiting confirmation'}`,to:`/teacher/payments?view=claims&review=${c.id}`,urgent:false,date:c.createdAt||c.paidOn||''})),
  ...data.submissions.filter(s=>submissionNeedsReview(data.assignments.find(a=>a.id===s.assignmentId),s)).map(s=>({id:`submission-${s.id}`,kind:'homework' as const,title:`Review homework · ${studentName(data,s.studentId)}`,detail:data.assignments.find(a=>a.id===s.assignmentId)?.title||'Assignment submission',to:`/teacher/lessons?view=submissions&review=${s.id}`,urgent:false,date:s.submittedAt||''})),
  ...data.accessRequests.filter(r=>r.status==='pending').map(r=>({id:`request-${r.id}`,kind:'access' as const,title:`Approve class access`,detail:`${data.users.find(u=>u.id===r.uid)?.displayName||r.uid} · ${courseName(data,r.courseId)}`,to:`/teacher/classes?view=requests&request=${r.id}`,urgent:false,date:r.createdAt||''})),
  ...missing.map(s=>({id:`recording-${s.lessonId}`,kind:'recording' as const,title:'Add the class recording',detail:`${data.lessons.find(l=>l.id===s.lessonId)?.title||'Lesson'} · ${batchName(data,s.batchId)}`,to:`/teacher/lessons?edit=${s.lessonId}`,urgent:false,date:s.date})),
  ...data.tasks.filter(t=>!t.done&&t.dueDate<=date).map(t=>({id:`task-${t.id}`,kind:'task' as const,title:t.title,detail:`${t.dueDate<date?'Overdue':'Due today'}${t.batchId?` · ${batchName(data,t.batchId)}`:''}`,to:`/teacher/tasks?edit=${t.id}`,urgent:t.dueDate<date,date:t.dueDate})),
 ].sort((a,b)=>Number(b.urgent)-Number(a.urgent)||a.date.localeCompare(b.date));
 return {date,todaySessions,next,queue,missing,due,owed:due.reduce((n,f)=>n+f.balance.pending,0),activeStudents:data.students.filter(s=>s.active).length,activeBatches:data.batches.filter(b=>b.active).length,received:data.payments.filter(p=>p.status!=='void'&&String(p.paidOn).startsWith(date.slice(0,7))).reduce((n,p)=>n+Number(p.amount),0)};
}
