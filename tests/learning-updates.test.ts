import { beforeEach,describe,expect,it,vi } from 'vitest';
const mock=vi.hoisted(()=>({set:vi.fn(),commit:vi.fn().mockResolvedValue(undefined),setDoc:vi.fn().mockResolvedValue(undefined),listener:vi.fn(),stop:vi.fn()}));
vi.mock('../src/firebase',()=>({db:{},publicDb:null}));
vi.mock('@firebase/firestore',()=>({doc:(_db:unknown,table:string,id:string)=>({path:`${table}/${id}`}),writeBatch:()=>({set:mock.set,commit:mock.commit}),setDoc:mock.setDoc,onSnapshot:mock.listener,collection:vi.fn(),getDoc:vi.fn(),getDocs:vi.fn(),query:vi.fn(),where:vi.fn(),deleteDoc:vi.fn(),runTransaction:vi.fn()}));
import { batchSave, save, subscribeLearningUpdates, subscribeCommunityStats, subscribeAppearance } from '../src/repository';
describe('live learning updates',()=>{
 beforeEach(()=>{vi.clearAllMocks();mock.listener.mockReturnValue(mock.stop);});
 it('streams the saved seasonal appearance and cleans up without changing teaching records',async()=>{
  const update=vi.fn(),error=vi.fn();const stop=subscribeAppearance(update,error);
  expect(mock.listener.mock.calls[0][0]).toEqual({path:'settings/appearance'});
  mock.listener.mock.calls[0][1]({exists:()=>true,id:'appearance',data:()=>({season:'winter'})});
  expect(update).toHaveBeenLastCalledWith({id:'appearance',season:'winter'});
  mock.listener.mock.calls[0][1]({exists:()=>false});expect(update).toHaveBeenLastCalledWith(null);
  stop();expect(mock.stop).toHaveBeenCalledOnce();
  await save('settings',{id:'appearance',season:'general',generalTheme:'original-pink-white-v1'});
  expect(mock.setDoc).toHaveBeenCalledWith({path:'settings/appearance'},{season:'general',generalTheme:'original-pink-white-v1'});
  expect(mock.commit).not.toHaveBeenCalled();
 });
 it('commits a recording and its quiz with one update signal in the same batch',async()=>{
  await batchSave([{table:'lessons',row:{id:'l',title:'Recording'}},{table:'assignments',row:{id:'q',title:'Quiz'}}]);
  expect(mock.set.mock.calls.map(c=>c[0].path)).toEqual(['lessons/l','assignments/q','settings/learningRevision']);
  expect(mock.commit).toHaveBeenCalledTimes(1);
  expect(mock.set.mock.calls[2][1]).toMatchObject({revision:expect.any(String),updatedAt:expect.any(Number)});
 });
 it('signals publishing edits while keeping student drafts out of the global update feed',async()=>{
  await save('lessons',{id:'l',published:true});expect(mock.commit).toHaveBeenCalledOnce();
  mock.set.mockClear();await save('submissions',{id:'s_l',status:'draft'});expect(mock.setDoc).toHaveBeenCalledOnce();expect(mock.set).not.toHaveBeenCalled();
 });
 it('delivers updates and returns a cleanup function for sign-out',()=>{
  const update=vi.fn(),error=vi.fn();const stop=subscribeLearningUpdates(update,error);
  expect(mock.listener.mock.calls[0][0]).toEqual({path:'settings/learningRevision'});
  mock.listener.mock.calls[0][1]();expect(update).toHaveBeenCalledOnce();stop();expect(mock.stop).toHaveBeenCalledOnce();
 });
 it('streams only the public community counts and handles missing records and errors',()=>{
  const update=vi.fn(),error=vi.fn();const stop=subscribeCommunityStats(update,error);
  expect(mock.listener.mock.calls[0][0]).toEqual({path:'settings/communityStats'});
  const receive=mock.listener.mock.calls[0][1];
  receive({exists:()=>true,id:'communityStats',data:()=>({counts:{youtube:1500}})});
  expect(update).toHaveBeenLastCalledWith({id:'communityStats',counts:{youtube:1500}});
  receive({exists:()=>false});expect(update).toHaveBeenLastCalledWith(null);
  const offline=Error('offline');mock.listener.mock.calls[0][2](offline);expect(error).toHaveBeenCalledWith(offline);
  stop();expect(mock.stop).toHaveBeenCalledOnce();
 });
});
