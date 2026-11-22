import { StudentAccountStatus } from './StudentAccountStatus';
import { StudentDetailsFields } from './StudentDetailsFields';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from './store';
import { registrationCourses, registrationNeedsReview, requestedCourse, validateRegistration } from './student-registration';
import { readable } from './domain';
import { Panel, Badge, Modal, Form } from './ui';
import type { Row } from './domain';

export function StudentRegistration() {
  const { identity, data, save, notify } = useApp();
  const profile = data.users.find(u => u.id === identity!.uid);
  const batches = registrationCourses(data.courses);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <section className="registration-card panel">
    <div className="pad"><h1>Your profile</h1>
      <StudentAccountStatus/><p>Save your details when you’re ready to request a course. Your teacher will review your request.</p>
      <form className="registration-form" onSubmit={async event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setBusy(true); setError('');
        try {
          const selected = batches.find(b => b.id === form.get('preferredCourseId'));
          if (!selected) throw Error('Choose a current course.');
          const details = validateRegistration({displayName: String(form.get('displayName') || ''), phone: String(form.get('phone') || ''), age: Number(form.get('age')), preferredCourseId: selected.id,city:String(form.get('city')||''),candidateType:String(form.get('candidateType')||''),school:String(form.get('school')||'')});
          await save('users', {id: identity!.uid, email: identity!.email, ...details, registrationCompleted: true, registeredAt: profile?.registeredAt || new Date().toISOString()});
          notify('Your details have been sent to your teacher.');
        } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
      }}>
        <label>Full name<input name="displayName" autoComplete="name" required maxLength={200} defaultValue={profile?.displayName || identity!.displayName}/></label>
        <label>Phone number<input name="phone" type="tel" autoComplete="tel" required maxLength={40} defaultValue={profile?.phone || ''} placeholder="0771234567"/></label>
        <label>Age<input name="age" type="number" required min={5} max={120} step={1} defaultValue={profile?.age || ''}/></label>
        <StudentDetailsFields profile={profile}/>
        <label>Course<select name="preferredCourseId" required defaultValue={profile ? requestedCourse(profile,data)?.id || '' : ''}><option value="" disabled>Choose your course</option>{batches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}</select></label>
        {!batches.length && <p>No courses are currently open. Please contact your teacher.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="button primary" disabled={busy || !batches.length}>{busy ? 'Saving your details…' : 'Save profile'}</button>
      </form>
    </div>
  </section>;
}

export function StudentRegistrations() {
  const { data, acceptRegistration, notify } = useApp();
  const [selected,setSelected] = useState<Row|null>(null);
  const profiles = data.users.filter(p => registrationNeedsReview(data,p)).sort((a,b) => String(b.registeredAt).localeCompare(String(a.registeredAt)));
  const pendingRequests=data.accessRequests.filter(r=>r.status==='pending').length;
  const requestsLink=pendingRequests ? <Link className="button small" to="/teacher/classes?view=requests">Review class access requests ({pendingRequests})</Link> : null;
  if (!profiles.length) return requestsLink ? <Panel className="section-gap" title="Pending students"><div className="pad">{requestsLink}</div></Panel> : null;
  const link = selected && data.studentLinks.find(l => l.id === selected.id);
  const suggested = selected && requestedCourse(selected,data);
  const matchingStudents=selected?.email?data.students.filter(s=>s.active&&!s.deleted&&s.email?.trim().toLowerCase()===selected.email.trim().toLowerCase()&&!data.studentLinks.some(l=>l.studentId===s.id&&l.id!==selected.id)):[];
  const defaultStudent=link?.studentId||(matchingStudents.length===1?matchingStudents[0].id:matchingStudents.length?'':'__new__');
  return <><Panel className="section-gap" title="Student registrations" description="Only registrations awaiting review appear here. Accepted students move to your student list below." action={requestsLink}>
    <div className="table-wrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Age</th><th>City / school</th><th>Requested course</th><th>Received</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>{profiles.map(p => {
        const target=requestedCourse(p,data);
        return <tr key={p.id}><td><strong>{p.displayName}</strong><small>{p.email}</small></td><td><a href={`tel:${p.phone}`}>{p.phone}</a></td><td>{p.age}</td><td>{p.city||'—'}<small>{p.candidateType==='private'?'Private candidate':p.school||'School not supplied'}</small></td><td>{target?.title || p.preferredBatch}</td><td>{readable(String(p.registeredAt).slice(0,10))}</td><td><Badge tone="amber">Pending</Badge></td><td><button className="button small" onClick={()=>setSelected(p)}>Review & accept</button></td></tr>;
      })}</tbody>
    </table></div>
  </Panel>{selected&&<Modal title="Accept student registration" onClose={()=>setSelected(null)}>
    <div className="pad"><h3>{selected.displayName}</h3><p>{selected.phone} · Age {selected.age}<br/>{selected.city} · {selected.candidateType==='private'?'Private candidate':selected.school}<br/>Requested course · {suggested?.title || selected.preferredBatch}</p><p>Match an existing record to keep its attendance and payment history connected, or create a new student.</p></div>
    <Form key={selected.id} fields={[
      {name:'studentId',label:'Student record',type:'select',required:true,options:link?[{value:link.studentId,label:data.students.find(s=>s.id===link.studentId)?.fullName || link.studentId}]:[{value:'',label:'Choose a student record'},{value:'__new__',label:'Create a new student from these details'},...data.students.filter(s=>s.active&&!s.deleted&&!data.studentLinks.some(l=>l.studentId===s.id&&l.id!==selected.id)).map(s=>({value:s.id,label:`${s.fullName} · ${s.phone} · ${s.id}`}))]},
      {name:'batchId',label:'Accept into course',type:'select',required:true,options:[{value:'',label:'Choose an active course'},...data.courses.filter(c=>c.active!==false).map(b=>({value:b.id,label:b.title}))]},
    ]} initial={{studentId:defaultStudent,batchId:suggested&&suggested.active!==false?suggested.id:''}} onCancel={()=>setSelected(null)} submit="Accept student" onSave={async values=>{
      await acceptRegistration(selected.id,values.studentId,values.batchId);
      setSelected(null);notify('Student accepted. All active modules in this course are available.');
    }}/>
  </Modal>}</>;
}

