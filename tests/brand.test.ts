import { describe, expect, it } from 'vitest';
import { brandDefaults, logoSource, publicLessons } from '../src/brand';
import { initialData } from '../src/seed';
import { youtubeId } from '../src/domain';
describe('supplied TD Nihongo Hub brand',()=>{
 it('uses the supplied local logo as the default',()=>{expect(logoSource()).toBe('/brand/td-nihongo-hub-logo.jpg');expect(logoSource('')).toBe(brandDefaults.logoUrl);expect(logoSource('javascript:alert(1)')).toBe(brandDefaults.logoUrl);});
 it('retains the published phone without inventing a WhatsApp contact',()=>{expect(brandDefaults.phoneInternational).toBe('+94703666043');expect(brandDefaults.whatsapp).toBe('');});
 it('provides real public YouTube recordings with valid levels and links',()=>{expect(publicLessons).toHaveLength(6);for(const l of publicLessons){expect(youtubeId(l.recordingUrl)).toBeTruthy();expect(l.visibility).toBe('public');expect(l.published).toBe(true);}expect(new Set(publicLessons.map(l=>l.level))).toEqual(new Set(['N5','N4','A/L','Other']));});
 it('preserves the demo lesson while adding the public library',()=>{expect(initialData(true).lessons[0].id).toBe('LES-DEMO');expect(initialData().lessons).toHaveLength(6);});
});
