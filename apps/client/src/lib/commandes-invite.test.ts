import { describe, expect, it } from 'vitest';
import { commandesInviteMemorisees, memoriserCommandeInvite, oublierCommandeInvite } from './commandes-invite';

describe('commandes invité mémorisées', () => {
  it('keeps the latest order first, without duplicates', () => {
    memoriserCommandeInvite('j1', 'repas');
    memoriserCommandeInvite('j2', 'colis');
    memoriserCommandeInvite('j1', 'repas');
    expect(commandesInviteMemorisees().map((c) => c.jeton)).toEqual(['j1', 'j2']);
  });

  it('caps the list at 10 orders', () => {
    for (let i = 0; i < 12; i += 1) memoriserCommandeInvite(`j${i}`, 'courses_express');
    const liste = commandesInviteMemorisees();
    expect(liste).toHaveLength(10);
    expect(liste[0]?.jeton).toBe('j11');
  });

  it('survives corrupted storage and forgets on demand', () => {
    localStorage.setItem('chapexpress-commandes-invite', '{pas du json');
    expect(commandesInviteMemorisees()).toEqual([]);
    memoriserCommandeInvite('j1', 'repas');
    oublierCommandeInvite('j1');
    expect(commandesInviteMemorisees()).toEqual([]);
  });
});
