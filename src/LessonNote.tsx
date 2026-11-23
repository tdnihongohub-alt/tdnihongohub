import { useEffect,useState } from 'react';
import { useApp } from './store';
import { scheduleLabel } from './assignment-scheduling';
import type { Row } from './domain';

export function LessonNote({lesson}:{lesson:Row}){
 const {readLessonNote,identity}=useApp();
 const [note,setNote]=useState<Row|null>(null);
 const [message,setMessage]=useState('');
 const [open,setOpen]=useState(false);
 useEffect(()=>{
  if(!open||!lesson.hasManagedNotes)return;
  void load();
  const timer=setInterval(()=>void load(),60000);
  return()=>clearInterval(timer);
 },[open,lesson.id,lesson.hasManagedNotes]);
 async function load(){
  setMessage('Loading lesson notes…');
  try{
   const current=await readLessonNote(lesson.id);
   setNote(current);
   setMessage(current?.body?'':'No published notes are available yet.');
  }catch(error){
   setNote(null);
   const code=(error as {code?:string}).code;
   setMessage(code==='permission-denied'?'No published notes are available yet.':'Couldn’t load the notes. Try again.');
  }
 }
 if(!lesson.hasManagedNotes&&!lesson.notes)return null;
 return <details className="weekly-notes" onToggle={event=>setOpen(event.currentTarget.open)}>
  <summary>Lesson notes · {lesson.title}</summary>
  {lesson.hasManagedNotes?<>{note?.body?<>{identity?.teacher&&<small>{!note.published?'Draft':note.releaseAt>Date.now()?'Scheduled for '+scheduleLabel(note.releaseAt):'Published'}</small>}<p className="preserve-lines">{note.body}</p></>:<p role="status">{message}</p>}{message&&message!=='Loading lesson notes…'&&<button type="button" className="text-link" onClick={()=>void load()}>Check for notes</button>}</>:<p className="preserve-lines">{lesson.notes}</p>}
 </details>;
}

