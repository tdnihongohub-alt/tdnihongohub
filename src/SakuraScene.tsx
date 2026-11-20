import { useEffect, useRef, useState } from 'react';
import type * as Three from 'three';


type Props={paused:boolean};
export function SakuraScene({paused}:Props){
 const host=useRef<HTMLDivElement>(null);const pausedRef=useRef(paused);const control=useRef<()=>void>(()=>{});const [fallback,setFallback]=useState(false);

 useEffect(()=>{pausedRef.current=paused;control.current();},[paused]);
 useEffect(()=>{
  const target=host.current;if(!target)return;const element:HTMLDivElement=target;
  let stopped=false;let dispose=()=>{};
  void import('three').then(T=>{
   if(stopped)return;
   let renderer:Three.WebGLRenderer;
   try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{setFallback(true);return;}
   renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
   element.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
   const scene=new T.Scene();scene.fog=new T.Fog('#f6f3ec',13,27);
   const camera=new T.PerspectiveCamera(40,1,.1,60);camera.position.set(0,0,13);
   scene.add(new T.HemisphereLight('#fff7e6','#a86e67',2.3));const light=new T.DirectionalLight('#fff7e0',3);light.position.set(-5,6,9);scene.add(light);
   const backlight=new T.DirectionalLight('#f4a29c',1.2);backlight.position.set(5,-2,2);scene.add(backlight);
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');const compact=window.matchMedia('(max-width:800px)').matches;
   let halfHeight=4.7,halfWidth=10;let visible=true;let last=0;let clock=0;let wind=0;let pointerWind=0;
   const petalShape=new T.Shape();petalShape.moveTo(0,-.04);petalShape.bezierCurveTo(.14,.01,.23,.19,.13,.31);petalShape.quadraticCurveTo(.06,.37,.015,.29);petalShape.quadraticCurveTo(-.045,.36,-.12,.31);petalShape.bezierCurveTo(-.24,.16,-.13,.0,0,-.04);
   const petalGeometry=new T.ShapeGeometry(petalShape,9);const positions=petalGeometry.attributes.position;
   for(let i=0;i<positions.count;i++){positions.setZ(i,Math.sin(positions.getY(i)*7)*.055+Math.pow(positions.getX(i),2)*.5);}petalGeometry.computeVertexNormals();
   const petalMaterial=new T.MeshStandardMaterial({color:'#efb4b0',roughness:.73,metalness:0,side:T.DoubleSide,transparent:true,opacity:.9});
   const count=compact?42:105;const falling=new T.InstancedMesh(petalGeometry,petalMaterial,count);falling.frustumCulled=false;scene.add(falling);
   const dummy=new T.Object3D();
   const particles=Array.from({length:count},()=>({x:Math.random()*23-5,y:Math.random()*13-6,z:Math.random()*9-5,phase:Math.random()*Math.PI*2,scale:.25+Math.random()*.8,speed:.3+Math.random()*.7}));
   for(let i=0;i<count;i++)falling.setColorAt(i,new T.Color().setHSL(.96+Math.random()*.035,.37+Math.random()*.25,.73+Math.random()*.15));
   const hero=element.parentElement!;
   function pointer(e:PointerEvent){const bounds=element.getBoundingClientRect();pointerWind=((e.clientX-bounds.left)/bounds.width*2-1)*1.2;}
   function leave(){pointerWind=0;}
   hero.addEventListener('pointermove',pointer);hero.addEventListener('pointerleave',leave);
   function resize(){const w=element.clientWidth,h=element.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();halfHeight=Math.tan(T.MathUtils.degToRad(20))*13;halfWidth=halfHeight*camera.aspect;render(0);}
   function render(time:number){if(stopped)return;const dt=Math.min((time-last)/1000||0,.04);last=time;const moving=!pausedRef.current&&!reduced.matches;if(moving){clock+=dt;wind+=(pointerWind-wind)*.02;}
    particles.forEach((p,i)=>{if(moving){p.x-=(.55+wind*.38)*p.speed*dt;p.y-=p.speed*.28*dt;if(p.x< -halfWidth-2||p.y< -halfHeight-2){p.x=halfWidth+Math.random()*3;p.y=halfHeight+Math.random()*3;}}dummy.position.set(p.x+Math.sin(clock*.7+p.phase)*.35,p.y+Math.cos(clock*.9+p.phase)*.15,p.z);dummy.rotation.set(clock*.8+p.phase,clock*.7+p.phase,clock*.45+p.phase);dummy.scale.setScalar(p.scale);dummy.updateMatrix();falling.setMatrixAt(i,dummy.matrix);});falling.instanceMatrix.needsUpdate=true;

    renderer.render(scene,camera);
   }
   function frame(time:number){if(time-last<30)return;render(time);}
   function schedule(){last=0;if(!document.hidden&&visible&&!pausedRef.current&&!reduced.matches)renderer.setAnimationLoop(frame);else{renderer.setAnimationLoop(null);render(0);}}
   control.current=schedule;
   const observer=new ResizeObserver(resize);observer.observe(element);const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();});intersection.observe(element);
   document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);resize();schedule();
   dispose=()=>{renderer.setAnimationLoop(null);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',schedule);reduced.removeEventListener('change',schedule);hero.removeEventListener('pointermove',pointer);hero.removeEventListener('pointerleave',leave);hero.style.cursor='';const geometries=new Set<Three.BufferGeometry>(),materials=new Set<Three.Material>();scene.traverse(object=>{const mesh=object as Three.Mesh;if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material){for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
  }).catch(()=>{if(!stopped)setFallback(true);});
  return()=>{stopped=true;control.current=()=>{};dispose();};
 },[]);
 return <div ref={host} className={`sakura-3d-scene ${fallback?'scene-fallback':''}`} aria-hidden="true"/>;
}
