import { useEffect, useRef, useState } from 'react';
import type * as Three from 'three';
import type { Row } from './domain';

type Props={courses:Row[];onSelect:(id:string)=>void;paused:boolean};
export function SakuraScene({courses,onSelect,paused}:Props){
 const host=useRef<HTMLDivElement>(null);const pausedRef=useRef(paused);const control=useRef<()=>void>(()=>{});const [fallback,setFallback]=useState(false);
 const signature=courses.map(c=>`${c.id}:${c.category}`).join('|');
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
   const tree=new T.Group();scene.add(tree);const bark=new T.MeshStandardMaterial({color:'#6f4a3b',roughness:1});
   function branch(points:number[][],radius:number){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],p[1],p[2])));const mesh=new T.Mesh(new T.TubeGeometry(curve,20,radius,5,false),bark);tree.add(mesh);}
   branch([[6.7,2.3,-2],[4.2,3.0,-1.8],[1.6,3.2,-.8],[-1.2,3.35,0],[-4.3,3.9,.6]],.095);
   const tips=[[-3.6,3.45,.5],[-2.2,2.45,.3],[-1.0,3.7,-.3],[.2,2.65,.4],[1.2,3.8,-.1],[2.5,2.0,-.5],[3.6,3.4,-.8],[4.9,2.2,-1.3]];
   tips.forEach((tip,i)=>{const root=[tip[0]+1,3.1,-.7];branch([root,[(root[0]+tip[0])/2,tip[1]+.2,tip[2]-.1],tip],i<4?.027:.035);});
   const blossomCount=compact?36:70;const blossomPetals=new T.InstancedMesh(petalGeometry,new T.MeshStandardMaterial({color:'#f7d1c8',side:T.DoubleSide,roughness:.85}),blossomCount*5);blossomPetals.frustumCulled=false;
   const hearts=new T.InstancedMesh(new T.SphereGeometry(.037,5,4),new T.MeshStandardMaterial({color:'#c68b59',roughness:.8}),blossomCount);hearts.frustumCulled=false;tree.add(blossomPetals,hearts);
   for(let b=0;b<blossomCount;b++){const tip=tips[b%tips.length];const x=tip[0]+(Math.random()-.5)*1.0,y=tip[1]+(Math.random()-.5)*.8,z=tip[2]+(Math.random()-.5)*.8;const scale=.47+Math.random()*.43;const group=new T.Object3D();group.position.set(x,y,z);group.rotation.set((Math.random()-.5)*.9,(Math.random()-.5)*.8,Math.random()*6.28);group.updateMatrixWorld();for(let p=0;p<5;p++){dummy.position.set(0,0,0);dummy.rotation.set(0,0,p*Math.PI*2/5);dummy.scale.setScalar(scale);dummy.updateMatrix();const matrix=new T.Matrix4().multiplyMatrices(group.matrixWorld,dummy.matrix);blossomPetals.setMatrixAt(b*5+p,matrix);}dummy.position.set(x,y,z+.015);dummy.rotation.set(0,0,0);dummy.scale.setScalar(scale);dummy.updateMatrix();hearts.setMatrixAt(b,dummy.matrix);}
   const markers:Three.Sprite[]=[];const textures:Three.Texture[]=[];const markerCourses=signature.split('|').filter(Boolean).map(s=>{const [id,category]=s.split(':');return{id,category};});
   for(const [i,c] of markerCourses.entries()){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=180;const ctx=canvas.getContext('2d')!;
    ctx.translate(128,85);ctx.beginPath();ctx.moveTo(-106,22);ctx.bezierCurveTo(-114,-66,-23,-80,9,-65);ctx.bezierCurveTo(61,-85,130,-36,106,13);ctx.bezierCurveTo(75,76,-6,96,-106,22);ctx.fillStyle=['#e9b2ad','#f0d0b4','#ead8cc'][i%3];ctx.fill();ctx.strokeStyle='#ad6d5b88';ctx.lineWidth=2;ctx.stroke();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 55px Georgia';ctx.fillStyle='#7c3029';ctx.fillText(c.category,0,-2);ctx.font='600 14px Arial';ctx.letterSpacing='2px';ctx.fillStyle='#995e4c';ctx.fillText('EXPLORE CLASS',0,39);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;textures.push(texture);const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,opacity:.98,depthTest:false}));sprite.scale.set(compact?1.3:1.65,compact?.92:1.16,1);sprite.userData={courseId:c.id,index:i};sprite.renderOrder=5;scene.add(sprite);markers.push(sprite);
   }
   const raycaster=new T.Raycaster();const ndc=new T.Vector2();const hero=element.parentElement!;
   function pointer(e:PointerEvent){const bounds=element.getBoundingClientRect();ndc.set((e.clientX-bounds.left)/bounds.width*2-1,-((e.clientY-bounds.top)/bounds.height)*2+1);pointerWind=ndc.x*1.2;raycaster.setFromCamera(ndc,camera);const hits=raycaster.intersectObjects(markers.filter(m=>m.visible));element.dataset.overMarker=hits.length?'true':'false';hero.style.cursor=hits.length?'pointer':'';}
   function click(e:PointerEvent){if((e.target as HTMLElement).closest('a,button,input,select'))return;pointer(e);raycaster.setFromCamera(ndc,camera);const hit=raycaster.intersectObjects(markers.filter(m=>m.visible))[0];if(hit)onSelect(hit.object.userData.courseId);}
   function leave(){pointerWind=0;delete element.dataset.overMarker;hero.style.cursor='';}
   hero.addEventListener('pointermove',pointer);hero.addEventListener('pointerup',click);hero.addEventListener('pointerleave',leave);
   function resize(){const w=element.clientWidth,h=element.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();halfHeight=Math.tan(T.MathUtils.degToRad(20))*13;halfWidth=halfHeight*camera.aspect;tree.position.set(halfWidth-6.5,compact?-4.8:0,-.4);render(0);}
   function render(time:number){if(stopped)return;const dt=Math.min((time-last)/1000||0,.04);last=time;const moving=!pausedRef.current&&!reduced.matches;if(moving){clock+=dt;wind+=(pointerWind-wind)*.02;}
    particles.forEach((p,i)=>{if(moving){p.x-=(.55+wind*.38)*p.speed*dt;p.y-=p.speed*.28*dt;if(p.x< -halfWidth-2||p.y< -halfHeight-2){p.x=halfWidth+Math.random()*3;p.y=halfHeight+Math.random()*3;}}dummy.position.set(p.x+Math.sin(clock*.7+p.phase)*.35,p.y+Math.cos(clock*.9+p.phase)*.15,p.z);dummy.rotation.set(clock*.8+p.phase,clock*.7+p.phase,clock*.45+p.phase);dummy.scale.setScalar(p.scale);dummy.updateMatrix();falling.setMatrixAt(i,dummy.matrix);});falling.instanceMatrix.needsUpdate=true;
    tree.rotation.z=moving?Math.sin(clock*.3)*.009:0;
    // Keep class petals in the top margin, clear of the face, hand and feature cards.
    const narrow=element.clientWidth<=800;
    markers.forEach((m,i)=>{m.visible=!narrow;m.position.set(halfWidth*(.26+i*.27),halfHeight*.84+Math.sin(clock*.7+i)*.018,0);const size=halfWidth*.12;m.scale.set(size,size*.70,1);(m.material as Three.SpriteMaterial).rotation=Math.sin(clock*.4+i)*.035;});
    renderer.render(scene,camera);
   }
   function frame(time:number){if(time-last<30)return;render(time);}
   function schedule(){last=0;if(!document.hidden&&visible&&!pausedRef.current&&!reduced.matches)renderer.setAnimationLoop(frame);else{renderer.setAnimationLoop(null);render(0);}}
   control.current=schedule;
   const observer=new ResizeObserver(resize);observer.observe(element);const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();});intersection.observe(element);
   document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);resize();schedule();
   dispose=()=>{renderer.setAnimationLoop(null);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',schedule);reduced.removeEventListener('change',schedule);hero.removeEventListener('pointermove',pointer);hero.removeEventListener('pointerup',click);hero.removeEventListener('pointerleave',leave);hero.style.cursor='';const geometries=new Set<Three.BufferGeometry>(),materials=new Set<Three.Material>();scene.traverse(object=>{const mesh=object as Three.Mesh;if(mesh.geometry)geometries.add(mesh.geometry);if(mesh.material){for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();};
  }).catch(()=>{if(!stopped)setFallback(true);});
  return()=>{stopped=true;control.current=()=>{};dispose();};
 },[signature,onSelect]);
 return <div ref={host} className={`sakura-3d-scene ${fallback?'scene-fallback':''}`} aria-hidden="true"/>;
}
