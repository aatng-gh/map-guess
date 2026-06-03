import type { CountryData, CountryLabelAnchor } from '$lib/data/countries';

interface LabelCandidate extends CountryData {
  label: CountryLabelAnchor;
}

interface PlacedLabel extends LabelCandidate {
  fontSize: number;
  labelX: number;
  labelY: number;
  labelBox: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

function getLabelBox(
  country: LabelCandidate,
  fontSize: number,
  scale: number,
  offset = { x: 0, y: 0 },
): PlacedLabel['labelBox'] {
  const width = Math.max(16, country.name.length * fontSize * 0.58);
  const height = fontSize * 1.35;
  const padding = 1.8 / scale;
  const x = country.label.x + offset.x;
  const y = country.label.y + offset.y;

  return {
    left: x - width / 2 - padding,
    right: x + width / 2 + padding,
    top: y - height / 2 - padding,
    bottom: y + height / 2 + padding,
  };
}

function overlaps(
  box: PlacedLabel['labelBox'],
  placed: PlacedLabel[],
  tolerance = 0,
) {
  return placed.some(
    (other) =>
      box.left < other.labelBox.right - tolerance &&
      box.right > other.labelBox.left + tolerance &&
      box.top < other.labelBox.bottom - tolerance &&
      box.bottom > other.labelBox.top + tolerance,
  );
}

export function getMapLabelFontSize(scale: number) {
  return Math.max(1.8, Math.min(10, 11 / scale));
}

export function getMapLabelStrokeWidth(scale: number) {
  return Math.max(0.35, Math.min(1.6, 2.2 / scale));
}

export function layoutCountryLabels(
  countries: LabelCandidate[],
  scale: number,
) {
  const baseFontSize = getMapLabelFontSize(scale);
  const fallbackFontSizes = [
    baseFontSize,
    Math.max(6.2, baseFontSize * 0.78),
    Math.max(4.8, baseFontSize * 0.62),
    Math.max(3.8, baseFontSize * 0.48),
  ];
  const placed: PlacedLabel[] = [];

  countries
    .sort((a, b) => b.label.area - a.label.area)
    .forEach((country, index) => {
      const smallestFontSize = fallbackFontSizes[fallbackFontSizes.length - 1];
      const forcedNudge = smallestFontSize * (1.2 + (index % 5) * 0.45);
      const forcedAngle = index * 2.399963229728653;
      const forcedOffset = {
        x: Math.cos(forcedAngle) * forcedNudge,
        y: Math.sin(forcedAngle) * forcedNudge,
      };

      for (const fontSize of fallbackFontSizes) {
        const nudge = fontSize * 1.45;
        const offsets =
          fontSize === baseFontSize
            ? [{ x: 0, y: 0 }]
            : [
                { x: 0, y: 0 },
                { x: 0, y: -nudge },
                { x: 0, y: nudge },
                { x: -nudge * 1.5, y: 0 },
                { x: nudge * 1.5, y: 0 },
                { x: -nudge, y: -nudge },
                { x: nudge, y: nudge },
              ];

        for (const offset of offsets) {
          const labelBox = getLabelBox(country, fontSize, scale, offset);
          const tolerance = fontSize <= 5 ? 0.8 / scale : 0;

          if (!overlaps(labelBox, placed, tolerance)) {
            placed.push({
              ...country,
              fontSize,
              labelX: country.label.x + offset.x,
              labelY: country.label.y + offset.y,
              labelBox,
            });
            return;
          }
        }
      }

      const labelBox = getLabelBox(
        country,
        smallestFontSize,
        scale,
        forcedOffset,
      );
      placed.push({
        ...country,
        fontSize: smallestFontSize,
        labelX: country.label.x + forcedOffset.x,
        labelY: country.label.y + forcedOffset.y,
        labelBox,
      });
    });

  return placed;
}
