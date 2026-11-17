import { describe,it,expect } from 'vitest';
import { emptyData } from '../src/domain';
import { additionalEnrollments } from '../src/multiple-enrollment';
import { assignmentForStudent } from '../src/assignment-audience';
describe('one student in multiple classes',()=>{
 it('adds two classes without replacing earlier enrolments or history',()=>{
  const data=emptyData();data.students=[{id:'s',active:true}];data.batches=[{id:'a',courseId:'n5',active:true,capacity:20},{id:'b',courseId:'al',active:true,capacity:20}];data.enrollments=[{id:'s_a',studentId:'s',batchId:'a',courseId:'n5',status:'active',joinedOn:'2025-01-01'}];
  const original=structuredClone(data);const changes=additionalEnrollments(data,'s',['a','b']);expect(data).toEqual(original);expect(changes.filter(c=>c.table==='enrollments').map(c=>c.row.batchId)).toEqual(['b']);
  for(const c of changes)data[c.table].push(c.row);
  for(const [batchId,courseId] of [['a','n5'],['b','al']])expect(assignmentForStudent({id:'work',batchId,courseId},data,'s')).toBe(true);
  expect(assignmentForStudent({id:'other',courseId:'n4'},data,'s')).toBe(false);
  expect(assignmentForStudent({id:'other-batch',courseId:'n5',batchId:'c'},data,'s')).toBe(false);
  expect(data.enrollments[0].joinedOn).toBe('2025-01-01');
 });
 it('rejects a full batch before any writes',()=>{const data=emptyData();data.students=[{id:'s',active:true}];data.batches=[{id:'full',active:true,capacity:1}];data.enrollments=[{id:'other_full',studentId:'other',batchId:'full',status:'active'}];expect(()=>additionalEnrollments(data,'s',['full'])).toThrow('full');});
});
