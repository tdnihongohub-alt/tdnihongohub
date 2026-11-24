import { lessonNote } from './lesson-note';
import type { NoteMode } from './lesson-note';
import { assignmentAppliesToBatch } from './assignment-audience';
import { DocumentField } from './DocumentField';
import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Image, Video } from 'lucide-react';
import { useApp } from './store';
import { Modal, Badge } from './ui';
import { today, uid } from './domain';
import type { Row } from './domain';
import { parseSriLanka, sriLankaInput } from './assignment-scheduling';
import type { FormQuestion } from './assignment-scheduling';
import { FormQuestionBuilder } from './FormQuestionBuilder';
import { DeleteLessonButton } from './DeleteLessonButton';
import { isRecordingRemoved } from './recording-removal';
import { lessonContentPlan, recordingThumbnail } from './lesson-content';
import './lesson-content.css';
import { moduleLessons, nextWeekNumber, sectionLabel,sectionTypes,weekGroups } from './weekly-learning';

export function LessonEditor({row,onClose,initialCourseId='',initialBatchId='',initialWeekNumber=1}:{row?:Row;onClose:()=>void;initialCourseId?:string;initialBatchId?:string;initialWeekNumber?:number}){
 const {data,batch,notify,readLessonNote}=useApp();const [id]=useState(row?.id||uid('LES-'));const [v,setV]=useState<Row>({id,title:'',courseId:initialCourseId,batchId:initialBatchId,weekNumber:row?.weekNumber||(row?weekGroups(moduleLessons(data,row.courseId,row.batchId||'','',true)).find(w=>w.lessons.some(l=>l.id===row.id))?.number||1:initialWeekNumber),sectionType:row?.sectionType||'week',weekTitle:row?.weekTitle||'',tutes:[],module:'Weekly lessons',notes:'',recordingUrl:'',resourceUrl:'',recordingTitle:'',recordingDescription:'',thumbnailUrl:'',published:false,visibility:'members',...row});
 const [noteText,setNoteText]=useState(row?.notes||'');
 const [noteMode,setNoteMode]=useState<NoteMode>(row?.notes?'now':'draft');
 const [noteTime,setNoteTime]=useState('');
 const [noteChanged,setNoteChanged]=useState(false);
 const [noteLoading,setNoteLoading]=useState(!!row?.hasManagedNotes);
 const [noteError,setNoteError]=useState('');
 const [noteRetry,setNoteRetry]=useState(0);
 useEffect(()=>{
  if(!row?.hasManagedNotes)return;
  let current=true;
  setNoteLoading(true);setNoteError('');
  void readLessonNote(id).then(note=>{
   if(!current)return;
   if(!note)throw Error('The note could not be found.');
   setNoteText(note.body);setNoteMode(note.published?(note.releaseAt?'scheduled':'now'):'draft');
   setNoteTime(sriLankaInput(note.releaseAt));
  }).catch(()=>{if(current)setNoteError('Couldn’t load the saved notes.');}).finally(()=>{if(current)setNoteLoading(false);});
  return()=>{current=false;};
 },[id,row?.hasManagedNotes,noteRetry]);
 const inherited=data.assignments.find(a=>a.lessonId===id&&a.kind==='form');
 const [quizChoice,setQuizChoice]=useState(row&&!row.quizState&&!row.quizId?'__auto__':row?.quizState==='coming_soon'?'':row?.quizId||inherited?.id||'');
 const [questions,setQuestions]=useState<FormQuestion[]>([]);const [quizTitle,setQuizTitle]=useState('');const [instructions,setInstructions]=useState('Complete this activity after watching the recording.');
 const [deadline,setDeadline]=useState(sriLankaInput(Date.parse(`${today()}T23:59:00+05:30`)));const [quizPublished,setQuizPublished]=useState(true);const [maxMark,setMaxMark]=useState(10);const [allowLate,setAllowLate]=useState(true);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [uploadBusy,setUploadBusy]=useState(false);
 const set=(name:string,value:any)=>setV(p=>({...p,[name]:value}));const thumb=recordingThumbnail(v);
 const quizzes=data.assignments.filter(a=>a.kind==='form'&&a.courseId===v.courseId&&(!v.batchId||assignmentAppliesToBatch(a,v.batchId)));
 return <Modal title={row?'Edit lesson & recording':'Create lesson & recording'} onClose={onClose}><form onSubmit={async e=>{e.preventDefault();if(uploadBusy||noteLoading||noteError)return;setError('');setBusy(true);try{
  const quizId=quizChoice==='__new__'?uid('ASN-'):quizChoice;
  const lesson:Row={...v,id,quizState:quizChoice?'linked':'coming_soon',quizId};
  if(quizChoice==='__auto__'){delete lesson.quizState;delete lesson.quizId;}if(lesson.recordingUrl)delete lesson.recordingState;
  const quiz=quizChoice==='__new__'?{id:quizId,title:quizTitle.trim()||`${v.title} — quiz`,courseId:v.courseId,batchId:v.batchId||'',lessonId:id,kind:'form',instructions,worksheetUrl:'',formQuestions:questions,maxMark,published:!!v.published&&quizPublished,allowLate,releaseAt:0,deadlineAt:parseSriLanka(deadline),dueDate:deadline.slice(0,10),createdAt:new Date().toISOString()}:undefined;
  const note=noteChanged?lessonNote(id,noteText,noteMode,noteTime):undefined;
  await batch(lessonContentPlan(data,lesson,quiz,note));
  notify(v.published&&note?.published&&note.releaseAt>Date.now()?'Lesson saved and notes scheduled.':v.published?'Lesson saved.':'Lesson template saved as a draft.');onClose();
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>
 <div className="form-body">{row&&isRecordingRemoved(v,initialBatchId||v.batchId||'')&&<div className="notice-bar"><span>This recording was removed from this week. Paste a new video link to add one again.</span>{!v.batchId&&initialBatchId&&v.recordingUrl&&<button type="button" onClick={()=>set('recordingHiddenInBatches',(v.recordingHiddenInBatches||[]).filter((id:string)=>id!==initialBatchId))}>Show recording in this batch</button>}</div>}<p className="form-note">Choose the course and batch, add the recording, and prepare its activity. Empty recordings and quizzes appear as Coming soon when the lesson is published.</p><div className="form-grid">
 <label className="form-field">Course *<select required value={v.courseId} onChange={e=>{set('courseId',e.target.value);set('batchId','');setQuizChoice('');if(!row)set('weekNumber',nextWeekNumber(data,e.target.value,''));}}><option value="">Choose course</option>{data.courses.map(c=><option value={c.id} key={c.id}>{c.title}</option>)}</select></label>
 <label className="form-field">Batch<select value={v.batchId||''} disabled={!v.courseId} onChange={e=>{set('batchId',e.target.value);setQuizChoice('');if(!row)set('weekNumber',nextWeekNumber(data,v.courseId,e.target.value));if(e.target.value)set('visibility','members');}}><option value="">All batches in this course</option>{data.batches.filter(b=>b.courseId===v.courseId).map(b=><option value={b.id} key={b.id}>{b.name}</option>)}</select></label>
 <label className="form-field">Section type<select value={v.sectionType} onChange={e=>set('sectionType',e.target.value)}>{sectionTypes.map(type=><option key={type} value={type}>{sectionLabel({id:'',sectionType:type})}</option>)}</select></label><label className="form-field">{sectionLabel(v)} number *<input type="number" min="1" max="520" required value={v.weekNumber} onChange={e=>set('weekNumber',Number(e.target.value))}/></label><label className="form-field">{sectionLabel(v)} heading (optional)<input value={v.weekTitle||''} placeholder={v.title||'Uses the lesson title'} onChange={e=>set('weekTitle',e.target.value)}/></label>
 <label className="form-field">Lesson title *<input required value={v.title} onChange={e=>set('title',e.target.value)}/></label><label className="form-field">Module / topic *<input required value={v.module} onChange={e=>set('module',e.target.value)}/></label>
  <section className="form-builder form-field wide" aria-label="Typed lesson notes">
  <h3>Typed lesson notes</h3>
  <p className="form-note">Write notes for this lesson. Notes can be released separately after you publish the lesson.</p>
  {noteLoading?<p role="status">Loading saved notes…</p>:noteError?<p role="alert">{noteError} <button className="text-link" type="button" onClick={()=>setNoteRetry(n=>n+1)}>Try again</button></p>:<>
   <label className="form-field">Notes<textarea rows={8} maxLength={20000} value={noteText} onChange={e=>{setNoteText(e.target.value);setNoteChanged(true);}}/></label>
   <div className="form-grid section-gap"><label className="form-field">Release notes<select value={noteMode} onChange={e=>{setNoteMode(e.target.value as NoteMode);setNoteChanged(true);}}><option value="draft">Keep as draft</option><option value="now">Publish now</option><option value="scheduled">Schedule release</option></select></label>
   {noteMode==='scheduled'&&<label className="form-field">Release date and time (Sri Lanka)<input required={!!noteText.trim()} type="datetime-local" value={noteTime} onChange={e=>{setNoteTime(e.target.value);setNoteChanged(true);}}/></label>}</div>
  </>}
 </section>
 <label className="form-field wide">YouTube recording link<input type="url" value={v.recordingUrl} onChange={e=>set('recordingUrl',e.target.value)}/><small>Paste the recording URL. Its thumbnail appears automatically. Leave empty while the recording is being prepared.</small></label>
 <label className="form-field">Recording title<input value={v.recordingTitle||''} placeholder={v.title||'Uses the lesson title'} onChange={e=>set('recordingTitle',e.target.value)}/></label>
 <label className="form-field">Custom thumbnail link (optional)<input type="url" value={v.thumbnailUrl||''} onChange={e=>set('thumbnailUrl',e.target.value)}/></label>
 <label className="form-field wide">Recording description<textarea rows={2} value={v.recordingDescription||''} onChange={e=>set('recordingDescription',e.target.value)}/></label>
 </div><div className="lesson-preview"><div className="lesson-preview-image">{thumb?<img src={thumb} alt="Recording thumbnail preview"/>:<Image size={28}/>}</div><div><Badge>{v.recordingUrl?<><Video size={13}/> Recording</>:<><Clock3 size={13}/> Recording coming soon</>}</Badge><h3>{v.recordingTitle||v.title||'Your recording title'}</h3><p>{v.recordingDescription||'Your recording description will appear here.'}</p></div></div>
 <div className="form-grid"><label className="form-field wide">Quiz beside this recording<select value={quizChoice} disabled={!v.courseId} onChange={e=>setQuizChoice(e.target.value)}>{row&&<option value="__auto__">Keep existing lesson activities</option>}<option value="">Coming soon</option><option value="__new__">Create a new interactive quiz here</option>{quizzes.map(q=><option key={q.id} value={q.id}>{q.title}{q.published?'':' (draft)'}</option>)}</select><small>Only quizzes matching this course and batch are listed. Unpublished or scheduled quizzes stay Coming soon for students.</small></label></div>
 {quizChoice==='__new__'&&<><div className="form-grid"><label className="form-field">Quiz title<input value={quizTitle} placeholder={`${v.title||'Lesson'} — quiz`} onChange={e=>setQuizTitle(e.target.value)}/></label><label className="form-field">Quiz deadline (Sri Lanka time) *<input required type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)}/></label><label className="form-field">Maximum quiz mark<input type="number" min="1" required value={maxMark} onChange={e=>setMaxMark(Number(e.target.value))}/></label><label className="check-line"><input type="checkbox" checked={allowLate} onChange={e=>setAllowLate(e.target.checked)}/>Allow late quiz submissions</label><label className="form-field wide">Quiz instructions<textarea required value={instructions} onChange={e=>setInstructions(e.target.value)}/></label><label className="check-line"><input type="checkbox" checked={quizPublished} onChange={e=>setQuizPublished(e.target.checked)}/>Publish the quiz with this lesson</label></div><FormQuestionBuilder questions={questions} setQuestions={setQuestions}/><p className="form-note">Responses are reviewed by the teacher. Set the maximum mark above. Feedback and official marks are entered in Homework review.</p></>}
 {quizChoice&&quizChoice!=='__new__'&&quizChoice!=='__auto__'&&<p className="form-note"><Link className="text-link" to={`/teacher/lessons?view=assignments&edit=${quizChoice}`} onClick={onClose}>Edit the linked quiz, marks and deadline →</Link></p>}
 <div className="form-grid section-gap"><DocumentField label="Worksheet / resource document (optional)" value={v.resourceUrl} onChange={url=>set('resourceUrl',url)} scope={{kind:'material',lessonId:id}} onBusy={setUploadBusy} disabled={!v.courseId||busy||uploadBusy}/><label className="form-field">Audience<select value={v.visibility} disabled={!!v.batchId} onChange={e=>set('visibility',e.target.value)}><option value="members">Enrolled students</option><option value="public">Public free lesson</option></select></label><label className="check-line"><input type="checkbox" checked={v.published} onChange={e=>set('published',e.target.checked)}/>Publish lesson</label></div>
 <section className="form-builder"><h3>Lesson tutes</h3><p className="form-note">Add a worksheet or PDF for this section. Upload a document or use an existing link.</p>{(v.tutes||[]).map((t:any,i:number)=><div className="form-grid" key={t.id}><label className="form-field">Tute title<input required value={t.title} onChange={e=>set('tutes',v.tutes.map((x:any,j:number)=>j===i?{...x,title:e.target.value}:x))}/></label><DocumentField label="Tute document" required value={t.url} onChange={url=>set('tutes',v.tutes.map((x:any,j:number)=>j===i?{...x,url}:x))} scope={{kind:'material',lessonId:id}} onBusy={setUploadBusy} disabled={!v.courseId||busy||uploadBusy}/><button className="text-link" type="button" onClick={()=>set('tutes',v.tutes.filter((x:any)=>x.id!==t.id))}>Remove tute</button></div>)}<button className="button small" type="button" disabled={(v.tutes||[]).length>=20} onClick={()=>set('tutes',[...(v.tutes||[]),{id:uid('TUTE-'),title:'',url:''}])}>Add tute link</button></section>
 {row&&<div className="lesson-editor-delete"><DeleteLessonButton lesson={data.lessons.find(l=>l.id===row.id)||row} onDeleted={onClose}/></div>}{error&&<p className="error" role="alert">{error}</p>}</div><div className="form-footer"><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy||uploadBusy||noteLoading||!!noteError}>{busy?'Saving…':v.published?'Save & publish':'Save lesson draft'}</button></div></form></Modal>;
}
