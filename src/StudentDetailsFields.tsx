import { useState } from 'react';
import type { Row } from './domain';
export function StudentDetailsFields({profile,onChange}:{profile?:Row;onChange?:(values:Record<string,string>)=>void}){
 const [values,setValues]=useState({city:profile?.city||'',candidateType:profile?.candidateType||'school',school:profile?.school||''});
 function change(key:string,value:string){const next={...values,[key]:value};if(key==='candidateType'&&value==='private')next.school='';setValues(next);onChange?.(next);}
 return <><label>City / town<input name="city" required maxLength={120} autoComplete="address-level2" value={values.city} onChange={e=>change('city',e.target.value)}/></label><label>Candidate type<select name="candidateType" value={values.candidateType} onChange={e=>change('candidateType',e.target.value)}><option value="school">School student</option><option value="private">Private candidate / not attending school</option></select></label>{values.candidateType==='school'&&<label>School name<input name="school" required maxLength={200} value={values.school} onChange={e=>change('school',e.target.value)}/></label>}</>;
}
