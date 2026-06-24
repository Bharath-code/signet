// The web-safe set email clients can actually render (installed on the recipient's
// device — Gmail won't load @font-face). The picker and the brand-font matcher both
// source values here so they can never drift.
export const EMAIL_FONTS = [
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet', value: 'Trebuchet MS, sans-serif' },
  { label: 'Times', value: 'Times New Roman, serif' },
] as const;

export const DEFAULT_EMAIL_FONT = 'Georgia, serif';

// Map an extracted brand font to its closest email-safe family.
// ponytail: name-keyword heuristic. Ceiling: obscure/unknown fonts fall to Arial.
//           Upgrade path: classify by font metrics (x-height, contrast) if match
//           quality ever matters more than "right ballpark".
export function toEmailSafeFont(extracted: string): string {
  const f = extracted.toLowerCase();
  if (/times|garamond|baskerville|caslon/.test(f)) return 'Times New Roman, serif';
  // "sans-serif" contains "serif" — only treat as serif when "sans" is absent.
  const serif =
    /georgia|merriweather|playfair|lora|cormorant|fraunces|slab/.test(f) ||
    (/serif/.test(f) && !/sans/.test(f));
  if (serif) return 'Georgia, serif';
  if (/trebuchet|nunito|quicksand|comfortaa|baloo|fredoka/.test(f)) return 'Trebuchet MS, sans-serif';
  if (/verdana|tahoma|poppins|montserrat|futura|gotham|circular|geometric|century gothic/.test(f))
    return 'Verdana, Geneva, sans-serif';
  return 'Arial, Helvetica, sans-serif';
}
