import { firebaseApp,auth,db,storageBucket } from './firebase';
import { doc,setDoc,serverTimestamp } from '@firebase/firestore';
import { documentPath,maxDocumentBytes,storageFilePath,storageFileUrl,validateDocument } from './document-files';
import type { UploadScope } from './document-files';
export { storageBucket };
async function grantDocumentAccess(path:string,operation:'read'|'write'){
 if(!auth?.currentUser||!db){if(operation==='read')return;throw Error('Sign in before uploading.');}
 const [folder,recordId,owner,name]=path.split('/');const kind=folder==='lessonFiles'?'lesson':folder==='worksheets'?'worksheet':folder==='submissions'?'submission':'';
 if(!kind||!name)throw Error('Invalid document path.');
 await setDoc(doc(db,'fileGrants',`${auth.currentUser.uid}_${name}`),{uid:auth.currentUser.uid,path,kind,recordId,owner,name,operation,issuedAt:serverTimestamp()});
}
export async function uploadDocument(file:File,scope:UploadScope,onProgress:(n:number)=>void,onCancel:(cancel:()=>void)=>void){
 if(!firebaseApp||!auth?.currentUser)throw Error('Sign in before uploading a document.');
 const contentType=validateDocument(file),path=documentPath(scope,auth.currentUser.uid,file.name,crypto.randomUUID());
 await grantDocumentAccess(path,'write');
 const {getStorage,ref,uploadBytesResumable}=await import('@firebase/storage');
 const task=uploadBytesResumable(ref(getStorage(firebaseApp,`gs://${storageBucket}`),path),file,{contentType,cacheControl:'private,max-age=0'});
 onCancel(()=>task.cancel());
 await new Promise<void>((resolve,reject)=>task.on('state_changed',snapshot=>onProgress(Math.round(snapshot.bytesTransferred/snapshot.totalBytes*100)),reject,()=>resolve()));
 return storageFileUrl(storageBucket,path);
}
export async function openStoredDocument(url:string){
 const path=storageFilePath(url,storageBucket);if(!path||!firebaseApp)throw Error('The document could not be opened.');
 await grantDocumentAccess(path,'read');
 const {getStorage,ref,getBlob}=await import('@firebase/storage');
 const blob=await getBlob(ref(getStorage(firebaseApp,`gs://${storageBucket}`),path),maxDocumentBytes),objectUrl=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=objectUrl;a.download=path.split('/').pop()?.replace(/^[a-f0-9-]{36}-/,'')||'document';a.click();setTimeout(()=>URL.revokeObjectURL(objectUrl),60000);
}
export function uploadError(error:unknown){const code=(error as {code?:string})?.code;if(code==='storage/canceled')return 'Upload cancelled.';if(code==='storage/unauthorized')return 'You do not have permission to upload here. Check your class access, or ask your teacher.';if(['storage/bucket-not-found','storage/project-not-found','storage/unknown'].includes(code||''))return 'File storage is not available yet. Please contact your teacher or use a document link.';return (error as Error)?.message||'Upload failed. Please try again.';}
