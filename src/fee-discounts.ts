import { key, uid } from './domain';
import type { Data, Row, Table } from './domain';

export type ClassDiscount={id:string;label:string;batchIds:string[];monthlyTotal:number;startMonth:string;active:boolean};
const cents=(n:number)=>Math.round(Number(n)*100);
export function validateClassDiscount(data:Data,studentId:string,discount:ClassDiscount){
 const student=data.students.find(s=>s.id===studentId);
 if(!student)throw Error('Choose a student.');
 if(!discount.id||!discount.label.trim())throw Error('Give this discount a name.');
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(discount.startMonth))throw Error('Choose the first billing month.');
 if(discount.batchIds.length<2||discount.batchIds.length>10||new Set(discount.batchIds).size!==discount.batchIds.length)throw Error('Select 2 to 10 different classes.');
 const batches=discount.batchIds.map(id=>data.batches.find(b=>b.id===id));
 if(batches.some(b=>!b))throw Error('A selected class could not be found.');
 const standard=batches.reduce((sum,b)=>sum+cents(Number(b!.monthlyFee)),0);
 if(!Number.isFinite(discount.monthlyTotal)||discount.monthlyTotal<0||cents(discount.monthlyTotal)>standard)throw Error('The discounted total must be between zero and the regular combined fee.');
 const others=(student.classDiscounts||[]) as ClassDiscount[];
 if(discount.active&&others.some(d=>d.id!==discount.id&&d.active&&d.batchIds.some(id=>discount.batchIds.includes(id))))throw Error('A selected class already belongs to another active discount for this student.');
}
export function billableEnrollments(data:Data,month:string){
 return data.enrollments.filter(e=>{
  const student=data.students.find(s=>s.id===e.studentId),batch=data.batches.find(b=>b.id===e.batchId);
  return e.status==='active'&&student?.active&&!student.deleted&&batch&&batch.active!==false&&month>=(e.billingStartMonth||e.joinedOn||month).slice(0,7)&&(!batch.endDate||month<=batch.endDate.slice(0,7));
 });
}
export function discountedFeeQuote(data:Data,studentId:string,batchId:string,month:string):Record<string,any>{
 const normal=Number(data.batches.find(b=>b.id===batchId)?.monthlyFee||0);
 const student=data.students.find(s=>s.id===studentId);
 const eligible=new Set(billableEnrollments(data,month).filter(e=>e.studentId===studentId).map(e=>e.batchId));
 const discount=((student?.classDiscounts||[]) as ClassDiscount[]).find(d=>d.active&&month>=d.startMonth&&d.batchIds.includes(batchId)&&d.batchIds.every(id=>eligible.has(id)));
 if(!discount)return {amount:normal};
 const shares=discount.batchIds.slice().sort().map(id=>({id,standard:cents(Number(data.batches.find(b=>b.id===id)?.monthlyFee||0)),amount:0,remainder:0}));
 const total=shares.reduce((n,s)=>n+s.standard,0),target=Math.min(total,cents(discount.monthlyTotal));
 for(const share of shares){const proportional=total?target*share.standard/total:0;share.amount=Math.floor(proportional);share.remainder=proportional-share.amount;}
 const remainder=target-shares.reduce((n,s)=>n+s.amount,0);
 const ordered=shares.slice().sort((a,b)=>b.remainder-a.remainder||a.id.localeCompare(b.id));
 for(let i=0;i<remainder;i++)ordered[i%ordered.length].amount++;
 const share=shares.find(s=>s.id===batchId)!;
 return {amount:share.amount/100,standardAmount:share.standard/100,discountAmount:(share.standard-share.amount)/100,discountNote:discount.label,discountRuleId:discount.id};
}
export function prepareMonthlyFees(data:Data,month:string):{table:Table;row:Row}[]{
 const changes:{table:Table;row:Row}[]=[],seen=new Set(data.feeMonths.map(f=>key(f.studentId,f.batchId,f.month)));
 for(const enrollment of billableEnrollments(data,month)){
  const id=key(enrollment.studentId,enrollment.batchId,month);if(seen.has(id))continue;seen.add(id);
  changes.push({table:'feeMonths',row:{id,studentId:enrollment.studentId,batchId:enrollment.batchId,month,dueDate:`${month}-10`,...discountedFeeQuote(data,enrollment.studentId,enrollment.batchId,month)}});
 }
 return changes;
}
export function classDiscountChanges(data:Data,studentId:string,discount:ClassDiscount,applyMonth=''):{table:Table;row:Row}[]{
 validateClassDiscount(data,studentId,discount);
 if(applyMonth&&(!/^\d{4}-(0[1-9]|1[0-2])$/.test(applyMonth)||applyMonth<discount.startMonth))throw Error('Apply the discount to a month on or after its start month.');
 const student=data.students.find(s=>s.id===studentId)!;
 const updated={...student,classDiscounts:[...(student.classDiscounts||[]).filter((d:ClassDiscount)=>d.id!==discount.id),{...discount,label:discount.label.trim(),monthlyTotal:cents(discount.monthlyTotal)/100}]};
 const next={...data,students:data.students.map(s=>s.id===studentId?updated:s)};
 const at=new Date().toISOString();const changes:{table:Table;row:Row}[]=[{table:'students',row:updated},{table:'audit',row:{id:uid(),action:'student_discount_saved',recordId:studentId,before:student.classDiscounts||[],after:updated.classDiscounts,at}}];
 if(applyMonth){
  const eligible=new Set(billableEnrollments(next,applyMonth).filter(e=>e.studentId===studentId).map(e=>e.batchId));
  if(!discount.active||!discount.batchIds.every(id=>eligible.has(id)))throw Error('The student must be actively enrolled in every selected class to apply this discount.');
  for(const batchId of discount.batchIds){
   const existing=data.feeMonths.filter(f=>f.studentId===studentId&&f.batchId===batchId&&f.month===applyMonth);
   if(existing.length>1)throw Error('This student has duplicate monthly fee entries. Correct those records before applying the discount.');
   const before=existing[0];
   const fee={...before,id:before?.id||key(studentId,batchId,applyMonth),studentId,batchId,month:applyMonth,dueDate:before?.dueDate||`${applyMonth}-10`,...discountedFeeQuote(next,studentId,batchId,applyMonth)};
   changes.push({table:'feeMonths',row:fee},{table:'audit',row:{id:uid(),action:'monthly_fee_discount_applied',recordId:fee.id,before:before||null,after:fee,at}});
  }
 }
 return changes;
}
