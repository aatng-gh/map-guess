import { describe, expect, it } from 'vitest';

import {
  COUNTRIES,
  COUNTRY_LABEL_ANCHORS,
  type CountryData,
  type CountryLabelAnchor,
} from './countries';
import { validateCountryData } from './countryValidation';

const validCountry: CountryData = {
  id: 'aa',
  name: 'Example',
  paths: [{ d: 'M0,0L1,1z' }],
};

const validAnchors: Record<string, CountryLabelAnchor> = {
  aa: { x: 0.5, y: 0.5, area: 1, width: 1, height: 1 },
};

describe('country data validation', () => {
  it('accepts the checked-in country dataset', () => {
    expect(validateCountryData(COUNTRIES, COUNTRY_LABEL_ANCHORS)).toEqual([]);
  });

  it('reports duplicate ids', () => {
    const issues = validateCountryData([validCountry, { ...validCountry }], validAnchors);

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'duplicate-id',
        countryId: 'aa',
      })
    );
  });

  it('reports missing country names and paths', () => {
    const issues = validateCountryData(
      [{ id: 'bb', name: ' ', paths: [{ d: ' ' }] }],
      { bb: { x: 1, y: 1, area: 1, width: 1, height: 1 } }
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'missing-name', countryId: 'bb' }),
        expect.objectContaining({ code: 'missing-paths', countryId: 'bb' }),
      ])
    );
  });

  it('reports missing label anchors', () => {
    const issues = validateCountryData([validCountry], {});

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'missing-label-anchor',
        countryId: 'aa',
      })
    );
  });

  it('reports invalid label anchors', () => {
    const issues = validateCountryData([validCountry], {
      aa: { x: Number.NaN, y: 1, area: 0, width: 0, height: 0 },
    });

    expect(issues).toContainEqual(
      expect.objectContaining({
        code: 'invalid-label-anchor',
        countryId: 'aa',
      })
    );
  });
});
