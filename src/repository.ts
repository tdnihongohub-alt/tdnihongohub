import { canOpenModule } from './course-enrollment';
import { limitedPolicyPlan,policyPatch,policySourceTables,studentPolicyPlan } from './student-access-policy';
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
export async function loadData(identity:Identity|null,onAccess?:(data:Data)=>void,onIncomplete?:()=>void):Promise<Data> {
 const data=emptyData();if(!db)return data;
 if(identity?.teacher){await Promise.all(tables.map(async t=>{data[t]=await readRows(t);}));return data;}

 // Resolve access before fetching class materials and other workspace records.
 if(identity){
  const [user,binding]=await Promise.all([
   getDoc(doc(db,'users',identity.uid)),
   identity.verified?getDoc(doc(db,'studentLinks',identity.uid)):null,
  ]);
  if(user.exists())data.users=[{...user.data(),id:user.id}];
  if(binding?.exists())data.studentLinks=[{...binding.data(),id:binding.id}];
 }
 const studentId=data.studentLinks[0]?.studentId;
 await Promise.all([
  ...(['courses','batches'] as const).map(async table=>{data[table]=await readPublicRows(table);}),
  ...(studentId?[
   getDoc(doc(db,'students',studentId)).then(student=>{if(student.exists())data.students=[{...student.data(),id:student.id}];}),
   ...(['enrollments','courseAccess'] as const).map(async table=>{data[table]=await readRows(table,where('studentId','==',studentId));}),
  ]:[]),
 ]);
 const activeStudent=data.students.some(s=>s.id===studentId&&s.active&&!s.deleted);
 const missingCourses=activeStudent?data.courseAccess.filter(a=>a.active&&!data.courses.some(c=>c.id===a.courseId)):[];
 const privateCourses=await Promise.allSettled(missingCourses.map(a=>getDoc(doc(db!,'courses',a.courseId))));
 for(const result of privateCourses)if(result.status==='fulfilled'&&result.value.exists()){
  const course=result.value;data.courses.push({...course.data(),id:course.id});
 }
 onAccess?.({...data});
 let incomplete=privateCourses.some(result=>result.status==='rejected');
 async function load(table:Table,read:()=>Promise<Row[]>){
  try{
   const rows=await read();
   data[table]=[...new Map([...data[table],...rows].map(row=>[row.id,row])).values()];
  }catch{incomplete=true;}
 }
 const tasks=(['lessons','communityLinks','settings'] as const).map(table=>load(table,()=>readPublicRows(table)));
 if(identity?.verified){
  for(const table of ['savedCourses','accessRequests','progress','contentReads','levelAttempts','quizAttempts'] as const)tasks.push(load(table,()=>readRows(table,where('uid','==',identity.uid))));
  if(studentId){
   for(const table of ['submissions','attendance','feeMonths','paymentClaims','payments'] as const)tasks.push(load(table,()=>readRows(table,where('studentId','==',studentId))));
   tasks.push(load('studentAlerts',()=>readRows('studentAlerts',where('studentId','==',studentId),where('audience','==','student'))));
  }
  const courseIds=new Set([...data.courseAccess.filter(a=>activeStudent&&a.active).map(a=>a.courseId),...data.courses.filter(c=>openFreeCourse(c)).map(c=>c.id)]);
  const visible=where('published','==',true),released=where('releaseAt','<=',Date.now());
  for(const courseId of courseIds){
   const course=where('courseId','==',courseId),shared=where('batchId','==','');
   tasks.push(load('lessons',()=>readRows('lessons',course,shared,visible)));
   tasks.push(load('assignments',()=>readRows('assignments',course,shared,visible,released)));
   tasks.push(load('questions',()=>readRows('questions',course,visible)));
  }
  if(activeStudent)tasks.push(load('communityLinks',()=>readRows('communityLinks',where('active','==',true),where('visibility','==','students'),where('batchId','==',''))));
  for(const module of data.batches.filter(b=>canOpenModule(data,studentId,b))){
   const batch=where('batchId','==',module.id),course=where('courseId','==',module.courseId);
   if(courseIds.has(module.courseId)){
    tasks.push(load('lessons',()=>readRows('lessons',course,batch,visible)));
    tasks.push(load('assignments',()=>readRows('assignments',course,batch,visible,released)));
    tasks.push(load('assignments',()=>readRows('assignments',course,where('batchIds','array-contains',module.id),visible,released)));
   }
   for(const table of ['sessions','practiceSeries','announcements'] as const)tasks.push(load(table,()=>readRows(table,batch)));
   tasks.push(load('communityLinks',()=>readRows('communityLinks',where('active','==',true),where('visibility','==','students'),batch)));
  }
 }
 await Promise.all(tasks);
 if(incomplete)onIncomplete?.();
 return data;
}
const learningTables=new Set<Table>(['lessons','assignments','questions','courses','batches','enrollments','courseAccess','studentLinks','students','sessions','practiceSeries','announcements','payments','feeMonths','attendance','studentAlerts']);
const learningRevision=()=>({updatedAt:Date.now(),revision:uid()});
export function subscribeLearningUpdates(onChange:()=>void,onError:(error:Error)=>void){
 if(!db)return ()=>{};
 let previous:string|undefined;
 return onSnapshot(doc(db,'settings','learningRevision'),{includeMetadataChanges:true},snapshot=>{
  if(snapshot.metadata.fromCache||snapshot.metadata.hasPendingWrites)return;
  const revision=String(snapshot.data()?.revision??'');
  const changed=previous!==undefined&&revision!==previous;
  previous=revision;
  if(changed)onChange();
 },onError);
}
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
export async function save(table:Table,row:Row){if(affectsBatchAccess([{table,row}]))return accessBatchSave([{table,row}]);if(!db)throw Error('Firebase is not configured.');const {id,...values}=row;if(learningTables.has(table)||table==='settings'&&row.id==='studentAccessPolicy'){const change=writeBatch(db);change.set(doc(db,table,id),clean(values));change.set(doc(db,'settings','learningRevision'),learningRevision());await change.commit();}else await setDoc(doc(db,table,id),clean(values));}
export async function remove(table:Table,id:string){if(!db)throw Error('Firebase is not configured.');if(table==='payments'||table==='feeMonths'){await runTransaction(db,async tx=>{const ref=doc(db!,table,id);const current=await tx.get(ref);if(!current.exists())throw Error('This financial record has already been deleted.');tx.set(doc(db!,'audit',uid()),{action:table==='payments'?'payment_deleted':'monthly_fee_deleted',recordId:id,before:current.data(),at:new Date().toISOString()});tx.delete(ref);tx.set(doc(db!,'settings','learningRevision'),learningRevision());});}else if(learningTables.has(table)){const change=writeBatch(db);change.delete(doc(db,table,id));change.set(doc(db,'settings','learningRevision'),learningRevision());await change.commit();}else await deleteDoc(doc(db,table,id));}
export async function batchSave(changes:{table:Table;row:Row}[]){if(affectsBatchAccess(changes))return accessBatchSave(changes);if(!db)throw Error('Firebase is not configured.');for(let offset=0;offset<changes.length;offset+=200){const batch=writeBatch(db);for(const {table,row} of changes.slice(offset,offset+200)){const {id,...values}=row;batch.set(doc(db,table,id),clean(values));}if(changes.slice(offset,offset+200).some(c=>learningTables.has(c.table)||c.table==='settings'&&c.row.id==='studentAccessPolicy'))batch.set(doc(db,'settings','learningRevision'),learningRevision());await batch.commit();}}
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
 tx.set(doc(db!,'audit',uid()),{action:'payment_confirmed',recordId:id,actor:teacherUid,at});tx.set(doc(db!,'settings','learningRevision'),learningRevision());
 });}
export async function setEnrollment(row:Row,allEnrollments:Row[]){
 const otherActive=allEnrollments.some(e=>e.id!==row.id&&e.studentId===row.studentId&&e.courseId===row.courseId&&e.status==='active');
 await batchSave([{table:'enrollments',row},{table:'courseAccess',row:{id:key(row.studentId,row.courseId),studentId:row.studentId,courseId:row.courseId,active:row.status==='active'||otherActive}}]);
}

export async function acceptRegistration(accountId:string,studentId:string,batchId:string,wholeCourse=false) {
 if (!db) throw Error('Firebase is not configured.');
 await runTransaction(db,async tx => {
  const data=emptyData();
  await Promise.all((['users','students','studentLinks','batches','courses','enrollments','courseAccess','accessRequests'] as const).map(async table => {data[table]=await readRows(table);}));
  const proposal=registrationApproval(data,accountId,studentId,batchId,wholeCourse);
  // Read every affected record before writing so concurrent approvals retry safely.
  for (const change of [...proposal,{table:wholeCourse?'courses' as const:'batches' as const,row:{id:batchId}},{table:'users' as const,row:{id:accountId}}]) {
   const current=await tx.get(doc(db!,change.table,change.row.id));
   data[change.table]=data[change.table].filter(r => r.id !== change.row.id);
   if(current.exists())data[change.table].push({...current.data(),id:current.id});
  }
  const changes=registrationApproval(data,accountId,studentId,batchId,wholeCourse);
  for(const {table,row} of changes){const {id,...values}=row;tx.set(doc(db!,table,id),clean(values));}
  const delivery=data.batches.find(b => b.id===batchId)!;
  if(!wholeCourse)tx.update(doc(db!,'batches',batchId),{enrollmentRevision:Number(delivery.enrollmentRevision||0)+1});tx.set(doc(db!,'settings','learningRevision'),learningRevision());
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

export async function runAccessPolicy(actor:string){
 if(!db)throw Error('Firebase is not configured.');
 let total=0;
 for(let part=0;part<10;part++){
  const result=await runTransaction(db,async tx=>{
   await tx.get(doc(db!,'settings','learningRevision'));
   const data=emptyData();await Promise.all(policySourceTables.map(async table=>{data[table]=await readRows(table);}));
   const plan=limitedPolicyPlan(studentPolicyPlan(data));
   for(const change of plan.changes){const {table,row}=change;const values=clean(policyPatch(data,change));if(table==='audit')values.actor=actor;
    if(data[table].some(r=>r.id===row.id))tx.update(doc(db!,table,row.id),values);else tx.set(doc(db!,table,row.id),values);
   }
   tx.set(doc(db!,'settings','accessAutomationHealth'),{lastWorkspaceRunAt:new Date().toISOString(),changes:plan.changes.length,remaining:plan.remaining},{merge:true});
   if(plan.changes.length)tx.set(doc(db!,'settings','learningRevision'),{...learningRevision(),source:'student-access-policy'});
   return {count:plan.changes.length,remaining:plan.remaining};
  });
  total+=result.count;if(!result.remaining)break;
 }
 return total;
}
