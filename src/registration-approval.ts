import { manualEnrollmentChange } from './student-access-policy';
import { withBatchAccess } from './batch-access';
import { key, monthNow, today } from './domain';
import type { Data, Row, Table } from './domain';

export function registrationApproval(data: Data, accountId: string, selectedStudentId: string, batchId: string): {table: Table; row: Row}[] {
  const profile = data.users.find(u => u.id === accountId);
  if (!profile?.registrationCompleted) throw Error('This student has not completed registration.');
  const batch = data.batches.find(b => b.id === batchId && b.active);
  if (!batch) throw Error('Choose an active batch.');
  const link = data.studentLinks.find(l => l.id === accountId);
  const studentId = selectedStudentId === '__new__' ? `STU-${accountId}` : selectedStudentId;
  if (!studentId) throw Error('Choose an existing student or create a new student.');
  if (link && link.studentId !== studentId) throw Error('This account is already linked to another student.');
  if (data.studentLinks.some(l => l.id !== accountId && l.studentId === studentId)) throw Error('This student record is already linked to another account.');
  let student = data.students.find(s => s.id === studentId);
  if (selectedStudentId !== '__new__' && !student) throw Error('The student record could not be found.');
  if (student && (!student.active || student.deleted)) throw Error('This student record is inactive or deleted. Review it before approving access.');
  if (student?.linkedAccountId && student.linkedAccountId !== accountId) throw Error('This student record is already linked to another account.');
  const changes: {table: Table; row: Row}[] = [];
  if (!student) {
    student = {id: studentId, fullName: profile.displayName, phone: profile.phone, email: profile.email || '', age: profile.age,city:profile.city||'',school:profile.school||'',candidateType:profile.candidateType||'', registeredOn: today(), active: true};
  }
  changes.push({table:'students',row:{...student,linkedAccountId:accountId}});
  const enrollmentId = key(studentId, batchId);
  const existing = data.enrollments.find(e => e.id === enrollmentId);
  if (existing?.status !== 'active' && data.enrollments.filter(e => e.batchId === batchId && e.id !== enrollmentId && (e.status === 'active' || e.autoPaymentSuspended)).length >= Number(batch.capacity)) throw Error('This batch is full.');
  changes.push({table:'studentLinks',row:{...link,id:accountId,studentId}});
  changes.push({table:'enrollments',row:manualEnrollmentChange({...existing,id:enrollmentId,studentId,batchId,courseId:batch.courseId,status:'active',...(!existing?{joinedOn:today(),billingStartMonth:monthNow()}: {})})});
  const access = data.courseAccess.find(a => a.id === key(studentId, batch.courseId));
  changes.push({table:'courseAccess',row:{...access,id:key(studentId,batch.courseId),studentId,courseId:batch.courseId,active:true}});
  for (const request of data.accessRequests.filter(r => r.uid === accountId && r.courseId === batch.courseId && r.status === 'pending')) changes.push({table:'accessRequests',row:{...request,studentId,status:'approved'}});
  return withBatchAccess(data,changes);
}

export function studentDeletion(data: Data, studentId: string): {table: Table; row: Row}[] {
  const student = data.students.find(s => s.id === studentId);
  if (!student) throw Error('Student record could not be found.');
  return withBatchAccess(data,[
    {table:'students',row:{...student,active:false,deleted:true}},
    ...data.enrollments.filter(e => e.studentId === studentId).map(e => ({table:'enrollments' as const,row:{...e,status:'suspended',autoPaymentSuspended:false,suspensionReason:'teacher'}})),
    ...data.courseAccess.filter(a => a.studentId === studentId).map(a => ({table:'courseAccess' as const,row:{...a,active:false,autoPaymentBlocked:false}})),
  ]);
}
