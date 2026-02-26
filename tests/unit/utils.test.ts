import { describe, expect, it } from 'vitest';
import { formatPrice, generateSlug, calculateDiscount } from '@/lib/utils';

describe('utils', () => {
  it('generates stable slug', () => {
    expect(generateSlug('Miroir LED Salle de Bain')).toBe('miroir-led-salle-de-bain');
  });

  it('calculates discount', () => {
    expect(calculateDiscount(100, 75)).toBe(25);
  });

  it('formats XOF price', () => {
    const result = formatPrice(2500, 'XOF');
    expect(result).toMatch(/2\s?500/);
  });
});
