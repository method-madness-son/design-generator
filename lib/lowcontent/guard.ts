/**
 * Copy guard for low-content manifests. Not a legal opinion.
 * Flags league and series marks, car manufacturers, puzzle-piece imagery,
 * and diagnosis or treatment language. "ADHD" and "autistic" are allowed.
 */

const MEDICAL = [
  'cure',
  'cures',
  'cured',
  'curing',
  'treatment',
  'treatments',
  'diagnose',
  'diagnosis',
  'diagnoses',
  'disorder',
  'disorders',
  'symptom',
  'symptoms',
  'therapy',
  'medication',
  'medications',
  'clinical',
  'patient',
  'patients',
];

const MARKS = [
  'nhl',
  'wrc',
  'fia',
  'nascar',
  'iracing',
  'formula 1',
  'formula one',
  'autism speaks',
  'light it up blue',
  'puzzle piece',
  'puzzle-piece',
  'ford',
  'subaru',
  'toyota',
  'mitsubishi',
  'audi',
  'bmw',
  'hyundai',
  'honda',
  'volkswagen',
  'porsche',
  'skoda',
  'citroen',
  'peugeot',
  'ferrari',
  'lamborghini',
  'mclaren',
  'nissan',
  'mazda',
  'volvo',
  'chevrolet',
  'chevy',
  'dodge',
  'jeep',
  'tesla',
  'mercedes',
  'bruins',
  'blackhawks',
  'canadiens',
  'maple leafs',
  'red wings',
  'golden knights',
  'blue jackets',
];

const WATCH = ['neurospicy'];

function hit(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i').test(text);
}

export function copyGuard(text: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const medical = MEDICAL.filter((term) => hit(text, term));
  const marks = MARKS.filter((term) => hit(text, term));
  const watch = WATCH.filter((term) => hit(text, term));
  if (medical.length > 0) {
    errors.push(`Diagnosis or treatment language (${medical.join(', ')}). Use identity-first copy without medical claims.`);
  }
  if (marks.length > 0) {
    errors.push(`Trademark or banned-symbol hit (${marks.join(', ')}). Keep the book generic.`);
  }
  if (watch.length > 0) {
    warnings.push(`Trademark watch (${watch.join(', ')}). Confirm the class before listing.`);
  }
  return { errors, warnings };
}
