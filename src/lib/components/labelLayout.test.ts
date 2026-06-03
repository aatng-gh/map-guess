import { describe, expect, it } from 'vitest';

import { COUNTRIES, COUNTRY_LABEL_ANCHORS } from '$lib/data/countries';
import { layoutCountryLabels } from '$lib/components/labelLayout';

function candidateFor(id: string) {
  const country = COUNTRIES.find((item) => item.id === id);
  if (!country) throw new Error(`Missing fixture country ${id}`);

  return {
    ...country,
    label: COUNTRY_LABEL_ANCHORS[country.id],
  };
}

describe('label layout', () => {
  it('returns a visible label for every country at default scale', () => {
    const candidates = COUNTRIES.map((country) => ({
      ...country,
      label: COUNTRY_LABEL_ANCHORS[country.id],
    }));
    const labels = layoutCountryLabels(candidates, 0.9611042813713213);

    expect(labels).toHaveLength(COUNTRIES.length);
    expect(new Set(labels.map((label) => label.id)).size).toBe(COUNTRIES.length);
  });

  it('keeps neighboring Chad and Niger labels visible at default scale', () => {
    const labels = layoutCountryLabels(
      [candidateFor('td'), candidateFor('ne')],
      0.9611042813713213,
    );

    expect(labels.map((label) => label.name)).toEqual(
      expect.arrayContaining(['Chad', 'Niger']),
    );
    expect(labels.find((label) => label.name === 'Chad')?.fontSize).toBeLessThan(
      10,
    );
  });
});
