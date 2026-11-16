import React from 'react';
import { learningGuides } from './learning-guides';
import type { Guide } from './learning-guides';

export function GuideCards(){return <div className="guide-grid">{learningGuides.map(g=><a className="guide-card" href={`/learn/${g.slug}`} key={g.slug}><span className="eyebrow">{g.topic}</span><h2>{g.title}</h2><p>{g.description}</p><span className="text-link">Read guide →</span></a>)}</div>;}

export function GuideArticle({guide}:{guide:Guide}){
  return <article className="guide-article">
    <header><a className="text-link" href="/learn">← Learning guides</a><p className="eyebrow">{guide.topic}</p><h1>{guide.title}</h1><p className="lead">{guide.description}</p><p className="guide-byline">TD Nihongo HUB · Published 16 November 2026</p></header>
    <nav className="guide-contents" aria-label="In this guide"><strong>In this guide</strong>{guide.sections.map((s,i)=><a key={s.title} href={`#section-${i+1}`}>{s.title}</a>)}<a href="#practice">Check your understanding</a></nav>
    {guide.sections.map((s,i)=><section key={s.title} id={`section-${i+1}`}><h2>{s.title}</h2>{s.paragraphs.map(p=><p key={p}>{p}</p>)}{s.examples&&<div className="guide-examples">{s.examples.map(e=><div key={e.jp}><strong lang="ja">{e.jp}</strong><span>{e.reading}</span><p>{e.meaning}</p></div>)}</div>}</section>)}
    <section id="practice" className="guide-practice"><h2>Check your understanding</h2><p>Try each question before opening the answer.</p>{guide.practice.map(q=><details key={q.prompt}><summary>{q.prompt}</summary><p>{q.answer}</p></details>)}</section>
    <section><h2>Further study</h2><p>These explanations and practice tasks were prepared for this website. Explore the following official resources for additional study.</p><ul>{guide.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a></li>)}</ul><p>For a question or correction, <a href="/contact">contact TD Nihongo HUB</a>.</p></section>
    <section><h2>Continue learning</h2><div className="guide-next">{learningGuides.filter(g=>g.slug!==guide.slug).map(g=><a key={g.slug} href={`/learn/${g.slug}`}>{g.title} →</a>)}</div><a className="button" href="/free-lessons">Watch free lessons</a></section>
  </article>;
}
