import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { emptyData } from '../src/domain';
import { registrationNeedsReview } from '../src/student-registration';
import { registrationApproval } from '../src/registration-approval';
import { AppContext } from '../src/store';
import { StudentRegistrations } from '../src/StudentRegistration';

function fixture(){
 const data=emptyData();
 data.users=[{id:'account',displayName:'New learner',phone:'0771112222',age:18,registrationCompleted:true,preferredBatchId:'requested',preferredBatch:'Requested batch',registeredAt:'2026-11-20'}];
 data.batches=[{id:'requested',name:'Requested batch',courseId:'course',active:true,capacity:30},{id:'approved',name:'Approved batch',courseId:'course',active:true,capacity:30}];
 return data;
}
function render(data:ReturnType<typeof fixture>){return renderToStaticMarkup(<AppContext.Provider value={{data} as any}><MemoryRouter><StudentRegistrations/></MemoryRouter></AppContext.Provider>);}
describe('registration attention queue',()=>{
 it('automatically hides a registration after approval, including into a different batch',()=>{
  const data=fixture();expect(render(data)).toContain('New learner');
  for(const {table,row} of registrationApproval(data,'account','__new__','approved'))data[table]=[...data[table].filter(r=>r.id!==row.id),row];
  const before=structuredClone(data);
  expect(registrationNeedsReview(data,data.users[0])).toBe(false);
  expect(render(data)).toBe('');expect(data).toEqual(before);
  expect(data.students[0].fullName).toBe('New learner');expect(data.users).toHaveLength(1);
  expect(data.enrollments[0].batchId).toBe('approved');
 });
 it('does not bring handled onboarding back when a student is later suspended',()=>{
  const data=fixture();for(const {table,row} of registrationApproval(data,'account','__new__','requested'))data[table]=[...data[table].filter(r=>r.id!==row.id),row];
  data.students[0].active=false;data.enrollments[0].status='suspended';
  expect(render(data)).toBe('');
 });
 it('keeps pending registrations and independent class access requests visible',()=>{
  const data=fixture();data.accessRequests=[{id:'request',status:'pending'}];
  expect(render(data)).toContain('Review &amp; accept');expect(render(data)).toContain('Review class access requests (1)');
  data.students=[{id:'student',linkedAccountId:'account',active:true}];
  data.enrollments=[{id:'enrolment',studentId:'student',batchId:'requested',status:'active'}];
  expect(render(data)).not.toContain('New learner');expect(render(data)).toContain('Review class access requests (1)');
 });
});
