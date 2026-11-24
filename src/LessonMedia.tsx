import { LessonNote } from './LessonNote';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, Check, Clock3, Play, Video } from 'lucide-react';
import { useApp } from './store';
import { Badge, OutLink } from './ui';
import { key, youtubeId } from './domain';
import type { Row } from './domain';
import { lessonQuiz, recordingThumbnail } from './lesson-content';
import { assignmentForStudent } from './assignment-audience';
import { courseName } from './domain';
import './lesson-content.css';

export function ComingSoon({label='Coming soon'}:{label?:string}){return <span className="content-coming-soon"><Clock3 size={15} aria-hidden="true"/>{label}</span>;}
export function LessonQuizCollection(){
 const {data,studentId}=useApp();const lessons=data.lessons.filter(l=>l.published&&assignmentForStudent(l,data,studentId)&&lessonQuiz(data,l,studentId));
 if(!lessons.length)return null;
 return <section className="lesson-quiz-collection"><h2>Quizzes for your recordings</h2>{lessons.length?<div className="lesson-quiz-grid">{lessons.map(lesson=><div key={lesson.id}><strong>{courseName(data,lesson.courseId)} · {lesson.title}</strong><LessonQuizCard lesson={lesson}/></div>)}</div>:<div className="lesson-activity-card"><BrainCircuit size={24}/><div><h3>Your lesson quizzes</h3><p>Your teacher will publish quizzes alongside your class recordings.</p><ComingSoon/></div></div>}</section>;
}
export function LessonQuizCard({lesson}:{lesson:Row}){
 const {data,studentId}=useApp();const quiz=lessonQuiz(data,lesson,studentId);
 if(!quiz)return null;
 return <section className="lesson-activity-card"><div className="lesson-activity-icon"><BrainCircuit size={23}/></div><div><span className="eyebrow">AFTER THE RECORDING</span><h3>{quiz?.title||'Lesson quiz'}</h3><p>{quiz?'Practise what you learned with an activity inside your learning space.':'Your teacher is preparing an activity for this lesson.'}</p>{quiz?<Link className="button primary small" to={`/student/assignments?assignment=${quiz.id}`}>Start lesson quiz →</Link>:<ComingSoon/>}{quiz&&<small>{quiz.autoGrade?'Automatically checked':'Teacher-reviewed'} · {quiz.formQuestions.length} questions</small>}</div></section>;
}
export function LessonMedia({lesson,preview=false,batchId=lesson.batchId||''}:{lesson:Row;preview?:boolean;batchId?:string}){
 const {data,identity,save,notify}=useApp();const [playing,setPlaying]=useState(false);const videoId=youtubeId(lesson.recordingUrl||'');const specific=data.taskProgress.find(p=>p.taskId==='recording:'+lesson.id&&p.batchId===batchId&&p.uid===identity?.uid);const complete=specific?specific.complete:data.progress.some(p=>p.lessonId===lesson.id&&p.uid===identity?.uid&&p.complete);
 return <><div className="lesson-recording-meta"><Badge>{videoId?<><Video size={14}/> Recording ready</>:<><Clock3 size={14}/> Recording coming soon</>}</Badge><h2>{lesson.recordingTitle||lesson.title}</h2>{lesson.recordingDescription&&<p className="preserve-lines">{lesson.recordingDescription}</p>}</div>
 <div className="lesson-video">{videoId?(playing?<iframe title={lesson.recordingTitle||lesson.title} src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>:<button className="lesson-play-preview" aria-label={`Play recording: ${lesson.recordingTitle||lesson.title}`} onClick={()=>setPlaying(true)}><img src={recordingThumbnail(lesson)} alt={lesson.recordingTitle||lesson.title}/><span><Play size={25} fill="currentColor"/>Watch recording</span></button>):<div className="recording-placeholder"><Video size={30}/><h3>Recording coming soon</h3><p>Your teacher will add the recording here.</p><ComingSoon/></div>}</div>
 {!preview&&<div className="lesson-companion-grid"><section className="lesson-activity-card"><div className="lesson-activity-icon"><Video size={23}/></div><div><span className="eyebrow">WATCH & REVISE</span><h3>Class recording</h3><p>{videoId?'Replay the lesson at your own pace.':'The recording will appear here when your teacher publishes it.'}</p>{videoId?<Badge tone="green">Ready to watch</Badge>:<ComingSoon/>}</div></section><LessonQuizCard lesson={lesson}/></div>}
 <div className="pad"><Badge tone="green">{lesson.module}</Badge><h3>Lesson notes & materials</h3>{lesson.hasManagedNotes?<LessonNote lesson={lesson}/>:<p className="preserve-lines">{lesson.notes}</p>}<div className="actions"><OutLink url={lesson.resourceUrl} className="button">Open worksheet / notes</OutLink>{!preview&&<button className={`button ${complete?'':'primary'}`} onClick={()=>void save('taskProgress',{id:key(identity!.uid,batchId,'recording:'+lesson.id),uid:identity!.uid,taskId:'recording:'+lesson.id,kind:'recording',recordId:lesson.id,courseId:lesson.courseId,batchId,complete:!complete}).catch(e=>notify(e.message))}>{complete?<><Check size={16}/>Completed</>:'Mark recording complete'}</button>}</div>{!preview&&<p className="form-note">Completing a recording does not mark live class attendance.</p>}</div></>;
}
