import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useApp } from './store';
import { Badge, Modal, OutLink } from './ui';
import { batchName, courseName } from './domain';
import type { Row } from './domain';
import './lesson-deletion.css';

export function DeleteLessonButton({lesson,onDeleted}:{lesson:Row;onDeleted?:()=>void}){
 const {identity}=useApp();const [open,setOpen]=useState(false);
 if(!identity?.teacher)return null;
 return <><button type="button" className="button small lesson-delete-button" aria-label={`Delete lesson: ${lesson.title}`} onClick={()=>setOpen(true)}><Trash2 size={14}/>Delete lesson</button>{open&&<DeleteLessonDialog lesson={lesson} onClose={()=>setOpen(false)} onDeleted={()=>{setOpen(false);onDeleted?.();}}/>}</>;
}

export function DeleteLessonDialog({lesson,onClose,onDeleted}:{lesson:Row;onClose:()=>void;onDeleted:()=>void}){
 const {data,identity,deleteLesson,notify}=useApp();const [busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!identity?.teacher)return null;
 const work=data.assignments.filter(a=>a.lessonId===lesson.id),sessions=data.sessions.filter(s=>s.lessonId===lesson.id);
 return <Modal title="Delete this lesson?" onClose={()=>{if(!busy)onClose();}}>
  <div className="form-body"><div className="lesson-delete-preview"><Badge>{lesson.published?'Published':'Draft'}</Badge><h3>{lesson.title}</h3><p>{courseName(data,lesson.courseId)} · {lesson.batchId?batchName(data,lesson.batchId):'Shared course lesson'}{lesson.weekNumber?` · Week ${lesson.weekNumber}`:''}</p><small>Lesson reference: {lesson.id}</small>{lesson.recordingUrl&&<OutLink url={lesson.recordingUrl}>Check the recording before deleting</OutLink>}</div>
   {!lesson.batchId&&<p className="notice-bar">This lesson is shared across the course. Deleting it removes it from every batch that uses it.</p>}
   <p>Only this lesson, its recording card, notes and material links will be removed from the lesson list. Other lessons in the same week stay in place.</p>
   <p className="form-note">{work.length} linked homework / quiz {work.length===1?'record':'records'} will be kept as class activities. {sessions.length} scheduled {sessions.length===1?'class':'classes'} will keep their dates and meeting details. Student submissions, marks, attendance and payments are preserved.</p>
   <p className="form-note">The original YouTube recording and external files stay at their original links. A private copy of the lesson is kept in the teacher's deletion history.</p>
   {error&&<p className="error" role="alert">{error}</p>}
  </div><div className="form-footer"><button className="button" type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="button lesson-delete-button" type="button" disabled={busy} onClick={async()=>{
   setBusy(true);setError('');
   try{await deleteLesson(lesson);notify('Lesson deleted. Linked class activities and student records were preserved.');onDeleted();}
   catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }}>{busy?'Deleting…':'Delete this lesson'}</button></div>
 </Modal>;
}
