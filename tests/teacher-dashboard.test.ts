import { describe, expect, it } from 'vitest';
import { initialData } from '../src/seed';
import { teacherDashboard } from '../src/teacher-dashboard-model';
const now=Date.parse('2026-11-11T12:00:00+05:30');
describe('teacher desk priorities',()=>{
 it('includes ended classes from today in the recording queue, once per reusable lesson',()=>{
  const d=initialData(true);d.sessions=[{id:'one',date:'2026-11-11',time:'08:00',duration:60,batchId:'BAT-DEMO',lessonId:'LES-DEMO',status:'scheduled'},{id:'two',date:'2026-11-11',time:'10:00',duration:60,batchId:'BAT-DEMO',lessonId:'LES-DEMO',status:'scheduled'}];
  const m=teacherDashboard(d,now);expect(m.missing).toHaveLength(1);expect(m.queue.find(q=>q.kind==='recording')?.to).toBe('/teacher/lessons?edit=LES-DEMO');
 });
 it('does not request a recording for cancelled or ongoing classes',()=>{
  const d=initialData(true);d.sessions=[{id:'cancelled',date:'2026-11-10',time:'08:00',duration:60,batchId:'BAT-DEMO',lessonId:'LES-DEMO',status:'cancelled'},{id:'live',date:'2026-11-11',time:'11:30',duration:90,batchId:'BAT-DEMO',lessonId:'LES-DEMO',status:'scheduled'}];
  const m=teacherDashboard(d,now);expect(m.missing).toHaveLength(0);expect(m.next?.id).toBe('live');
 });
 it('puts overdue preparation first and omits completed and future tasks',()=>{
  const d=initialData(true);d.tasks=[{id:'late',title:'Prepare worksheet',dueDate:'2026-11-10',done:false},{id:'done',title:'Already done',dueDate:'2026-11-09',done:true},{id:'later',title:'Later task',dueDate:'2026-11-20',done:false}];
  const m=teacherDashboard(d,now);expect(m.queue[0].id).toBe('task-late');expect(m.queue[0].urgent).toBe(true);expect(m.queue.filter(q=>q.kind==='task')).toHaveLength(1);
 });
 it('links reviews directly to their records and ignores settled reviews',()=>{
  const d=initialData(true);d.paymentClaims=[{id:'claim',studentId:'STU-DEMO',batchId:'BAT-DEMO',status:'awaiting_review',amount:1000},{id:'settled',status:'confirmed'}];d.submissions=[{id:'work',studentId:'STU-DEMO',assignmentId:'ASN-DEMO',status:'submitted'},{id:'reviewed',status:'reviewed'}];
  const m=teacherDashboard(d,now);expect(m.queue.filter(q=>q.kind==='payment')).toHaveLength(1);expect(m.queue.find(q=>q.kind==='payment')?.to).toContain('review=claim');expect(m.queue.filter(q=>q.kind==='homework')).toHaveLength(1);expect(m.queue.find(q=>q.kind==='homework')?.to).toContain('review=work');
 });
 it('calculates monthly receipts by receipt date, while preserving old outstanding fees',()=>{
  const d=initialData(true);d.feeMonths=[{id:'old',studentId:'STU-DEMO',batchId:'BAT-DEMO',month:'2026-10',amount:2500}];d.payments=[{id:'received',studentId:'STU-DEMO',batchId:'BAT-DEMO',month:'2026-10',paidOn:'2026-11-11',amount:1000,status:'confirmed'},{id:'void',paidOn:'2026-11-11',amount:99999,status:'void'}];
  const m=teacherDashboard(d,now);expect(m.received).toBe(1000);expect(m.owed).toBe(1500);
 });
});
