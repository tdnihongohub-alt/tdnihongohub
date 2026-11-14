import { useEffect, useState } from 'react';

export type StudentTheme = 'light' | 'dark';
const preferenceKey = (scope:'student'|'teacher') => `td-nihongo-${scope}-theme`;

export function initialStudentTheme(scope:'student'|'teacher'='student'): StudentTheme {
 try {
  const saved = localStorage.getItem(preferenceKey(scope));
  if (saved === 'light' || saved === 'dark') return saved;
 } catch { /* Private browsing may disable storage. */ }
 return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useStudentTheme(scope:'student'|'teacher'='student') {
 const [theme, setTheme] = useState<StudentTheme>(()=>initialStudentTheme(scope));
 useEffect(()=>setTheme(initialStudentTheme(scope)),[scope]);
 function toggleTheme() {
  const next = theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  try { localStorage.setItem(preferenceKey(scope), next); } catch { /* The toggle still works without persistence. */ }
 }
 return { theme, toggleTheme };
}
