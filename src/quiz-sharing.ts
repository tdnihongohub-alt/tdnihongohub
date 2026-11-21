import { siteOrigin } from './search-metadata';
export type QuizShareTarget={kind:'assignment';id:string}|{kind:'monthly';id:string}|{kind:'practice';courseId:string;topic?:string};
export function quizSharePath(target:QuizShareTarget){
 const id=target.kind==='practice'?target.courseId:target.id;
 if(!id?.trim()||/[\x00-\x1f]/.test(id))throw Error('Save the quiz before sharing its link.');
 if(target.kind==='assignment')return `/student/assignments?assignment=${encodeURIComponent(id)}`;
 if(target.kind==='monthly')return `/student/check-level/${encodeURIComponent(id)}`;
 return `/student/quizzes/${encodeURIComponent(id)}${target.topic?`?topic=${encodeURIComponent(target.topic)}`:''}`;
}
export function quizShareUrl(target:QuizShareTarget){return siteOrigin+quizSharePath(target);}
