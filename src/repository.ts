import { affectsBatchAccess,withBatchAccess } from './batch-access';
import type { RecordChange } from './batch-access';
import { openFreeCourse } from './free-squads';
import { collection, doc, getDoc, getDocs, query, where, setDoc, deleteDoc, runTransaction, writeBatch, onSnapshot } from '@firebase/firestore';
import type { QueryConstraint } from '@firebase/firestore';
import { db, publicDb } from './firebase';
import { collection as publicCollection, query as publicQuery, where as publicWhere, getDocs as publicGetDocs } from '@firebase/firestore/lite';
import { emptyData, tables, key, uid } from './domain';
import type { Data, Row, Table } from './domain';
import { registrationApproval, studentDeletion } from './registration-approval';
import { sameSession, validateTimetableChanges } from './timetable-management';
import type { TimetableChange } from './timetable-management';
import { lessonDeletionPlan, sameLessonRecord } from './lesson-deletion';
import { recordingRemovalUpdates, sameRecordingSource } from './recording-removal';
export type Identity={uid:string;email:string;displayName:string;verified:boolean;teacher:boolean};
export async function readRows(table:Table,...filters:QueryConstraint[]):Promise<Row[]> { if(!db)return [];const result=await getDocs(query(collection(db,table),...filters));return result.docs.map(d=>({...d.data(),id:d.id})); }
async function readPublicRows(table:'courses'|'lessons'|'settings'|'batches'|'communityLinks'):Promise<Row[]>{
 if(!publicDb)return [];
 const filters:[string,string|boolean][]=table==='courses'?[['published',true]]:table==='lessons'?[['published',true],['visibility','public'],['batchId','']]:table==='batches'?[['active',true]]:table==='communityLinks'?[['active',true],['visibility','public']]:[];
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
 data.progress=await readRows('progress',where('uid','==',identity.uid));data.contentReads=await readRows('contentReads',where('uid','==',identity.uid));
 data.levelAttempts=await readRows('levelAttempts',where('uid','==',identity.uid));
 data.quizAttempts=await readRows('quizAttempts',where('uid','==',identity.uid));
 const studentId=binding.data()?.studentId;
 if(studentId){
  const student=await getDoc(doc(db,'students',studentId));if(student.exists())data.students=[{...student.data(),id:student.id}];
  await Promise.all((['enrollments','courseAccess','submissions','attendance','feeMonths','paymentClaims','payments'] as Table[]).map(async t=>{data[t]=await readRows(t,where('studentId','==',studentId));}));
 }
 const courseIds=[...new Set([...data.courseAccess.filter(a=>a.active).map(a=>a.courseId),...data.courses.filter(c=>openFreeCourse(c)).map(c=>c.id)])];
 for(const courseId of courseIds){for(const t of ['lessons','assignments','questions'] as Table[]){const rows=await readRows(t,where('courseId','==',courseId),where('published','==',true),...(t==='assignments'?[where('batchId','==',''),where('releaseAt','<=',Date.now())]:t==='lessons'?[where('batchId','==','')]:[]));data[t]=[...new Map([...data[t],...rows].map(r=>[r.id,r])).values()];}}
 if(studentId&&data.students.some(s=>s.id===studentId&&s.active)){
  data.communityLinks.push(...await readRows('communityLinks',where('active','==',true),where('visibility','==','students'),where('batchId','==','')));
  for(const e of data.enrollments.filter(e=>e.status==='active'))data.communityLinks.push(...await readRows('communityLinks',where('active','==',true),where('visibility','==','students'),where('batchId','==',e.batchId)));
 }
 for(const e of data.enrollments.filter(e=>e.status==='active')){if(courseIds.includes(e.courseId)){data.lessons.push(...await readRows('lessons',where('courseId','==',e.courseId),where('batchId','==',e.batchId),where('published','==',true)));const work=await readRows('assignments',where('courseId','==',e.courseId),where('batchId','==',e.batchId),where('published','==',true),where('releaseAt','<=',Date.now()));data.assignments=[...new Map([...data.assignments,...work].map(a=>[a.id,a])).values()];}data.sessions.push(...await readRows('sessions',where('batchId','==',e.batchId)));data.announcements.push(...await readRows('announcements',where('batchId','==',e.batchId)));}
 const seen=new Set(data.assignments.map(a=>a.id));
 if(studentId&&data.students.some(s=>s.id===studentId&&s.active))for(const e of data.enrollments.filter(e=>e.status==='active')){
  if(!courseIds.includes(e.courseId))continue;
  const rows=await readRows('assignments',where('courseId','==',e.courseId),where('batchIds','array-contains',e.batchId),where('published','==',true),where('releaseAt','<=',Date.now()));
  for(const a of rows)if(!seen.has(a.id)){data.assignments.push(a);seen.add(a.id);}
 }
 return data;
}
const learningTables=new Set<Table>(['lessons','assignments','questions','courses','batches','enrollments','courseAccess','studentLinks','students','sessions','announcements']);
const learningRevision=()=>({updatedAt:Date.now(),revision:uid()});
export function subscribeLearningUpdates(onChange:()=>void,onError:(error:Error)=>void){if(!db)return ()=>{};return onSnapshot(doc(db,'settings','learningRevision'),()=>onChange(),onError);}
export function subscribeAppearance(onChange:(row:Row|null)=>void,onError:(error:Error)=>void){if(!db)return ()=>{};return onSnapshot(doc(db,'settings','appearance'),snapshot=>onChange(snapshot.exists()?{...snapshot.data(),id:snapshot.id}:null),onError);}
export function subscribeCommunityStats(onChange:(row:Row|null)=>void,onError:(error:Error)=>void){if(!db)return ()=>{};return onSnapshot(doc(db,'settings','communityStats'),snapshot=>onChange(snapshot.exists()?{...snapshot.data(),id:snapshot.id}:null),onError);}
const clean=(value:any):any=>Array.isArray(value)?value.map(clean):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,clean(v)])):value;
async function accessBatchSave(changes:RecordChange[]){
 if(!db)throw Error('Firebase is not configured.');
 if(changes.length>200)throw Error('Save up to 200 access changes at a time.');
 await runTransaction(db,async tx=>{
  await tx.get(doc(db!,'settings','learningRevision'));
  const data=emptyData(),ids=new Set(changes.flatMap(c=>c.table==='students'?[c.row.id]:['enrollments','studentLinks'].includes(c.table)?[c.row.studentId]:[]));
  for(const c of changes.filter(c=>c.table==='studentLinks')){const current=await tx.get(doc(db!,'studentLinks',c.row.id));if(current.exists())ids.add(current.data().studentId);}
  for(const id of ids){
   const student=await tx.get(doc(db!,'students',id));if(student.exists())data.students.push({...student.data(),id:student.id});
   data.enrollments.push(...await readRows('enrollments',where('studentId','==',id)));
   data.studentLinks.push(...await readRows('studentLinks',where('studentId','==',id)));
  }
  for(const {table,row} of withBatchAccess(data,changes)){const {id,...values}=row;tx.set(doc(db!,table,id),clean(values));}
  tx.set(doc(db!,'settings','learningRevision'),learningRevision());
 });
}
export async function save(table:Table,row:Row){if(affectsBatchAccess([{table,row}]))return accessBatchSave([{table,row}]);if(!db)throw Error('Firebase is not configured.');const {id,...values}=row;if(learningTables.has(table)){const change=writeBatch(db);change.set(doc(db,table,id),clean(values));change.set(doc(db,'settings','learningRevision'),learningRevision());await change.commit();}else await setDoc(doc(db,table,id),clean(values));}
export async function remove(table:Table,id:string){if(!db)throw Error('Firebase is not configured.');if(table==='payments'||table==='feeMonths'){await runTransaction(db,async tx=>{const ref=doc(db!,table,id);const current=await tx.get(ref);if(!current.exists())throw Error('This financial record has already been deleted.');tx.set(doc(db!,'audit',uid()),{action:table==='payments'?'payment_deleted':'monthly_fee_deleted',recordId:id,before:current.data(),at:new Date().toISOString()});tx.delete(ref);});}else if(learningTables.has(table)){const change=writeBatch(db);change.delete(doc(db,table,id));change.set(doc(db,'settings','learningRevision'),learningRevision());await change.commit();}else await deleteDoc(doc(db,table,id));}
export async function batchSave(changes:{table:Table;row:Row}[]){if(affectsBatchAccess(changes))return accessBatchSave(changes);if(!db)throw Error('Firebase is not configured.');for(let offset=0;offset<changes.length;offset+=200){const batch=writeBatch(db);for(const {table,row} of changes.slice(offset,offset+200)){const {id,...values}=row;batch.set(doc(db,table,id),clean(values));}if(changes.slice(offset,offset+200).some(c=>learningTables.has(c.table)))batch.set(doc(db,'settings','learningRevision'),learningRevision());await batch.commit();}}
export async function removeRecording(original:Row,batchId:string,actor:string){
 if(!db)throw Error('Firebase is not configured.');
 await runTransaction(db,async tx=>{
  const ref=doc(db!,'lessons',original.id),snapshot=await tx.get(ref);
  if(!snapshot.exists())throw Error('The lesson could not be found. Refresh the class page.');
  const current={...snapshot.data(),id:snapshot.id} as Row;
  if(!sameRecordingSource(current,original))throw Error('This recording has changed. Refresh and check the selected copy before removing it.');
  const updates=recordingRemovalUpdates(current,batchId);
  tx.update(ref,updates);
  tx.set(doc(db!,'audit',uid()),clean({action:'recording_removed_from_week',recordId:original.id,batchId:batchId||current.batchId||'',before:current,after:{...current,...updates},actor,at:new Date().toISOString()}));
  tx.set(doc(db!,'settings','learningRevision'),learningRevision());
 });
}
export async function deleteLesson(original:Row,actor:string){
 if(!db)throw Error('Firebase is not configured.');
 await runTransaction(db,async tx=>{
  // The shared revision also protects links created while the query runs.
  await tx.get(doc(db!,'settings','learningRevision'));
  const lesson=await tx.get(doc(db!,'lessons',original.id));
  if(!lesson.exists())throw Error('This lesson has already been removed.');
  const current={...lesson.data(),id:lesson.id} as Row;
  if(!sameLessonRecord(current,original))throw Error('This lesson has changed. Close this window, refresh and check the lesson before deleting it.');
  const [assignments,sessions]=await Promise.all([readRows('assignments',where('lessonId','==',original.id)),readRows('sessions',where('lessonId','==',original.id))]);
  if(assignments.length+sessions.length>400)throw Error('This lesson has too many linked records for one deletion. Unpublish it first.');
  const data=emptyData();data.lessons=[current];
  for(const table of ['assignments','sessions'] as const){
   const targets=table==='assignments'?assignments:sessions;
   const linked=await Promise.all(targets.map(row=>tx.get(doc(db!,table,row.id))));
   data[table]=linked.filter(row=>row.exists()&&row.data()!.lessonId===original.id).map(row=>({...row.data(),id:row.id}));
  }
  const plan=lessonDeletionPlan(data,original.id);
  for(const change of plan.assignments)tx.update(doc(db!,'assignments',change.before.id),{lessonId:''});
  for(const change of plan.sessions)tx.update(doc(db!,'sessions',change.before.id),{lessonId:'',title:change.after.title});
  tx.set(doc(db!,'audit',uid()),clean({action:'lesson_deleted',recordId:original.id,before:current,detachedAssignments:plan.assignments.map(c=>c.before.id),retainedSessions:plan.sessions.map(c=>c.before.id),actor,at:new Date().toISOString()}));
  tx.delete(doc(db!,'lessons',original.id));
  tx.set(doc(db!,'settings','learningRevision'),learningRevision());
 });
}
export async function changeTimetable(changes:TimetableChange[],actor:string){
 if(!db)throw Error('Firebase is not configured.');
 validateTimetableChanges(changes);
 await runTransaction(db,async tx=>{
  const current=await Promise.all(changes.map(c=>tx.get(doc(db!,'sessions',c.before.id))));
  for(let i=0;i<changes.length;i++){
   const row=current[i];
   if(!row.exists()||!sameSession({...row.data(),id:row.id},changes[i].before))throw Error('A selected class has changed. Close this window, refresh the timetable and try again.');
  }
  const at=new Date().toISOString(),operationId=uid('TIM-');
  for(const change of changes){
   const ref=doc(db!,'sessions',change.before.id);
   if(change.after){const {id,...values}=change.after;tx.set(ref,clean(values));}else tx.delete(ref);
   tx.set(doc(db!,'audit',uid()),clean({action:change.after?'session_updated':'session_deleted',operationId,recordId:change.before.id,before:change.before,after:change.after,actor,at}));
  }
  tx.set(doc(db!,'settings','learningRevision'),learningRevision());
 });
}
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
  tx.update(doc(db!,'batches',batchId),{enrollmentRevision:Number(delivery.enrollmentRevision||0)+1});tx.set(doc(db!,'settings','learningRevision'),learningRevision());
 });
}

export async function deleteStudent(studentId:string) {
 if(!db)throw Error('Firebase is not configured.');
 await runTransaction(db,async tx => {
  const data=emptyData();
  await Promise.all((['students','enrollments','courseAccess','studentLinks'] as const).map(async table=>{data[table]=await readRows(table);}));
  const proposal=studentDeletion(data,studentId);
  for(const {table,row} of proposal){
   const current=await tx.get(doc(db!,table,row.id));
   data[table]=data[table].filter(r=>r.id!==row.id);
   if(current.exists())data[table].push({...current.data(),id:current.id});
  }
  for(const {table,row} of studentDeletion(data,studentId)){
   const {id,...values}=row;tx.set(doc(db!,table,id),clean(values));
  }
  tx.set(doc(db!,'settings','learningRevision'),learningRevision());
 });
}
