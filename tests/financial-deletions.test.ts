import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({record:null as Record<string,any>|null,set:vi.fn(),remove:vi.fn()}));
vi.mock('../src/firebase',()=>({db:{},publicDb:null}));
vi.mock('@firebase/firestore',()=>({
 doc:(_db:unknown,table:string,id:string)=>({path:`${table}/${id}`}),
 runTransaction:async(_db:unknown,run:(tx:any)=>Promise<void>)=>run({get:async()=>({exists:()=>!!mock.record,data:()=>mock.record}),set:mock.set,delete:mock.remove}),
 collection:vi.fn(),getDoc:vi.fn(),getDocs:vi.fn(),query:vi.fn(),where:vi.fn(),setDoc:vi.fn(),deleteDoc:vi.fn(),writeBatch:vi.fn(),onSnapshot:vi.fn()
}));
import { remove } from '../src/repository';
describe('financial record deletion',()=>{
 beforeEach(()=>{vi.clearAllMocks();mock.record={studentId:'deleted-student',batchId:'b',month:'2026-11',amount:5000};});
 it('deletes a selected fee with an audit copy while leaving received payments untouched',async()=>{
  await remove('feeMonths','fee');expect(mock.remove).toHaveBeenCalledExactlyOnceWith({path:'feeMonths/fee'});
  expect(mock.set).toHaveBeenCalledWith(expect.objectContaining({path:expect.stringMatching(/^audit\//)}),expect.objectContaining({action:'monthly_fee_deleted',recordId:'fee',before:mock.record}));
 });
 it('keeps the existing audited received-payment deletion available',async()=>{
  await remove('payments','payment');expect(mock.remove).toHaveBeenCalledExactlyOnceWith({path:'payments/payment'});expect(mock.set.mock.calls[0][1].action).toBe('payment_deleted');
 });
 it('rejects repeat deletion without creating an extra audit entry',async()=>{
  mock.record=null;await expect(remove('feeMonths','fee')).rejects.toThrow('already been deleted');expect(mock.remove).not.toHaveBeenCalled();expect(mock.set).not.toHaveBeenCalled();
 });
});
