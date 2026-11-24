import { CopyQuizLink } from './CopyQuizLink';
import { useEffect,useState } from 'react';
import { Link,useParams,useSearchParams } from 'react-router-dom';
import { BookOpen,CalendarDays,ClipboardCheck,FileText,Play,Plus,Video } from 'lucide-react';
import { useApp } from './store';
import { Badge,Editor,Empty,Modal,OutLink } from './ui';
import { key,percent,readable,studentName,today,uid } from './domain';
import type { Row } from './domain';
import { canOpenModule } from './course-enrollment';
import { openFreeCourse } from './free-squads';
import { moduleLessons,nextWeekNumber,noticeRead,noticeReceipt,sectionLabel,weekGroups } from './weekly-learning';
import { learningTasks,sortLearning,taskDone } from './learning-tasks';
import type { LearningTask } from './learning-tasks';
import { assignmentDeadline,scheduleLabel } from './assignment-scheduling';
import { ModuleCards } from './TeachingModules';
import { LessonNote } from './LessonNote';
import { LessonMedia,ComingSoon } from './LessonMedia';
import { LessonEditor } from './LessonEditor';
import { AssignmentEditor } from './AssignmentEditor';
import { DeleteLessonButton } from './DeleteLessonButton';
import { RemoveRecordingButton } from './RemoveRecordingButton';
import { recordingThumbnail } from './lesson-content';
import { TransferActivity } from './TransferActivity';
import CultureQuizLibrary from './CultureQuizLibrary';
import './weekly-learning.css';

export function WeeklyClass({teacher=false}:{teacher?:boolean}){
 const {id=''}=useParams(),[params,setParams]=useSearchParams();
 const {data,identity,studentId,batch,notify,readUpdates}=useApp();
 const batchId=params.get('batch')||data.lessons.find(l=>l.id===params.get('lesson')&&l.courseId===id)?.batchId||'';
 const course=data.courses.find(c=>c.id===id),delivery=data.batches.find(b=>b.id===batchId&&b.courseId===id);
 const allowed=teacher||!!course&&(openFreeCourse(course)||data.courseAccess.some(a=>a.studentId===studentId&&a.courseId===id&&a.active))&&(!batchId||!!delivery&&canOpenModule(data,studentId,delivery));
 const [lessonEdit,setLessonEdit]=useState<Row|undefined|null>(null),[workEdit,setWorkEdit]=useState<Row|undefined|null>(null);
 const [newLesson,setNewLesson]=useState(''),[newKind,setNewKind]=useState('assignment');
 const [watching,setWatching]=useState<Row|null>(null),[announcementEdit,setAnnouncementEdit]=useState<Row|undefined|null>(null);
 const [copy,setCopy]=useState<{row:Row;table:'lessons'|'assignments'}|null>(null);
 const [sort,setSort]=useState('order'),[expand,setExpand]=useState(false),[busy,setBusy]=useState(false),[showPast,setShowPast]=useState(false);
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 const lessons=sortLearning(moduleLessons(data,id,batchId,studentId,teacher),sort),groups=weekGroups(lessons);
 const tasks=learningTasks(data,id,batchId,studentId,teacher,now);
 const flat=delivery?.learningLayout==='flat'||(delivery?.learningLayout!=='grouped'&&!tasks.some(t=>t.kind==='recording')&&tasks.some(t=>t.kind==='assignment'));
 const weekly=!flat&&groups.length>0&&groups.every(g=>g.label==='Week');
 const requested=params.get('tab')||'weeks',tab=requested==='homework'?'assignments':requested;
 const shown=tasks.filter(task=>tab==='weeks'||tab==='recordings'&&task.kind==='recording'||tab==='assignments'&&task.kind==='assignment'&&task.row.kind!=='form'||tab==='quizzes'&&task.kind==='assignment'&&task.row.kind==='form'||tab==='tutes'&&['material','notes'].includes(task.kind));
 const sorted=shown.slice().sort((a,b)=>sort==='title'?a.title.localeCompare(b.title,undefined,{numeric:true}):sort==='newest'?String(b.row.createdAt||b.id).localeCompare(String(a.row.createdAt||a.id)):sort==='deadline'?Number(a.row.deadlineAt||Infinity)-Number(b.row.deadlineAt||Infinity):0);
 const done=tasks.filter(t=>taskDone(data,identity?.uid||'',studentId,t)).length;
 const timetable=(teacher?'/teacher/schedule':'/student/schedule')+'?course='+encodeURIComponent(id);
 const announcements=data.announcements.filter(a=>batchId&&a.batchId===batchId).slice().reverse();
 const sessions=data.sessions.filter(s=>batchId&&s.batchId===batchId&&(showPast||s.date>=today())).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 useEffect(()=>{
  if(teacher||!allowed||!identity?.verified)return;
  const kind=tab==='announcements'?'announcement':tab==='schedule'?'session':null;
  if(!kind)return;
  const rows=kind==='announcement'?announcements:sessions;
  const unread=rows.filter(row=>!noticeRead(data,identity.uid,row,kind));
  if(unread.length)readUpdates(unread.map(row=>noticeReceipt(identity.uid,kind,row,id)));
 },[teacher,allowed,identity?.uid,tab,data.contentReads,data.sessions,data.announcements]);
 useEffect(()=>{const lesson=lessons.find(l=>l.id===params.get('lesson'));if(lesson?.recordingUrl)setWatching(lesson);},[params.get('lesson')]);
 if(!course||!allowed||batchId&&!delivery)return <Empty title="This class needs teacher approval"><Link to={teacher?'/teacher/modules':'/student/classes'}>Back to courses</Link></Empty>;
 if(!batchId&&!params.has('shared')&&data.batches.some(b=>b.courseId===id))return <><Link className="text-link" to={teacher?'/teacher/modules':'/student/classes'}>Back to courses</Link><header className="weekly-module-banner"><h1>{course.title}</h1><p>Choose a module to open its lessons and activities.</p><Link className="button primary" to={timetable}>Course timetable</Link><Link className="button" to="?shared=1">Shared course materials</Link></header><ModuleCards teacher={teacher} courseId={id}/></>;
 function createWork(lessonId='',kind='assignment'){setNewLesson(lessonId);setNewKind(kind);setWorkEdit(undefined);}
 async function mark(items:LearningTask[],complete:boolean){
  setBusy(true);
  try{
   const changes=items.map(t=>({table:'taskProgress' as const,row:{id:key(identity!.uid,batchId,t.id),uid:identity!.uid,taskId:t.id,kind:t.kind,recordId:t.recordId,courseId:id,batchId,complete}}));
   for(let i=0;i<changes.length;i+=4)await batch(changes.slice(i,i+4));
  }catch(e){notify((e as Error).message);}finally{setBusy(false);}
 }
 function taskRow(t:LearningTask,index:number){
  const checked=taskDone(data,identity?.uid||'',studentId,t);
  return <div className={'weekly-resource activity-tone-'+index%6} key={t.id}>
   {!teacher&&<input type="checkbox" aria-label={'Complete '+t.title} checked={checked} disabled={busy} onChange={e=>void mark([t],e.target.checked)}/>}
   {t.kind==='recording'&&recordingThumbnail(t.row)?<img className="weekly-recording-thumb" src={recordingThumbnail(t.row)} alt=""/>:t.kind==='assignment'?<ClipboardCheck size={20}/>:t.kind==='recording'?<Video size={20}/>:<FileText size={20}/>}
   <div><strong>{t.title}</strong><small>{t.kind==='assignment'?(t.row.kind==='form'?'Quiz':'Assignment / homework')+' · '+scheduleLabel(assignmentDeadline(t.row)):t.kind==='recording'?'Lesson recording':t.kind==='notes'?'Typed notes':'Lesson material'}{teacher&&!t.row.published?' · Draft':''}</small>{t.kind==='notes'&&<LessonNote lesson={t.row}/>}</div>
   {t.kind==='assignment'?(teacher?<button className="button small" onClick={()=>setWorkEdit(t.row)}>Edit</button>:<Link className="button small" to={'/student/assignments?assignment='+encodeURIComponent(t.recordId)}>Open</Link>):t.kind==='recording'?<button className="button small" onClick={()=>setWatching(t.row)}><Play size={14}/>Watch</button>:t.url?<OutLink className="button small" url={t.url}>Open tute</OutLink>:null}
   {teacher&&t.kind!=='assignment'&&<button className="text-link" onClick={()=>setLessonEdit(t.row)}>Edit</button>}
   {teacher&&t.kind==='recording'&&<RemoveRecordingButton lesson={t.row} batchId={batchId}/>}
   {teacher&&t.kind==='assignment'&&<CopyQuizLink target={{kind:'assignment',id:t.recordId}} title={t.title}/>} {teacher&&<button className="text-link" onClick={()=>setCopy({row:t.row,table:t.kind==='assignment'?'assignments':'lessons'})}>Transfer / copy</button>}
  </div>;
 }
 const academic=['weeks','recordings','assignments','quizzes','tutes'].includes(tab);
 return <>
  <Link className="text-link" to={(teacher?'/teacher/modules/':'/student/course/')+id}>Back to {course.title}</Link>
  <header className="weekly-module-banner"><span>{course.category} · {course.title}</span><h1>{delivery?.name||course.title}</h1>
   <Link className="button" to={timetable}>Course timetable</Link>
   {teacher&&<div className="actions"><button className="button" onClick={()=>setLessonEdit(undefined)}><Plus size={15}/>Add {weekly?'week':'lesson'}</button><button className="button primary" onClick={()=>createWork()}>Create assignment</button><button className="button" onClick={()=>createWork('','form')}>Create quiz</button>{delivery&&<Link className="button" to={'/teacher/classes?view=batches&edit='+batchId}>Module layout & colour</Link>}</div>}
  </header>
  {!teacher&&tasks.length>0&&<div className="weekly-progress"><div><strong>Your learning progress</strong><span>{done} of {tasks.length} tasks complete · {Math.round(done/tasks.length*100)}%</span></div><progress aria-label="Learning progress" value={done} max={tasks.length}/><small>Tick each recording, assignment, quiz or material as you complete it.</small></div>}
  <nav className="weekly-tabs" aria-label="Class module sections">{[['weeks',flat?'Activities':weekly?'Weekly lessons':'Lessons & materials'],['recordings','Lesson recordings'],['assignments','Assignments & homework'],['quizzes','Quizzes'],['tutes','Tutes & notes'],['announcements','Announcements'],['schedule','Class schedule'],['attendance','Attendance'],...(teacher?[['culture','Culture library']]:[])].map(([value,label])=><button key={value} className={tab===value?'active':''} onClick={()=>{const next=new URLSearchParams(params);next.set('tab',value);setParams(next);}}>{label}{!teacher&&['announcements','schedule'].includes(value)&&(()=>{const kind=value==='announcements'?'announcement':'session';const rows=kind==='announcement'?announcements:sessions;const count=rows.filter(row=>!noticeRead(data,identity!.uid,row,kind)).length;return count?<b className="module-count">{count}</b>:null;})()}</button>)}</nav>
  {academic&&<>
   {teacher&&<p className="form-note">This class is selected automatically. Choose a lesson or publish an activity directly in this module.</p>}<div className="weekly-section-heading"><h2>{tab==='weeks'?(flat?'Activities':weekly?'Weekly lessons':'Lessons & materials'):tab==='assignments'?'Assignments & homework':tab==='recordings'?'Lesson recordings':tab==='quizzes'?'Quizzes':'Tutes & notes'}</h2><div className="actions"><label>Sort <select aria-label="Sort activities" value={sort} onChange={e=>setSort(e.target.value)}><option value="order">Lesson order</option><option value="title">Title A–Z</option><option value="newest">Newest first</option><option value="deadline">Deadline</option></select></label>{!flat&&<button className="text-link" onClick={()=>setExpand(!expand)}>{expand?'Collapse all':'Expand all'}</button>}</div></div>
   {flat?<section className="weekly-notice-panel">{sorted.map(taskRow)}</section>:<>
    {groups.map(group=>{
     const groupTasks=sorted.filter(t=>group.lessons.some(l=>l.id===t.lessonId));
     if(!teacher&&!groupTasks.length)return null;
     return <details className={'weekly-section week-tone-'+(group.number-1)%6} key={group.key+expand} open={expand}><summary><span>{group.label} {group.number}: {group.title}</span></summary><div className="weekly-section-body">
      {teacher&&<div className="weekly-teacher-actions">{group.lessons.map(l=><div className="lesson-management-actions" key={l.id}><button className="text-link" onClick={()=>setLessonEdit(l)}>Edit {sectionLabel(l).toLowerCase()} / {l.title}{!l.published?' · Draft':''}</button><DeleteLessonButton lesson={l}/><button className="text-link" onClick={()=>setCopy({row:l,table:'lessons'})}>Transfer / copy</button></div>)}</div>}
      {groupTasks.map(taskRow)}
      {teacher&&<div className="weekly-teacher-actions"><button className="button small" onClick={()=>createWork(group.lessons[0].id)}>Create assignment</button><button className="button small" onClick={()=>createWork(group.lessons[0].id,'form')}>Create quiz</button><button className="button small" onClick={()=>setLessonEdit(group.lessons[0])}>Write / edit notes</button>{!groupTasks.length&&<ComingSoon label="Add recordings, questions or materials"/>}</div>}
      {!teacher&&groupTasks.length>0&&<label className="week-completion-check"><input type="checkbox" disabled={busy} checked={groupTasks.every(t=>taskDone(data,identity!.uid,studentId,t))} onChange={e=>void mark(groupTasks,e.target.checked)}/>Complete all tasks in {group.label} {group.number}</label>}
     </div></details>;
    })}
    {sorted.some(t=>!lessons.some(l=>l.id===t.lessonId))&&<section className="weekly-notice-panel"><h2>Assignments & activities</h2>{sorted.filter(t=>!lessons.some(l=>l.id===t.lessonId)).map(taskRow)}</section>}
   </>}
   {!sorted.length&&!teacher&&<Empty title="No published activities yet"/>}
  </>}
  {tab==='culture'&&teacher&&<CultureQuizLibrary initialCourseId={id} initialBatchId={batchId}/>}
  {tab==='announcements'&&<section className="weekly-notice-panel"><h2>Announcements</h2>{teacher&&batchId&&<button className="button" onClick={()=>setAnnouncementEdit(undefined)}>Add announcement</button>}{announcements.map(a=><article className="module-announcement" key={a.id}><h3>{a.title}</h3><p className="preserve-lines">{a.body}</p>{teacher&&<button className="text-link" onClick={()=>setAnnouncementEdit(a)}>Edit</button>}</article>)}</section>}
  {tab==='schedule'&&<section className="weekly-notice-panel"><h2>Class schedule</h2>{teacher&&batchId&&<Link className="button" to={'/teacher/schedule?new=1&batch='+batchId}>Schedule class</Link>}<label className="check-line"><input type="checkbox" checked={showPast} onChange={e=>setShowPast(e.target.checked)}/>Show past classes</label>{sessions.map(s=><div className="weekly-resource" key={s.id}><CalendarDays size={20}/><div><strong>{s.title||data.lessons.find(l=>l.id===s.lessonId)?.title||delivery?.name}</strong><small>{readable(s.date)} · {s.time} · {s.duration} minutes · Sri Lanka time</small></div>{s.status==='cancelled'?<Badge>Cancelled</Badge>:<OutLink className="button" url={s.zoomUrl}>Join class</OutLink>}{teacher&&<Link to={'/teacher/schedule?edit='+s.id}>Edit</Link>}</div>)}</section>}
  {tab==='attendance'&&<section className="weekly-notice-panel"><h2>{teacher?'Class attendance':'My attendance'}</h2>{(()=>{const rows=data.attendance.filter(a=>(teacher||a.studentId===studentId)&&(batchId?a.batchId===batchId:data.batches.some(b=>b.id===a.batchId&&b.courseId===id)));return <><p>{percent(rows)}% attended. Present and Late count as attended.</p>{rows.map(a=><div className="weekly-resource" key={a.id}><strong>{readable(a.date)}</strong>{teacher&&<span>{studentName(data,a.studentId)}</span>}<Badge>{a.status}</Badge></div>)}</>;})()}</section>}
  {lessonEdit!==null&&<LessonEditor row={lessonEdit} initialCourseId={id} initialBatchId={batchId} initialWeekNumber={nextWeekNumber(data,id,batchId)} onClose={()=>setLessonEdit(null)}/>}
  {workEdit!==null&&<AssignmentEditor key={workEdit?.id||newLesson+newKind} row={workEdit} initialCourseId={id} initialBatchId={batchId} initialLessonId={newLesson} initialKind={newKind} onClose={()=>setWorkEdit(null)}/>}
  {watching&&<Modal title={watching.title} onClose={()=>setWatching(null)}><LessonMedia lesson={watching} preview={teacher} batchId={batchId}/></Modal>}
  {announcementEdit!==null&&<Editor table="announcements" row={announcementEdit||{id:uid('ANN-'),courseId:id,batchId,title:'',body:''}} isNew={!announcementEdit} onClose={()=>setAnnouncementEdit(null)}/>}
  {copy&&<TransferActivity {...copy} onClose={()=>setCopy(null)}/>}
 </>;
}
