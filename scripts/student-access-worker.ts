import { emptyData } from '../src/domain';
import { completedAttendanceWeeks,limitedPolicyPlan,policyPatch,policySourceTables,studentPolicyPlan } from '../src/student-access-policy';
import type { Data,Row,Table } from '../src/domain';

type Value={stringValue?:string;integerValue?:string;doubleValue?:number;booleanValue?:boolean;nullValue?:null;timestampValue?:string;arrayValue?:{values?:Value[]};mapValue?:{fields?:Record<string,Value>}};
type Document={name:string;fields?:Record<string,Value>;updateTime:string};
export function decode(v:Value):any{if('stringValue'in v)return v.stringValue;if('integerValue'in v)return Number(v.integerValue);if('doubleValue'in v)return v.doubleValue;if('booleanValue'in v)return v.booleanValue;if('timestampValue'in v)return v.timestampValue;if(v.arrayValue)return (v.arrayValue.values||[]).map(decode);if(v.mapValue)return Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,v])=>[k,decode(v)]));return null;}
export function encode(v:any):Value{if(v===null)return {nullValue:null};if(typeof v==='string')return {stringValue:v};if(typeof v==='boolean')return {booleanValue:v};if(typeof v==='number'&&Number.isFinite(v))return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};if(Array.isArray(v))return {arrayValue:{values:v.map(encode)}};if(v&&typeof v==='object')return {mapValue:{fields:fields(v)}};throw Error('Unsupported policy field value.');}
const fields=(row:Record<string,any>)=>Object.fromEntries(Object.entries(row).filter(([,v])=>v!==undefined).map(([k,v])=>[k,encode(v)]));
const row=(document:Document):Row=>({...Object.fromEntries(Object.entries(document.fields||{}).map(([k,v])=>[k,decode(v)])),id:document.name.split('/').pop()!});
export function policyWrite(base:string,data:Data,change:{table:Table;row:Row},documents:Map<string,Document>){
 const name=base+'/'+change.table+'/'+change.row.id,current=documents.get(name),patch=policyPatch(data,change);
 if(!['enrollments','courseAccess','studentLinks','studentAlerts','audit'].includes(change.table))throw Error('The checker cannot modify teaching or financial records.');
 if(change.table==='audit')patch.actor='background-student-access-policy';
 return {update:{name,fields:fields(patch)},...(current?{updateMask:{fieldPaths:Object.keys(patch)},currentDocument:{updateTime:current.updateTime}}:{currentDocument:{exists:false}})};
}
export async function runWorker({projectId,token,apply=false,now=Date.now(),fetcher=fetch}:{projectId:string;token:string;apply?:boolean;now?:number;fetcher?:typeof fetch}){
 if(projectId!=='td-nihongo-hub')throw Error('Unexpected Firebase project.');if(!token)throw Error('A short-lived Google access token is required.');
 const resourceBase=`projects/${projectId}/databases/(default)/documents`,base=`https://firestore.googleapis.com/v1/${resourceBase}`;
 async function api(url:string,body?:unknown,allow404=false):Promise<any>{const res=await fetcher(url,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});if(res.status===404&&allow404)return null;const result=await res.json();if(!res.ok)throw Object.assign(Error(`Firestore ${res.status}: ${result.error?.message||result[0]?.error?.message||'Request failed'}`),{status:res.status});return result;}
 let applied=0;
 for(let part=0;part<10;part++){
  let committed=false;
  for(let attempt=0;attempt<3&&!committed;attempt++){
   const documents=new Map<string,Document>(),data=emptyData();
   const revision:Document|null=await api(base+'/settings/learningRevision',undefined,true);
   const policyDocument:Document|null=await api(base+'/settings/studentAccessPolicy',undefined,true);
   if(!policyDocument||!row(policyDocument).enabled)return {enabled:false,applied:0,remaining:0};
   data.settings=[row(policyDocument)];documents.set(policyDocument.name,policyDocument);
   for(const table of policySourceTables.filter(t=>t!=='settings')){
    const query:any={from:[{collectionId:table}],limit:5001};
    if(table==='sessions'||table==='attendance')query.where={fieldFilter:{field:{fieldPath:'date'},op:'GREATER_THAN_OR_EQUAL',value:{stringValue:completedAttendanceWeeks(now)[0].start}}};
    const result=await api(base+':runQuery',{structuredQuery:query}),rows=result.filter((r:any)=>r.document).map((r:any)=>r.document as Document);
    if(rows.length>5000)throw Error(`Too many ${table} records for a safe check. No changes in this part were saved.`);
    data[table]=rows.map(row);rows.forEach((d:Document)=>documents.set(d.name,d));
   }
   const plan=limitedPolicyPlan(studentPolicyPlan(data,now));
   if(!apply)return {enabled:true,preview:true,proposed:plan.changes.length,remaining:plan.remaining};
   const writes=plan.changes.map(c=>policyWrite(resourceBase,data,c,documents));
   const at=new Date(now).toISOString();writes.push({update:{name:resourceBase+'/settings/accessAutomationHealth',fields:fields({lastBackgroundRunAt:at,changes:plan.changes.length,remaining:plan.remaining})},updateMask:{fieldPaths:['lastBackgroundRunAt','changes','remaining']}} as any);
   // Every payment, fee, attendance and access change also writes this shared barrier.
   writes.push({update:{name:resourceBase+'/settings/learningRevision',fields:fields({updatedAt:now,revision:`policy-${now}-${part}`,source:'student-access-policy'})},currentDocument:revision?{updateTime:revision.updateTime}:{exists:false}} as any);
   // This check prevents a settings change during the read phase from applying an old policy.
   writes.push({update:{name:policyDocument.name,fields:policyDocument.fields},currentDocument:{updateTime:policyDocument.updateTime}} as any);
   try{await api(base+':commit',{writes});committed=true;applied+=plan.changes.length;if(!plan.remaining)return {enabled:true,applied,remaining:0};}
   catch(e){if(attempt<2&&[409,412].includes((e as any).status))continue;throw e;}
  }
 }
 return {enabled:true,applied,remaining:'Another check is needed to finish the remaining students.'};
}
