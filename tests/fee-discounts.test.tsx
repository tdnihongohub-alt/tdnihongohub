import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { emptyData, feeBalance } from '../src/domain';
import { classDiscountChanges, discountedFeeQuote, prepareMonthlyFees, validateClassDiscount } from '../src/fee-discounts';
import type { ClassDiscount } from '../src/fee-discounts';
import { monthlyFeeChanges } from '../src/payment-corrections';
import { AppContext } from '../src/store';
import { Payments } from '../src/Administration';
import { StudentPayments } from '../src/Student';
import { StudentDiscounts } from '../src/StudentDiscounts';

const discount:ClassDiscount={id:'discount',label:'Two-class discount',batchIds:['paper','theory'],monthlyTotal:8000,startMonth:'2026-11',active:true};
function fixture(withDiscount=true){
 const data=emptyData();data.students=[{id:'s',fullName:'Idumini Deshani',active:true,classDiscounts:withDiscount?[discount]:[]}];
 data.batches=[{id:'paper',name:'2027 A/L Paper',courseId:'al',monthlyFee:5000,active:true},{id:'theory',name:'2027 A/L Theory',courseId:'al',monthlyFee:5000,active:true}];
 data.enrollments=data.batches.map(b=>({id:`s_${b.id}`,studentId:'s',batchId:b.id,courseId:'al',status:'active',joinedOn:'2026-11-15',billingStartMonth:'2026-11'}));
 return data;
}
describe('conditional recurring class discounts',()=>{
 it('charges exactly 8000 across the two selected classes and leaves other students at regular prices',()=>{
  const data=fixture();const rows=prepareMonthlyFees(data,'2026-12').map(c=>c.row);
  expect(rows.map(r=>r.amount)).toEqual([4000,4000]);expect(rows.reduce((sum,r)=>sum+r.amount,0)).toBe(8000);
  expect(rows[0]).toMatchObject({standardAmount:5000,discountAmount:1000,discountRuleId:'discount'});
  data.students.push({id:'other',active:true});data.enrollments.push({...data.enrollments[0],id:'other_paper',studentId:'other'});
  expect(discountedFeeQuote(data,'other','paper','2026-12')).toEqual({amount:5000});
 });
 it('requires both active enrolments and stops charging a removed or suspended student',()=>{
  const data=fixture();data.enrollments[1].status='suspended';expect(prepareMonthlyFees(data,'2026-12').map(c=>c.row.amount)).toEqual([5000]);
  data.students[0].active=false;expect(prepareMonthlyFees(data,'2026-12')).toEqual([]);
  data.students[0].active=true;data.students[0].deleted=true;expect(prepareMonthlyFees(data,'2026-12')).toEqual([]);
 });
 it('honours the start month and class end dates without rewriting existing monthly snapshots',()=>{
  const data=fixture();data.students[0].classDiscounts=[{...discount,startMonth:'2026-12'}];
  expect(prepareMonthlyFees(data,'2026-11').map(c=>c.row.amount)).toEqual([5000,5000]);
  data.feeMonths=prepareMonthlyFees(data,'2026-12').map(c=>c.row);const before=structuredClone(data.feeMonths);
  data.students[0].classDiscounts=[{...discount,monthlyTotal:7000}];expect(prepareMonthlyFees(data,'2026-12')).toEqual([]);expect(data.feeMonths).toEqual(before);
  data.batches[1].endDate='2026-12-31';expect(prepareMonthlyFees(data,'2027-01').map(c=>c.row.amount)).toEqual([5000]);
 });
 it('allocates unequal fees and fractional amounts without losing cents',()=>{
  const data=fixture();data.batches[1].monthlyFee=3000;data.students[0].classDiscounts=[{...discount,monthlyTotal:6000}];
  expect(prepareMonthlyFees(data,'2026-12').map(c=>c.row.amount)).toEqual([3750,2250]);
  data.batches[1].monthlyFee=4999;data.students[0].classDiscounts=[{...discount,monthlyTotal:8000.01}];
  const rows=prepareMonthlyFees(data,'2026-12').map(c=>c.row);expect(Math.round(rows.reduce((n,r)=>n+r.amount,0)*100)).toBe(800001);
 });
 it('updates the selected month to the agreed total while preserving payments, old months and original records',()=>{
  const data=fixture(false);data.feeMonths=[{id:'existing-paper',studentId:'s',batchId:'paper',month:'2026-11',amount:10000,dueDate:'2026-11-10',teacherNote:'Keep this note'},{id:'october',studentId:'s',batchId:'paper',month:'2026-10',amount:5000,dueDate:'2026-10-10'}];
  data.payments=[{id:'first',studentId:'s',batchId:'paper',month:'2026-11',amount:10000},{id:'second',studentId:'s',batchId:'theory',month:'2026-11',amount:5000}];
  const before=structuredClone(data),changes=classDiscountChanges(data,'s',discount,'2026-11'),fees=changes.filter(c=>c.table==='feeMonths').map(c=>c.row);
  expect(fees).toHaveLength(2);expect(fees.reduce((n,f)=>n+f.amount,0)).toBe(8000);expect(fees[0]).toMatchObject({id:'existing-paper',teacherNote:'Keep this note',amount:4000});
  expect(changes.some(c=>c.table==='payments')).toBe(false);expect(changes.filter(c=>c.table==='audit')).toHaveLength(3);expect(data).toEqual(before);
  expect(fees.reduce((sum,f)=>sum+Math.max(0,feeBalance(f,data.payments).paid-f.amount),0)).toBe(7000);
 });
 it('rejects overlapping discounts, invalid totals, duplicate classes and duplicate fee snapshots',()=>{
  const data=fixture();expect(()=>validateClassDiscount(data,'s',{...discount,id:'overlap'})).toThrow('another active discount');
  for(const monthlyTotal of [-1,NaN,Infinity,10001])expect(()=>validateClassDiscount(data,'s',{...discount,monthlyTotal})).toThrow();
  expect(()=>validateClassDiscount(data,'s',{...discount,batchIds:['paper','paper']})).toThrow('different classes');
  data.feeMonths=[{id:'one',studentId:'s',batchId:'paper',month:'2026-11'},{id:'two',studentId:'s',batchId:'paper',month:'2026-11'}];expect(()=>classDiscountChanges(data,'s',discount,'2026-11')).toThrow('duplicate monthly');
 });
 it('keeps manual fee corrections consistent with the saved discount breakdown',()=>{
  const data=fixture(),fee={id:'fee',studentId:'s',batchId:'paper',month:'2026-11',amount:4000,dueDate:'2026-11-10',standardAmount:5000,discountAmount:1000,discountRuleId:'discount'};
  expect(monthlyFeeChanges(data,{amount:4500,dueDate:fee.dueDate},fee)[0].row).toMatchObject({amount:4500,standardAmount:5000,discountAmount:500});
 });
 it('shows discount controls and readable fee breakdowns to the teacher and student',()=>{
  const data=fixture();data.feeMonths=prepareMonthlyFees(data,'2026-11').map(c=>c.row);
  const context={data,studentId:'s',identity:{uid:'teacher',verified:true,teacher:true},save:async()=>{},batch:async()=>{},remove:async()=>{},notify:()=>{}} as any;
  const render=(node:React.ReactNode)=>renderToStaticMarkup(<AppContext.Provider value={context}><MemoryRouter>{node}</MemoryRouter></AppContext.Provider>);
  expect(render(<Payments/>)).toContain('Student discounts');expect(render(<StudentPayments/>)).toContain('Two-class discount');
  const editor=render(<StudentDiscounts initialStudentId="s" onClose={()=>{}}/>);expect(editor).toContain('LKR 8,000 / month');expect(editor).toContain('2027 A/L Paper');expect(editor).toContain('2027 A/L Theory');
 });
});
