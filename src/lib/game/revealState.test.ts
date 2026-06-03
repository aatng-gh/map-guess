import { describe, expect, it } from 'vitest';

import { COUNTRIES } from '$lib/data/countries';
import {
  isCountryId,
  randomUnrevealedCountry,
  revealCountry,
} from '$lib/game/revealState';

const firstCountry = COUNTRIES[0];

describe('reveal state helpers', () => {
  it('validates country ids against the checked-in dataset', () => {
    expect(isCountryId(firstCountry.id)).toBe(true);
    expect(isCountryId('not-a-country')).toBe(false);
  });

  it('reveals a country without mutating the original set', () => {
    const revealed = new Set<typeof firstCountry.id>();
    const result = revealCountry(revealed, firstCountry.id);

    expect(result.changed).toBe(true);
    expect(result.message).toBe(`Revealed ${firstCountry.name}`);
    expect(revealed.size).toBe(0);
    if (result.changed) {
      expect(result.revealed.has(firstCountry.id)).toBe(true);
    }
  });

  it('does not reveal the same country twice', () => {
    const result = revealCountry(new Set([firstCountry.id]), firstCountry.id);

    expect(result).toEqual({
      changed: false,
      message: `${firstCountry.name} already revealed`,
    });
  });

  it('returns null when no random country remains', () => {
    expect(
      randomUnrevealedCountry(new Set(COUNTRIES.map((country) => country.id))),
    ).toBeNull();
  });
});
