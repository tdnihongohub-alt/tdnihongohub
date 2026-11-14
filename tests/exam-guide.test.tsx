import React from 'react';
import { expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ExamExplorer, CrossedFlags } from '../src/ExamExplorer';
import { exams, examGoals, jlptLevels } from '../src/exam-guide';

it('contains exactly the five selected exams with official source links',()=>{expect(exams.map(e=>e.name)).toEqual(['JLPT','JFT-Basic','NAT-TEST','JLCT','J.TEST']);for(const e of exams){expect(new URL(e.source).protocol).toBe('https:');expect(e.benefits).toHaveLength(3);expect(e.consider).toBeTruthy();}});
it('offers results for every goal and keeps the JLPT path in beginner-to-advanced order',()=>{for(const g of examGoals){expect(exams.filter(e=>g.id==='all'||e.goals.includes(g.id)).length).toBeGreaterThan(0);}expect(jlptLevels.map(l=>l.id)).toEqual(['N5','N4','N3','N2','N1']);});
it('renders usable default exam and level controls plus both real flag assets',()=>{const html=renderToString(<MemoryRouter><ExamExplorer/></MemoryRouter>);expect(html).toContain('Explore exams by learning goal');expect(html).toContain('Choose an examination');expect(html).toContain('Explore JLPT levels');expect(html).toContain('Official JLPT level guide');expect(html).toContain('Your first milestone');const flags=renderToString(<CrossedFlags/>);expect(flags).toContain('/flags/jp.svg');expect(flags).toContain('/flags/lk.svg');expect(flags).toContain('Crossed flags of Japan and Sri Lanka');});
