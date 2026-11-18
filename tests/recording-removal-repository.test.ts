import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({records:new Map<string,Record<string,any>>(),set:vi.fn(),update:vi.fn(),remove:vi.fn()}));
vi.mock('../src/firebase',()=>({db:{},publicDb:null}));
vi.mock('@firebase/firestore',()=>({doc:(_db:unknown,table:string,id:string)=>({path:`${table}/${id}`,id}),runTransaction:async(_db:unknown,run:(tx:any)=>Promise<void>)=>run({get:async(ref:any)=>({id:ref.id,exists:()=>mock.records.has(ref.path),data:()=>mock.records.get(ref.path)}),set:mock.set,update:mock.update,delete:mock.remove}),collection:vi.fn(),getDoc:vi.fn(),getDocs:vi.fn(),query:vi.fn(),where:vi.fn(),setDoc:vi.fn(),deleteDoc:vi.fn(),writeBatch:vi.fn(),onSnapshot:vi.fn()}));
import { removeRecording } from '../src/repository';
const first={id:'one',title:'First copy',courseId:'al',batchId:'a',recordingUrl:'https://youtu.be/abcdefghijk',notes:'Keep notes',resourceUrl:'https://example.com/tute.pdf',quizId:'quiz'};
describe('recording removal persistence',()=>{
 beforeEach(()=>{vi.clearAllMocks();mock.records.clear();const {id,...values}=first;mock.records.set('lessons/one',values);mock.records.set('lessons/two',{...values,title:'Other copy'});});
 it('updates only the selected lesson video fields and publishes a live update without deleting any document',async()=>{
  await removeRecording(first,'a','teacher');
  expect(mock.update).toHaveBeenCalledExactlyOnceWith({path:'lessons/one',id:'one'},{recordingUrl:'',thumbnailUrl:'',recordingTitle:'',recordingDescription:'',recordingState:'removed'});
  expect(mock.remove).not.toHaveBeenCalled();
  const audit=mock.set.mock.calls.find(c=>c[0].path.startsWith('audit/'));expect(audit?.[1]).toMatchObject({action:'recording_removed_from_week',recordId:'one',batchId:'a',actor:'teacher',before:first});
  expect(mock.set.mock.calls.some(c=>c[0].path==='settings/learningRevision')).toBe(true);
 });
 it('keeps concurrent note edits intact and preserves other shared-batch removals',async()=>{
  mock.records.set('lessons/one',{...mock.records.get('lessons/one'),batchId:'',notes:'Latest notes',recordingHiddenInBatches:['b']});
  await removeRecording({...first,batchId:''},'a','teacher');expect(mock.update.mock.calls[0][1]).toEqual({recordingHiddenInBatches:['b','a']});expect(mock.update.mock.calls[0][1]).not.toHaveProperty('notes');
 });
 it('rejects a replaced recording or missing lesson without writing anything',async()=>{
  mock.records.set('lessons/one',{...mock.records.get('lessons/one'),recordingUrl:'https://youtu.be/12345678901'});
  await expect(removeRecording(first,'a','teacher')).rejects.toThrow('has changed');expect(mock.update).not.toHaveBeenCalled();expect(mock.set).not.toHaveBeenCalled();
  mock.records.clear();await expect(removeRecording(first,'a','teacher')).rejects.toThrow('could not be found');
 });
});
