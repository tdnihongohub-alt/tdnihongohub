import { loginEmail } from './student-number';
import { accessPolicy,applyPolicyPlan,manualEnrollmentChange,studentPolicyPlan } from './student-access-policy';
import { registrationApproval, studentDeletion } from './registration-approval';
import { lessonDeletionPlan, sameLessonRecord } from './lesson-deletion';
import { recordingRemovalUpdates, sameRecordingSource } from './recording-removal';
import { sameSession, validateTimetableChanges } from './timetable-management';
import type { TimetableChange } from './timetable-management';
import type { RegistrationDetails } from './student-registration';
import { validateRegistration } from './student-registration';
import { assignmentForStudent, validateAssignmentBatch } from './assignment-audience';
import { assignmentReleased, assignmentClosed, usesQuestionResponses, validateFormAnswers } from './assignment-scheduling';
import { brandDefaults, publicLessons } from './brand';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider, signOut, updateProfile } from '@firebase/auth';
import { getDoc, doc } from '@firebase/firestore';
import { auth, db, configured } from './firebase';
import * as repo from './repository';
import type { Identity } from './repository';
import { initialData } from './seed';
import { key, uid, validate } from './domain';
import type { Data, Row, Table } from './domain';

type Context={data:Data;identity:Identity|null;loading:boolean;error:string;demo:boolean;studentId:string;notify:(message:string)=>void;refresh:()=>Promise<void>;save:(table:Table,row:Row)=>Promise<void>;remove:(table:Table,id:string)=>Promise<void>;batch:(changes:{table:Table;row:Row}[])=>Promise<void>;changeTimetable:(changes:TimetableChange[])=>Promise<void>;approve:(id:string)=>Promise<void>;enroll:(row:Row)=>Promise<void>;login:(email:string,password:string,register?:boolean,name?:string,details?:RegistrationDetails)=>Promise<void>;acceptRegistration:(accountId:string,studentId:string,batchId:string)=>Promise<void>;deleteStudent:(studentId:string)=>Promise<void>;deleteLesson:(lesson:Row)=>Promise<void>;removeRecording:(lesson:Row,batchId:string)=>Promise<void>;google:()=>Promise<void>;reset:(email:string)=>Promise<void>;verify:()=>Promise<void>;logout:()=>Promise<void>;startDemo:(role:'teacher'|'student')=>void;exitDemo:()=>void};
export const AppContext=createContext<Context>(null!);
export const useApp=()=>useContext(AppContext);
const cacheKey='td-nihongo-preview-v2';
export function Provider({children}:{children:ReactNode}){
 const pendingRegistration=useRef<{email:string;ready:Promise<void>}|null>(null);const loadVersion=useRef(0);const [data,setData]=useState<Data>(initialData());const [identity,setIdentity]=useState<Identity|null>(null);const [demo,setDemo]=useState(false);const [loading,setLoading]=useState(configured);const [error,setError]=useState('');const [toast,setToast]=useState('');
 const notify=useCallback((message:string)=>{setToast(message);},[]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),5000);return()=>clearTimeout(timer);},[toast]);
 const refresh=useCallback(async()=>{if(demo||!configured)return;const version=++loadVersion.current;try{const next=await repo.loadData(identity);if(version===loadVersion.current){setData(next);setError('');}}catch(e){if(version===loadVersion.current)setError((e as Error).message);}finally{if(version===loadVersion.current)setLoading(false);}},[identity,demo]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{if(demo||!configured||!identity?.verified)return;let timer:ReturnType<typeof setTimeout>|undefined;const unsubscribe=repo.subscribeLearningUpdates(()=>{clearTimeout(timer);timer=setTimeout(()=>void refresh(),200);},()=>notify('Live updates are temporarily unavailable. Use Refresh records to check for changes.'));return()=>{clearTimeout(timer);unsubscribe();};},[demo,identity?.verified,refresh,notify]);
 useEffect(()=>{if(demo||!configured||!identity?.verified||identity.teacher)return;const timer=setInterval(()=>void refresh(),60000);return()=>clearInterval(timer);},[demo,identity,refresh]);
 useEffect(()=>{if(!auth)return;return onAuthStateChanged(auth,async user=>{const version=++loadVersion.current;setData(initialData());setLoading(true);let nextIdentity:Identity|null=null;try{if(!user){setIdentity(null);const publicData=await repo.loadData(null);if(version===loadVersion.current)setData(publicData);return;}const teacher=await getDoc(doc(db!,'teachers',user.uid));nextIdentity={uid:user.uid,email:user.email||'',displayName:user.displayName||user.email||'Student',verified:user.emailVerified,teacher:teacher.exists()&&teacher.data()?.enabled===true};const pending=pendingRegistration.current;if(pending&&pending.email===user.email?.toLowerCase())await pending.ready;const nextData=await repo.loadData(nextIdentity);if(version===loadVersion.current){setData(nextData);setIdentity(nextIdentity);setError('');}}catch(e){if(version===loadVersion.current){setIdentity(nextIdentity);setError((e as Error).message);}}finally{if(version===loadVersion.current)setLoading(false);}});},[]);
 useEffect(()=>{if(demo)localStorage.setItem(cacheKey,JSON.stringify(data));},[data,demo]);
 const policyBusy=useRef(false);const [policyTick,setPolicyTick]=useState(0);
 useEffect(()=>{const timer=setInterval(()=>setPolicyTick(t=>t+1),15*60000);return()=>clearInterval(timer);},[]);
 const policy=accessPolicy(data),revision=data.settings.find(s=>s.id==='learningRevision');
 useEffect(()=>{
  if(!identity?.teacher||!policy.enabled||loading)return;
  if(demo){const plan=studentPolicyPlan(data);if(plan.length)setData(previous=>applyPolicyPlan(previous,plan));return;}
  if(policyBusy.current||revision?.source==='student-access-policy'&&policyTick===0)return;
  policyBusy.current=true;let cancelled=false;
  void repo.runAccessPolicy(identity.uid).then(count=>{if(count&&!cancelled)void refresh();}).catch(e=>{if(!cancelled)notify('Student access check failed. Existing access was kept: '+(e as Error).message);}).finally(()=>{policyBusy.current=false;});
  return()=>{cancelled=true;};
 },[demo,demo?data:null,identity?.uid,identity?.teacher,policy.enabled,policy.paymentEnabled,policy.attendanceEnabled,revision?.revision,loading,policyTick,refresh,notify]);
 const studentId=data.studentLinks.find(r=>r.id===identity?.uid)?.studentId||'';
 const save=async(table:Table,row:Row)=>{if(table==='lessons'){row={...row,batchId:row.batchId||''};validateAssignmentBatch(row,data);if(row.batchId&&row.visibility==='public')throw Error('Batch-specific materials must use the Enrolled students audience.');}if(table==='assignments'){row={...row,batchId:row.batchId||''};validateAssignmentBatch(row,data);}if(table==='submissions'&&!identity?.teacher){if(!['draft','submitted'].includes(row.status))throw Error('Only the teacher can review or return student work.');const a=data.assignments.find(a=>a.id===row.assignmentId);if(!a||!assignmentForStudent(a,data,studentId)||!assignmentReleased(a)||(assignmentClosed(a)&&!row.timedOut))throw Error('This work is not open for submission.');if(row.status==='submitted'&&usesQuestionResponses(a))validateFormAnswers(row.timedOut?(a.formQuestions||[]).map((q:any)=>({...q,required:false})):a.formQuestions||[],row.formAnswers||{});}const valid=validate(table,row) as Row;if(demo){setData(previous=>({...previous,[table]:[...previous[table].filter(r=>r.id!==row.id),valid]}));}else{await repo.save(table,valid);await refresh();}};
 const remove=async(table:Table,id:string)=>{if(demo)setData(previous=>({...previous,[table]:previous[table].filter(r=>r.id!==id)}));else{await repo.remove(table,id);await refresh();}};
 const batch=async(changes:{table:Table;row:Row}[])=>{if(demo){setData(previous=>{const next=structuredClone(previous);for(const {table,row} of changes)next[table]=[...next[table].filter(r=>r.id!==row.id),row];return next;});}else{await repo.batchSave(changes);await refresh();}};
 const changeTimetable=async(changes:TimetableChange[])=>{
  if(!identity?.teacher)throw Error('Teacher access required.');
  validateTimetableChanges(changes);
  if(demo){
   for(const change of changes){const current=data.sessions.find(s=>s.id===change.before.id);if(!current||!sameSession(current,change.before))throw Error('A selected class has changed. Refresh the timetable and try again.');}
   const updates=new Map(changes.map(c=>[c.before.id,c.after]));const at=new Date().toISOString(),operationId=uid('TIM-');
   const audit=changes.map(c=>({id:uid(),action:c.after?'session_updated':'session_deleted',operationId,recordId:c.before.id,before:c.before,after:c.after,actor:identity.uid,at}));
   setData(previous=>({...previous,sessions:previous.sessions.flatMap(s=>updates.has(s.id)?updates.get(s.id)?[updates.get(s.id)!]:[]:[s]),audit:[...previous.audit,...audit]}));
  }else{await repo.changeTimetable(changes,identity.uid);await refresh();}
 };
 const removeRecording=async(original:Row,batchId:string)=>{
  if(!identity?.teacher)throw Error('Teacher access required.');
  if(demo){
   const current=data.lessons.find(l=>l.id===original.id);if(!current)throw Error('The lesson could not be found.');
   if(!sameRecordingSource(current,original))throw Error('This recording has changed. Refresh and check it before removing.');
   const updates=recordingRemovalUpdates(current,batchId),audit={id:uid(),action:'recording_removed_from_week',recordId:original.id,batchId,before:current,after:{...current,...updates},actor:identity.uid,at:new Date().toISOString()};
   setData(previous=>({...previous,lessons:previous.lessons.map(l=>l.id===original.id?{...l,...updates}:l),audit:[...previous.audit,audit]}));
  }else{await repo.removeRecording(original,batchId,identity.uid);await refresh();}
 };
 const deleteLesson=async(original:Row)=>{
  if(!identity?.teacher)throw Error('Teacher access required.');
  if(demo){
   const plan=lessonDeletionPlan(data,original.id);
   if(!sameLessonRecord(plan.lesson,original))throw Error('This lesson has changed. Refresh and check it before deleting.');
   const assignments=new Set(plan.assignments.map(c=>c.before.id)),sessions=new Set(plan.sessions.map(c=>c.before.id));
   const audit={id:uid(),action:'lesson_deleted',recordId:original.id,before:plan.lesson,detachedAssignments:[...assignments],retainedSessions:[...sessions],actor:identity.uid,at:new Date().toISOString()};
   setData(previous=>({...previous,lessons:previous.lessons.filter(l=>l.id!==original.id),assignments:previous.assignments.map(a=>assignments.has(a.id)?{...a,lessonId:''}:a),sessions:previous.sessions.map(s=>sessions.has(s.id)?{...s,lessonId:'',title:s.title||plan.lesson.title}:s),audit:[...previous.audit,audit]}));
  }else{await repo.deleteLesson(original,identity.uid);await refresh();}
 };
 const approve=async(id:string)=>{if(demo){const c=data.paymentClaims.find(c=>c.id===id);if(!c)throw Error('Missing claim.');if(c.status==='confirmed'||data.payments.some(p=>p.id===id))throw Error('Already confirmed.');await batch([{table:'paymentClaims',row:{...c,status:'confirmed',reviewedAt:new Date().toISOString()}},{table:'payments',row:{id,studentId:c.studentId,batchId:c.batchId,month:c.month,amount:c.amount,paidOn:c.paidOn,method:'Bank Transfer',reference:c.reference,claimId:id,status:'confirmed'}},{table:'audit',row:{id:uid(),action:'payment_confirmed',recordId:id,at:new Date().toISOString()}}]);}else{await repo.approveClaim(id,identity!.uid);await refresh();}};
 const enroll=async(row:Row)=>{row=manualEnrollmentChange(row);const b=data.batches.find(b=>b.id===row.batchId);if(!b)throw Error('Choose a batch.');if(row.status==='active'&&data.enrollments.filter(e=>e.batchId===b.id&&e.id!==row.id&&(e.status==='active'||e.autoPaymentSuspended)).length>=Number(b.capacity))throw Error('This batch is full.');if(demo){const active=row.status==='active'||data.enrollments.some(e=>e.id!==row.id&&e.courseId===row.courseId&&e.studentId===row.studentId&&e.status==='active');await batch([{table:'enrollments',row},{table:'courseAccess',row:{id:key(row.studentId,row.courseId),studentId:row.studentId,courseId:row.courseId,active}}]);}else{await repo.setEnrollment(row,data.enrollments);await refresh();}};
 const acceptRegistration=async(accountId:string,studentId:string,batchId:string)=>{if(!identity?.teacher)throw Error('Teacher access required.');if(demo)await batch(registrationApproval(data,accountId,studentId,batchId,true));else{await repo.acceptRegistration(accountId,studentId,batchId,true);await refresh();}};
 const deleteStudent=async(studentId:string)=>{if(!identity?.teacher)throw Error('Teacher access required.');if(demo)await batch(studentDeletion(data,studentId));else{await repo.deleteStudent(studentId);await refresh();}};
 const login=async(email:string,password:string,register=false,name='',details?:RegistrationDetails)=>{if(!auth)throw Error('Firebase setup is required before creating real accounts. Use the preview to explore.');if(register){const registration=validateRegistration(details!);if(!data.courses.some(c=>c.id===details?.preferredCourseId&&c.active!==false&&c.published))throw Error('Choose a current course.');let resolveSave!:()=>void;
  const ready=new Promise<void>(resolve=>{resolveSave=resolve;});
  pendingRegistration.current={email:email.trim().toLowerCase(),ready};
  try{
   const {user}=await createUserWithEmailAndPassword(auth,email.trim(),password);
   await repo.save('users',{id:user.uid,email:user.email||email.trim(),...registration,registrationCompleted:true,registeredAt:new Date().toISOString()});
   await updateProfile(user,{displayName:name});
   await sendEmailVerification(user);
   notify('Account created. Check your email to verify your account.');
  }finally{pendingRegistration.current=null;resolveSave();}
 }else await signInWithEmailAndPassword(auth,loginEmail(email),password);};
 const startDemo=(role:'teacher'|'student')=>{loadVersion.current++;setLoading(false);let saved:Data;try{saved=JSON.parse(localStorage.getItem(cacheKey)||'null')||initialData(true);}catch{saved=initialData(true);}saved.practiceSeries ||= [];saved.studentAlerts ||= [];saved.contentReads ||= [];saved.quizAttempts ||= [];saved.levelAttempts ||= [];saved.communityLinks ||= [];const previousBrand=saved.settings.find(b=>b.id==='brand');const updatedBrand={...brandDefaults,...previousBrand};if(!previousBrand?.logoUrl)updatedBrand.logoUrl=brandDefaults.logoUrl;if(previousBrand?.tagline==='A little Japanese. A world of possibilities.')updatedBrand.tagline=brandDefaults.tagline;if(previousBrand?.bio==='Online Japanese classes for N5, N4, A/L students and other learners. Learn through live classes, recordings and guided practice.')updatedBrand.bio=brandDefaults.bio;saved.settings=[updatedBrand,...saved.settings.filter(b=>b.id!=='brand')];for(const lesson of publicLessons)if(!saved.lessons.some(l=>l.id===lesson.id))saved.lessons.push({...lesson});setData(saved);setDemo(true);setIdentity({uid:role==='teacher'?'demo-teacher':'demo-student',email:`${role}@example.test`,displayName:role==='teacher'?'Teacher preview':'Demo Student',verified:true,teacher:role==='teacher'});setError('');};
 return <AppContext.Provider value={{data,identity,loading,error,demo,studentId,notify,refresh,save,remove,batch,changeTimetable,approve,enroll,login,acceptRegistration,deleteStudent,deleteLesson,removeRecording,startDemo,exitDemo:()=>{setDemo(false);setIdentity(null);setData(initialData());},google:async()=>{if(!auth)throw Error('Firebase setup is required.');await signInWithPopup(auth,new GoogleAuthProvider());},reset:async(email)=>{if(!auth)throw Error('Firebase setup is required.');await sendPasswordResetEmail(auth,email);notify('If this account exists, a recovery email will arrive.');},verify:async()=>{if(!auth?.currentUser)throw Error('Sign in first.');await sendEmailVerification(auth.currentUser);notify('Verification email sent.');},logout:async()=>{if(demo){setDemo(false);setData(initialData());}else if(auth)await signOut(auth);setIdentity(null);}}}>{children}{toast&&<div role="status" className="toast" onClick={()=>setToast('')}>{toast}</div>}</AppContext.Provider>;
}
