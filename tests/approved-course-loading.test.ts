import { describe, expect, it, vi } from 'vitest';

const fixture=vi.hoisted(()=>({
 rows:{
  users:[{id:'account',registrationCompleted:true}],
  studentLinks:[{id:'account',studentId:'student'}],
  students:[{id:'student',active:true}],
  courses:[{id:'theory',title:'2027 AL Squad (Theory)',published:false,active:true,access:'paid'}],
  batches:[{id:'grammar',courseId:'theory',active:true}],
  courseAccess:[{id:'student_theory',studentId:'student',courseId:'theory',active:true,allModules:true}],
  sessions:[{id:'class',batchId:'grammar'}],
 } as Record<string,Record<string,unknown>[]>,
 query:vi.fn(),
}));
vi.mock('../src/firebase',()=>({db:{},publicDb:{}}));
vi.mock('@firebase/firestore',()=>({
 doc:(_db:unknown,table:string,id:string)=>({table,id}),
 getDoc:async({table,id}:{table:string;id:string})=>{
  const row=fixture.rows[table]?.find(r=>r.id===id);
  return {id,exists:()=>!!row,data:()=>row};
 },
 collection:(_db:unknown,table:string)=>table,
 query:(table:string,...filters:unknown[])=>({table,filters}),
 where:(field:string,op:string,value:unknown)=>({field,op,value}),
 getDocs:fixture.query,
}));
vi.mock('@firebase/firestore/lite',async()=>({
 collection:(_db:unknown,table:string)=>table,
 query:(table:string,...filters:unknown[])=>({table,filters}),
 where:(field:string,op:string,value:unknown)=>({field,op,value}),
 getDocs:fixture.query,
}));

import { loadData } from '../src/repository';
import { teachingModules } from '../src/weekly-learning';

describe('approved course loading',()=>{
 it('keeps a private approved course and its active module visible if another workspace query fails',async()=>{
  fixture.query.mockImplementation(async({table,filters})=>{
   if(table==='assignments')throw Error('Quota exceeded');
   const rows=(fixture.rows[table]||[]).filter(row=>filters.every((filter:{field:string;op:string;value:unknown})=>row[filter.field]===filter.value));
   return {docs:rows.map(row=>({id:row.id,data:()=>row}))};
  });
  const access=vi.fn(),incomplete=vi.fn();
  const data=await loadData({uid:'account',email:'student@example.test',displayName:'Student',verified:true,teacher:false},access,incomplete);
  expect(access).toHaveBeenCalledOnce();
  expect(teachingModules(access.mock.calls[0][0],'student','account')).toMatchObject([{courseId:'theory',batchId:'grammar'}]);
  expect(teachingModules(data,'student','account')).toMatchObject([{courseId:'theory',batchId:'grammar'}]);
  expect(data.sessions).toMatchObject([{id:'class'}]);
  expect(incomplete).toHaveBeenCalledOnce();
 });
});

