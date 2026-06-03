import { COUNTRIES, type CountryId } from '$lib/data/countries';

export function nextTarget(exclude: Set<CountryId>) {
  const remaining = COUNTRIES.filter((country) => !exclude.has(country.id));
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)].id;
}
