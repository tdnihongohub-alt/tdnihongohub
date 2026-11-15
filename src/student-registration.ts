import type { Row } from './domain';

export const registrationBatches = ['27/A/L', '28/A/L', 'N5', 'N4', '28/O/L'] as const;
export type RegistrationDetails = { displayName: string; phone: string; age: number; preferredBatch: string };

export function validateRegistration(values: RegistrationDetails): RegistrationDetails {
  const displayName = values.displayName.trim();
  const phone = values.phone.replace(/[\s()-]/g, '');
  if (!displayName || displayName.length > 200) throw Error('Enter your full name.');
  if (!/^\+?[0-9]{9,15}$/.test(phone)) throw Error('Enter a valid phone number, for example 0771234567.');
  if (!Number.isInteger(Number(values.age)) || Number(values.age) < 5 || Number(values.age) > 120) throw Error('Enter your age in years (5–120).');
  if (!registrationBatches.includes(values.preferredBatch as typeof registrationBatches[number])) throw Error('Choose your batch.');
  return { displayName, phone, age: Number(values.age), preferredBatch: values.preferredBatch };
}

export function registrationComplete(profile?: Row) {
  if (!profile?.registrationCompleted) return false;
  try {
    validateRegistration({displayName: profile.displayName, phone: profile.phone, age: profile.age, preferredBatch: profile.preferredBatch});
    return true;
  } catch { return false; }
}
