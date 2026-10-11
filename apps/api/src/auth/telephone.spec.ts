import { normaliserTelephoneBenin, variantesTelephone } from './telephone';

describe('normaliserTelephoneBenin', () => {
  it('normalises the 10-digit format, with or without prefix', () => {
    expect(normaliserTelephoneBenin('0157866959')).toBe('+2290157866959');
    expect(normaliserTelephoneBenin('01 57 86 69 59')).toBe('+2290157866959');
    expect(normaliserTelephoneBenin('+229 01 57 86 69 59')).toBe(
      '+2290157866959',
    );
    expect(normaliserTelephoneBenin('002290157866959')).toBe('+2290157866959');
  });

  it('keeps accepting the former 8-digit format (seeded accounts)', () => {
    expect(normaliserTelephoneBenin('+22900000001')).toBe('+22900000001');
    expect(normaliserTelephoneBenin('97123456')).toBe('+22997123456');
  });

  it('rejects anything else', () => {
    expect(normaliserTelephoneBenin('12345')).toBeNull();
    expect(normaliserTelephoneBenin('0257866959')).toBeNull();
    expect(normaliserTelephoneBenin('+33612345678')).toBeNull();
    expect(normaliserTelephoneBenin('01abc66959')).toBeNull();
  });
});

describe('variantesTelephone', () => {
  it('lists the spellings an existing account may use', () => {
    expect(variantesTelephone('+2290157866959')).toEqual([
      '+2290157866959',
      '0157866959',
      '002290157866959',
    ]);
  });
});
