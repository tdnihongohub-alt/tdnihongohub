import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe,it,expect } from 'vitest';
import { InteractiveForm, answered } from '../src/InteractiveForm';
import type { FormQuestion } from '../src/assignment-scheduling';
const questions:FormQuestion[]=[{id:'kana',label:'Choose the reading of 山',type:'choice',options:['やま','かわ'],required:true},{id:'sentence',label:'Write a Japanese sentence',type:'long',options:[],required:true}];
describe('in-site interactive activities',()=>{
 it('shows one question as native selectable answers and restores a saved draft',()=>{
  const html=renderToStaticMarkup(<InteractiveForm questions={questions} answers={{kana:'やま'}} onChange={()=>{}} onSubmit={()=>{}} busy={false}/>);
  expect(html).toContain('type="radio"');expect(html).toContain('checked=""');expect(html).toContain('1 / 2 answered');expect(html).toContain('Next question');expect(html).not.toContain('Write a Japanese sentence');expect(html).not.toContain('<iframe');expect(html).not.toContain('<select');expect(html).not.toContain('Submit to teacher');
 });
 it('counts actual answers and handles an activity without questions safely',()=>{
  expect(answered('  ')).toBe(false);expect(answered([])).toBe(false);expect(answered(['Kanji'])).toBe(true);expect(answered('こんにちは')).toBe(true);
  const html=renderToStaticMarkup(<InteractiveForm questions={[]} answers={{}} onChange={()=>{}} onSubmit={()=>{}} busy={false}/>);expect(html).toContain('has not added questions');expect(html).not.toContain('Submit');
 });
});
