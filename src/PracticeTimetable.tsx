import { moduleColour } from './module-colour';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { useApp } from './store';
import { batchName,courseName,uid } from './domain';
import type { Row } from './domain';
import { Form,Modal } from './ui';
import { parseSriLanka,sriLankaInput } from './assignment-scheduling';
import { practiceSeriesRecord,practiceStatus } from './practice-schedule';
import type { PracticeSlot } from './practice-schedule';

export function PracticeEntry({slot,student,compact,onEdit}:{slot:PracticeSlot;student:boolean;compact?:boolean;onEdit:()=>void}){
 const {data}=useApp();
 const colour=moduleColour(data.batches.find(batch=>batch.id===slot.series.batchId));
 const available=practiceStatus(slot)==='Available';
 const time=slot.assignment?.releaseAt?sriLankaInput(slot.assignment.releaseAt).slice(11):slot.series.time;
 const status=student?(available?'Available':Date.now()<parseSriLanka(slot.date+'T'+slot.series.time)?'Upcoming':'Questions pending'):practiceStatus(slot);
 const title=slot.assignment?.title||slot.series.title;
 const homework=slot.series.kind==='assignment';
 const url='/student/assignments?assignment='+encodeURIComponent(slot.id);
 const label=<>{time} · {homework?'Homework: ':''}{title}</>;
 if(compact)return student?available?<Link className="calendar-event practice-event" data-module-colour={colour} to={url}>{label}</Link>:<span className="calendar-event practice-event" data-module-colour={colour}>{label}</span>:<button type="button" className="calendar-event practice-event" data-module-colour={colour} onClick={onEdit}>{label}</button>;
 return <div className="list-row timetable-session-row practice-entry" data-module-colour={colour}><span className="time-chip">{time}</span><div><strong><ClipboardList size={15}/> {title}</strong><small>{homework?'Homework · ':''}{batchName(data,slot.series.batchId)} · {slot.series.questionCount} {slot.series.questionCount===1?'question':'questions'} · {status}</small></div>
  {student?available&&<Link className="button small" to={url}>{homework?'Open homework':'Open practice'}</Link>:<button className="button small" onClick={onEdit}>{slot.assignment?'Edit questions':'Add questions'}</button>}
 </div>;
}

export function PracticeSeriesEditor({date,batchId,courseId='',onClose}:{date:string;batchId:string;courseId?:string;onClose:()=>void}){
 const {data,save,notify}=useApp();
 const [selected,setSelected]=useState('');
 const [copy,setCopy]=useState(false);
 const existing=data.practiceSeries.find(row=>row.id===selected);
 const modules=data.batches.filter(b=>b.active&&(copy||!courseId||b.courseId===courseId));
 const editing=copy?undefined:existing;
 const series=data.practiceSeries.filter(row=>!courseId||row.courseId===courseId);
 const fields=[
  ...(!editing?[{name:'batchId',label:'Course module',type:'select',required:true,options:[{value:'',label:'Choose a module'},...modules.map(b=>({value:b.id,label:`${courseName(data,b.courseId)} · ${b.name}`}))]},{name:'startDate',label:'First date',type:'date',required:true}]:[]),
  {name:'title',label:'Practice title',required:true},
  {name:'endDate',label:'Repeat weekly through',type:'date',required:true},
  {name:'time',label:'Release time (Sri Lanka)',type:'time',required:true},
  {name:'questionCount',label:'Questions per slot',type:'number',required:true,min:1,max:20},
  {name:'kind',label:'Question format',type:'select',options:[{value:'form',label:'Multiple choice with automatic marks'},{value:'assignment',label:'Written answers for teacher review'}]},
  {name:'active',label:'Show recurring slots',type:'checkbox'}
 ];
 return <Modal title="Recurring practice" onClose={onClose}><div className="pad"><label className="form-field">Practice series<select value={selected} onChange={e=>{setSelected(e.target.value);setCopy(false);}}><option value="">Create a series</option>{series.map(row=><option key={row.id} value={row.id}>{row.title} · {batchName(data,row.batchId)} · {row.startDate}</option>)}</select></label>{existing&&!copy&&<button className="button small section-gap" onClick={()=>setCopy(true)}>Reuse schedule in another module</button>}</div>
  <Form key={selected+String(copy)} initial={editing||{batchId:copy?'':batchId,startDate:date,endDate:Math.max(2027,Number(date.slice(0,4)))+'-12-31',time:existing?.time||'08:00',title:existing?.title||'',questionCount:existing?.questionCount||10,kind:existing?.kind||'form',active:true}} fields={fields} extra={<p className="form-note">The first date sets the weekday. Reusing a schedule copies the timing and answer format. Add questions to individual slots from the timetable. Saved assignments keep their own release dates.</p>} onCancel={onClose} submit="Save practice series" onSave={async values=>{
   const record=practiceSeriesRecord(data,{...editing,...values},editing?.id||uid('SER-'));
   await save('practiceSeries',record);
   notify('Practice series saved.');
   onClose();
  }}/>
 </Modal>;
}
