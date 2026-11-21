import { beforeEach,describe,it,expect,vi } from 'vitest';
const mock=vi.hoisted(()=>({set:vi.fn(),get:vi.fn(),queries:vi.fn(),transaction:vi.fn(),fail:false,rows:{students:[{id:'s',active:true}],studentLinks:[{id:'u',studentId:'s',custom:'keep',activeBatchIds:['a','b']}],enrollments:[{id:'s_a',studentId:'s',batchId:'a',status:'active'},{id:'s_b',studentId:'s',batchId:'b',status:'active'}]} as Record<string,any[]>}));
vi.mock('../src/firebase',()=>({db:{},publicDb:null}));
vi.mock('@firebase/firestore',()=>({doc:(_db:unknown,table:string,id:string)=>({path:`${table}/${id}`}),collection:(_db:unknown,table:string)=>({table}),where:(field:string,op:string,value:unknown)=>({field,op,value}),query:(ref:any,...filters:any[])=>({...ref,filters}),getDocs:mock.queries,runTransaction:mock.transaction,writeBatch:vi.fn(),setDoc:vi.fn(),deleteDoc:vi.fn(),onSnapshot:vi.fn(),getDoc:vi.fn()}));
import { batchSave,save } from '../src/repository';
describe('atomic batch access maintenance',()=>{
 beforeEach(()=>{vi.clearAllMocks();mock.fail=false;mock.get.mockImplementation(async(ref:any)=>{const [table,id]=ref.path.split('/');const row=mock.rows[table]?.find(r=>r.id===id);return {id,exists:()=>!!row,data:()=>row};});mock.queries.mockImplementation(async(q:any)=>{if(mock.fail)throw Error('Quota exceeded');const rows=(mock.rows[q.table]||[]).filter(r=>q.filters.every((f:any)=>r[f.field]===f.value));return {docs:rows.map(r=>({id:r.id,data:()=>r}))};});mock.transaction.mockImplementation(async(_db:unknown,work:Function)=>work({get:mock.get,set:mock.set}));});
 it('revokes one batch while retaining another in the same transaction and preserves binding metadata',async()=>{
  await batchSave([{table:'enrollments',row:{...mock.rows.enrollments[0],status:'suspended'}}]);
  expect(mock.transaction).toHaveBeenCalledOnce();expect(mock.get.mock.calls[0][0].path).toBe('settings/learningRevision');
  const writes=Object.fromEntries(mock.set.mock.calls.map(([ref,data])=>[ref.path,data]));
  expect(writes['studentLinks/u']).toMatchObject({studentId:'s',custom:'keep',activeBatchIds:['b']});expect(writes['enrollments/s_a'].status).toBe('suspended');
  expect(Object.keys(writes).sort()).toEqual(['enrollments/s_a','settings/learningRevision','studentLinks/u']);
 });
 it('clears the trusted batch index when a student becomes inactive',async()=>{
  await save('students',{id:'s',active:false});
  expect(mock.set.mock.calls.find(([ref])=>ref.path==='studentLinks/u')?.[1].activeBatchIds).toEqual([]);
 });
 it('makes no partial changes if the source records cannot be read',async()=>{
  mock.fail=true;await expect(batchSave([{table:'enrollments',row:{...mock.rows.enrollments[0],status:'suspended'}}])).rejects.toThrow('Quota exceeded');
  expect(mock.set).not.toHaveBeenCalled();
 });
});
