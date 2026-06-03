import { describe, expect, it } from 'vitest';

import { COUNTRIES, COUNTRY_LABEL_ANCHORS } from '$lib/data/countries';
import { layoutCountryLabels } from '$lib/components/labelLayout';

const DEFAULT_WORLD_SCALE = 0.9611042813713213;
const TEST_SCALES = [0.5, 0.75, DEFAULT_WORLD_SCALE, 1.25, 1.5, 2, 3, 5];

function allCandidates() {
  return COUNTRIES.map((country) => ({
    ...country,
    label: COUNTRY_LABEL_ANCHORS[country.id],
  }));
}

function candidateFor(id: string) {
  const country = COUNTRIES.find((item) => item.id === id);
  if (!country) throw new Error(`Missing fixture country ${id}`);

  return {
    ...country,
    label: COUNTRY_LABEL_ANCHORS[country.id],
  };
}

function labelNamesAt(scale: number) {
  return layoutCountryLabels(allCandidates(), scale).map((label) => label.name);
}

function hasMaterialOverlap(
  a: ReturnType<typeof layoutCountryLabels>[number],
  b: ReturnType<typeof layoutCountryLabels>[number],
  scale: number,
) {
  const overlapX =
    Math.min(a.labelBox.right, b.labelBox.right) -
    Math.max(a.labelBox.left, b.labelBox.left);
  const overlapY =
    Math.min(a.labelBox.bottom, b.labelBox.bottom) -
    Math.max(a.labelBox.top, b.labelBox.top);
  const tolerance = a.fontSize <= 5 || b.fontSize <= 5 ? 0.8 / scale : 0;

  return overlapX > tolerance && overlapY > tolerance;
}

describe('label layout', () => {
  it('keeps the default world view selective instead of forcing every label', () => {
    const labels = layoutCountryLabels(allCandidates(), DEFAULT_WORLD_SCALE);

    expect(labels.length).toBeGreaterThan(0);
    expect(labels.length).toBeLessThan(COUNTRIES.length);
    expect(new Set(labels.map((label) => label.id)).size).toBe(labels.length);
  });

  it('shows smaller country labels after zooming in', () => {
    expect(labelNamesAt(DEFAULT_WORLD_SCALE)).not.toContain('Burkina Faso');
    expect(labelNamesAt(3)).toContain('Burkina Faso');
  });

  it('scales long country names to avoid dominating nearby labels', () => {
    const labels = layoutCountryLabels(allCandidates(), 5);
    const centralAfricanRepublic = labels.find(
      (label) => label.name === 'Central African Republic',
    );
    const drCongo = labels.find((label) => label.name === 'DR Congo');

    expect(centralAfricanRepublic).toBeDefined();
    expect(drCongo).toBeDefined();
    expect(centralAfricanRepublic?.fontSize).toBeLessThan(
      drCongo?.fontSize ?? 0,
    );
    expect((centralAfricanRepublic?.fontSize ?? 0) * 5).toBeLessThanOrEqual(11);
  });

  it('keeps neighboring Chad and Niger labels visible at default scale when they are eligible', () => {
    const labels = layoutCountryLabels(
      [candidateFor('td'), candidateFor('ne')],
      0.9611042813713213,
    );

    expect(labels.map((label) => label.name)).toEqual(
      expect.arrayContaining(['Chad', 'Niger']),
    );
  });

  it('increases label availability as zoom increases', () => {
    const counts = TEST_SCALES.map(
      (scale) => layoutCountryLabels(allCandidates(), scale).length,
    );

    expect(counts).toEqual([...counts].sort((a, b) => a - b));
  });

  it('avoids material label overlaps across representative zoom levels', () => {
    for (const scale of TEST_SCALES) {
      const labels = layoutCountryLabels(allCandidates(), scale);

      for (let i = 0; i < labels.length; i += 1) {
        for (let j = i + 1; j < labels.length; j += 1) {
          expect(
            hasMaterialOverlap(labels[i], labels[j], scale),
            `${labels[i].name} overlaps ${labels[j].name} at scale ${scale}`,
          ).toBe(false);
        }
      }
    }
  });

  it('keeps existing positions stable when revealed labels are filtered from the global layout', () => {
    const globalLabels = layoutCountryLabels(allCandidates(), DEFAULT_WORLD_SCALE);
    const initialRevealed = new Set(['fr', 'de']);
    const laterRevealed = new Set(['fr', 'de', 'td']);
    const initialVisible = globalLabels.filter((label) =>
      initialRevealed.has(label.id),
    );
    const laterVisible = globalLabels.filter((label) =>
      laterRevealed.has(label.id),
    );

    for (const countryId of initialRevealed) {
      const before = initialVisible.find((label) => label.id === countryId);
      const after = laterVisible.find((label) => label.id === countryId);

      expect(after?.labelX).toBe(before?.labelX);
      expect(after?.labelY).toBe(before?.labelY);
      expect(after?.fontSize).toBe(before?.fontSize);
    }
  });
});
