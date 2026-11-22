import { useEffect,useState } from 'react';
import { useApp } from './store';
import { registrationNeedsReview,requestedCourse } from './student-registration';
import { rememberStudentNumber,studentNumber } from './student-number';

export function StudentAccountStatus(){
 const {data,identity}=useApp();
 const [number,setNumber]=useState('');
 const [remembered,setRemembered]=useState(false);
 const uid=identity?.uid||'',email=identity?.email||'';
 useEffect(()=>{
  let current=true;
  if(uid)void studentNumber(uid).then(value=>{if(current){setNumber(value);setRemembered(rememberStudentNumber(value,email));}}).catch(()=>{});
  return()=>{current=false;};
 },[uid,email]);
 if(!identity||identity.teacher)return null;
 const profile=data.users.find(u=>u.id===uid);
 const pending=!!profile&&registrationNeedsReview(data,profile);
 const course=profile&&requestedCourse(profile,data);
 return <div className="notice-bar student-account-status">
  {number&&<span><strong>Student number</strong> <code>{number}</code> · {remembered?'Use it with your password on this browser.':'Use your email to sign in on this browser.'}</span>}
  {pending&&<span role="status"><strong>Awaiting teacher approval{course?' · '+course.title:''}</strong>. Your details have been saved.</span>}
 </div>;
}
