import { ALL_IDS, COUNTRY_NAMES, type CountryId } from '$lib/data/countries';

export function isCountryId(id: string): id is CountryId {
  return ALL_IDS.has(id);
}

export function revealCountry(
  revealed: Set<CountryId>,
  cid: CountryId,
):
  | { revealed: Set<CountryId>; message: string; changed: true }
  | { message: string; changed: false } {
  if (!isCountryId(cid)) {
    return { message: 'Unknown country', changed: false };
  }

  if (revealed.has(cid)) {
    return {
      message: `${COUNTRY_NAMES[cid]} already revealed`,
      changed: false,
    };
  }

  return {
    revealed: new Set([...revealed, cid]),
    message: `Revealed ${COUNTRY_NAMES[cid]}`,
    changed: true,
  };
}

export function randomUnrevealedCountry(revealed: Set<CountryId>) {
  const unrevealed = Array.from(ALL_IDS).filter((id) => !revealed.has(id));
  if (unrevealed.length === 0) return null;
  return unrevealed[Math.floor(Math.random() * unrevealed.length)];
}
