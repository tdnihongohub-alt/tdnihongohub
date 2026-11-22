import { addDays,emptyData,key } from './domain';
import type { Data,Row } from './domain';
import { withBatchAccess } from './batch-access';
import type { RecordChange } from './batch-access';

export const policyDefaults={enabled:false,paymentEnabled:true,attendanceEnabled:true,graceDays:7,absenceWeeks:2,enabledAt:''};
export const policyDate=(now=Date.now())=>new Date(now+19800000).toISOString().slice(0,10);
export const validPolicyDate=(s:unknown):s is string=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
export function accessPolicy(data:Data){return {...policyDefaults,...data.settings.find(s=>s.id==='studentAccessPolicy')};}
export const policySourceTables=['settings','students','batches','courses','enrollments','courseAccess','studentLinks','feeMonths','payments','sessions','attendance','studentAlerts'] as const;
const alertId=(prefix:string,id:string)=>`${prefix}-${encodeURIComponent(id)}`;
function outstanding(data:Data,fee:Row){
 const received=data.payments.filter(p=>p.studentId===fee.studentId&&p.batchId===fee.batchId&&p.month===fee.month&&!['void','pending','rejected','awaiting_review','clarification_requested'].includes(p.status)).reduce((n,p)=>n+Math.max(0,Number(p.amount)||0),0);
 return Math.max(0,Math.round((Number(fee.amount)-received)*100)/100);
}
function same(a:unknown,b:unknown){return JSON.stringify(a)===JSON.stringify(b);}
export function completedAttendanceWeeks(now=Date.now()){
 const date=policyDate(now),weekday=(new Date(date+'T12:00:00Z').getUTCDay()+6)%7,end=addDays(date,-weekday-1);
 return [{start:addDays(end,-13),end:addDays(end,-7)},{start:addDays(end,-6),end}];
}
export function missedTwoWeeks(data:Data,enrollment:Row,now=Date.now()){
 const weeks=completedAttendanceWeeks(now),student=data.students.find(s=>s.id===enrollment.studentId);
 const joined=enrollment.joinedOn||student?.registeredOn||'';
 return weeks.every(week=>{
  const sessions=data.sessions.filter(s=>s.batchId===enrollment.batchId&&s.status!=='cancelled'&&s.date>=week.start&&s.date<=week.end&&(!joined||s.date>=joined)&&Date.parse(`${s.date}T${s.time||'00:00'}:00+05:30`)+(Number(s.duration)||0)*60000<=now);
  const dates=[...new Set(sessions.map(s=>s.date))];
  return dates.length>0&&dates.every(date=>{const marks=data.attendance.filter(a=>a.studentId===enrollment.studentId&&a.batchId===enrollment.batchId&&a.date===date);return marks.length>0&&marks.every(a=>a.status==='Absent');});
 });
}

/** Pure plan: never writes fees, payments, attendance or student identity records. */
export function studentPolicyPlan(data:Data,now=Date.now()):RecordChange[]{
 const policy=accessPolicy(data);if(!policy.enabled)return [];
 if(policy.graceDays!==7||policy.absenceWeeks!==2)throw Error('This policy requires the agreed 7-day payment grace period and two-week attendance warning.');
 const date=policyDate(now),at=new Date(now).toISOString();const changes:RecordChange[]=[];
 const upsert=(table:RecordChange['table'],row:Row)=>{const current=data[table].find(r=>r.id===row.id);if(!same(current,row))changes.push({table,row});};
 const relevant=new Set<string>(),affectedCourses=new Set<string>();
 const nextEnrollments=data.enrollments.map(e=>({...e}));
 const eligible=(e:Row)=>data.students.some(s=>s.id===e.studentId&&s.active&&!s.deleted)&&data.batches.some(b=>b.id===e.batchId&&b.active!==false)&&data.courses.some(c=>c.id===e.courseId&&c.active!==false);
 if(policy.paymentEnabled)for(const enrollment of nextEnrollments){
  if(!eligible(enrollment)||!['active','suspended'].includes(enrollment.status)||enrollment.status==='suspended'&&!enrollment.autoPaymentSuspended)continue;
  if(!data.courses.some(c=>c.id===enrollment.courseId&&c.access==='paid'))continue;
  const exempt=validPolicyDate(enrollment.paymentExemptUntil)&&enrollment.paymentExemptUntil>=date;
  let shouldSuspend=false;
  for(const fee of data.feeMonths.filter(f=>f.studentId===enrollment.studentId&&f.batchId===enrollment.batchId)){
   if(!validPolicyDate(fee.dueDate)||!Number.isFinite(Number(fee.amount))||Number(fee.amount)<0)continue;
   const remaining=outstanding(data,fee);if(remaining<=0||fee.dueDate>=date)continue;
   const id=alertId('fee',fee.id),old=data.studentAlerts.find(a=>a.id===id),reopen=!old||old.state==='resolved';
   const warnedOn=reopen?date:old.warnedOn;
   const earliest=addDays(fee.dueDate,policy.graceDays+1),fromWarning=addDays(validPolicyDate(warnedOn)?warnedOn:date,policy.graceDays);
   let suspendOn=earliest>fromWarning?earliest:fromWarning;
   if(validPolicyDate(enrollment.paymentExemptUntil)&&addDays(enrollment.paymentExemptUntil,1)>suspendOn)suspendOn=addDays(enrollment.paymentExemptUntil,1);
   const dueToSuspend=!exempt&&date>=suspendOn;shouldSuspend ||= dueToSuspend;
   const state=dueToSuspend?'suspended':'warning';relevant.add(id);
   const history=reopen||old?.state!==state?[...(old?.history||[]).slice(-19),{state,at}]:old.history||[];
   upsert('studentAlerts',{...old,id,kind:'payment',audience:'student',studentId:enrollment.studentId,batchId:enrollment.batchId,courseId:enrollment.courseId,feeId:fee.id,month:fee.month,remaining,state,warnedOn:validPolicyDate(warnedOn)?warnedOn:date,suspendOn,createdAt:old?.createdAt||at,teacherHidden:reopen||old?.state!==state?false:!!old.teacherHidden,history});
  }
  const wasSuspended=enrollment.status==='suspended'&&enrollment.autoPaymentSuspended===true;
  if(shouldSuspend&&enrollment.status==='active'){
   Object.assign(enrollment,{status:'suspended',autoPaymentSuspended:true,suspensionReason:'unpaid_fees',suspendedAt:at});
   upsert('enrollments',enrollment);affectedCourses.add(key(enrollment.studentId,enrollment.courseId));
   upsert('audit',{id:alertId('auto-suspend',enrollment.id+'-'+at),action:'automatic_payment_suspension',recordId:enrollment.id,studentId:enrollment.studentId,batchId:enrollment.batchId,actor:'student-access-policy',at});
  }else if(wasSuspended&&!shouldSuspend){
   Object.assign(enrollment,{status:'active',autoPaymentSuspended:false,suspensionReason:'',restoredAt:at});
   upsert('enrollments',enrollment);affectedCourses.add(key(enrollment.studentId,enrollment.courseId));
   upsert('audit',{id:alertId('auto-restore',enrollment.id+'-'+at),action:'automatic_payment_restoration',recordId:enrollment.id,studentId:enrollment.studentId,batchId:enrollment.batchId,actor:'student-access-policy',at});
  }
 }
 if(policy.attendanceEnabled){
  const weeks=completedAttendanceWeeks(now);
  for(const enrollment of nextEnrollments.filter(e=>e.status==='active'&&eligible(e))){
   if(!missedTwoWeeks(data,enrollment,now))continue;
   const id=alertId('absence',enrollment.id+'-'+weeks[1].end),old=data.studentAlerts.find(a=>a.id===id);relevant.add(id);
   upsert('studentAlerts',{...old,id,kind:'absence',audience:'teacher',studentId:enrollment.studentId,batchId:enrollment.batchId,courseId:enrollment.courseId,state:'warning',weeks,createdAt:old?.createdAt||at,teacherHidden:!!old?.teacherHidden});
  }
 }
 // Resolve obsolete notices, including corrected/deleted fee records. Keep their history.
 for(const alert of data.studentAlerts){if(alert.state==='resolved'||relevant.has(alert.id)||(alert.kind==='payment'&&!policy.paymentEnabled)||(alert.kind==='absence'&&!policy.attendanceEnabled))continue;
  if(!['payment','absence'].includes(alert.kind))continue;
  upsert('studentAlerts',{...alert,state:'resolved',resolvedAt:at,history:[...(alert.history||[]).slice(-19),{state:'resolved',at}]});
 }
 for(const id of affectedCourses){
  const changed=nextEnrollments.find(e=>key(e.studentId,e.courseId)===id)!,existing=data.courseAccess.find(a=>a.id===id);
  const active=nextEnrollments.some(e=>e.studentId===changed.studentId&&e.courseId===changed.courseId&&e.status==='active');
  const paymentHold=nextEnrollments.some(e=>e.studentId===changed.studentId&&e.courseId===changed.courseId&&e.autoPaymentSuspended&&e.status==='suspended');
  if(existing?.allModules){
   if(paymentHold&&existing.active)upsert('courseAccess',{...existing,active:false,autoPaymentBlocked:true});
   else if(!paymentHold&&existing.autoPaymentBlocked)upsert('courseAccess',{...existing,active:true,autoPaymentBlocked:false});
  }else if(!active)upsert('courseAccess',{...existing,id,studentId:changed.studentId,courseId:changed.courseId,active:false,autoPaymentBlocked:!!existing?.active||!!existing?.autoPaymentBlocked});
  else if(existing?.autoPaymentBlocked)upsert('courseAccess',{...existing,active:true,autoPaymentBlocked:false});
 }
 return withBatchAccess(data,changes);
}
export function applyPolicyPlan(data:Data,changes:RecordChange[]){const next={...emptyData(),...structuredClone(data)};for(const {table,row} of changes)next[table]=next[table].some(r=>r.id===row.id)?next[table].map(r=>r.id===row.id?row:r):[...next[table],row];return next;}
export function limitedPolicyPlan(changes:RecordChange[],limit=400){
 const groups=new Map<string,RecordChange[]>();for(const c of changes){const id=c.row.studentId;if(!id)throw Error('A policy change is missing its student identity.');groups.set(id,[...(groups.get(id)||[]),c]);}
 const selected:RecordChange[]=[];for(const group of groups.values()){if(group.length>limit)throw Error('One student has too many policy records for a safe update.');if(selected.length+group.length>limit)break;selected.push(...group);}
 return {changes:selected,remaining:changes.length-selected.length};
}
export function policyPatch(data:Data,change:RecordChange){const old=data[change.table].find(r=>r.id===change.row.id);return Object.fromEntries(Object.entries(change.row).filter(([k,v])=>k!=='id'&&!same(old?.[k],v)));}

export function manualEnrollmentChange(row:Row,now=Date.now()):Row{
 const auto=row.autoPaymentSuspended===true;
 return {...row,autoPaymentSuspended:false,suspensionReason:row.status==='suspended'?'teacher':'',...(auto&&row.status==='active'?{paymentExemptUntil:addDays(policyDate(now),7)}:{})};
}
