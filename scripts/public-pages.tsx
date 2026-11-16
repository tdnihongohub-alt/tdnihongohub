import React from 'react';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Plugin } from 'vite';
import { GuideArticle, GuideCards } from '../src/GuideContent';
import { learningGuides } from '../src/learning-guides';
import { pageMetadata, publicPages, siteOrigin } from '../src/search-metadata';

function escape(value:string){return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
export function publicPagesPlugin():Plugin{
 let outDir='';
 return {name:'public-learning-pages',apply:'build',configResolved(config){outDir=resolve(config.root,config.build.outDir);},closeBundle(){
  const template=readFileSync(resolve(outDir,'index.html'),'utf8');
  const paths=[...Object.keys(publicPages),'/login'];
  for(const path of paths){
   const page=pageMetadata(path);
   let html=template.replace(/<title>.*?<\/title>/,`<title>${escape(page.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/,`<meta name="description" content="${escape(page.description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/,`<meta property="og:title" content="${escape(page.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/,`<meta property="og:description" content="${escape(page.description)}" />`)
    .replace('</head>',`<link rel="canonical" href="${escape(page.canonical)}" /><meta property="og:url" content="${escape(page.canonical)}" /><meta name="robots" content="${page.index?'index,follow':'noindex,follow'}" /></head>`);
   const guide=learningGuides.find(g=>`/learn/${g.slug}`===path);
   if(guide||path==='/learn'){
    const content=renderToStaticMarkup(<><header className="public-header"><div className="container"><a href="/">TD Nihongo HUB</a><nav aria-label="Main navigation"><a href="/learn">Learning guides</a> · <a href="/free-lessons">Free lessons</a> · <a href="/contact">Contact</a></nav></div></header><main className="container section public-restyle guides-page">{guide?<GuideArticle guide={guide}/>:<><h1>Japanese learning guides</h1><p>Explanations, examples and practice for your next learning step.</p><GuideCards/></>}</main><footer className="public-footer"><div className="container"><a href="/about">About</a> · <a href="/privacy">Privacy Policy</a> · <a href="/contact">Contact</a></div></footer></>);
    html=html.replace('<div id="root"></div>',`<div id="root">${content}</div>`).replace('<noscript>Please enable JavaScript to use TD Nihongo HUB.</noscript>','');
   }
   const folder=path==='/'?outDir:resolve(outDir,path.slice(1));mkdirSync(folder,{recursive:true});writeFileSync(resolve(folder,'index.html'),html);
  }
  writeFileSync(resolve(outDir,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`);
  writeFileSync(resolve(outDir,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(publicPages).map(path=>`<url><loc>${siteOrigin}${path}</loc></url>`).join('')}</urlset>\n`);
 }};
}
