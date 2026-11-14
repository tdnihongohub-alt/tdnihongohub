import { describe, expect, it } from 'vitest';
import { initialData } from '../src/seed';
import { studentDashboard } from '../src/student-dashboard-model';

describe('student learning desk',()=>{
 it('does not label a class that ended earlier today as next',()=>{
  const d=initialData(true);d.sessions=[{id:'ended',batchId:'BAT-DEMO',date:'2026-11-11',time:'09:00',duration:60,status:'scheduled'},{id:'next',batchId:'BAT-DEMO',date:'2026-11-11',time:'18:00',duration:60,status:'scheduled'}];
  const m=studentDashboard(d,'demo-student','STU-DEMO',Date.parse('2026-11-11T12:00:00+05:30'));
  expect(m.next?.id).toBe('next');
 });
 it('keeps an ongoing class available to join',()=>{
  const d=initialData(true);d.sessions=[{id:'live',batchId:'BAT-DEMO',date:'2026-11-11',time:'18:00',duration:90,status:'scheduled'}];
  expect(studentDashboard(d,'demo-student','STU-DEMO',Date.parse('2026-11-11T18:30:00+05:30')).next?.id).toBe('live');
 });
 it('includes unfinished older work and returned work',()=>{
  const d=initialData(true);d.assignments[0].dueDate='2026-01-01';
  expect(studentDashboard(d,'demo-student','STU-DEMO').homework).toHaveLength(1);
  d.submissions=[{id:'draft',studentId:'STU-DEMO',assignmentId:'ASN-DEMO',status:'returned',feedback:'Try the greeting again.'}];
  expect(studentDashboard(d,'demo-student','STU-DEMO').homework[0].submission?.status).toBe('returned');
  d.submissions[0].status='submitted';expect(studentDashboard(d,'demo-student','STU-DEMO').homework).toHaveLength(0);
 });
 it('ignores other students’ completions, submissions, balances and sessions',()=>{
  const d=initialData(true);d.progress=[{id:'other',uid:'other-user',lessonId:'LES-DEMO',complete:true}];
  d.submissions=[{id:'other',studentId:'OTHER',assignmentId:'ASN-DEMO',status:'reviewed',feedback:'Other student feedback.'}];
  d.feeMonths.push({id:'other',studentId:'OTHER',batchId:'BAT-DEMO',month:'2026-11',amount:100000});
  const m=studentDashboard(d,'demo-student','STU-DEMO');expect(m.completedCount).toBe(0);expect(m.feedback).toHaveLength(0);expect(m.owed).toBe(2500);expect(m.homework).toHaveLength(1);
 });
 it('selects the first incomplete published lesson and deduplicates saved classes',()=>{
  const d=initialData(true);d.lessons.push({...d.lessons[0],id:'LES-2',title:'Next lesson',module:'02 · Next steps'});d.progress=[{id:'done',uid:'demo-student',lessonId:'LES-DEMO',complete:true}];d.savedCourses=[{id:'saved',uid:'demo-student',courseId:'n5'}];
  const m=studentDashboard(d,'demo-student','STU-DEMO');expect(m.courses).toHaveLength(1);expect(m.completedCount).toBe(1);expect(m.continueLesson.id).toBe('LES-2');
 });
});
