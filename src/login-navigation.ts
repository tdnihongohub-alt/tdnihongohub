export function loginUrl(destination: string) {
  return `/login?next=${encodeURIComponent(destination)}`;
}

export function loginDestination(search: string, teacher: boolean) {
  const fallback = teacher ? '/teacher' : '/student';
  const next = new URLSearchParams(search).get('next');
  if (!next || /[\\\x00-\x20]/.test(next)) return fallback;
  if (!/^\/(student|teacher|courses)(\/|\?|#|$)/.test(next)) return fallback;
  if (!teacher && /^\/teacher(\/|\?|#|$)/.test(next)) return fallback;
  return next;
}
