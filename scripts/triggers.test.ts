import { describe, it, expect } from 'vitest';
import { classifyTrigger, newNameFrom } from './triggers';

// Headlines are real news hits from 2026-09 (the leads in the Signet Moat Plan).
describe('newNameFrom', () => {
  it('takes the capitalised name after the verb and stops at punctuation or lowercase', () => {
    expect(newNameFrom('Transact Capital Rebrands as Sequel Advisors, Sharpening Its Focus')).toBe('Sequel Advisors');
    expect(newNameFrom('Fromen Attorneys at Law rebrands as Fromen Injury Law - Buffalo Business First')).toBe('Fromen Injury Law');
    expect(newNameFrom('Savant Tax & Consulting has changed its name to Savant Accounting & Business Advisory, or SABA')).toBe('Savant Accounting & Business Advisory');
    expect(newNameFrom('Prudential Advisors Rebrands As Prudential Wealth Advisors')).toBe('Prudential Wealth Advisors');
  });
  it('returns undefined when no new name is stated', () => {
    expect(newNameFrom('McLaren Unveils New Brand Identity')).toBeUndefined();
    expect(newNameFrom('Firm rebrands as part of a refresh')).toBeUndefined();
  });
});

describe('classifyTrigger', () => {
  it('sorts headlines into rebrand, merger, new firm, or nothing', () => {
    expect(classifyTrigger('Affinity Partners Rebrands as Truestead Group')).toBe('rebrand');
    expect(classifyTrigger('Law firm with Buffalo presence announces merger, name change')).toBe('rebrand');
    expect(classifyTrigger('Fennemore, Gallagher & Kennedy Announce Plans to Merge Firms')).toBe('merger');
    expect(classifyTrigger('Former prosecutor launches boutique law firm in Austin')).toBe('new-firm');
    expect(classifyTrigger('Crowell & Moring Adds Senior DOJ Attorneys')).toBeUndefined();
  });
});
