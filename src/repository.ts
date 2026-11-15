import { collection, doc, getDoc, getDocs, query, where, setDoc, deleteDoc, runTransaction, writeBatch } from '@firebase/firestore';
import type { QueryConstraint } from '@firebase/firestore';
import { db, publicDb } from './firebase';
import { collection as publicCollection, query as publicQuery, where as publicWhere, getDocs as publicGetDocs } from '@firebase/firestore/lite';
import { emptyData, tables, key, uid } from './domain';
import type { Data, Row, Table } from './domain';
import { registrationApproval, studentDeletion } from './registration-approval';
export type Identity={uid:string;email:string;displayName:string;verified:boolean;teacher:boolean};
export async function readRows(table:Table,...filters:QueryConstraint[]):Promise<Row[]> { if(!db)return [];const result=await getDocs(query(collection(db,table),...filters));return result.docs.map(d=>({...d.data(),id:d.id})); }
async function readPublicRows(table:'courses'|'lessons'|'settings'|'batches'|'communityLinks'):Promise<Row[]>{
 if(!publicDb)return [];
 const filters:[string,string|boolean][]=table==='courses'?[['published',true]]:table==='lessons'?[['published',true],['visibility','public']]:table==='batches'?[['active',true]]:table==='communityLinks'?[['active',true],['visibility','public']]:[];
 const result=await publicGetDocs(publicQuery(publicCollection(publicDb,table),...filters.map(([field,value])=>publicWhere(field,'==',value))));
 return result.docs.map(d=>({...d.data(),id:d.id}));
}
export async function loadData(identity:Identity|null):Promise<Data> {
 const data=emptyData();if(!db)return data;
 if(identity?.teacher){await Promise.all(tables.map(async t=>{data[t]=await readRows(t);}));return data;}
 await Promise.all((['courses','lessons','communityLinks','settings','batches'] as const).map(async table=>{data[table]=await readPublicRows(table);}));
 if(!identity)return data;
 const user=await getDoc(doc(db,'users',identity.uid));if(user.exists())data.users=[{...user.data(),id:user.id}];
 if(!identity.verified)return data;
 const binding=await getDoc(doc(db,'studentLinks',identity.uid));if(binding.exists())data.studentLinks=[{...binding.data(),id:binding.id}];
 data.savedCourses=await readRows('savedCourses',where('uid','==',identity.uid));
 data.accessRequests=await readRows('accessRequests',where('uid','==',identity.uid));
 data.progress=await readRows('progress',where('uid','==',identity.uid));
 data.levelAttempts=await readRows('levelAttempts',where('uid','==',identity.uid));
 data.quizAttempts=await readRows('quizAttempts',where('uid','==',identity.uid));
 const studentId=binding.data()?.studentId;
 if(studentId){
  const student=await getDoc(doc(db,'students',studentId));if(student.exists())data.students=[{...student.data(),id:student.id}];
  await Promise.all((['enrollments','courseAccess','submissions','attendance','feeMonths','paymentClaims','payments'] as Table[]).map(async t=>{data[t]=await readRows(t,where('studentId','==',studentId));}));
 }
 const courseIds=[...new Set([...data.courseAccess.filter(a=>a.active).map(a=>a.courseId),...data.courses.filter(c=>c.access==='free').map(c=>c.id)])];
 for(const courseId of courseIds){for(const t of ['lessons','assignments','questions'] as Table[]){const rows=await readRows(t,where('courseId','==',courseId),where('published','==',true),...(t==='assignments'?[where('releaseAt','<=',Date.now())]:[]));data[t]=[...new Map([...data[t],...rows].map(r=>[r.id,r])).values()];}}
 if(studentId&&data.students.some(s=>s.id===studentId&&s.active)){
  data.communityLinks.push(...await readRows('communityLinks',where('active','==',true),where('visibility','==','students'),where('batchId','==','')));
  for(const e of data.enrollments.filter(e=>e.status==='active'))data.communityLinks.push(...await readRows('communityLinks',where('active','==',true),where('visibility','==','students'),where('batchId','==',e.batchId)));
 }
 for(const e of data.enrollments.filter(e=>e.status==='active')){data.sessions.push(...await readRows('sessions',where('batchId','==',e.batchId)));data.announcements.push(...await readRows('announcements',where('batchId','==',e.batchId)));}
 return data;
}
const clean=(value:any):any=>Array.isArray(value)?value.map(clean):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,clean(v)])):value;
export async function save(table:Table,row:Row){if(!db)throw Error('Firebase is not configured.');const {id,...values}=row;await setDoc(doc(db,table,id),clean(values));}
export async function remove(table:Table,id:string){if(!db)throw Error('Firebase is not configured.');await deleteDoc(doc(db,table,id));}
export async function batchSave(changes:{table:Table;row:Row}[]){if(!db)throw Error('Firebase is not configured.');for(let offset=0;offset<changes.length;offset+=200){const batch=writeBatch(db);for(const {table,row} of changes.slice(offset,offset+200)){const {id,...values}=row;batch.set(doc(db,table,id),clean(values));}await batch.commit();}}
export async function approveClaim(id:string,teacherUid:string){if(!db)throw Error('Firebase is not configured.');await runTransaction(db,async tx=>{
 const ref=doc(db!,'paymentClaims',id),paymentRef=doc(db!,'payments',id);const [claim,payment]=await Promise.all([tx.get(ref),tx.get(paymentRef)]);
 if(!claim.exists())throw Error('Claim no longer exists.');if(payment.exists())throw Error('This claim has already been confirmed.');
 const c=claim.data();if(c.status==='confirmed')throw Error('Claim already confirmed.');
 tx.set(paymentRef,{studentId:c.studentId,batchId:c.batchId,month:c.month,amount:Number(c.amount),paidOn:c.paidOn,reference:c.reference,method:'Bank Transfer',claimId:id,status:'confirmed'});
 const at=new Date().toISOString();tx.update(ref,{status:'confirmed',reviewedAt:at,reviewedBy:teacherUid});
 tx.set(doc(db!,'audit',uid()),{action:'payment_confirmed',recordId:id,actor:teacherUid,at});
 });}
export async function setEnrollment(row:Row,allEnrollments:Row[]){
 const otherActive=allEnrollments.some(e=>e.id!==row.id&&e.studentId===row.studentId&&e.courseId===row.courseId&&e.status==='active');
 await batchSave([{table:'enrollments',row},{table:'courseAccess',row:{id:key(row.studentId,row.courseId),studentId:row.studentId,courseId:row.courseId,active:row.status==='active'||otherActive}}]);
}

export async function acceptRegistration(accountId:string,studentId:string,batchId:string) {
 if (!db) throw Error('Firebase is not configured.');
 await runTransaction(db,async tx => {
  const data=emptyData();
  await Promise.all((['users','students','studentLinks','batches','enrollments','courseAccess','accessRequests'] as const).map(async table => {data[table]=await readRows(table);}));
  const proposal=registrationApproval(data,accountId,studentId,batchId);
  // Read every affected record before writing so concurrent approvals retry safely.
  for (const change of [...proposal,{table:'batches' as const,row:{id:batchId}},{table:'users' as const,row:{id:accountId}}]) {
   const current=await tx.get(doc(db!,change.table,change.row.id));
   data[change.table]=data[change.table].filter(r => r.id !== change.row.id);
   if(current.exists())data[change.table].push({...current.data(),id:current.id});
  }
  const changes=registrationApproval(data,accountId,studentId,batchId);
  for(const {table,row} of changes){const {id,...values}=row;tx.set(doc(db!,table,id),clean(values));}
  const delivery=data.batches.find(b => b.id===batchId)!;
  tx.update(doc(db!,'batches',batchId),{enrollmentRevision:Number(delivery.enrollmentRevision||0)+1});
 });
}

export async function deleteStudent(studentId:string) {
 if(!db)throw Error('Firebase is not configured.');
 await runTransaction(db,async tx => {
  const data=emptyData();
  await Promise.all((['students','enrollments','courseAccess'] as const).map(async table=>{data[table]=await readRows(table);}));
  const proposal=studentDeletion(data,studentId);
  for(const {table,row} of proposal){
   const current=await tx.get(doc(db!,table,row.id));
   data[table]=data[table].filter(r=>r.id!==row.id);
   if(current.exists())data[table].push({...current.data(),id:current.id});
  }
  for(const {table,row} of studentDeletion(data,studentId)){
   const {id,...values}=row;tx.set(doc(db!,table,id),clean(values));
  }
 });
}
