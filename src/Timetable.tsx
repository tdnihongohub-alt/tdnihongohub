import { LearningRhythm } from './LearningRhythm';
import { ExamCountdowns } from './ExamCountdown';
import { TimetableHomeworkEditor } from './TimetableHomeworkEditor';
import { moduleColour } from './module-colour';
import { AssignmentEditor } from './AssignmentEditor';
import { PracticeEntry,PracticeSeriesEditor } from './PracticeTimetable';
import { teachingModules } from './weekly-learning';
import { canOpenModule } from './course-enrollment';
import { practiceSlots,practiceTemplate } from './practice-schedule';
import type { PracticeSlot } from './practice-schedule';
import { useEffect, useState } from 'react';
import { Link,useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from './store';
import { AddButton, Badge, Empty, Form, Modal, OutLink, PageHead, Panel, SearchBox } from './ui';
import { addDays, batchName, readable, today } from './domain';
import type { Row } from './domain';
import { sessionChanges } from './schedule-editing';
import { sessionsInWeek, timetableChanges, validDate, weekStart } from './timetable-management';
import type { TimetableChange } from './timetable-management';
import './timetable.css';

type Management={rows:Row[];action:'move'|'delete';futureRows?:Row[]};

export function Schedule({student=false}:{student?:boolean}){
 const [params]=useSearchParams();
 const courseId=params.get('course')||'';
 return <CourseTimetable key={courseId} student={student} courseId={courseId}/>;
}

function CourseTimetable({student,courseId}:{student:boolean;courseId:string}){
 const {data,identity,studentId}=useApp();
 const [params,setParams]=useSearchParams();
 const available=student?new Set(teachingModules(data,studentId,identity?.uid||'').map(module=>module.courseId)):null;
 const courses=data.courses.filter(course=>!available||available.has(course.id)).sort((a,b)=>a.title.localeCompare(b.title));
 const course=courses.find(row=>row.id===courseId);
 const modules=data.batches.filter(module=>(!courseId||module.courseId===courseId)&&(!student||canOpenModule(data,studentId,module)));
 const colour=(id:string)=>moduleColour(data.batches.find(module=>module.id===id));
 const moduleIds=new Set(modules.map(module=>module.id));
 const inCourse=(item:Row)=>(!student&&!courseId)||moduleIds.has(item.batchId);
 const initialEdit=data.sessions.find(s=>s.id===params.get('edit')&&inCourse(s));
 const [view,setView]=useState(['day','week','month',...(!student?['list']:[])].includes(params.get('view')||'')?params.get('view')!:'week');
 const [date,setDate]=useState(validDate(params.get('date')||'')?params.get('date')!:initialEdit?.date||today());
 const [edit,setEdit]=useState<Row|undefined|null>(student?null:initialEdit|| (params.get('new')==='1'?undefined:null));
 const [newDate,setNewDate]=useState(date);
 const [batchFilter,setBatchFilter]=useState(moduleIds.has(params.get('batch')||'')?params.get('batch')!:'');
 const [search,setSearch]=useState('');
 const [management,setManagement]=useState<Management|null>(null);
 const [practiceEdit,setPracticeEdit]=useState<PracticeSlot|null>(null);
 const [practiceManager,setPracticeManager]=useState(false);
 const [homework,setHomework]=useState<{source?:Row;reuse?:Row}|null>(null);
 const monday=weekStart(date),first=date.slice(0,7)+'-01',monthStart=weekStart(first);
 const dates=view==='day'?[date]:Array.from({length:view==='month'?42:7},(_,i)=>addDays(view==='month'?monthStart:monday,i));
 const title=(s:Row)=>s.title||data.lessons.find(l=>l.id===s.lessonId)?.title||'Live class';
 const rows=data.sessions.filter(s=>inCourse(s)&&(!batchFilter||s.batchId===batchFilter)&&[title(s),batchName(data,s.batchId),s.date,s.time].join(' ').toLowerCase().includes(search.toLowerCase()));
 const recurring=(data.practiceSeries||[]).filter(r=>inCourse(r)&&(!batchFilter||r.batchId===batchFilter)&&[r.title,batchName(data,r.batchId)].join(' ').toLowerCase().includes(search.toLowerCase().trim()));
 const slots=practiceSlots(recurring,data.assignments,dates[0],dates[dates.length-1]);
 const slotsOn=(day:string)=>slots.filter(slot=>slot.date===day);
 const practiceEntries=(day:string,compact=false)=>slotsOn(day).map(slot=><PracticeEntry key={slot.id} slot={slot} student={student} compact={compact} onEdit={()=>setPracticeEdit(slot)}/>);
 const weekRows=sessionsInWeek(rows,date);
 function shift(n:number){
  if(view==='month'){const value=new Date(date.slice(0,7)+'-15T12:00:00Z');value.setUTCMonth(value.getUTCMonth()+n);setDate(value.toISOString().slice(0,10));}
  else setDate(addDays(date,n*(view==='week'?7:1)));
 }
 function create(day=date){setNewDate(day);setEdit(undefined);}
 function openEdit(s:Row){setDate(s.date);setEdit(s);}
 function openDelete(s:Row){
  setEdit(null);
  setManagement({rows:[s],action:'delete',futureRows:s.seriesId?data.sessions.filter(l=>l.seriesId===s.seriesId&&l.batchId===s.batchId&&l.date>=s.date).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)):undefined});
 }
 const controls=(s:Row)=><div className="actions"><button className="button small" aria-label="Edit session" onClick={()=>openEdit(s)}><Pencil size={14}/>Edit</button><button className="button small timetable-delete" aria-label={`Delete session on ${s.date} at ${s.time}`} onClick={()=>openDelete(s)}><Trash2 size={14}/>Delete</button></div>;
 function selectCourse(id:string){
  const next=new URLSearchParams({date,view});
  if(id)next.set('course',id);
  setParams(next);
 }
 if(courseId&&!course)return <Empty title="This course timetable is unavailable"><Link className="text-link" to={student?'/student/schedule':'/teacher/schedule'}>Back to timetable</Link></Empty>;
 return <>
  {course&&<Link className="text-link" to={(student?'/student/course/':'/teacher/modules/')+encodeURIComponent(course.id)}>Back to {course.title}</Link>}
  <PageHead eyebrow={student?'YOUR LEARNING SPACE':undefined} title={course?course.title+' timetable':'Your timetable.'} description="Plan your classes and keep every date clear. Classes and practice releases use Sri Lanka time.">{!student&&<><AddButton onClick={()=>create()}>Schedule class</AddButton><button className="button" onClick={()=>setHomework({})}>Schedule homework</button><button className="button" onClick={()=>setPracticeManager(true)}>Recurring homework & quizzes</button></>}</PageHead>
  {(!course||/\b(?:a\/?l|advanced level)\b/i.test([course.category,course.title].join(' ')))&&<LearningRhythm date={date} onSelect={day=>{setDate(day);setView('day');setBatchFilter('');setSearch('');}}/>}
  <ExamCountdowns courses={course?[course]:courses}/>
  {course&&!student&&<Link className="button small section-gap" to={`/teacher/classes?edit=${encodeURIComponent(course.id)}`}>Set exam date & quote</Link>}
  <div className="toolbar spread">
   <label className="timetable-date-picker">Course<select value={courseId} onChange={e=>selectCourse(e.target.value)}><option value="">All courses</option>{courses.map(c=><option value={c.id} key={c.id}>{c.title}</option>)}</select></label>
   <div className="actions"><div className="filter-tabs inline">{(student?['day','week','month']:['day','week','month','list']).map(v=><button className={v===view?'active':''} key={v} onClick={()=>setView(v)}>{v==='list'?'All sessions':v[0].toUpperCase()+v.slice(1)}</button>)}</div><button className="icon-button" onClick={()=>shift(-1)} aria-label="Previous period"><ChevronLeft size={18}/></button><strong>{view==='month'?readable(date.slice(0,7)):readable(date)}</strong><button className="icon-button" onClick={()=>shift(1)} aria-label="Next period"><ChevronRight size={18}/></button><button className="button small" onClick={()=>setDate(today())}>Today</button></div>
   <label className="timetable-date-picker">Jump to date<input type="date" value={date} onChange={e=>{if(validDate(e.target.value))setDate(e.target.value);}}/></label>
   <SearchBox value={search} onChange={setSearch} placeholder="Search classes or practice"/>
   <select aria-label="Filter timetable module" value={batchFilter} onChange={e=>setBatchFilter(e.target.value)}><option value="">All modules</option>{modules.map(b=><option value={b.id} key={b.id}>{b.name}</option>)}</select>
  </div>
  {modules.length>0&&<div className="timetable-legend" aria-label="Module colours">{modules.filter(m=>!batchFilter||m.id===batchFilter).map(m=>{
   const label=<><i aria-hidden="true"/>{m.name}</>;
   return student?<span key={m.id} data-module-colour={colour(m.id)}>{label}</span>:<Link key={m.id} data-module-colour={colour(m.id)} title={`Edit colour for ${m.name}`} to={`/teacher/classes?view=batches&edit=${encodeURIComponent(m.id)}`}>{label}</Link>;
  })}</div>}
  {!student&&<section className="timetable-week-tools" aria-label="Manage this week's timetable"><div><strong><CalendarDays size={18}/>Week of {readable(monday)} – {readable(addDays(monday,6))}</strong><p>{weekRows.length} {weekRows.length===1?'class':'classes'} matching your filters. Select classes to move or delete, or reschedule the whole week.</p></div><div className="actions"><button className="button" disabled={!weekRows.length} onClick={()=>setManagement({rows:weekRows,action:'delete'})}><Trash2 size={15}/>Manage / delete</button><button className="button primary" disabled={!weekRows.length} onClick={()=>setManagement({rows:weekRows,action:'move'})}>Reschedule week</button></div></section>}
  <Panel className={view==='month'?'timetable-month-panel':''}>
   {view==='list'?<div className="table-wrap"><table><thead><tr><th>Date & time</th><th>Module</th><th>Session</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(s=><tr key={s.id}><td>{readable(s.date)}<small>{s.time} · {s.duration} minutes</small></td><td><span className="timetable-module-label" data-module-colour={colour(s.batchId)}><i aria-hidden="true"/>{batchName(data,s.batchId)}</span></td><td>{title(s)}</td><td><Badge>{s.status==='cancelled'?'Cancelled':'Scheduled'}</Badge></td><td>{controls(s)}</td></tr>)}</tbody></table>{!rows.length&&<Empty title="No sessions found"/>}</div>
   :view==='month'?<div className="month-grid">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><div className="weekday" key={day}>{day}</div>)}{dates.map(day=><div className={`calendar-cell ${day===today()?'today':''} ${day.slice(0,7)!==date.slice(0,7)?'dim':''}`} key={day}><div className="timetable-cell-date"><span>{Number(day.slice(-2))}</span>{!student&&<button className="icon-button" aria-label={`Schedule class on ${day}`} onClick={()=>create(day)}><Plus size={12}/></button>}</div>{rows.filter(s=>s.date===day).sort((a,b)=>a.time.localeCompare(b.time)).map(s=><button className={`calendar-event ${s.status==='cancelled'?'cancelled':''}`} key={s.id} data-module-colour={colour(s.batchId)} disabled={student} aria-label={student?undefined:`Edit session on ${s.date} at ${s.time}`} onClick={()=>openEdit(s)}>{!student&&<Pencil size={12}/>} {s.time} · {batchName(data,s.batchId)}{s.status==='cancelled'?' · cancelled':''}</button>)}{practiceEntries(day,true)}</div>)}</div>
   :dates.map(day=><div key={day}><div className="agenda-day">{new Date(day+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}{day===today()&&<Badge tone="green">Today</Badge>}{!student&&<button className="text-link" onClick={()=>create(day)}><Plus size={13}/>Add class</button>}</div>{rows.filter(s=>s.date===day).length?rows.filter(s=>s.date===day).sort((a,b)=>a.time.localeCompare(b.time)).map(s=><div className="list-row timetable-session-row" data-module-colour={colour(s.batchId)} key={s.id}><span className="time-chip">{s.time}</span><div><strong>{title(s)}</strong><small>{batchName(data,s.batchId)} · {s.duration} minutes</small></div>{s.status==='cancelled'?<Badge>Cancelled</Badge>:<OutLink url={s.zoomUrl} className="button small">Join Zoom</OutLink>}{!student&&controls(s)}</div>):(!slotsOn(day).length&&<p className="agenda-empty">Nothing scheduled.</p>)}{practiceEntries(day)}</div>)}
  </Panel>
  {view==='list'&&slots.length>0&&<Panel title="Practice this week">{dates.filter(day=>slotsOn(day).length).map(day=><div key={day}><div className="agenda-day">{readable(day)}</div>{practiceEntries(day)}</div>)}</Panel>}
  {!student&&homework&&<TimetableHomeworkEditor source={homework.source} reuse={homework.reuse} date={date} batchId={batchFilter} courseId={courseId} onClose={()=>setHomework(null)}/>}
  {!student&&practiceManager&&<PracticeSeriesEditor date={date} batchId={batchFilter} courseId={courseId} onClose={()=>setPracticeManager(false)}/>}
  {!student&&practiceEdit&&<AssignmentEditor key={practiceEdit.id} row={practiceEdit.assignment} initialTemplate={practiceTemplate(practiceEdit)} onReuse={practiceEdit.assignment?.kind==='assignment'&&practiceEdit.assignment.formQuestions?.length===1&&practiceEdit.assignment.formQuestions[0].type==='long'?()=>{setHomework({reuse:practiceEdit.assignment});setPracticeEdit(null);}:undefined} onClose={()=>setPracticeEdit(null)}/>}
  {!student&&edit!==null&&<Modal title={edit?'Edit scheduled class':'Schedule a class'} onClose={()=>setEdit(null)}><SessionForm key={edit?.id||'new-'+newDate} row={edit} date={newDate} batchId={batchFilter} courseId={courseId} onClose={()=>setEdit(null)} onDelete={edit?()=>openDelete(edit):undefined} onConvert={edit?()=>{setEdit(null);setHomework({source:edit});}:undefined}/></Modal>}
  {!student&&management&&<TimetableManager {...management} onClose={()=>setManagement(null)} onMoved={day=>setDate(day)}/>}
 </>;
}

function SessionForm({row,date,batchId,courseId,onClose,onDelete,onConvert}:{row?:Row;date:string;batchId:string;courseId:string;onClose:()=>void;onDelete?:()=>void;onConvert?:()=>void}){
 const {data,batch,changeTimetable,notify}=useApp();const [future,setFuture]=useState(false);
 const fields=[{name:'batchId',label:'Module',type:'select',required:true,options:[{value:'',label:'Choose module'},...data.batches.filter(b=>(!courseId||b.courseId===courseId)&&(b.active||b.id===row?.batchId)).map(b=>({value:b.id,label:b.name+(b.active?'':' (inactive)')}))]},
  {name:'lessonId',label:'Reusable lesson',type:'select',options:[{value:'',label:'No linked lesson'},...data.lessons.filter(l=>!courseId||l.courseId===courseId).map(l=>({value:l.id,label:l.title}))]},
  {name:'title',label:'Session title (optional)'},{name:'date',label:'Date',type:'date',required:true},{name:'time',label:'Start time (Sri Lanka)',type:'time',required:true},
  {name:'duration',label:'Duration (minutes)',type:'number',required:true,min:15,max:600},{name:'zoomUrl',label:'Zoom meeting link',type:'url'},
  {name:'status',label:'Status',type:'select',options:[{value:'scheduled',label:'Scheduled'},{value:'cancelled',label:'Cancelled'}]},
  ...(!row?[{name:'repeatUntil',label:'Repeat weekly until (optional)',type:'date',help:'Choose an end date to schedule this class on the same weekday each week.'}]:[])];
 return <Form fields={fields} initial={{batchId,date,time:'18:00',duration:90,status:'scheduled',zoomUrl:'',lessonId:'',...row}} onCancel={onClose}
  extra={<>{row?.seriesId&&<label className="check-line"><input type="checkbox" checked={future} onChange={e=>setFuture(e.target.checked)}/>Apply date shift, time, duration, Zoom link and status to this and future classes in this series</label>}{future&&<p className="form-note">Changing the date moves each remaining class by the same number of days. Earlier classes keep their dates.</p>}{onConvert&&<div className="timetable-form-delete"><button className="button" type="button" onClick={onConvert}>Convert to homework</button><small>Set a question and let students type their answers.</small></div>}{onDelete&&<div className="timetable-form-delete"><button className="button timetable-delete" type="button" onClick={onDelete}><Trash2 size={15}/>Delete scheduled class</button><small>You can choose this class only or the remaining repeating classes.</small></div>}</>}
  submit={row?'Save session changes':'Schedule class'} onSave={async values=>{
   const changes=sessionChanges(data,values,row,future);
   if(row)await changeTimetable(changes.map(c=>({before:c.row.id===row.id?row:data.sessions.find(s=>s.id===c.row.id)!,after:c.row})));
   else await batch(changes);
   onClose();notify(row?'Timetable changes saved.':'Classes scheduled.');
  }}/>;
}

export function TimetableManager({rows,action:initialAction,futureRows,onClose,onMoved}:{rows:Row[];action:'move'|'delete';futureRows?:Row[];onClose:()=>void;onMoved?:(date:string)=>void}){
 const {data,changeTimetable,notify}=useApp();
 const [action,setAction]=useState(initialAction),[includeFuture,setIncludeFuture]=useState(false);
 const [selected,setSelected]=useState(()=>new Set(rows.map(r=>r.id)));
 const [firstDate,setFirstDate]=useState(rows[0]?.date||today()),[dateEdited,setDateEdited]=useState(false),[time,setTime]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const available=includeFuture&&futureRows?futureRows:rows;
 const selectedRows=available.filter(r=>selected.has(r.id)).slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const firstSelected=selectedRows[0]?.date||'';
 useEffect(()=>{if(!dateEdited&&firstSelected)setFirstDate(firstSelected);},[firstSelected,dateEdited]);
 let changes:TimetableChange[]=[],proposalError='';
 try{changes=timetableChanges(selectedRows,action==='delete'?{action:'delete'}:{action:'move',firstDate,time});}catch(e){proposalError=(e as Error).message;}
 return <Modal title="Manage scheduled classes" onClose={()=>{if(!busy)onClose();}}><form aria-busy={busy} onSubmit={async e=>{
  e.preventDefault();setError('');if(proposalError){setError(proposalError);return;}setBusy(true);
  try{await changeTimetable(changes);if(action==='move')onMoved?.(firstDate);notify(`${changes.length} ${changes.length===1?'class':'classes'} ${action==='delete'?'deleted':'rescheduled'}.`);onClose();}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }}><div className="form-body"><fieldset className="timetable-manager-fields" disabled={busy}>
  <div className="filter-tabs"><button type="button" className={action==='move'?'active':''} onClick={()=>{setAction('move');setError('');}}>Reschedule</button><button type="button" className={action==='delete'?'active':''} onClick={()=>{setAction('delete');setError('');}}>Delete</button></div>
  {futureRows&&futureRows.length>rows.length&&<label className="check-line"><input type="checkbox" checked={includeFuture} onChange={e=>{setIncludeFuture(e.target.checked);setSelected(new Set((e.target.checked?futureRows:rows).map(r=>r.id)));setDateEdited(false);}}/>Include this and all remaining classes in the repeating series</label>}
  <div className="timetable-selection-head"><strong>{selectedRows.length} of {available.length} selected</strong><button type="button" className="text-link" onClick={()=>{setSelected(new Set(selectedRows.length===available.length?[]:available.map(r=>r.id)));setDateEdited(false);}}>{selectedRows.length===available.length?'Clear selection':'Select all'}</button></div>
  <div className="timetable-selection-list">{available.map(s=>{const next=changes.find(c=>c.before.id===s.id)?.after;return <label className="timetable-selection-row" key={s.id}><input type="checkbox" checked={selected.has(s.id)} onChange={e=>setSelected(current=>{const next=new Set(current);if(e.target.checked)next.add(s.id);else next.delete(s.id);return next;})}/><div><strong>{s.title||data.lessons.find(l=>l.id===s.lessonId)?.title||'Live class'}</strong><small>{batchName(data,s.batchId)} · {readable(s.date)} · {s.time}{s.status==='cancelled'?' · Cancelled':''}</small>{selected.has(s.id)&&(action==='delete'?<span className="timetable-removal-note">Will be deleted</span>:next&&<span className="timetable-move-preview">→ {readable(next.date)} · {next.time}</span>)}</div></label>;})}</div>
  {action==='move'?<><div className="form-grid section-gap"><label className="form-field">Move first selected class to *<input type="date" required value={firstDate} onChange={e=>{setFirstDate(e.target.value);setDateEdited(true);}}/><small>The other selected classes move by the same number of days.</small></label><label className="form-field">New start time for all selected (optional)<input type="time" value={time} onChange={e=>setTime(e.target.value)}/><small>Leave blank to keep each class's current start time.</small></label></div>{proposalError&&!error&&<p className="form-note">{proposalError}</p>}</>:<p className="notice-bar">Only the selected timetable entries will be removed. Existing attendance, recordings and student records are retained.</p>}
  </fieldset>{error&&<p className="error" role="alert">{error}</p>}</div><div className="form-footer"><button className="button" type="button" disabled={busy} onClick={onClose}>Cancel</button><button className={`button ${action==='delete'?'timetable-delete':'primary'}`} disabled={busy||!selectedRows.length}>{busy?'Saving…':`${action==='delete'?'Delete':'Reschedule'} ${selectedRows.length} ${selectedRows.length===1?'class':'classes'}`}</button></div></form></Modal>;
}
