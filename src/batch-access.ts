import type { Data,Row,Table } from './domain';
export type RecordChange={table:Table;row:Row};
export const affectsBatchAccess=(changes:RecordChange[])=>changes.some(c=>['students','enrollments','studentLinks'].includes(c.table));
// Trusted teacher writes keep this read-only student access index in the same commit.
export function withBatchAccess(data:Data,changes:RecordChange[]):RecordChange[]{
 if(!affectsBatchAccess(changes))return changes;
 const next={students:data.students.slice(),enrollments:data.enrollments.slice(),studentLinks:data.studentLinks.slice()};
 const affected=new Set<string>();
 for(const c of changes){if(c.table==='students')affected.add(c.row.id);else if(c.table==='enrollments'||c.table==='studentLinks'){affected.add(c.row.studentId);const old=data[c.table].find(r=>r.id===c.row.id);if(old?.studentId)affected.add(old.studentId);}if(c.table in next){const t=c.table as keyof typeof next;next[t]=[...next[t].filter(r=>r.id!==c.row.id),c.table==='studentLinks'?{...next.studentLinks.find(l=>l.id===c.row.id),...c.row}:c.row];}}
 const links=next.studentLinks.filter(l=>affected.has(l.studentId)).map(l=>({...l,activeBatchIds:next.students.some(s=>s.id===l.studentId&&s.active&&!s.deleted)?[...new Set(next.enrollments.filter(e=>e.studentId===l.studentId&&e.status==='active').map(e=>e.batchId))]:[]}));
 return [...changes.filter(c=>c.table!=='studentLinks'||!links.some(l=>l.id===c.row.id)),...links.map(row=>({table:'studentLinks' as const,row}))];
}
