import type { Row } from './domain';
export function redoDraft(previous:Row,assignment:Row){
 if(!assignment.allowRedo||!['submitted','reviewed'].includes(previous.status))throw Error('This activity is not open for another attempt.');
 return {...previous,status:'draft',answer:'',fileUrl:'',formAnswers:{},timerId:'',timedOut:false,feedback:'',mark:'',history:[...(previous.history||[]),{status:'redo'}]};
}
