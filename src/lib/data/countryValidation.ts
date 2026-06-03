import type { CountryData, CountryId, CountryLabelAnchor } from './countries';

export interface CountryValidationIssue {
  code:
    | 'duplicate-id'
    | 'missing-id'
    | 'missing-name'
    | 'missing-paths'
    | 'missing-label-anchor'
    | 'invalid-label-anchor';
  countryId?: CountryId;
  message: string;
}

function hasValidAnchor(anchor: CountryLabelAnchor | undefined): anchor is CountryLabelAnchor {
  return (
    anchor !== undefined &&
    Number.isFinite(anchor.x) &&
    Number.isFinite(anchor.y) &&
    Number.isFinite(anchor.area) &&
    Number.isFinite(anchor.width) &&
    Number.isFinite(anchor.height) &&
    anchor.area > 0 &&
    anchor.width > 0 &&
    anchor.height > 0
  );
}

export function validateCountryData(
  countries: readonly CountryData[],
  labelAnchors: Readonly<Record<CountryId, CountryLabelAnchor>>
): CountryValidationIssue[] {
  const issues: CountryValidationIssue[] = [];
  const seenIds = new Set<CountryId>();

  for (const country of countries) {
    const id = country.id.trim();

    if (!id) {
      issues.push({
        code: 'missing-id',
        message: 'Country record is missing a stable id.',
      });
      continue;
    }

    if (seenIds.has(id)) {
      issues.push({
        code: 'duplicate-id',
        countryId: id,
        message: `Country id "${id}" is duplicated.`,
      });
    }
    seenIds.add(id);

    if (!country.name.trim()) {
      issues.push({
        code: 'missing-name',
        countryId: id,
        message: `Country "${id}" is missing a display name.`,
      });
    }

    if (country.paths.length === 0 || country.paths.some(path => !path.d.trim())) {
      issues.push({
        code: 'missing-paths',
        countryId: id,
        message: `Country "${id}" is missing SVG path data.`,
      });
    }

    if (!(id in labelAnchors)) {
      issues.push({
        code: 'missing-label-anchor',
        countryId: id,
        message: `Country "${id}" is missing a label anchor.`,
      });
      continue;
    }

    if (!hasValidAnchor(labelAnchors[id])) {
      issues.push({
        code: 'invalid-label-anchor',
        countryId: id,
        message: `Country "${id}" has an invalid label anchor.`,
      });
    }
  }

  return issues;
}
