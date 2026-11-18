import { key, uid, validate } from './domain';
import type { Data, Row, Table } from './domain';

export function monthlyFeeChanges(data:Data,values:Record<string,any>,original?:Row):{table:Table;row:Row}[]{
 let row:Row;
 if(original){
  // A historical fee keeps its identity and allocation even after enrolment ends.
  row=validate('feeMonths',{...original,amount:values.amount,dueDate:values.dueDate}) as Row;
 }else{
  const id=key(values.studentId,values.batchId,values.month);
  row=validate('feeMonths',{...values,id}) as Row;
  if(data.feeMonths.some(f=>f.id===id||f.studentId===row.studentId&&f.batchId===row.batchId&&f.month===row.month))throw Error('This monthly fee already exists. Edit its amount or due date instead.');
  if(!data.students.some(s=>s.id===row.studentId)||!data.batches.some(b=>b.id===row.batchId))throw Error('Choose a student record and batch.');
  if(!data.enrollments.some(e=>e.studentId===row.studentId&&e.batchId===row.batchId)&&!data.payments.some(p=>p.studentId===row.studentId&&p.batchId===row.batchId))throw Error('Choose a batch with an enrolment or recorded payment for this student.');
 }
 if(original?.standardAmount!==undefined){const standard=Math.max(Number(original.standardAmount),Number(row.amount));row={...row,standardAmount:standard,discountAmount:Math.round((standard-Number(row.amount))*100)/100};}
 return [{table:'feeMonths',row},{table:'audit',row:{id:uid(),action:original?'monthly_fee_edited':'monthly_fee_created',recordId:row.id,before:original||null,after:row,at:new Date().toISOString()}}];
}

export function paymentCorrectionChanges(data:Data,input:Row,original?:Row):{table:Table;row:Row}[]{
 const row=validate('payments',input) as Row;
 const allocationChanged=!original||['studentId','batchId','month'].some(k=>row[k]!==original[k]);
 const allocatedFee=data.feeMonths.some(f=>f.studentId===row.studentId&&f.batchId===row.batchId&&f.month===row.month);
 // Existing historical allocations can be corrected without reactivating a student.
 if(!original&&!data.enrollments.some(e=>e.studentId===row.studentId&&e.batchId===row.batchId))throw Error('Student is not enrolled in this batch.');
 if(allocationChanged&&!allocatedFee)throw Error('Prepare or add this monthly fee first.');
 const payment={...row,status:'confirmed'};
 return [{table:'payments',row:payment},{table:'audit',row:{id:uid(),action:original?'payment_edited':'payment_recorded',recordId:row.id,before:original||null,after:payment,at:new Date().toISOString()}}];
}
