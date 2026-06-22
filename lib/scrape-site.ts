import Firecrawl from '@mendable/firecrawl-js';

const client = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function scrapeSite(url: string): Promise<{ html: string; screenshotUrl: string }> {
  if (!process.env.FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY is not set');
  const doc = await client.scrape(url, { formats: ['html', 'screenshot'], onlyMainContent: false });
  const html = doc.html ?? '';
  const screenshotUrl = doc.screenshot ?? '';
  if (!screenshotUrl) throw new Error('Firecrawl returned no screenshot');
  return { html: html.slice(0, 20000), screenshotUrl };
}
