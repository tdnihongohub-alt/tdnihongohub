import { recurringSessions, uid, validate } from './domain';
import type { Data, Row, Table } from './domain';

export function sessionChanges(data:Data, values:Record<string,any>, original:Row|undefined, future:boolean):{table:Table;row:Row}[] {
  const batch=data.batches.find(b=>b.id===values.batchId);
  if(!batch)throw Error('Choose a batch.');
  if(!batch.active && original?.batchId!==batch.id)throw Error('Choose an active batch for a new session.');
  if(values.lessonId&&data.lessons.find(l=>l.id===values.lessonId)?.courseId!==batch.courseId)throw Error('The lesson and batch must belong to the same course.');
  const base={...original,...values,id:original?.id||uid('SES-'),courseId:batch.courseId} as Row;
  const repeat=base.repeatUntil;delete base.repeatUntil;
  const validated=validate('sessions',base) as Row;
  if(!original&&repeat)return recurringSessions({...validated,seriesId:uid('SER-')},repeat).map(row=>({table:'sessions',row}));
  if(original?.seriesId&&future){
    if(base.date!==original.date||base.batchId!==original.batchId)throw Error('Change date and batch for this session only. Future edits apply time, duration, link and status.');
    const later=data.sessions.filter(s=>s.id!==original.id&&s.seriesId===original.seriesId&&s.date>=original.date);
    return [{table:'sessions',row:validated},...later.map(s=>({table:'sessions' as const,row:{...s,time:validated.time,duration:validated.duration,zoomUrl:validated.zoomUrl,status:validated.status}}))];
  }
  return [{table:'sessions',row:validated}];
}
