import { assignmentAppliesToBatch } from './assignment-audience';
import { openFreeCourse } from './free-squads';
import type { Data, Row } from './domain';
import { assignmentForStudent } from './assignment-audience';
import { assignmentReleased } from './assignment-scheduling';
import { today } from './domain';
export type TeachingModule={id:string;courseId:string;batchId:string;title:string;category:string;active:boolean};
export function teachingModules(data:Data,studentId:string,uid:string,teacher=false):TeachingModule[]{
 const batches=teacher?data.batches:data.batches.filter(b=>data.students.some(s=>s.id===studentId&&s.active)&&data.enrollments.some(e=>e.studentId===studentId&&e.batchId===b.id&&e.status==='active'));
 const modules:TeachingModule[]=batches.flatMap(b=>{const c=data.courses.find(c=>c.id===b.courseId);return c?[{id:`batch:${b.id}`,courseId:c.id,batchId:b.id,title:b.name,category:c.category,active:!!b.active}]:[];});
 const courses=teacher?data.courses.filter(c=>!data.batches.some(b=>b.courseId===c.id)):data.courses.filter(c=>!modules.some(m=>m.courseId===c.id)&&(data.courseAccess.some(a=>a.studentId===studentId&&a.courseId===c.id&&a.active)||openFreeCourse(c)&&data.savedCourses.some(s=>s.uid===uid&&s.courseId===c.id)));
 modules.push(...courses.map(c=>({id:`course:${c.id}`,courseId:c.id,batchId:'',title:c.title,category:c.category,active:c.active!==false})));return modules.sort((a,b)=>a.title.localeCompare(b.title,undefined,{numeric:true}));
}
export function moduleLessons(data:Data,courseId:string,batchId:string,studentId:string,teacher=false){return data.lessons.filter(l=>l.courseId===courseId&&(!l.batchId||l.batchId===batchId)&&(teacher||l.published&&assignmentForStudent(l,data,studentId))).sort((a,b)=>(Number(a.weekNumber)||Infinity)-(Number(b.weekNumber)||Infinity)||`${a.module}|${a.title}`.localeCompare(`${b.module}|${b.title}`,undefined,{numeric:true}));}
export function weekGroups(lessons:Row[]){
 const groups=new Map<number,{number:number;title:string;lessons:Row[]}>();const reserved=new Set(lessons.map(l=>Number(l.weekNumber)).filter(n=>n>0));let next=1;
 lessons.forEach(lesson=>{while(reserved.has(next))next++;const number=Number(lesson.weekNumber)>0?Number(lesson.weekNumber):next++;const group=groups.get(number)||{number,title:lesson.weekTitle||lesson.title,lessons:[] as Row[]};group.lessons.push(lesson);groups.set(number,group);});
 return [...groups.values()].sort((a,b)=>a.number-b.number);
}
export function nextWeekNumber(data:Data,courseId:string,batchId:string){const groups=weekGroups(moduleLessons(data,courseId,batchId,'',true));return Math.max(0,...groups.map(w=>w.number))+1;}
export function weeklyWork(data:Data,lessons:Row[],courseId:string,batchId:string,studentId:string,teacher=false){const ids=new Set(lessons.map(l=>l.id)),quizzes=new Set(lessons.map(l=>l.quizId).filter(Boolean));return data.assignments.filter(a=>a.courseId===courseId&&assignmentAppliesToBatch(a,batchId)&&(ids.has(a.lessonId)||quizzes.has(a.id))&&(teacher||assignmentReleased(a)&&assignmentForStudent(a,data,studentId)));}
export type NoticeKind='announcement'|'session';
export function noticeVersion(row:Row,kind:NoticeKind){const fields=kind==='announcement'?['title','body','batchId','courseId']:['title','date','time','duration','status','zoomUrl','batchId','courseId'];const value=JSON.stringify(fields.map(k=>row[k]??''));let hash=2166136261;for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);return (hash>>>0).toString(16);}
export function noticeRead(data:Data,uid:string,row:Row,kind:NoticeKind){return data.contentReads.some(r=>r.uid===uid&&r.recordId===row.id&&r.kind===kind&&r.version===noticeVersion(row,kind));}
export function studentNotices(data:Data,studentId:string){const active=new Set(data.enrollments.filter(e=>e.studentId===studentId&&e.status==='active').map(e=>e.batchId));return [...data.announcements.filter(a=>active.has(a.batchId)).map(row=>({row,kind:'announcement' as const})),...data.sessions.filter(s=>active.has(s.batchId)&&s.date>=today()).map(row=>({row,kind:'session' as const}))];}
