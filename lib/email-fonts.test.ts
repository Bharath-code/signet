import { describe, it, expect } from 'vitest';
import { toEmailSafeFont, EMAIL_FONTS } from './email-fonts';

const GEORGIA = 'Georgia, serif';
const ARIAL = 'Arial, Helvetica, sans-serif';
const VERDANA = 'Verdana, Geneva, sans-serif';
const TREBUCHET = 'Trebuchet MS, sans-serif';
const TIMES = 'Times New Roman, serif';

describe('toEmailSafeFont', () => {
  it('maps serif brands to Georgia', () => {
    expect(toEmailSafeFont('Playfair Display, serif')).toBe(GEORGIA);
    expect(toEmailSafeFont('Merriweather')).toBe(GEORGIA);
    expect(toEmailSafeFont('Roboto Slab')).toBe(GEORGIA);
  });

  it('maps Times-like serifs to Times', () => {
    expect(toEmailSafeFont('Times New Roman')).toBe(TIMES);
    expect(toEmailSafeFont('EB Garamond')).toBe(TIMES);
  });

  it('does NOT treat sans-serif as serif (the "sans-serif" contains "serif" trap)', () => {
    expect(toEmailSafeFont('Open Sans, sans-serif')).toBe(ARIAL);
    expect(toEmailSafeFont('sans-serif')).toBe(ARIAL);
  });

  it('maps geometric sans to Verdana', () => {
    expect(toEmailSafeFont('Poppins, sans-serif')).toBe(VERDANA);
    expect(toEmailSafeFont('Montserrat')).toBe(VERDANA);
  });

  it('maps rounded sans to Trebuchet', () => {
    expect(toEmailSafeFont('Nunito')).toBe(TREBUCHET);
    expect(toEmailSafeFont('Quicksand')).toBe(TREBUCHET);
  });

  it('falls back to Arial for neutral/unknown sans', () => {
    expect(toEmailSafeFont('Inter')).toBe(ARIAL);
    expect(toEmailSafeFont('Helvetica Neue')).toBe(ARIAL);
    expect(toEmailSafeFont('')).toBe(ARIAL);
  });

  it('every mapping result is an offered picker option', () => {
    const values = new Set(EMAIL_FONTS.map((f) => f.value));
    for (const sample of ['Playfair', 'Times', 'Poppins', 'Nunito', 'Inter', '']) {
      expect(values.has(toEmailSafeFont(sample))).toBe(true);
    }
  });
});
