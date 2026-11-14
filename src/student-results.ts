import type { Data, Row } from './domain';

export function availableQuizzes(data:Data){
 const allowed=new Set(data.courses.filter(c=>c.published&&(c.access==='free'||data.courseAccess.some(a=>a.courseId===c.id&&a.active))).map(c=>c.id));
 const groups=new Map<string,{courseId:string;topic:string;questions:Row[]}>();
 for(const question of data.questions.filter(q=>q.published&&allowed.has(q.courseId))){
  const topic=String(question.topic||'General practice');const id=JSON.stringify([question.courseId,topic]);
  if(!groups.has(id))groups.set(id,{courseId:question.courseId,topic,questions:[]});groups.get(id)!.questions.push(question);
 }
 return [...groups.values()].sort((a,b)=>`${a.courseId}|${a.topic}`.localeCompare(`${b.courseId}|${b.topic}`));
}
export function teacherMarks(data:Data,studentId:string){
 return data.submissions.filter(s=>!!studentId&&s.studentId===studentId&&s.status==='reviewed'&&s.mark!==''&&s.mark!=null&&Number.isFinite(Number(s.mark))).sort((a,b)=>String(b.reviewedAt||b.submittedAt||'').localeCompare(String(a.reviewedAt||a.submittedAt||'')));
}
export function practiceHistory(data:Data,uid:string){return data.quizAttempts.filter(a=>!!uid&&a.uid===uid).sort((a,b)=>String(b.completedAt).localeCompare(String(a.completedAt)));}
