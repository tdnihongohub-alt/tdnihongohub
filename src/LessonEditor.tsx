import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Image, Video } from 'lucide-react';
import { useApp } from './store';
import { Modal, Badge } from './ui';
import { today, uid } from './domain';
import type { Row } from './domain';
import { parseSriLanka, sriLankaInput } from './assignment-scheduling';
import type { FormQuestion } from './assignment-scheduling';
import { FormQuestionBuilder } from './FormQuestionBuilder';
import { lessonContentPlan, recordingThumbnail } from './lesson-content';
import './lesson-content.css';

export function LessonEditor({row,onClose}:{row?:Row;onClose:()=>void}){
 const {data,batch,notify}=useApp();const [id]=useState(row?.id||uid('LES-'));const [v,setV]=useState<Row>({id,title:'',courseId:'',batchId:'',module:'Getting started',notes:'',recordingUrl:'',resourceUrl:'',recordingTitle:'',recordingDescription:'',thumbnailUrl:'',published:false,visibility:'members',...row});
 const inherited=data.assignments.find(a=>a.lessonId===id&&a.kind==='form');
 const [quizChoice,setQuizChoice]=useState(row&&!row.quizState&&!row.quizId?'__auto__':row?.quizState==='coming_soon'?'':row?.quizId||inherited?.id||'');
 const [questions,setQuestions]=useState<FormQuestion[]>([]);const [quizTitle,setQuizTitle]=useState('');const [instructions,setInstructions]=useState('Complete this activity after watching the recording.');
 const [deadline,setDeadline]=useState(sriLankaInput(Date.parse(`${today()}T23:59:00+05:30`)));const [quizPublished,setQuizPublished]=useState(true);const [maxMark,setMaxMark]=useState(10);const [allowLate,setAllowLate]=useState(true);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const set=(name:string,value:any)=>setV(p=>({...p,[name]:value}));const thumb=recordingThumbnail(v);
 const quizzes=data.assignments.filter(a=>a.kind==='form'&&a.courseId===v.courseId&&(!a.batchId||a.batchId===v.batchId));
 return <Modal title={row?'Edit lesson & recording':'Create lesson & recording'} onClose={onClose}><form onSubmit={async e=>{e.preventDefault();setError('');setBusy(true);try{
  const quizId=quizChoice==='__new__'?uid('ASN-'):quizChoice;
  const lesson:Row={...v,id,quizState:quizChoice?'linked':'coming_soon',quizId};
  if(quizChoice==='__auto__'){delete lesson.quizState;delete lesson.quizId;}
  const quiz=quizChoice==='__new__'?{id:quizId,title:quizTitle.trim()||`${v.title} — quiz`,courseId:v.courseId,batchId:v.batchId||'',lessonId:id,kind:'form',instructions,worksheetUrl:'',formQuestions:questions,maxMark,published:!!v.published&&quizPublished,allowLate,releaseAt:0,deadlineAt:parseSriLanka(deadline),dueDate:deadline.slice(0,10),createdAt:new Date().toISOString()}:undefined;
  await batch(lessonContentPlan(data,lesson,quiz));notify(v.published?'Lesson published. Students receive the update automatically.':'Lesson template saved as a draft.');onClose();
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>
 <div className="form-body"><p className="form-note">Choose the course and batch, add the recording, and prepare its activity. Empty recordings and quizzes appear as Coming soon when the lesson is published.</p><div className="form-grid">
 <label className="form-field">Course *<select required value={v.courseId} onChange={e=>{set('courseId',e.target.value);set('batchId','');setQuizChoice('');}}><option value="">Choose course</option>{data.courses.map(c=><option value={c.id} key={c.id}>{c.title}</option>)}</select></label>
 <label className="form-field">Batch<select value={v.batchId||''} disabled={!v.courseId} onChange={e=>{set('batchId',e.target.value);setQuizChoice('');if(e.target.value)set('visibility','members');}}><option value="">All batches in this course</option>{data.batches.filter(b=>b.courseId===v.courseId).map(b=><option value={b.id} key={b.id}>{b.name}</option>)}</select></label>
 <label className="form-field">Lesson title *<input required value={v.title} onChange={e=>set('title',e.target.value)}/></label><label className="form-field">Module / topic *<input required value={v.module} onChange={e=>set('module',e.target.value)}/></label>
 <label className="form-field wide">Lesson notes<textarea rows={3} value={v.notes} onChange={e=>set('notes',e.target.value)}/></label>
 <label className="form-field wide">YouTube recording link<input type="url" value={v.recordingUrl} onChange={e=>set('recordingUrl',e.target.value)}/><small>Paste the recording URL. Its thumbnail appears automatically. Leave empty while the recording is being prepared.</small></label>
 <label className="form-field">Recording title<input value={v.recordingTitle||''} placeholder={v.title||'Uses the lesson title'} onChange={e=>set('recordingTitle',e.target.value)}/></label>
 <label className="form-field">Custom thumbnail link (optional)<input type="url" value={v.thumbnailUrl||''} onChange={e=>set('thumbnailUrl',e.target.value)}/></label>
 <label className="form-field wide">Recording description<textarea rows={2} value={v.recordingDescription||''} onChange={e=>set('recordingDescription',e.target.value)}/></label>
 </div><div className="lesson-preview"><div className="lesson-preview-image">{thumb?<img src={thumb} alt="Recording thumbnail preview"/>:<Image size={28}/>}</div><div><Badge>{v.recordingUrl?<><Video size={13}/> Recording</>:<><Clock3 size={13}/> Recording coming soon</>}</Badge><h3>{v.recordingTitle||v.title||'Your recording title'}</h3><p>{v.recordingDescription||'Your recording description will appear here.'}</p></div></div>
 <div className="form-grid"><label className="form-field wide">Quiz beside this recording<select value={quizChoice} disabled={!v.courseId} onChange={e=>setQuizChoice(e.target.value)}>{row&&<option value="__auto__">Keep existing lesson activities</option>}<option value="">Coming soon</option><option value="__new__">Create a new interactive quiz here</option>{quizzes.map(q=><option key={q.id} value={q.id}>{q.title}{q.published?'':' (draft)'}</option>)}</select><small>Only quizzes matching this course and batch are listed. Unpublished or scheduled quizzes stay Coming soon for students.</small></label></div>
 {quizChoice==='__new__'&&<><div className="form-grid"><label className="form-field">Quiz title<input value={quizTitle} placeholder={`${v.title||'Lesson'} — quiz`} onChange={e=>setQuizTitle(e.target.value)}/></label><label className="form-field">Quiz deadline (Sri Lanka time) *<input required type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)}/></label><label className="form-field">Maximum quiz mark<input type="number" min="1" required value={maxMark} onChange={e=>setMaxMark(Number(e.target.value))}/></label><label className="check-line"><input type="checkbox" checked={allowLate} onChange={e=>setAllowLate(e.target.checked)}/>Allow late quiz submissions</label><label className="form-field wide">Quiz instructions<textarea required value={instructions} onChange={e=>setInstructions(e.target.value)}/></label><label className="check-line"><input type="checkbox" checked={quizPublished} onChange={e=>setQuizPublished(e.target.checked)}/>Publish the quiz with this lesson</label></div><FormQuestionBuilder questions={questions} setQuestions={setQuestions}/><p className="form-note">Responses are reviewed by the teacher. Set the maximum mark above. Feedback and official marks are entered in Homework review.</p></>}
 {quizChoice&&quizChoice!=='__new__'&&quizChoice!=='__auto__'&&<p className="form-note"><Link className="text-link" to={`/teacher/lessons?view=assignments&edit=${quizChoice}`} onClick={onClose}>Edit the linked quiz, marks and deadline →</Link></p>}
 <div className="form-grid section-gap"><label className="form-field wide">Worksheet / resource link (optional)<input type="url" value={v.resourceUrl} onChange={e=>set('resourceUrl',e.target.value)}/></label><label className="form-field">Audience<select value={v.visibility} disabled={!!v.batchId} onChange={e=>set('visibility',e.target.value)}><option value="members">Enrolled students</option><option value="public">Public free lesson</option></select></label><label className="check-line"><input type="checkbox" checked={v.published} onChange={e=>set('published',e.target.checked)}/>Publish lesson</label></div>
 {error&&<p className="error" role="alert">{error}</p>}</div><div className="form-footer"><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy}>{busy?'Saving…':v.published?'Save & publish':'Save lesson draft'}</button></div></form></Modal>;
}
