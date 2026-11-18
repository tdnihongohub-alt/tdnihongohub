import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({sessions:new Map<string,Record<string,any>>(),events:[] as string[],set:vi.fn(),remove:vi.fn()}));
vi.mock('../src/firebase',()=>({db:{},publicDb:null}));
vi.mock('@firebase/firestore',()=>({
 doc:(_db:unknown,table:string,id:string)=>({path:`${table}/${id}`,id}),
 runTransaction:async(_db:unknown,run:(tx:any)=>Promise<void>)=>run({
  get:async(ref:any)=>{mock.events.push('read '+ref.path);const value=mock.sessions.get(ref.id);return {id:ref.id,exists:()=>!!value,data:()=>value};},
  set:(ref:any,value:any)=>{mock.events.push('set '+ref.path);mock.set(ref,value);},
  delete:(ref:any)=>{mock.events.push('delete '+ref.path);mock.remove(ref);}
 }),
 collection:vi.fn(),getDoc:vi.fn(),getDocs:vi.fn(),query:vi.fn(),where:vi.fn(),setDoc:vi.fn(),deleteDoc:vi.fn(),writeBatch:vi.fn(),onSnapshot:vi.fn()
}));
import { changeTimetable } from '../src/repository';
const first={id:'one',batchId:'a',courseId:'al',lessonId:'lesson',date:'2026-11-23',time:'18:00',duration:90,zoomUrl:'',status:'scheduled'};
const second={...first,id:'two',date:'2026-11-24'};
describe('atomic timetable changes',()=>{
 beforeEach(()=>{vi.clearAllMocks();mock.events.length=0;mock.sessions.clear();for(const row of [first,second]){const {id,...values}=row;mock.sessions.set(id,values);}});
 it('reads all selected sessions before deleting and writes audit copies and one live update',async()=>{
  await changeTimetable([{before:first,after:null},{before:second,after:null}],'teacher');
  expect(mock.events.slice(0,2)).toEqual(['read sessions/one','read sessions/two']);
  expect(mock.remove.mock.calls.map(c=>c[0].path)).toEqual(['sessions/one','sessions/two']);
  const audit=mock.set.mock.calls.filter(c=>c[0].path.startsWith('audit/'));
  expect(audit).toHaveLength(2);expect(audit[0][1]).toMatchObject({action:'session_deleted',before:first,after:null,actor:'teacher'});
  expect(mock.set.mock.calls.filter(c=>c[0].path==='settings/learningRevision')).toHaveLength(1);
  expect(mock.events.some(e=>/attendance|payments|lessons/.test(e))).toBe(false);
 });
 it('updates the same session ID and retains its lesson link',async()=>{
  await changeTimetable([{before:first,after:{...first,date:'2026-11-30'}}],'teacher');
  expect(mock.set).toHaveBeenCalledWith({path:'sessions/one',id:'one'},expect.objectContaining({date:'2026-11-30',lessonId:'lesson'}));expect(mock.remove).not.toHaveBeenCalled();
 });
 it('rejects a concurrent edit before writing or deleting any selected session',async()=>{
  mock.sessions.set('two',{...mock.sessions.get('two'),time:'19:00'});
  await expect(changeTimetable([{before:first,after:null},{before:second,after:null}],'teacher')).rejects.toThrow('has changed');
  expect(mock.set).not.toHaveBeenCalled();expect(mock.remove).not.toHaveBeenCalled();
 });
 it('rejects a removed session and invalid selections without partial deletion',async()=>{
  mock.sessions.delete('two');
  await expect(changeTimetable([{before:first,after:null},{before:second,after:null}],'teacher')).rejects.toThrow('has changed');
  expect(mock.remove).not.toHaveBeenCalled();expect(mock.set).not.toHaveBeenCalled();
  await expect(changeTimetable([{before:first,after:null},{before:first,after:null}],'teacher')).rejects.toThrow('once');
 });
});
