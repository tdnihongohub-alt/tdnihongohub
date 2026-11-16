import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from './store';
import { pageMetadata, siteOrigin } from './search-metadata';

function meta(attribute:'name'|'property',key:string,content:string){
 let element=document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
 if(!element){element=document.createElement('meta');element.setAttribute(attribute,key);document.head.append(element);}
 element.content=content;
}
export function PageMetadata(){
 const {pathname}=useLocation();const {data}=useApp();
 useEffect(()=>{
  window.scrollTo(0,0);
  const page=pageMetadata(pathname);
  const course=pathname.startsWith('/courses/')?data.courses.find(c=>c.id===pathname.split('/')[2]&&c.published):null;
  if(course){page.title=`${course.title} | TD Nihongo HUB`;page.description=course.description;page.canonical=siteOrigin+pathname;page.index=true;}
  document.title=page.title;
  meta('name','description',page.description);meta('name','robots',page.index?'index,follow':'noindex,follow');
  meta('property','og:title',page.title);meta('property','og:description',page.description);meta('property','og:url',page.canonical);
  meta('property','og:type',pathname.startsWith('/learn/')?'article':'website');
  let canonical=document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical);}
  canonical.href=page.canonical;
 },[pathname,data.courses]);
 return null;
}
