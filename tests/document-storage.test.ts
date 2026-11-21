import { beforeEach,describe,it,expect,vi } from 'vitest';
const mock=vi.hoisted(()=>({write:vi.fn(),upload:vi.fn(),cancel:vi.fn(),current:{uid:'student'}}));
vi.mock('../src/firebase',()=>({firebaseApp:{},auth:{currentUser:mock.current},db:{},storageBucket:'test.firebasestorage.app'}));
vi.mock('@firebase/firestore',()=>({doc:(_db:unknown,table:string,id:string)=>({path:table+'/'+id}),setDoc:mock.write,serverTimestamp:()=> 'server-time'}));
vi.mock('@firebase/storage',()=>({getStorage:()=>({}),ref:(_storage:unknown,path:string)=>path,uploadBytesResumable:mock.upload}));
import { uploadDocument } from '../src/document-storage';
describe('authenticated document upload',()=>{
 beforeEach(()=>{vi.clearAllMocks();mock.write.mockResolvedValue(undefined);mock.upload.mockReturnValue({cancel:mock.cancel,on:(_event:string,progress:Function,_error:Function,complete:Function)=>{progress({bytesTransferred:5,totalBytes:10});complete();}});});
 it('obtains permission before uploading and returns a private URL with progress and cancellation',async()=>{
  const progress=vi.fn(),cancel=vi.fn();const file={name:'homework.PDF',size:10,type:'application/pdf'} as File;
  const url=await uploadDocument(file,{kind:'submission',assignmentId:'assignment'},progress,cancel);
  expect(mock.write).toHaveBeenCalledOnce();expect(mock.write.mock.calls[0][1]).toMatchObject({uid:'student',kind:'submission',owner:'student',recordId:'assignment',operation:'write',issuedAt:'server-time'});
  expect(mock.upload.mock.calls[0][2]).toMatchObject({contentType:'application/pdf',cacheControl:'private,max-age=0'});
  expect(progress).toHaveBeenCalledWith(50);cancel.mock.calls[0][0]();expect(mock.cancel).toHaveBeenCalledOnce();
  expect(url).toContain('/v0/b/test.firebasestorage.app/o/submissions%2Fassignment%2Fstudent%2F');expect(url).not.toContain('token=');
 });
 it('does not upload anything when assignment permission is denied',async()=>{
  mock.write.mockRejectedValue(Error('Permission denied'));
  await expect(uploadDocument({name:'work.pdf',type:'application/pdf',size:10} as File,{kind:'submission',assignmentId:'other'},()=>{},()=>{})).rejects.toThrow('Permission denied');
  expect(mock.upload).not.toHaveBeenCalled();
 });
});
