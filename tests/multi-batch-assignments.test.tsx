import React from 'react';
import { describe,it,expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { emptyData,key } from '../src/domain';
import { assignmentAudienceFields,assignmentForStudent,assignmentBatchLabel,assignmentLessonChoices,validateAssignmentBatch } from '../src/assignment-audience';
import { withBatchAccess } from '../src/batch-access';
import { weeklyWork } from '../src/weekly-learning';
import { AppContext } from '../src/store';
import { TeacherRecords } from '../src/Teacher';
import { ScheduledWork } from '../src/ScheduledWork';
function fixture(){const d=emptyData();d.courses=[{id:'al',title:'A/L'}];d.batches=[{id:'a',courseId:'al',name:'Theory',active:true},{id:'b',courseId:'al',name:'Paper',active:true},{id:'c',courseId:'al',name:'Other batch',active:true},{id:'n5',courseId:'n5'}];d.students=[{id:'s',active:true}];d.studentLinks=[{id:'u',studentId:'s',customNote:'keep'}];d.enrollments=[{id:'s_a',studentId:'s',batchId:'a',courseId:'al',status:'active'},{id:'s_b',studentId:'s',batchId:'b',courseId:'al',status:'active'}];d.lessons=[{id:'shared',courseId:'al',batchId:''},{id:'a-week',courseId:'al',batchId:'a'}];d.assignments=[{id:'quiz',courseId:'al',title:'Shared quiz',kind:'form',...assignmentAudienceFields(['a','b']),lessonId:'shared',published:true,releaseAt:0,deadlineAt:4102444800000}];return d;}
function render(d:ReturnType<typeof fixture>,node:React.ReactNode,path:string){return renderToStaticMarkup(<AppContext.Provider value={{data:d,studentId:'s',demo:true,identity:{uid:'u',teacher:true,verified:true}} as any}><MemoryRouter initialEntries={[path]}>{node}</MemoryRouter></AppContext.Provider>);}
describe('one quiz assigned to multiple batches',()=>{
 it('retains a single quiz and student submission identity when enrolled twice',()=>{
  const d=fixture(),before=structuredClone(d),a=d.assignments[0];expect(assignmentForStudent(a,d,'s')).toBe(true);
  for(const batch of ['a','b'])expect(weeklyWork(d,[d.lessons[0]],'al',batch,'s').map(a=>a.id)).toEqual(['quiz']);
  expect(key('s',a.id)).toBe('s_quiz');expect(d).toEqual(before);
  expect((render(d,<ScheduledWork/>,'/student/assignments').match(/Shared quiz/g)||[])).toHaveLength(1);
 });
 it('denies other, suspended and empty selected audiences and preserves legacy scopes',()=>{
  const d=fixture(),a=d.assignments[0];expect(assignmentForStudent({...a,...assignmentAudienceFields(['c'])},d,'s')).toBe(false);
  expect(assignmentForStudent(a,{...d,students:[{id:'s',active:false}]},'s')).toBe(false);
  expect(assignmentForStudent(a,{...d,enrollments:d.enrollments.map(e=>({...e,status:'suspended'}))},'s')).toBe(false);
  expect(()=>assignmentAudienceFields([])).toThrow('Select at least one');
  expect(assignmentForStudent({...a,audience:'batches',batchIds:[]},d,'s')).toBe(false);
  expect(assignmentForStudent({id:'old',courseId:'al',batchId:'a'},d,'s')).toBe(true);
  expect(assignmentForStudent({id:'old',courseId:'al',batchId:''},d,'s')).toBe(true);
  expect(()=>validateAssignmentBatch({...a,...assignmentAudienceFields(['a','n5'])},d)).toThrow('belonging');
 });
 it('shows selected batch names and filters teacher work by batch',()=>{
  const d=fixture();expect(assignmentBatchLabel(d.assignments[0],d)).toBe('Theory · Paper');
  expect(render(d,<TeacherRecords/>,'/teacher/lessons?view=assignments&batch=b')).toContain('Shared quiz');
  const html=render(d,<TeacherRecords/>,'/teacher/lessons?view=assignments&batch=c');expect(html).not.toContain('Shared quiz');expect(html).toContain('aria-label="Filter batch"');
  expect(assignmentLessonChoices(d,'al',['a','b']).map(l=>l.id)).toEqual(['shared']);
 });
 it('synchronizes the trusted access index for enrollment changes, deletion and relinking without financial changes',()=>{
  const d=fixture(),before=structuredClone(d);
  const changes=withBatchAccess(d,[{table:'enrollments',row:{...d.enrollments[0],status:'suspended'}}]);
  expect(changes.find(c=>c.table==='studentLinks')?.row).toMatchObject({id:'u',studentId:'s',activeBatchIds:['b'],customNote:'keep'});
  expect(withBatchAccess(d,[{table:'students',row:{id:'s',active:false}}]).find(c=>c.table==='studentLinks')?.row.activeBatchIds).toEqual([]);
  expect(changes.some(c=>['payments','feeMonths','submissions'].includes(c.table))).toBe(false);expect(d).toEqual(before);
 });
});
