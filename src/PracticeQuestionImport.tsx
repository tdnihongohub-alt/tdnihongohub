import { useState } from 'react';
import { uid } from './domain';
import type { FormQuestion } from './assignment-scheduling';

export function PracticeQuestionImport({multipleChoice,count,onImport}:{multipleChoice:boolean;count:number;onImport:(questions:FormQuestion[])=>void}){
 const [text,setText]=useState(''),[error,setError]=useState('');
 async function readFile(file?:File){
  if(!file)return;
  try{
   if(file.size>100000)throw Error('Choose a text file up to 100 KB.');
   setText(await file.text());setError('');
  }catch(e){setError((e as Error).message);}
 }
 function importQuestions(){
  try{
   const lines=text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
   if(lines.length!==count)throw Error(`Enter ${count} ${count===1?'line':'lines'}, one per question.`);
   const questions=lines.map((line,index):FormQuestion=>{
    if(!multipleChoice)return {id:uid('Q-'),label:line,type:'long',options:[],required:true};
    const [label,...columns]=line.split('|').map(part=>part.trim());
    const options=columns.slice(0,4),correct=Number(columns[4]);
    if(!label||columns.length!==5||options.some(option=>!option)||new Set(options).size!==4||!Number.isInteger(correct)||correct<1||correct>4)throw Error(`Check line ${index+1}. Include four different choices and the correct choice number (1–4).`);
    return {id:uid('Q-'),label,type:'choice',options,correctOption:correct-1,required:true};
   });
   onImport(questions);setError('');setText('');
  }catch(e){setError((e as Error).message);}
 }
 return <details className="section-gap"><summary>Paste questions or import a text file</summary>
  <p className="form-note">{multipleChoice?'One per line: Question | Choice 1 | Choice 2 | Choice 3 | Choice 4 | Correct choice number':'Write one question per line.'}</p>
  <label className="form-field">Question text file<input type="file" accept=".txt,text/plain" onChange={e=>void readFile(e.target.files?.[0])}/></label>
  <label className="form-field">Question text<textarea rows={5} value={text} onChange={e=>setText(e.target.value)}/></label>
  <button type="button" className="button" onClick={importQuestions}>Replace questions with imported text</button>
  {error&&<p className="error" role="alert">{error}</p>}
 </details>;
}
