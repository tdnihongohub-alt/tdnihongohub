import type { Data,Row } from './domain';
import { assignmentForStudent,assignmentAppliesToBatch } from './assignment-audience';
import { assignmentReleased } from './assignment-scheduling';
import { isRecordingRemoved } from './recording-removal';
export type LearningTask={id:string;kind:'recording'|'material'|'notes'|'assignment';title:string;lessonId:string;recordId:string;courseId:string;batchId:string;url?:string;row:Row};
export function availableNotes(lesson:Row,now=Date.now()){
 return !!lesson.notes||lesson.hasManagedNotes&&lesson.notesPublished===true&&Number(lesson.notesReleaseAt||0)<=now;
}
export function learningTasks(data:Data,courseId:string,batchId:string,studentId:string,teacher=false,now=Date.now()):LearningTask[]{
 const lessons=data.lessons.filter(l=>l.courseId===courseId&&(!l.batchId||l.batchId===batchId)&&(teacher||l.published&&assignmentForStudent(l,data,studentId)));
 const tasks:LearningTask[]=[];
 for(const l of lessons){
  const base={lessonId:l.id,courseId,batchId,recordId:l.id,row:l};
  if(l.recordingUrl&&!isRecordingRemoved(l,batchId))tasks.push({...base,id:'recording:'+l.id,kind:'recording',title:l.recordingTitle||l.title});
  if(availableNotes(l,now))tasks.push({...base,id:'notes:'+l.id,kind:'notes',title:'Notes · '+l.title});
  for(const t of [...(l.resourceUrl?[{id:'main',title:'Worksheet · '+l.title,url:l.resourceUrl}]:[]),...(l.tutes||[])])tasks.push({...base,id:'material:'+l.id+':'+t.id,kind:'material',title:t.title,url:t.url});
 }
 for(const a of data.assignments.filter(a=>a.courseId===courseId&&assignmentAppliesToBatch(a,batchId)&&(teacher||assignmentReleased(a,now)&&assignmentForStudent(a,data,studentId)))){
  tasks.push({id:'assignment:'+a.id,kind:'assignment',title:a.title,lessonId:a.lessonId||lessons.find(l=>l.quizId===a.id)?.id||'',recordId:a.id,courseId,batchId,row:a});
 }
 return tasks;
}
export function taskDone(data:Data,uid:string,studentId:string,task:LearningTask){
 const own=data.taskProgress.find(p=>p.uid===uid&&p.taskId===task.id&&p.batchId===task.batchId);
 if(own)return own.complete;
 if(task.kind==='assignment')return data.submissions.some(s=>s.studentId===studentId&&s.assignmentId===task.recordId&&['submitted','reviewed'].includes(s.status));
 return data.progress.some(p=>p.uid===uid&&p.lessonId===task.lessonId&&p.complete);
}
export function sortLearning<T extends Row>(rows:T[],sort:string):T[]{
 return rows.slice().sort((a,b)=>sort==='title'?String(a.title||a.name||a.id).localeCompare(String(b.title||b.name||b.id),undefined,{numeric:true}):sort==='newest'?String(b.createdAt||b.id).localeCompare(String(a.createdAt||a.id)):sort==='deadline'?Number(a.deadlineAt||Infinity)-Number(b.deadlineAt||Infinity):Number(a.weekNumber||Infinity)-Number(b.weekNumber||Infinity));
}

