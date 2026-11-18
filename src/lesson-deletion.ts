import type { Data, Row } from './domain';

export function lessonDeletionPlan(data:Data,lessonId:string){
 const lesson=data.lessons.find(l=>l.id===lessonId);
 if(!lesson)throw Error('This lesson has already been removed.');
 return {
  lesson,
  assignments:data.assignments.filter(a=>a.lessonId===lessonId).map(before=>({before,after:{...before,lessonId:''}})),
  sessions:data.sessions.filter(s=>s.lessonId===lessonId).map(before=>({before,after:{...before,lessonId:'',title:before.title||lesson.title}}))
 };
}
function canonical(value:any):any{
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>[k,canonical(value[k])]));
 return value;
}
export function sameLessonRecord(a:Row,b:Row){return JSON.stringify(canonical(a))===JSON.stringify(canonical(b));}
