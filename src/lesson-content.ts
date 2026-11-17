import { safeLink, validate, youtubeId } from './domain';
import type { Data, Row, Table } from './domain';
import { assignmentForStudent, validateAssignmentBatch } from './assignment-audience';
import { assignmentReleased } from './assignment-scheduling';

export function recordingThumbnail(lesson:Row){return safeLink(lesson.thumbnailUrl||'')||(youtubeId(lesson.recordingUrl||'')?`https://i.ytimg.com/vi/${youtubeId(lesson.recordingUrl)}/hqdefault.jpg`:'');}
export function lessonQuiz(data:Data,lesson:Row,studentId:string,now=Date.now()){
 if(lesson.quizState==='coming_soon')return undefined;
 return data.assignments.find(a=>(lesson.quizId?a.id===lesson.quizId:a.lessonId===lesson.id)&&a.kind==='form'&&a.courseId===lesson.courseId&&a.formQuestions?.length>0&&assignmentReleased(a,now)&&assignmentForStudent(a,data,studentId));
}
export function lessonContentPlan(data:Data,lesson:Row,newQuiz?:Row):{table:Table;row:Row}[]{
 const row=validate('lessons',lesson) as Row;validateAssignmentBatch(row,data);
 if(row.weekNumber!==undefined&&(!Number.isInteger(Number(row.weekNumber))||Number(row.weekNumber)<1||Number(row.weekNumber)>520))throw Error('Choose a week number from 1 to 520.');
 if(row.tutes&&(!Array.isArray(row.tutes)||row.tutes.length>20||row.tutes.some((t:any)=>!t.id||!String(t.title||'').trim()||!safeLink(t.url||''))))throw Error('Each tute needs a title and a valid worksheet link (up to 20 tutes).');
 if(row.batchId&&row.visibility==='public')throw Error('Batch-specific lessons must use the Enrolled students audience.');
 if(row.recordingUrl&&!youtubeId(row.recordingUrl))throw Error('Paste a valid YouTube recording link, or leave it empty for Coming soon.');
 if(row.thumbnailUrl&&(!safeLink(row.thumbnailUrl)||!row.thumbnailUrl.startsWith('https://')))throw Error('Use an HTTPS image link for a custom thumbnail.');
 const changes:{table:Table;row:Row}[]=[];
 if(row.quizState==='linked'){
  const quiz=newQuiz?validate('assignments',newQuiz) as Row:data.assignments.find(a=>a.id===row.quizId);
  if(!quiz||quiz.id!==row.quizId||quiz.kind!=='form'||quiz.courseId!==row.courseId||quiz.batchId&&quiz.batchId!==row.batchId)throw Error('Choose an interactive quiz for the same course and batch, or a shared course quiz.');
  if(newQuiz){validateAssignmentBatch(quiz,data);changes.push({table:'assignments',row:quiz});}
 }else if(row.quizState==='coming_soon')row.quizId='';
 changes.push({table:'lessons',row});return changes;
}
