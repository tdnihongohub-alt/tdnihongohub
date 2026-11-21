import React from 'react';
import { describe,it,expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { documentPath,storageFilePath,storageFileUrl,validateDocument,maxDocumentBytes } from '../src/document-files';
import { DocumentField } from '../src/DocumentField';
import { emptyData } from '../src/domain';
import { AppContext } from '../src/store';
describe('drag and drop documents',()=>{
 it('accepts supported documents and checks empty, oversized and mismatched files',()=>{
  expect(validateDocument({name:'worksheet.PDF',type:'application/pdf',size:100})).toBe('application/pdf');
  expect(validateDocument({name:'work.docx',type:'',size:100})).toContain('wordprocessingml');
  for(const file of [{name:'bad.html',type:'text/html',size:20},{name:'empty.pdf',type:'application/pdf',size:0},{name:'huge.pdf',type:'application/pdf',size:maxDocumentBytes+1},{name:'fake.pdf',type:'text/html',size:100}])expect(()=>validateDocument(file)).toThrow();
 });
 it('uses unique paths tied to the source record and avoids permanent public download tokens',()=>{
  const path=documentPath({kind:'material',lessonId:'week'},'teacher','Notes.PDF','unique');
  expect(path).toBe('lessonFiles/week/teacher/unique-Notes.pdf');
  const url=storageFileUrl('bucket.firebasestorage.app',path);
  expect(storageFilePath(url,'bucket.firebasestorage.app')).toBe(path);expect(url).not.toContain('token=');
  expect(storageFilePath(url+'?token=public','bucket.firebasestorage.app')).toBe(null);
  expect(storageFilePath(url,'another-bucket')).toBe(null);
  expect(()=>documentPath({kind:'submission',assignmentId:'../other'},'student','work.pdf','id')).toThrow();
 });
 it('keeps links working without pretending uploads are enabled before Storage setup',()=>{
  const data=emptyData();const render=(teacher:boolean)=>renderToStaticMarkup(<AppContext.Provider value={{data,identity:{teacher},demo:false} as any}><DocumentField label="Worksheet" value="https://example.com/old.pdf" onChange={()=>{}} scope={{kind:'worksheet',assignmentId:'a'}}/></AppContext.Provider>);
  expect(render(true)).toContain('Firebase Storage must be enabled');expect(render(false)).not.toContain('Drag &amp; drop');expect(render(false)).toContain('https://example.com/old.pdf');
 });
 it('shows the accessible drop target and chooser only after activation',()=>{
  const data=emptyData();data.settings=[{id:'uploads',enabled:true}];
  const html=renderToStaticMarkup(<AppContext.Provider value={{data,identity:{teacher:true},demo:false} as any}><DocumentField label="Tute" value="" onChange={()=>{}} scope={{kind:'material',lessonId:'lesson'}}/></AppContext.Provider>);
  expect(html).toContain('Drag &amp; drop');expect(html).toContain('Choose file');expect(html).toContain('type="file"');expect(html).toContain('10 MB');
 });
});
