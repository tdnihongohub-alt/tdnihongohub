const loginKey='td-student-number-logins';

export async function studentNumber(uid:string){
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(uid));
 const suffix=Array.from(new Uint8Array(hash).slice(0,8),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
 return 'STU-'+suffix;
}

function rememberedLogins():Record<string,string>{
 try{return JSON.parse(localStorage.getItem(loginKey)||'{}')||{};}catch{return {};}
}

export function rememberStudentNumber(number:string,email:string){
 if(!email)return false;
 try{localStorage.setItem(loginKey,JSON.stringify({...rememberedLogins(),[number]:email}));return true;}catch{return false;}
}

export function loginEmail(input:string){
 const value=input.trim();
 if(value.includes('@'))return value;
 const email=rememberedLogins()[value.toUpperCase()];
 if(typeof email!=='string')throw Error('Sign in with your email once on this browser to use your student number here.');
 return email;
}
