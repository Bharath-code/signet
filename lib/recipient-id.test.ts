import { it, expect } from 'vitest';
import { recipientId } from './recipient-id';

it('is stable, case-insensitive, and never contains the address', async () => {
  const a = await recipientId('Jane@Acme.io ');
  expect(a).toBe(await recipientId('jane@acme.io'));
  expect(a).toMatch(/^r_[0-9a-f]{16}$/);
  expect(a).not.toContain('jane');
});
