import { useState } from 'react';
import { Form,Modal } from './ui';
import { useApp } from './store';
import type { Row } from './domain';
import { courseName,readable,uid } from './domain';
import { homeworkDeadline,timetableHomework } from './timetable-homework';

export function TimetableHomeworkEditor({source,reuse,date,batchId,courseId,onClose}:{source?:Row;reuse?:Row;date:string;batchId:string;courseId:string;onClose:()=>void}){
 const {data,batch,convertHomework,notify}=useApp();
 const [id]=useState(()=>source?'HOMEWORK-'+source.id:uid('HOMEWORK-'));
 const modules=data.batches.filter(b=>b.active&&(reuse||!courseId||b.courseId===courseId));
 const fields=[
  ...(!source?[{name:'batchId',label:'Module',type:'select',required:true,options:[{value:'',label:'Choose a module'},...modules.map(b=>({value:b.id,label:courseId&&!reuse?b.name:courseName(data,b.courseId)+' · '+b.name}))]}]:[]),
  {name:'title',label:'Homework title',required:true},
  {name:'question',label:'Question for students',type:'textarea',required:true,wide:true},
  ...(!source?[{name:'date',label:'Release date',type:'date',required:true},{name:'time',label:'Release time (Sri Lanka)',type:'time',required:true}]:[]),
  {name:'deadline',label:'Deadline (Sri Lanka)',type:'datetime-local',required:true},
  {name:'allowLate',label:'Allow late submissions',type:'checkbox'},
 ];
 const day=source?.date||date,time=source?.time||'18:00';
 return <Modal title={source?'Convert class to homework':reuse?'Reuse homework in another module':'Schedule homework'} onClose={onClose}>
  <div className="pad"><p>Students type their answers on the website and submit them for your review.</p>
   {source&&<p>This replaces just this class entry with homework at {source.time} on {readable(source.date)}. Other entries in the series stay scheduled.</p>}
  </div>
  <Form fields={fields} initial={{batchId:source?.batchId||(reuse?'':batchId),title:source?.title||reuse?.title||'',question:reuse?.formQuestions?.[0]?.label||'',date:day,time,deadline:homeworkDeadline(day,time),allowLate:true}}
   onCancel={onClose} submit={source?'Convert to homework':'Schedule homework'} onSave={async values=>{
    const {series,assignment}=timetableHomework(data,id,values);
    if(source)await convertHomework(source,series,assignment);
    else await batch([{table:'practiceSeries',row:series},{table:'assignments',row:assignment}]);
    notify(source?'Class converted to homework.':'Homework scheduled.');
    onClose();
  }}/>
 </Modal>;
}

