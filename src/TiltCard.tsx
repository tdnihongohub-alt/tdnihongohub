import { useRef } from 'react';
import type { PointerEvent, ReactNode } from 'react';

export function TiltCard({children,className=''}:{children:ReactNode;className?:string}){
 const card=useRef<HTMLElement>(null);
 function move(event:PointerEvent<HTMLElement>){
  if(event.pointerType!=='mouse'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const box=event.currentTarget.getBoundingClientRect();
  const x=((event.clientX-box.left)/box.width-.5)*2;
  const y=((event.clientY-box.top)/box.height-.5)*2;
  card.current?.style.setProperty('--card-rx',`${-y*2}deg`);
  card.current?.style.setProperty('--card-ry',`${x*2.5}deg`);
 }
 function reset(){card.current?.style.setProperty('--card-rx','0deg');card.current?.style.setProperty('--card-ry','0deg');}
 return <article className={`${className} tilt-card`} ref={card} onPointerMove={move} onPointerLeave={reset}>{children}</article>;
}
