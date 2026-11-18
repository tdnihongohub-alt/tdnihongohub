import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useApp } from './store';
import { Modal, OutLink } from './ui';
import type { Row } from './domain';
import { isRecordingRemoved } from './recording-removal';
import { recordingThumbnail } from './lesson-content';
import './lesson-deletion.css';

export function RemoveRecordingButton({lesson,batchId=''}:{lesson:Row;batchId?:string}){
 const {identity}=useApp();const [open,setOpen]=useState(false);
 if(!identity?.teacher||isRecordingRemoved(lesson,batchId))return null;
 return <><button type="button" className="button small lesson-delete-button" aria-label={`Remove recording from week: ${lesson.recordingTitle||lesson.title}`} onClick={()=>setOpen(true)}><Trash2 size={14}/>Remove from week</button>{open&&<RemoveRecordingDialog lesson={lesson} batchId={batchId} onClose={()=>setOpen(false)}/>}</>;
}
export function RemoveRecordingDialog({lesson,batchId='',onClose}:{lesson:Row;batchId?:string;onClose:()=>void}){
 const {identity,removeRecording,notify}=useApp();const [busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!identity?.teacher)return null;
 return <Modal title="Remove this recording from the week?" onClose={()=>{if(!busy)onClose();}}><div className="form-body">
  <div className="lesson-delete-preview">{recordingThumbnail(lesson)&&<img className="weekly-recording-thumb" src={recordingThumbnail(lesson)} alt="Selected recording thumbnail"/>}<h3>{lesson.recordingTitle||lesson.title}</h3>{lesson.weekNumber&&<p>Week {lesson.weekNumber}</p>}<small>Selected copy: {lesson.id}</small>{lesson.recordingUrl&&<OutLink url={lesson.recordingUrl}>Check this recording</OutLink>}</div>
  <p>This removes the selected recording entry from this week. The other recording, tutes, homework, quizzes and student records stay in place.</p>
  {!lesson.batchId&&!batchId&&<p className="notice-bar">You are editing shared course materials. This removes the recording from every batch using this shared lesson.</p>}
  <p className="form-note">You can add a recording again through Edit week. The original YouTube upload stays on your channel.</p>{error&&<p className="error" role="alert">{error}</p>}
 </div><div className="form-footer"><button className="button" type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="button lesson-delete-button" type="button" disabled={busy} onClick={async()=>{
  setBusy(true);setError('');try{await removeRecording(lesson,batchId);notify('Recording removed from this week. Your other lesson content is preserved.');onClose();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }}>{busy?'Removing…':'Remove from this week'}</button></div></Modal>;
}
