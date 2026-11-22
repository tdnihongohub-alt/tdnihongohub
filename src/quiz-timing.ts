import type { Row } from './domain';
import { assignmentDeadline } from './assignment-scheduling';
export const quizLimit=(a:Row)=>Number(a.timeLimitMinutes)||0;
export const quizTimerId=(studentId:string,a:Row,submission?:Row)=>`${studentId}_${a.id}_${submission?.history?.length||0}`;
export function quizEndsAt(a:Row,timer:Row){const end=Number(timer.startedAtMs)+Number(timer.durationMinutes)*60000;return a.allowLate===false&&assignmentDeadline(a)?Math.min(end,assignmentDeadline(a)):end;}
export function clockLabel(ms:number){const seconds=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
