import { tarifCoursesExpress, tarifQuartier } from './tarification';

describe('tarifQuartier (Repas delivery fee, Colis price)', () => {
  it('is the fee of the neighbourhood', () => {
    expect(tarifQuartier(500)).toBe(500);
    expect(tarifQuartier(1000)).toBe(1000);
  });
});

describe('tarifCoursesExpress', () => {
  it('charges one stop at its neighbourhood fee', () => {
    expect(tarifCoursesExpress([500])).toBe(500);
  });

  it('charges every stop at the dearest neighbourhood fee', () => {
    // Boriyouré (500) + Ourbouga (1 000): 2 stops × 1 000.
    expect(tarifCoursesExpress([500, 1000])).toBe(2000);
    expect(tarifCoursesExpress([500, 500, 500])).toBe(1500);
  });

  it('refuses a course without stops', () => {
    expect(() => tarifCoursesExpress([])).toThrow();
  });
});
