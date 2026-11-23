import { parseSriLanka,sriLankaInput } from './assignment-scheduling';
import type { Row } from './domain';

export type NoteMode='draft'|'now'|'scheduled';
export function lessonNote(id:string,body:string,mode:NoteMode,date:string):Row{
 const releaseAt=mode==='scheduled'&&body.trim()?parseSriLanka(date):0;
 if(mode==='scheduled'&&body.trim()&&(!releaseAt||sriLankaInput(releaseAt)!==date))throw Error('Choose a valid note release date and time.');
 if(body.length>20000)throw Error('Lesson notes can contain up to 20,000 characters.');
 return {id,body,published:mode!=='draft'&&!!body.trim(),releaseAt};
}

export function noteVisible(note:Row,now=Date.now()){
 return note.published===true&&note.releaseAt<=now&&!!note.body?.trim();
}
