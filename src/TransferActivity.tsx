import { useState } from 'react';
import { useApp } from './store';
import { assignmentAudienceFields } from './assignment-audience';
import { Modal,Form } from './ui';
import { uid } from './domain';
import type { Row } from './domain';

export function TransferActivity({row,table,onClose}:{row:Row;table:'lessons'|'assignments';onClose:()=>void}){
 const {data,batch,readLessonNote,notify,moveActivity}=useApp();
 const [course,setCourse]=useState(row.courseId);
 const [mode,setMode]=useState('copy');
 return <Modal title="Transfer to course / module / batch" onClose={onClose}><div className="pad"><p>Create a draft copy for another class. Previous attempts and feedback stay with the original activity.</p>
 <label className="form-field">Action<select value={mode} onChange={e=>setMode(e.target.value)}><option value="copy">Create a draft copy</option>{!row.published&&!row.practiceSeriesId&&<option value="move">Move this draft</option>}</select></label><label className="form-field">Destination course<select value={course} onChange={e=>setCourse(e.target.value)}>{data.courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label></div>
 <Form key={course} fields={[{name:'batchId',label:'Destination module / batch',type:'select',options:[{value:'',label:'Shared with all modules in this course'},...data.batches.filter(b=>b.courseId===course&&b.active).map(b=>({value:b.id,label:b.name}))]}]} initial={{batchId:''}} onCancel={onClose} submit={mode==='move'?'Move draft':'Create draft copy'} onSave={async values=>{
  const id=mode==='move'?row.id:uid(table==='lessons'?'LES-':'ASN-');
  const copy:Row={...row,id,courseId:course,...assignmentAudienceFields(values.batchId?[values.batchId]:[],!values.batchId),published:false,createdAt:new Date().toISOString()};
  delete copy.practiceSeriesId;delete copy.practiceDate;delete copy.expectedQuestionCount;
  if(mode==='move'){
   if(table==='assignments')copy.lessonId='';
   else{copy.quizId='';copy.quizState='coming_soon';copy.visibility=values.batchId?'members':copy.visibility;}
   await moveActivity(table,row,copy);notify('Draft moved to the selected course and module.');onClose();return;
  }
  const changes:{table:typeof table|'lessonNotes';row:Row}[]=[];
  if(table==='assignments')copy.lessonId='';
  else{
   copy.quizState='coming_soon';copy.quizId='';copy.visibility=values.batchId?'members':copy.visibility;
   if(row.hasManagedNotes){const note=await readLessonNote(row.id);if(!note)throw Error('Saved notes could not be loaded.');changes.push({table:'lessonNotes',row:{...note,id,published:false,releaseAt:0}});copy.notesPublished=false;copy.notesReleaseAt=0;}
  }
  changes.push({table,row:copy});await batch(changes);
  notify('Draft copy created in the selected course and module.');onClose();
 }}/>
 </Modal>;
}

