import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GuideArticle } from '../src/GuideContent';
import { learningGuides } from '../src/learning-guides';
import { pageMetadata, publicPages } from '../src/search-metadata';

describe('public learning and search preparation',()=>{
 it('publishes substantive guides with examples, answers and source links',()=>{
  for(const guide of learningGuides){
   const html=renderToStaticMarkup(<GuideArticle guide={guide}/>);
   expect(guide.sections.length).toBeGreaterThanOrEqual(3);
   expect(html).toContain('Check your understanding');
   expect(html).toContain('<details>');
   expect(html).toContain('href="/contact"');
   for(const source of guide.sources)expect(html).toContain(source.url.replaceAll('&','&amp;'));
   for(const question of guide.practice)expect(html).toContain(question.answer);
  }
 });
 it('gives each guide an indexable canonical page and excludes private routes',()=>{
  for(const guide of learningGuides){
   const path=`/learn/${guide.slug}`;
   expect(publicPages[path].title).toBe(guide.title);
   expect(pageMetadata(path)).toMatchObject({canonical:`https://tdnihongohub.com${path}`,index:true});
  }
  for(const path of ['/student','/student/payments','/teacher/students','/login','/missing'])expect(pageMetadata(path).index).toBe(false);
 });
 it('keeps source links and article identifiers unique',()=>{
  expect(new Set(learningGuides.map(g=>g.slug)).size).toBe(learningGuides.length);
  for(const guide of learningGuides)expect(guide.sources.every(s=>s.url.startsWith('https://'))).toBe(true);
 });
});
