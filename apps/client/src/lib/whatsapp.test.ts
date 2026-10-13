import { describe, expect, it } from 'vitest';
import { lienWhatsApp, numeroWhatsApp } from '@delivero/config/whatsapp';

describe('numeroWhatsApp', () => {
  it.each([
    ['+2290157866959', '2290157866959'],
    ['2290157866959', '2290157866959'],
    ['01 57 86 69 59', '2290157866959'],
    ['0157866959', '2290157866959'],
    // Pre-2024 8-digit numbers gained the 01 prefix.
    ['57 86 69 59', '2290157866959'],
  ])('%s → %s', (entree, attendu) => {
    expect(numeroWhatsApp(entree)).toBe(attendu);
  });

  it('rejects numbers it cannot place', () => {
    expect(numeroWhatsApp('12345')).toBeNull();
  });
});

describe('lienWhatsApp', () => {
  it('encodes the prefilled message', () => {
    expect(lienWhatsApp('0157866959', 'Bonjour à vous')).toBe(
      'https://wa.me/2290157866959?text=Bonjour%20%C3%A0%20vous',
    );
  });
});
