import { describe, expect, it } from 'vitest';
import { loginDestination, loginUrl } from '../src/login-navigation';

describe('sign-in handoff', () => {
  it('preserves a course request, nested quiz, query and anchor through login', () => {
    for (const destination of ['/courses/n5?join=1', '/student/check-level/N4-B01', '/student/marks?view=practice#history']) {
      const url = loginUrl(destination);
      expect(loginDestination(url.slice(url.indexOf('?')), false)).toBe(destination);
    }
  });
  it('keeps default workspaces and teacher permission boundaries', () => {
    expect(loginDestination('', false)).toBe('/student');
    expect(loginDestination('', true)).toBe('/teacher');
    expect(loginDestination('?next=%2Fteacher%2Fpayments', false)).toBe('/student');
    expect(loginDestination('?next=%2Fteacher%2Fpayments', true)).toBe('/teacher/payments');
  });
  it('rejects external destinations and login loops', () => {
    for (const destination of ['https://example.com', '//example.com', '/student\\evil', '/login', '/student\n/evil']) {
      expect(loginDestination(`?next=${encodeURIComponent(destination)}`, false)).toBe('/student');
    }
  });
});
