'use client';
import { useEffect, useRef, useState } from 'react';

// Misregistration is print's word for plates that don't line up. A team's
// signatures look exactly like that; the snap into register is the promise.
const TEAM = [
  { role: 'CEO', name: 'Maya Okafor', fault: '2022 logo' },
  { role: 'Sales', name: 'Luis Ferreira', fault: 'No logo' },
  { role: 'Eng', name: 'Priya Raman', fault: 'Wrong blue' },
  { role: 'Support', name: 'Sam Whitlock', fault: 'Just black' },
];

const Mark = ({ className }: { className: string }) => (
  <svg className={`reg-mark ${className}`} viewBox="0 0 26 26" aria-hidden>
    <circle cx="13" cy="13" r="7" fill="none" stroke="#131210" />
    <path d="M13 0V26M0 13H26" stroke="#131210" />
  </svg>
);

export function Registration() {
  const [registered, setRegistered] = useState(false);
  const touched = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      t = setTimeout(() => { if (!touched.current) setRegistered(true); }, 1200);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);

  const toggle = () => { touched.current = true; setRegistered((r) => !r); };

  return (
    <div className="border bg-card" style={{ borderColor: 'var(--color-line)' }}>
      <div ref={ref} className={`relative px-4 py-7 sm:px-10 ${registered ? '' : 'drift'}`} style={{ background: 'var(--color-paper-deep)' }}>
        <Mark className="left-1.5 top-1.5" />
        <Mark className="right-1.5 top-1.5" />
        <Mark className="bottom-1.5 left-1.5" />
        <Mark className="bottom-1.5 right-1.5" />
        <div className="flex flex-col gap-2.5">
          {TEAM.map((p) => (
            <div key={p.role} className="reg-sig grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3.5 border bg-card px-3.5 py-3 sm:grid-cols-[84px_40px_minmax(0,1fr)_120px]" style={{ borderColor: 'var(--color-line)' }}>
              <span className="hidden font-mono text-[0.66rem] uppercase tracking-[0.12em] text-muted sm:block">{p.role}</span>
              <span className="reg-logo grid h-10 w-10 place-items-center font-bold" style={{ fontFamily: 'Georgia, serif', fontSize: 18 }} aria-hidden>N</span>
              <span className="flex min-w-0 flex-col gap-1.5">
                <span className="reg-nm text-[1.05rem] font-semibold leading-tight text-ink">{p.name}</span>
                <span className="reg-rule block h-[3px] w-full" />
              </span>
              <span className="hidden text-right font-mono text-[0.64rem] uppercase tracking-[0.1em] text-muted sm:block">
                <span className="reg-note-drift">{p.fault}</span>
                <span className="reg-note-ok">Current kit</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3" style={{ borderColor: 'var(--color-line)' }}>
        <output aria-live="polite" className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-ink">
          4 signatures · <span style={{ color: 'var(--color-accent)' }}>{registered ? '1 brand' : '4 versions of the brand'}</span>
        </output>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={registered}
          className="press-shadow border-[1.5px] border-ink bg-card px-3.5 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink"
        >
          {registered ? 'Show the drift' : 'Register the team'}
        </button>
      </div>
    </div>
  );
}
