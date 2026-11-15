import { useState } from 'react';
import { useApp } from './store';
import { registrationBatches, validateRegistration } from './student-registration';
import { readable } from './domain';
import { Panel, Badge } from './ui';

export function StudentRegistration() {
  const { identity, data, save, notify } = useApp();
  const profile = data.users.find(u => u.id === identity!.uid);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <section className="registration-card panel">
    <div className="pad"><div className="eyebrow">WELCOME TO TD NIHONGO HUB</div><h1>Tell us a little about you.</h1>
      <p>Complete your student details to continue. Your teacher will receive them and confirm your class enrolment.</p>
      <form className="registration-form" onSubmit={async event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setBusy(true); setError('');
        try {
          const details = validateRegistration({displayName: String(form.get('displayName') || ''), phone: String(form.get('phone') || ''), age: Number(form.get('age')), preferredBatch: String(form.get('preferredBatch') || '')});
          await save('users', {id: identity!.uid, email: identity!.email, ...details, registrationCompleted: true, registeredAt: profile?.registeredAt || new Date().toISOString()});
          notify('Your details have been sent to your teacher.');
        } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
      }}>
        <label>Full name<input name="displayName" autoComplete="name" required maxLength={200} defaultValue={profile?.displayName || identity!.displayName}/></label>
        <label>Phone number<input name="phone" type="tel" autoComplete="tel" required maxLength={40} defaultValue={profile?.phone || ''} placeholder="0771234567"/></label>
        <label>Age<input name="age" type="number" required min={5} max={120} step={1} defaultValue={profile?.age || ''}/></label>
        <label>Batch<select name="preferredBatch" required defaultValue={profile?.preferredBatch || ''}><option value="" disabled>Choose your batch</option>{registrationBatches.map(b => <option key={b}>{b}</option>)}</select></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="button primary" disabled={busy}>{busy ? 'Saving your details…' : 'Complete registration'}</button>
      </form>
    </div>
  </section>;
}

export function StudentRegistrations() {
  const { data } = useApp();
  const profiles = data.users.filter(p => p.registrationCompleted === true).sort((a,b) => String(b.registeredAt).localeCompare(String(a.registeredAt)));
  if (!profiles.length) return null;
  return <Panel className="section-gap" title="Student registrations" description="Details submitted by students. Confirm their identity, then link their account to a student record and assign a batch.">
    <div className="table-wrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Age</th><th>Requested batch</th><th>Received</th><th>Account</th></tr></thead>
      <tbody>{profiles.map(p => <tr key={p.id}><td><strong>{p.displayName}</strong></td><td><a href={`tel:${p.phone}`}>{p.phone}</a></td><td>{p.age}</td><td>{p.preferredBatch}</td><td>{readable(String(p.registeredAt).slice(0,10))}</td><td><Badge tone={data.studentLinks.some(l => l.id === p.id) ? 'green' : 'amber'}>{data.studentLinks.some(l => l.id === p.id) ? 'Linked' : 'Needs linking'}</Badge></td></tr>)}</tbody>
    </table></div>
  </Panel>;
}

