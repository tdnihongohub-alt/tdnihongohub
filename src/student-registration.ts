import type { Data, Row } from './domain';

export type RegistrationDetails = { displayName: string; phone: string; age: number; preferredBatch: string; preferredBatchId?: string; city?:string; school?:string; candidateType?:string };

export function registrationBatches(batches: Row[]) {
  return batches.filter(b => b.active && b.name).sort((a,b) => a.name.localeCompare(b.name));
}

export function registrationStudent(data:Data,accountId:string){
 const binding=data.studentLinks.find(l=>l.id===accountId);
 return data.students.find(s=>s.id===binding?.studentId)||data.students.find(s=>s.linkedAccountId===accountId||s.id===`STU-${accountId}`);
}

export function registrationNeedsReview(data:Data,profile:Row){
 const student=registrationStudent(data,profile.id);
 // Enrolment history means onboarding has been handled, even if access is later suspended.
 return profile.registrationCompleted===true&&!student?.deleted&&
  (!student||!data.enrollments.some(e=>e.studentId===student.id));
}

export function validateRegistration(values: RegistrationDetails): RegistrationDetails {
  const displayName = values.displayName.trim();
  const phone = values.phone.replace(/[\s()-]/g, '');
  if (!displayName || displayName.length > 200) throw Error('Enter your full name.');
  if (!/^\+?[0-9]{9,15}$/.test(phone)) throw Error('Enter a valid phone number, for example 0771234567.');
  if (!Number.isInteger(Number(values.age)) || Number(values.age) < 5 || Number(values.age) > 120) throw Error('Enter your age in years (5–120).');
  if (!values.preferredBatch?.trim() || values.preferredBatch.length > 200) throw Error('Choose your batch.');
  const demographics=values.city!==undefined||values.candidateType!==undefined;
  const city=values.city?.trim()||'',school=values.school?.trim()||'';
  if(demographics){if(!city||city.length>120)throw Error('Enter your city or town.');if(!['school','private'].includes(values.candidateType||''))throw Error('Choose school student or private candidate.');if(values.candidateType==='school'&&(!school||school.length>200))throw Error('Enter your school name.');}
  return { ...(demographics?{city,candidateType:values.candidateType,school:values.candidateType==='school'?school:''}:{}), displayName, phone, age: Number(values.age), preferredBatch: values.preferredBatch.trim(), ...(values.preferredBatchId ? {preferredBatchId: values.preferredBatchId} : {}) };
}

export function requestedBatch(profile: Row, batches: Row[]) {
  if (profile.preferredBatchId) return batches.find(b => b.id === profile.preferredBatchId);
  const matches = batches.filter(b => b.name === profile.preferredBatch);
  return matches.length === 1 ? matches[0] : undefined;
}

export function registrationComplete(profile?: Row) {
  if (!profile?.registrationCompleted) return false;
  try {
    if(!profile.city||!profile.candidateType)return false;
    validateRegistration({displayName: profile.displayName, phone: profile.phone, age: profile.age, preferredBatch: profile.preferredBatch,city:profile.city,school:profile.school,candidateType:profile.candidateType});
    return true;
  } catch { return false; }
}
