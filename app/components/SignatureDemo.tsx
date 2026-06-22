'use client';
import { useState } from 'react';
import { renderSignature } from '@/lib/render-signature';
import { DEMO_FIELDS, NEUTRAL_BRAND_KIT } from '@/lib/brand-kit-schema';
import type { BrandKit, SignatureFields, Layout } from '@/lib/types';

const LAYOUTS: Layout[] = ['minimal', 'logo', 'logo-cta'];

export default function SignatureDemo() {
  const [url, setUrl] = useState('');
  const [kit, setKit] = useState<BrandKit>(NEUTRAL_BRAND_KIT);
  const [fields, setFields] = useState<SignatureFields>(DEMO_FIELDS);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setNote('');
    try {
      const res = await fetch('/api/brand-kit', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setKit(data.brandKit);
      if (data.fallback) setNote("Couldn't read that site — showing a neutral signature. Try another URL.");
    } finally { setLoading(false); }
  }

  const set = (k: keyof SignatureFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields(f => ({ ...f, [k]: e.target.value }));

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui', padding: 16 }}>
      <h1>Your branded email signature in 10 seconds</h1>
      <p>Paste your website URL — we read your logo, colors, and font automatically.</p>

      <form onSubmit={generate} style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourcompany.com"
          style={{ flex: 1, padding: 10 }} />
        <button disabled={loading} style={{ padding: '10px 18px' }}>
          {loading ? 'Reading…' : 'Generate'}
        </button>
      </form>
      {note && <p style={{ color: '#b00' }}>{note}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, margin: '16px 0' }}>
        <input value={fields.fullName} onChange={set('fullName')} placeholder="Full name" />
        <input value={fields.jobTitle} onChange={set('jobTitle')} placeholder="Job title" />
        <input value={fields.email} onChange={set('email')} placeholder="Email" />
        <input value={fields.phone} onChange={set('phone')} placeholder="Phone" />
      </div>

      {LAYOUTS.map(layout => (
        <div key={layout} style={{ margin: '12px 0' }}>
          <small style={{ textTransform: 'uppercase', color: '#888' }}>{layout}</small>
          <iframe title={layout} style={{ width: '100%', height: 130, border: '1px solid #eee' }}
            srcDoc={renderSignature(kit, fields, layout)} />
        </div>
      ))}

      <form onSubmit={e => { e.preventDefault(); alert("Thanks! We'll be in touch about team deploy."); }}
        style={{ marginTop: 24, padding: 16, background: '#f6f6f6', borderRadius: 8 }}>
        <strong>Want this live for your whole team in 2 minutes?</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input type="email" required placeholder="you@work.com" style={{ flex: 1, padding: 10 }} />
          <button style={{ padding: '10px 18px' }}>Notify me</button>
        </div>
      </form>
    </main>
  );
}
