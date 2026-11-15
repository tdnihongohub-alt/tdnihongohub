import { describe, it, expect } from 'vitest';
import { initialData } from '../src/seed';
import { registrationApproval, studentDeletion } from '../src/registration-approval';

function fixture(){
  const data=initialData(true);
  data.users.push({id:'applicant',displayName:'New Learner',phone:'0771112222',email:'new@example.test',age:17,preferredBatch:'N5',registrationCompleted:true});
  return data;
}
describe('registration approval and student deletion',()=>{
 it('links an existing student while retaining teacher details and old financial records',()=>{
  const data=fixture();data.studentLinks=[];
  const original=structuredClone(data);
  data.students[0].notes='Teacher information';
  const changes=registrationApproval(data,'applicant','STU-DEMO','BAT-DEMO');
  expect(changes.find(c=>c.table==='students')?.row).toEqual({...data.students[0],linkedAccountId:'applicant'});
  expect(changes.some(c=>['feeMonths','payments','attendance','users'].includes(c.table))).toBe(false);
  expect(data.payments).toEqual(original.payments);
  expect(changes.find(c=>c.table==='enrollments')?.row.joinedOn).toBe(data.enrollments[0].joinedOn);
 });
 it('creates a deterministic new student and keeps retries from duplicating them',()=>{
  const data=fixture();
  const first=registrationApproval(data,'applicant','__new__','BAT-DEMO');
  for(const {table,row} of first)data[table]=[...data[table].filter(r=>r.id!==row.id),row];
  const second=registrationApproval(data,'applicant','__new__','BAT-DEMO');
  expect(second.map(c=>[c.table,c.row.id])).toEqual(first.map(c=>[c.table,c.row.id]));
  expect(second.find(c=>c.table==='students')?.row.id).toBe('STU-applicant');
 });
 it('rejects full batches, conflicting accounts, and deleted student records',()=>{
  const data=fixture();
  expect(()=>registrationApproval(data,'applicant','STU-DEMO','BAT-DEMO')).toThrow('another account');
  data.batches[0].capacity=1;
  expect(()=>registrationApproval(data,'applicant','__new__','BAT-DEMO')).toThrow('full');
  data.studentLinks=[];data.students[0].deleted=true;
  expect(()=>registrationApproval(data,'applicant','STU-DEMO','BAT-DEMO')).toThrow('deleted');
 });
 it('removes a student from use and revokes access while preserving historical records',()=>{
  const data=fixture();const snapshot=structuredClone(data);
  const changes=studentDeletion(data,'STU-DEMO');
  expect(changes.find(c=>c.table==='students')?.row).toMatchObject({id:'STU-DEMO',deleted:true,active:false});
  expect(changes.find(c=>c.table==='courseAccess')?.row.active).toBe(false);
  expect(changes.find(c=>c.table==='enrollments')?.row.status).toBe('suspended');
  expect(changes.some(c=>['payments','feeMonths','attendance','teacherNotes'].includes(c.table))).toBe(false);
  expect(data).toEqual(snapshot);
 });
});
