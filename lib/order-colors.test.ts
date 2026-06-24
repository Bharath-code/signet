import { describe, it, expect } from 'vitest';
import { orderColors } from './extract-brand-kit';

describe('orderColors', () => {
  it('puts the more saturated color first regardless of input order', () => {
    // lime is vivid, near-black is neutral → lime is primary either way
    expect(orderColors('#0c0c0c', '#d4ff33')).toEqual(['#d4ff33', '#0c0c0c']);
    expect(orderColors('#d4ff33', '#0c0c0c')).toEqual(['#d4ff33', '#0c0c0c']);
  });

  it('is stable: same inputs in any order give the same primary', () => {
    const [p1] = orderColors('#1d4ed8', '#94a3b8');
    const [p2] = orderColors('#94a3b8', '#1d4ed8');
    expect(p1).toBe(p2);
    expect(p1).toBe('#1d4ed8'); // saturated blue beats muted slate
  });

  it('tie-breaks two neutrals by darkness (darker is primary)', () => {
    expect(orderColors('#eeeeee', '#222222')).toEqual(['#222222', '#eeeeee']);
  });
});
