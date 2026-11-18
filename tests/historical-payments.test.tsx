import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { emptyData, feeBalance } from '../src/domain';
import type { Data } from '../src/domain';
import { AppContext } from '../src/store';
import { Payments } from '../src/Administration';
import { StudentRegistrations } from '../src/StudentRegistration';
import { MonthlyFeeEditor } from '../src/MonthlyFeeEditor';
import { monthlyFeeChanges, paymentCorrectionChanges } from '../src/payment-corrections';

const fee={id:'legacy-fee-id',studentId:'s',batchId:'b',month:'2026-11',amount:5000,dueDate:'2026-11-10',openingNote:'Original teacher note'};
const payment={id:'p',studentId:'s',batchId:'b',month:'2026-11',amount:1000,paidOn:'2026-11-18',method:'Cash',reference:'Original reference',status:'confirmed',claimId:'original-claim'};
function fixture(){const data=emptyData();data.students=[{id:'s',fullName:'Removed Student',active:false,deleted:true,linkedAccountId:'removed'}];data.users=[{id:'removed',displayName:'Removed account',email:'removed@example.test',phone:'0771234567',age:18,preferredBatch:'2027 A/L',registrationCompleted:true,registeredAt:'2026-11-18'}];data.studentLinks=[{id:'removed',studentId:'s'}];data.batches=[{id:'b',name:'2027 A/L',courseId:'al',active:false}];data.feeMonths=[fee];data.payments=[payment];return data;}
function render(node:React.ReactNode,data:Data,path='/teacher/payments'){
 const context={data,identity:{uid:'teacher',teacher:true,verified:true},save:async()=>{},remove:async()=>{},batch:async()=>{},notify:()=>{},approve:async()=>{}} as any;
 return renderToStaticMarkup(<AppContext.Provider value={context}><MemoryRouter initialEntries={[path]}>{node}</MemoryRouter></AppContext.Provider>);
}
describe('removed registrations and historical financial corrections',()=>{
 it('hides deleted accounts from registrations while keeping new and suspended students visible',()=>{
  const data=fixture();data.users.push({id:'new',displayName:'Pending learner',registrationCompleted:true},{id:'suspended',displayName:'Suspended learner',registrationCompleted:true});
  data.students.push({id:'suspended-student',linkedAccountId:'suspended',active:false});const before=structuredClone(data);
  const html=render(<StudentRegistrations/>,data);expect(html).not.toContain('Removed account');expect(html).not.toContain('removed@example.test');expect(html).toContain('Pending learner');expect(html).toContain('Suspended learner');expect(data).toEqual(before);
 });
 it('also hides deleted legacy registrations when an account link is missing',()=>{
  const data=fixture();data.studentLinks=[];expect(render(<StudentRegistrations/>,data)).not.toContain('Removed account');
  data.students[0]={...data.students[0],linkedAccountId:undefined,id:'STU-removed'};expect(render(<StudentRegistrations/>,data)).not.toContain('Removed account');
 });
 it('edits a deleted student’s historic fee without an enrolment and preserves its original ID and allocation',()=>{
  const data=fixture(),before=structuredClone(data);
  const changes=monthlyFeeChanges(data,{amount:'2500',dueDate:'2026-11-25',studentId:'other',batchId:'other',month:'2026-12'},fee);
  expect(changes[0]).toEqual({table:'feeMonths',row:{...fee,amount:2500,dueDate:'2026-11-25'}});
  expect(changes[1].row).toMatchObject({action:'monthly_fee_edited',before:fee,after:changes[0].row});
  expect(feeBalance(changes[0].row,data.payments).pending).toBe(1500);expect(data).toEqual(before);
 });
 it('allows zero fees and rejects negative or invalid corrections',()=>{
  const data=fixture();expect(monthlyFeeChanges(data,{amount:0,dueDate:fee.dueDate},fee)[0].row.amount).toBe(0);
  for(const amount of [-1,NaN,Infinity])expect(()=>monthlyFeeChanges(data,{amount,dueDate:fee.dueDate},fee)).toThrow();
 });
 it('allows correcting received payments after enrolment and fee records have been removed',()=>{
  const data=fixture();data.feeMonths=[];
  const changes=paymentCorrectionChanges(data,{...payment,amount:'3000',reference:'Corrected reference'},payment);
  expect(changes[0].row).toMatchObject({id:'p',studentId:'s',batchId:'b',amount:3000,claimId:'original-claim'});expect(changes.some(c=>['students','enrollments','courseAccess'].includes(c.table))).toBe(false);
 });
 it('allows reassignment to a historic fee without restoring student access',()=>{
  const data=fixture();data.feeMonths.push({...fee,id:'december-fee',month:'2026-12'});
  const changes=paymentCorrectionChanges(data,{...payment,month:'2026-12'},payment);expect(changes[0].row.month).toBe('2026-12');
  expect(()=>paymentCorrectionChanges(data,{...payment,month:'2027-01'},payment)).toThrow('monthly fee first');
 });
 it('provides visible fee correction and deletion controls and keeps receipt controls for removed students',()=>{
  const data=fixture(),fees=render(<Payments/>,data);
  expect(fees).toContain('Edit monthly fee');expect(fees).toContain('Delete monthly fee');expect(fees).toContain('Payments →');
  const history=render(<Payments/>,data,'/teacher/payments?view=history&student=s&batch=b&month=2026-11');expect(history).toContain('Edit payment');expect(history).toContain('>Delete</button>');expect(history).toContain('Removed Student');
  const editor=render(<MonthlyFeeEditor row={fee} onClose={()=>{}}/>,data);expect(editor).toContain('value="5000"');expect(editor).toContain('Save fee changes');expect(editor).not.toContain('<select');
 });
 it('does not mix payment history for students who share the same name',()=>{
  const data=fixture();data.students.push({id:'other',fullName:'Removed Student',active:true});data.payments.push({...payment,id:'other-payment',studentId:'other',reference:'Other student reference'});
  const html=render(<Payments/>,data,'/teacher/payments?view=history&student=s');expect(html).toContain('Original reference');expect(html).not.toContain('Other student reference');
 });
});
