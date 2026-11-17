import { useEffect, useRef } from 'react';
import { useApp } from './store';
import { noticeRead, noticeVersion, studentNotices } from './weekly-learning';
export function ClassUpdateAlerts(){
 const {data,identity,studentId,notify}=useApp();const previous=useRef<{uid:string;versions:Set<string>}|null>(null);
 useEffect(()=>{if(!identity||identity.teacher||!studentId)return;const notices=studentNotices(data,studentId);const versions=new Set(notices.map(n=>`${n.kind}:${n.row.id}:${noticeVersion(n.row,n.kind)}`));
 if(previous.current?.uid===identity.uid){const added=notices.filter(n=>!previous.current!.versions.has(`${n.kind}:${n.row.id}:${noticeVersion(n.row,n.kind)}`)&&!noticeRead(data,identity.uid,n.row,n.kind));if(added.length)notify(`${added.length} new class ${added.length===1?'update':'updates'}. Check Announcements and Class schedule in your class folder.`);}
 previous.current={uid:identity.uid,versions};
 },[data.announcements,data.sessions,data.contentReads,identity,studentId,notify]);return null;
}
export function UnreadClassBadge(){const {data,identity,studentId}=useApp();if(!identity||identity.teacher)return null;const count=studentNotices(data,studentId).filter(n=>!noticeRead(data,identity.uid,n.row,n.kind)).length;return count?<b className="module-count" aria-label={`${count} unread class updates`}>{count}</b>:null;}
