import { useApp } from './store';
import { Form, Modal } from './ui';
import { batchName, monthNow, readable, studentName } from './domain';
import type { Row } from './domain';
import type { Field } from './ui';
import { monthlyFeeChanges } from './payment-corrections';

export function MonthlyFeeEditor({row,onClose,onPayments}:{row?:Row;onClose:()=>void;onPayments?:(fee:Row)=>void}){
 const {data,batch,notify}=useApp();
 const fields:Field[]=[
  ...(!row?[
   {name:'studentId',label:'Student',type:'select',required:true,options:[{value:'',label:'Choose student'},...data.students.map(s=>({value:s.id,label:`${s.fullName}${s.deleted?' (deleted)':!s.active?' (inactive)':''}`}))]},
   {name:'batchId',label:'Batch',type:'select',required:true,options:[{value:'',label:'Choose batch'},...data.batches.map(b=>({value:b.id,label:b.name}))]},
   {name:'month',label:'Billing month',type:'month',required:true}
  ]:[]),
  {name:'amount',label:'Monthly fee amount (LKR)',type:'number',required:true,min:0,help:'This is the fee charged for the month. Recorded payments are managed in Payment history.'},
  {name:'dueDate',label:'Due date',type:'date',required:true}
 ];
 return <Modal title={row?'Edit monthly fee':'Add opening monthly fee'} onClose={onClose}>
  {row&&<div className="pad"><h3>{studentName(data,row.studentId)}</h3><p>{batchName(data,row.batchId)} · {readable(row.month)}</p><p className="form-note">You can correct this historical fee even if the student is suspended or deleted.</p>{onPayments&&<button type="button" className="text-link" onClick={()=>{onClose();onPayments(row);}}>View or edit recorded payments →</button>}</div>}
  <Form fields={fields} initial={row?{amount:row.amount,dueDate:row.dueDate||`${row.month}-10`}:{studentId:'',batchId:'',month:monthNow(),amount:0,dueDate:`${monthNow()}-10`}} submit={row?'Save fee changes':'Add monthly fee'} onCancel={onClose} onSave={async values=>{await batch(monthlyFeeChanges(data,values,row));notify('Monthly fee saved. Balances updated.');onClose();}}/>
 </Modal>;
}
