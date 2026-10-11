// Benin numbers: 10 digits since the 2024 renumbering (01XXXXXXXX), 8 digits
// before. Accounts created with a password store the number as typed, so the
// same line can exist as "+2290157866959" or "0157866959".

/** International form (+229…) of a Benin number, or null if not one. */
export function normaliserTelephoneBenin(saisie: string): string | null {
  const brut = saisie.replace(/[\s.-]/g, '');
  const national = brut.replace(/^(\+|00)229/, '');
  if (!/^\d+$/.test(national)) {
    return null;
  }
  if (national.length === 10 && national.startsWith('01')) {
    return `+229${national}`;
  }
  if (national.length === 8) {
    return `+229${national}`;
  }
  return null;
}

/** Spellings under which an existing account may store this number. */
export function variantesTelephone(normalise: string): string[] {
  const national = normalise.replace(/^\+229/, '');
  return [normalise, national, `00229${national}`];
}
