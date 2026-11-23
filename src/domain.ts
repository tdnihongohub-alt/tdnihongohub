import { moduleColours } from './module-colour';
import { validateSchedule } from './assignment-scheduling';
import { z } from 'zod';

export type Row = { id: string; [key: string]: any };
export const tables = ['courses','batches','lessons','lessonNotes','sessions','practiceSeries','students','enrollments','accessRequests','assignments','questions','quizAttempts','levelAttempts','communityLinks','submissions','attendance','feeMonths','paymentClaims','payments','announcements','tasks','teacherNotes','studentLinks','courseAccess','progress','savedCourses','users','settings','audit','contentReads','studentAlerts'] as const;
export type Table = typeof tables[number];
export type Data = Record<Table, Row[]>;
export const emptyData = (): Data => Object.fromEntries(tables.map(k=>[k,[]])) as unknown as Data;
export const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Colombo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const monthNow = () => today().slice(0,7);
export const lkr = (n: number) => `LKR ${Number(n||0).toLocaleString('en-LK',{maximumFractionDigits:2})}`;
export const readable = (d: string) => d ? new Date(`${d.length===7?d+'-01':d}T12:00:00`).toLocaleDateString('en-GB',{day:d.length===7?undefined:'numeric',month:'short',year:'numeric'}) : '—';
export const uid = (prefix='') => prefix+crypto.randomUUID().slice(0,12);
export const key = (...parts: string[]) => parts.join('_');
export function addDays(d:string, n:number) { const value=new Date(d+'T12:00:00Z');value.setUTCDate(value.getUTCDate()+n);return value.toISOString().slice(0,10); }
export function monthsBetween(from:string,to:string) { const result:string[]=[];let current=from.slice(0,7);while(current<=to.slice(0,7)&&result.length<120){result.push(current);const [y,m]=current.split('-').map(Number);current=m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,'0')}`;}return result; }
export function youtubeId(link:string) { try {const u=new URL(link);if(u.hostname==='youtu.be')return /^[\w-]{11}$/.test(u.pathname.slice(1))?u.pathname.slice(1):null;if(!['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname))return null;const id=u.searchParams.get('v')||u.pathname.split('/')[2]||'';return /^[\w-]{11}$/.test(id)?id:null;}catch{return null;} }
export function safeLink(link:string) { try {const u=new URL(link);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';} }
export const courseName=(data:Data,id:string)=>data.courses.find(r=>r.id===id)?.title||'Course';
export const studentName=(data:Data,id:string)=>data.students.find(r=>r.id===id)?.fullName||id;
export const batchName=(data:Data,id:string)=>data.batches.find(r=>r.id===id)?.name||'Batch';
export function feeBalance(fee:Row,payments:Row[]) { const paid=payments.filter(p=>p.studentId===fee.studentId&&p.batchId===fee.batchId&&p.month===fee.month&&p.status!=='void').reduce((s,p)=>s+Number(p.amount),0);return {paid,pending:Math.max(0,Number(fee.amount)-paid),status:paid>=Number(fee.amount)?'Paid':paid>0?'Partially paid':'Pending'}; }
export function percent(records:Row[]) {return records.length?Math.round(records.filter(r=>['Present','Late'].includes(r.status)).length/records.length*100):0;}
const text=z.string().trim().min(1,'This field is required.');
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Choose a date.');
const link=z.string().refine(v=>!v||!!safeLink(v),'Use a full http:// or https:// link.');
const schemas:Partial<Record<Table,z.ZodTypeAny>>={
 courses:z.object({title:text,category:text,description:text,access:z.enum(['free','paid']),monthlyFee:z.coerce.number().min(0),published:z.boolean(),active:z.boolean(),examDate:z.union([date,z.literal('')]).optional(),examQuote:z.string().trim().max(280).optional()}),
 batches:z.object({name:text,courseId:text,capacity:z.coerce.number().int().min(1),monthlyFee:z.coerce.number().min(0),startDate:date,endDate:z.string(),active:z.boolean(),colour:z.enum(moduleColours).optional()}),
 lessons:z.object({title:text,courseId:text,module:text,notes:z.string(),recordingUrl:link,resourceUrl:link,published:z.boolean(),visibility:z.enum(['public','members'])}),
 sessions:z.object({batchId:text,courseId:text,lessonId:z.string(),date,time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),duration:z.coerce.number().int().min(15).max(600),zoomUrl:link,status:z.enum(['scheduled','cancelled'])}),
 students:z.object({fullName:text,phone:text,email:z.union([z.literal(''),z.string().email()]),registeredOn:date,active:z.boolean()}),
 payments:z.object({studentId:text,batchId:text,month:z.string().regex(/^\d{4}-\d{2}$/),amount:z.coerce.number().finite().positive(),paidOn:date,method:z.enum(['Cash','Bank Transfer','Other']),reference:z.string().default('')}),
 feeMonths:z.object({studentId:text,batchId:text,month:z.string().regex(/^\d{4}-\d{2}$/),amount:z.coerce.number().finite().min(0),dueDate:date}),
 assignments:z.object({title:text,courseId:text,lessonId:z.string(),instructions:text,dueDate:date,worksheetUrl:link,published:z.boolean(),maxMark:z.coerce.number().min(1)}),
 questions:z.object({courseId:text,topic:text,prompt:text,options:z.array(text).length(4),correct:z.coerce.number().int().min(0).max(3),explanation:z.string(),published:z.boolean()}),
 levelAttempts:z.object({uid:text,quizId:z.enum(['AL-B01','AL-I01','AL-H01','N5-B01','N5-I01','N5-H01','N4-B01','N4-I01','N4-H01']),edition:z.literal('2026-11'),score:z.number().int().min(0).max(3),total:z.literal(3),completedAt:z.string().datetime()}),
 quizAttempts:z.object({uid:text,courseId:text,topic:z.string().max(200),score:z.number().int().min(0),total:z.number().int().min(1).max(500),completedAt:z.string().datetime()}).refine(r=>r.score<=r.total,'Score cannot exceed total questions.'),
 communityLinks:z.object({name:text,url:link,batchId:z.string(),active:z.boolean(),visibility:z.enum(['public','students']).default('students')}),
 tasks:z.object({title:text,dueDate:date,batchId:z.string(),lessonId:z.string(),done:z.boolean()}),
 announcements:z.object({title:text,body:text,batchId:text,courseId:text}),
 paymentClaims:z.object({amount:z.coerce.number().positive(),month:z.string().regex(/^\d{4}-\d{2}$/),paidOn:date,reference:text,receiptUrl:link,batchId:text}),
 submissions:z.object({answer:z.string().max(20000),fileUrl:link,status:z.enum(['draft','submitted','returned','reviewed'])}),
};
export function validate(table:Table,row:Record<string,any>) { const result=schemas[table]?.safeParse(row);if(result&&!result.success)throw Error(result.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('\n'));if(table==='assignments'&&('releaseAt' in row||'deadlineAt' in row))validateSchedule(row as Row);if(row.endDate&&row.startDate&&row.endDate<row.startDate)throw Error('End date must be after start date.');return {...row,...(result?.success?result.data:{})}; }
export function recurringSessions(base:Row,until:string) {if(until<base.date)throw Error('Repeat end date must follow the first session.');const dates:Row[]=[];for(let d=base.date;d<=until;d=addDays(d,7)){if(dates.length>=104)throw Error('Limit a recurring series to two years.');dates.push({...base,id:uid('SES-'),date:d});}return dates;}
export function csv(rows:Record<string,any>[]) {if(!rows.length)return '';const columns=[...new Set(rows.flatMap(Object.keys))];const cell=(x:any)=>{let s=String(x??'');if(/^[=+@\-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};return '\uFEFF'+[columns.map(cell).join(','),...rows.map(r=>columns.map(c=>cell(typeof r[c]==='object'?JSON.stringify(r[c]):r[c])).join(','))].join('\r\n');}
