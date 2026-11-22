import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useApp } from './store';
import { useAppearance,useSeason } from './SeasonTheme';
import { seasons } from './season-theme';
import { batchName,courseName,key,readable } from './domain';
import { noticeRead,noticeReceipt,studentNotices } from './weekly-learning';
import { Modal } from './ui';
import './workspace-updates.css';

export function WorkspaceUpdates(){
 const {data,identity,studentId,readUpdates}=useApp();
 const appearance=useAppearance(),season=useSeason();
 const [open,setOpen]=useState(false);
 if(!identity?.verified||identity.teacher)return null;
 const uid=identity.uid;
 const notices=studentNotices(data,studentId)
  .filter(n=>!noticeRead(data,uid,n.row,n.kind))
  .map(({kind,row})=>({
   ...noticeReceipt(uid,kind,row,row.courseId||data.batches.find(b=>b.id===row.batchId)?.courseId),
   title:row.title||(kind==='session'?'Class schedule updated':'New announcement'),
   detail:kind==='session'?`${readable(row.date)} · ${row.time||''}${row.status==='cancelled'?' · Cancelled':''}`:batchName(data,row.batchId),
   url:`/student/course/${encodeURIComponent(row.courseId)}?batch=${encodeURIComponent(row.batchId)}&tab=${kind==='session'?'schedule':'announcements'}`
  }));
 const themeVersion=appearance?.updatedAt?season+':'+appearance.updatedAt:'';
 const themeUnread=themeVersion&&!data.contentReads.some(r=>r.uid===uid&&r.kind==='theme'&&r.recordId==='appearance'&&r.version===themeVersion);
 const themeName=seasons.find(s=>s.id===season)?.name||season;
 const theme=themeUnread?[{id:key(uid,'theme','appearance'),uid,kind:'theme' as const,recordId:'appearance',version:themeVersion,courseId:'',batchId:'',title:`${themeName} theme is live`,detail:'The website appearance has been updated.',url:'/'}]:[];
 const entries=[...theme,...notices];
 const groups=[...new Set(entries.map(n=>n.courseId))];
 function markRead(rows:typeof entries){
  readUpdates(rows.map(({id,uid,kind,recordId,version,courseId,batchId})=>({id,uid,kind,recordId,version,courseId,batchId})));
 }
 return <>
  <button className="icon-button workspace-update-button" type="button" aria-label={`Updates, ${entries.length} unread`} onClick={()=>setOpen(true)}><Bell size={18}/>{entries.length>0&&<b className="module-count">{entries.length}</b>}</button>
  {open&&<Modal title="Your updates" onClose={()=>setOpen(false)}><div className="pad workspace-updates">
   {entries.length===0?<p>You’re up to date.</p>:<>
    <button className="button small" onClick={()=>markRead(entries)}>Mark all as read</button>
    {groups.map(id=><section key={id}><h3>{id?courseName(data,id):'Website theme'}</h3>{entries.filter(entry=>entry.courseId===id).map(entry=><div className="list-row compact" key={entry.kind+entry.recordId}><Link to={entry.url} onClick={()=>{markRead([entry]);setOpen(false);}}><strong>{entry.title}</strong><small>{entry.detail}</small></Link><button className="button small" onClick={()=>markRead([entry])}>Mark read</button></div>)}</section>)}
   </>}
  </div></Modal>}
 </>;
}
