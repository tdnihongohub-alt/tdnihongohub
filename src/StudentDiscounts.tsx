import { useState } from 'react';
import { useApp } from './store';
import { Badge, Modal } from './ui';
import { batchName, lkr, monthNow, uid } from './domain';
import { classDiscountChanges } from './fee-discounts';
import type { ClassDiscount } from './fee-discounts';
import './fee-discounts.css';

export function StudentDiscounts({initialStudentId='',onClose}:{initialStudentId?:string;onClose:()=>void}){
 const {data,batch,notify}=useApp();
 const [studentId,setStudentId]=useState(initialStudentId),[editId,setEditId]=useState('');
 const [label,setLabel]=useState('Multiple-class discount'),[batchIds,setBatchIds]=useState<string[]>([]),[total,setTotal]=useState(''),[start,setStart]=useState(monthNow()),[active,setActive]=useState(true),[apply,setApply]=useState(true),[applyMonth,setApplyMonth]=useState(monthNow());
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const student=data.students.find(s=>s.id===studentId),discounts=(student?.classDiscounts||[]) as ClassDiscount[];
 const enrolledIds=new Set(data.enrollments.filter(e=>e.studentId===studentId&&e.status==='active').map(e=>e.batchId));
 const batches=data.batches.filter(b=>enrolledIds.has(b.id)||batchIds.includes(b.id));
 const standard=data.batches.filter(b=>batchIds.includes(b.id)).reduce((sum,b)=>sum+Number(b.monthlyFee),0);
 function reset(){setEditId('');setLabel('Multiple-class discount');setBatchIds([]);setTotal('');setStart(monthNow());setActive(true);setApply(true);setApplyMonth(monthNow());setError('');}
 function edit(d:ClassDiscount){setEditId(d.id);setLabel(d.label);setBatchIds(d.batchIds);setTotal(String(d.monthlyTotal));setStart(d.startMonth);setActive(d.active);setApply(false);setError('');}
 return <Modal title="Student class discounts" onClose={()=>{if(!busy)onClose();}}><form onSubmit={async e=>{
  e.preventDefault();setError('');setBusy(true);
  try{const rule:ClassDiscount={id:editId||uid('DISC-'),label,batchIds,monthlyTotal:total.trim()?Number(total):NaN,startMonth:start,active};await batch(classDiscountChanges(data,studentId,rule,apply?applyMonth:''));notify(apply?'Discount saved and monthly fees updated.':'Recurring discount saved. Existing monthly fees are preserved.');reset();}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }}><div className="form-body"><p className="form-note">Set one combined monthly fee for a student's selected classes. It applies while the student attends every class in the discount. Each class gets its share of the discounted total.</p>
  <fieldset className="discount-fields" disabled={busy}>
   <label className="form-field">Student *<select required value={studentId} onChange={e=>{reset();setStudentId(e.target.value);}}><option value="">Choose student</option>{data.students.filter(s=>!s.deleted).map(s=><option value={s.id} key={s.id}>{s.fullName} · {s.id}</option>)}</select></label>
   {discounts.length>0&&<section className="discount-saved"><h3>Saved discounts</h3>{discounts.map(d=><div className="discount-saved-row" key={d.id}><div><strong>{d.label} · {lkr(d.monthlyTotal)} / month</strong><small>{d.batchIds.map(id=>batchName(data,id)).join(' + ')} · From {d.startMonth}</small></div><Badge tone={d.active?'green':'neutral'}>{d.active?'Active':'Inactive'}</Badge><button type="button" className="button small" onClick={()=>edit(d)}>Edit</button></div>)}</section>}
   <div className="form-grid section-gap"><label className="form-field">Discount name *<input required value={label} onChange={e=>setLabel(e.target.value)}/></label><label className="form-field">Starts from *<input type="month" required value={start} onChange={e=>setStart(e.target.value)}/></label></div>
   <section className="discount-class-picker"><strong>Classes included · choose at least two</strong>{batches.map(b=><label className="check-line" key={b.id}><input type="checkbox" checked={batchIds.includes(b.id)} onChange={e=>setBatchIds(ids=>e.target.checked?[...ids,b.id]:ids.filter(id=>id!==b.id))}/><span>{b.name} · {lkr(b.monthlyFee)} / month</span></label>)}{studentId&&!batches.length&&<p>No active class enrolments found for this student.</p>}</section>
   <label className="form-field">Combined monthly fee after discount (LKR) *<input type="number" min="0" max={standard||undefined} step="0.01" required placeholder="e.g. 8000" value={total} onChange={e=>setTotal(e.target.value)}/></label>
   {batchIds.length>=2&&<div className="discount-summary"><span>Regular combined fee <strong>{lkr(standard)}</strong></span><span>Monthly discount <strong>{lkr(Math.max(0,standard-Number(total||standard)))}</strong></span><span>Student pays <strong>{total.trim()?lkr(Number(total)):'Enter a total'}</strong></span></div>}
   <label className="check-line"><input type="checkbox" checked={active} onChange={e=>{setActive(e.target.checked);if(!e.target.checked)setApply(false);}}/>Enable this recurring discount</label>
   <label className="check-line"><input type="checkbox" disabled={!active} checked={apply} onChange={e=>setApply(e.target.checked)}/>Also apply to this billing month's fees</label>
   {apply&&<label className="form-field">Month to update<input type="month" min={start} required value={applyMonth} onChange={e=>setApplyMonth(e.target.value)}/><small>Only this month's fees for the selected classes are updated. Recorded payments keep their original amounts.</small></label>}
   <p className="form-note">Future fees use the discount when you prepare that month's fees. If the student leaves or is suspended from one of these classes, the remaining classes use their regular fees. Saved earlier months keep their amounts.</p>
  </fieldset>{error&&<p className="error" role="alert">{error}</p>}</div><div className="form-footer"><button type="button" className="button" disabled={busy} onClick={onClose}>Close</button>{editId&&<button type="button" className="button" disabled={busy} onClick={reset}>New discount</button>}<button className="button primary" disabled={busy||!studentId}>{busy?'Saving…':editId?'Save discount changes':'Save student discount'}</button></div></form></Modal>;
}
