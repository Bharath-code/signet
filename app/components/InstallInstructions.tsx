'use client';
import { track } from './track';

// Post-copy install guide. Native <details> = zero deps, keyboard-accessible,
// collapsed by default. Shown under the previews so a copied signature is
// actually installable — the difference between a waitlist demo and a usable tool.

const CLIENTS: { name: string; steps: string[] }[] = [
  {
    name: 'Gmail',
    steps: [
      'Settings (gear, top-right) → See all settings → General.',
      'Scroll to Signature → Create new, name it.',
      'Click into the box and paste (⌘/Ctrl+V).',
      'Scroll down → Save Changes.',
    ],
  },
  {
    name: 'Outlook (web)',
    steps: [
      'Settings (gear) → Mail → Compose and reply.',
      'Under Email signature, create or pick a signature.',
      'Click the box and paste (⌘/Ctrl+V).',
      'Save.',
    ],
  },
  {
    name: 'Apple Mail',
    steps: [
      'Mail → Settings → Signatures.',
      'Pick the account, click + for a new signature.',
      'Uncheck “Always match my default message font”.',
      'Paste (⌘V) into the right pane.',
    ],
  },
];

export function InstallInstructions() {
  return (
    <div className="mt-4 border border-line">
      {CLIENTS.map((c) => (
        <details
          key={c.name}
          className="border-b border-line last:border-b-0"
          onToggle={(e) => {
            if ((e.currentTarget as HTMLDetailsElement).open) track('install_help_opened', { client: c.name });
          }}
        >
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink transition-colors hover:text-accent">
            Install in {c.name}
            <span aria-hidden className="text-muted">＋</span>
          </summary>
          <ol className="list-decimal space-y-1.5 px-8 pb-4 text-sm text-muted">
            {c.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </details>
      ))}
    </div>
  );
}
