import bank from './monthly-quiz-bank.json';
import type { Row } from './domain';
export const monthlyBank = bank;
export type MonthlyQuizData = typeof bank.quizzes[number];
export function markMonthly(quiz: MonthlyQuizData, answers: Record<string, number>) {
 if (!quiz.questions.every(q => Number.isInteger(answers[q.id]) && answers[q.id] >= 0 && answers[q.id] < 4)) throw Error('Answer all three questions first.');
 return quiz.questions.filter(q => answers[q.id] === q.correctIndex).length;
}
export function monthlyProgress(attempts: Row[], uid: string) {
 const own = attempts.filter(a => uid && a.uid === uid && a.edition === bank.edition && a.total === 3 && Number.isInteger(a.score) && a.score >= 0 && a.score <= 3 && bank.quizzes.some(q => q.id === a.quizId));
 const best: Record<string, number> = {};
 for (const a of own) best[a.quizId] = Math.max(best[a.quizId] ?? 0, a.score);
 return {best, points: Object.values(best).reduce((sum, n) => sum + n, 0), completed: Object.keys(best).length, history: own.sort((a,b) => String(b.completedAt).localeCompare(String(a.completedAt)))};
}
