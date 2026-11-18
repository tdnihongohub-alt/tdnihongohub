import type { Row } from './domain';

export function isRecordingRemoved(lesson:Row,batchId=''){
 return lesson.recordingState==='removed'&&!lesson.recordingUrl||!!batchId&&(lesson.recordingHiddenInBatches||[]).includes(batchId);
}
export function recordingRemovalUpdates(lesson:Row,batchId=''):Record<string,any>{
 if(lesson.batchId&&batchId&&lesson.batchId!==batchId)throw Error('This recording belongs to a different class.');
 if(isRecordingRemoved(lesson,batchId))throw Error('This recording has already been removed from this week.');
 if(!lesson.batchId&&batchId)return {recordingHiddenInBatches:[...new Set([...(lesson.recordingHiddenInBatches||[]),batchId])]};
 return {recordingUrl:'',thumbnailUrl:'',recordingTitle:'',recordingDescription:'',recordingState:'removed'};
}
export function sameRecordingSource(a:Row,b:Row){
 return ['recordingUrl','thumbnailUrl','recordingTitle','recordingDescription'].every(field=>(a[field]||'')===(b[field]||''));
}
