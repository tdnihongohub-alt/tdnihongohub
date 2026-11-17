import { describe, expect, it } from 'vitest';
import { emptyData, feeBalance, validate } from '../src/domain';
import { assignmentForStudent, validateAssignmentBatch } from '../src/assignment-audience';

describe('batch assignment audience',()=>{
 const data=emptyData();
 data.students=[{id:'s',active:true}];
 data.batches=[{id:'n5-a',courseId:'n5'},{id:'n5-b',courseId:'n5'},{id:'n4',courseId:'n4'}];
 data.enrollments=[{id:'s_n5-a',studentId:'s',batchId:'n5-a',courseId:'n5',status:'active'},{id:'s_n5-b',studentId:'s',batchId:'n5-b',courseId:'n5',status:'suspended'}];
 it('allows work only for the selected active enrolment, including custom forms',()=>{
  for(const kind of ['assignment','form']){
   expect(assignmentForStudent({id:'a',kind,courseId:'n5',batchId:'n5-a'},data,'s')).toBe(true);
   expect(assignmentForStudent({id:'a',kind,courseId:'n5',batchId:'n5-b'},data,'s')).toBe(false);
   expect(assignmentForStudent({id:'a',kind,courseId:'n5',batchId:'n5-a'},data,'other')).toBe(false);
  }
  expect(assignmentForStudent({id:'a',courseId:'n5',batchId:'n5-a'},{...data,students:[{id:'s',active:false}]},'s')).toBe(false);
 });
 it('preserves legacy course-wide assignments and rejects a mismatched batch',()=>{
  expect(assignmentForStudent({id:'old',courseId:'n5'},data,'s')).toBe(true);
  expect(()=>validateAssignmentBatch({id:'a',courseId:'n5',batchId:'n4'},data)).toThrow('belonging');
 });
});

describe('admin payment corrections',()=>{
 const fee={id:'f',studentId:'s',batchId:'b',month:'2026-11',amount:3000};
 const payment={id:'p',studentId:'s',batchId:'b',month:'2026-11',amount:1000,paidOn:'2026-11-17',method:'Cash',reference:'',status:'confirmed',claimId:'claim'};
 it('saves a corrected numeric amount while retaining the claim link and recalculating fees',()=>{
  const corrected=validate('payments',{...payment,amount:'2500'});
  expect(corrected.amount).toBe(2500);expect(corrected.claimId).toBe('claim');
  expect(feeBalance(fee,[corrected])).toMatchObject({paid:2500,pending:500,status:'Partially paid'});
  expect(feeBalance(fee,[])).toMatchObject({paid:0,pending:3000,status:'Pending'});
 });
 it('rejects invalid amounts and methods',()=>{
  for(const amount of [0,-1,NaN,Infinity])expect(()=>validate('payments',{...payment,amount})).toThrow();
  expect(()=>validate('payments',{...payment,method:'invalid'})).toThrow();
 });
});
