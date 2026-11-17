import { useState } from 'react';
import { useApp } from './store';
import { courseName } from './domain';
import { additionalEnrollments } from './multiple-enrollment';
export function StudentBatchEnrollment({studentId,onClose}:{studentId:string;onClose:()=>void}){
 const {data,batch,notify}=useApp();const [selected,setSelected]=useState<string[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const current=new Set(data.enrollments.filter(e=>e.studentId===studentId&&e.status==='active').map(e=>e.batchId));
 return <form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await batch(additionalEnrollments(data,studentId,selected));notify('Classes added. Existing enrolments and history preserved.');onClose();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}><div className="form-body"><h3>Add classes / batches</h3><p className="form-note">Select one or more batches. A student can attend multiple classes using the same account.</p>{data.batches.filter(b=>b.active).map(b=><label className="check-line" key={b.id}><input type="checkbox" disabled={current.has(b.id)||busy} checked={current.has(b.id)||selected.includes(b.id)} onChange={e=>setSelected(v=>e.target.checked?[...v,b.id]:v.filter(id=>id!==b.id))}/><span>{b.name} · {courseName(data,b.courseId)}{current.has(b.id)?' · Already enrolled':''}</span></label>)}{error&&<p className="error" role="alert">{error}</p>}</div><div className="form-footer"><button type="button" className="button" onClick={onClose}>Cancel</button><button className="button primary" disabled={busy||!selected.length}>{busy?'Saving…':'Add selected classes'}</button></div></form>;
}
