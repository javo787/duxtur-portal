import { describe, expect, it, vi } from 'vitest';
import { gatherMaterial, htmlToText, isAllowedSourceUrl, isSufficient, parseEuropePmc, parseMedlinePlus, sourceRefs } from './sources';
import { makeMaterial } from './test-fixtures';
import type { Topic } from './types';

const SUMMARY = '<p>Blood pressure is the force of your blood pushing against the walls of your arteries. Each time your heart beats, it pumps blood into the arteries.</p><p>If your blood pressure rises and stays high over time, it can damage your body in many ways. High blood pressure usually has no symptoms, so many people do not know they have it until a doctor measures it.</p><ul><li>Measure it regularly</li><li>Move more and eat less salt</li></ul>';

// Structure as documented by NLM: nlmSearchResult > list > document[url] > content[name]. Query words are wrapped in tags in "brief" mode.
const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MEDLINE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<nlmSearchResult><term>high blood pressure</term><count>2</count><list>
<document url="https://medlineplus.gov/highbloodpressure.html" rank="0">
  <content name="title">${escapeXml('<span class="qt0">High</span> <span class="qt1">Blood</span> Pressure')}</content>
  <content name="organizationName">National Library of Medicine</content>
  <content name="altTitle">Hypertension</content>
  <content name="FullSummary">${escapeXml(SUMMARY)}</content>
  <content name="snippet">short</content>
</document>
<document url="https://evil.example.com/page.html" rank="1">
  <content name="title">Not allowed host</content>
  <content name="FullSummary">${escapeXml(SUMMARY)}</content>
</document>
<document url="https://medlineplus.gov/tiny.html" rank="2">
  <content name="title">Too short</content>
  <content name="fullSummary">${escapeXml('<p>Tiny.</p>')}</content>
</document>
</list></nlmSearchResult>`;

const ABSTRACT = '<h4>Background</h4> Hypertension is a leading modifiable risk factor for cardiovascular disease worldwide. <h4>Methods</h4> We reviewed guidelines and trials on blood pressure measurement, lifestyle change and treatment strategies. '.repeat(2);
const EPMC_JSON = {
  resultList: {
    result: [
      { id: '123', source: 'MED', doi: '10.1000/abc', title: 'Hypertension: a review.', abstractText: ABSTRACT, journalInfo: { journal: { title: 'Some Journal' } }, pubYear: '2024', license: 'cc by' },
      { id: '456', source: 'PMC', title: 'No DOI article', abstractText: ABSTRACT, journalTitle: 'Other Journal', pubYear: '2023' },
      { id: '789', source: 'MED', doi: '10.1000/short', title: 'Short abstract', abstractText: 'Too short.' },
      { id: '000', source: 'MED', title: '', abstractText: ABSTRACT },
    ],
  },
};

describe('htmlToText', () => {
  it('keeps paragraph and list breaks and decodes entities', () => {
    expect(htmlToText('<p>One &amp; two</p><ul><li>a</li><li>b</li></ul><p>Three</p>')).toBe('One & two\n- a\n- b\n\nThree');
  });
});

describe('isAllowedSourceUrl', () => {
  it.each([
    ['https://medlineplus.gov/highbloodpressure.html', true],
    ['https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1/', true],
    ['https://doi.org/10.1000/abc', true],
    ['https://europepmc.org/article/MED/1', true],
    ['http://medlineplus.gov/x.html', false],
    ['https://evil.example.com/medlineplus.gov', false],
    ['https://medlineplus.gov.evil.com/x', false],
    ['javascript:alert(1)', false],
    ['not a url', false],
  ])('%s -> %s', (url, expected) => expect(isAllowedSourceUrl(url)).toBe(expected));
});

describe('parseMedlinePlus', () => {
  it('extracts the title and the full summary as text, and drops bad documents', () => {
    const docs = parseMedlinePlus(MEDLINE_XML);
    expect(docs).toHaveLength(1);
    expect(docs[0].ref.title).toBe('High Blood Pressure');
    expect(docs[0].ref.url).toBe('https://medlineplus.gov/highbloodpressure.html');
    expect(docs[0].ref.name).toBe('MedlinePlus (NLM)');
    expect(docs[0].text).toContain('Blood pressure is the force of your blood');
    expect(docs[0].text).toContain('- Measure it regularly');
    expect(docs[0].text).not.toContain('<');
  });

  it('returns nothing for an empty or error response', () => {
    expect(parseMedlinePlus('<nlmSearchResult><list/></nlmSearchResult>')).toEqual([]);
    expect(parseMedlinePlus('')).toEqual([]);
  });
});

describe('parseEuropePmc', () => {
  it('keeps records with a title, a long abstract and a safe link', () => {
    const docs = parseEuropePmc(EPMC_JSON);
    expect(docs).toHaveLength(2);
    expect(docs[0].ref).toMatchObject({ name: 'Europe PMC: Some Journal, 2024', title: 'Hypertension: a review', url: 'https://doi.org/10.1000/abc', license: 'Open access (cc by)' });
    expect(docs[0].text).not.toContain('<h4>');
    expect(docs[1].ref.url).toBe('https://europepmc.org/article/PMC/456');
    expect(docs[1].ref.name).toBe('Europe PMC: Other Journal, 2023');
  });

  it('survives garbage', () => {
    expect(parseEuropePmc(null)).toEqual([]);
    expect(parseEuropePmc({})).toEqual([]);
    expect(parseEuropePmc({ resultList: { result: 'x' } })).toEqual([]);
  });
});

describe('gatherMaterial', () => {
  const topic: Topic = { key: 'hypertension', category: 'cardiology', query: 'high blood pressure' };
  const respond = (url: string): Response => {
    if (url.includes('wsearch.nlm.nih.gov')) return new Response(MEDLINE_XML, { status: 200 });
    if (url.includes('europepmc')) return new Response(JSON.stringify(EPMC_JSON), { status: 200 });
    return new Response('nope', { status: 404 });
  };

  it('combines both sources and sends well-formed requests', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => respond(String(url)));
    const material = await gatherMaterial(topic, { fetchImpl: fetchImpl as unknown as typeof fetch, now: new Date('2026-10-24') });
    expect(material.passages).toHaveLength(3);

    const urls = fetchImpl.mock.calls.map((c) => decodeURIComponent(String(c[0])));
    expect(urls.some((u) => u.includes('db=healthTopics') && u.includes('term=high blood pressure') && u.includes('tool=duxtur-auto-blog'))).toBe(true);
    const epmc = urls.find((u) => u.includes('europepmc'))!;
    expect(epmc).toContain('OPEN_ACCESS:y');
    expect(epmc).toContain('PUB_YEAR:[2021 TO 2026]');
    expect(epmc).toContain('sort_cited:y');
    expect(epmc).toContain('"high blood pressure"');
  });

  it('falls back to a broader Europe PMC query when the review-only search finds too little', async () => {
    let epmcCalls = 0;
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes('europepmc')) {
        epmcCalls++;
        return new Response(JSON.stringify(epmcCalls === 1 ? { resultList: { result: [] } } : EPMC_JSON), { status: 200 });
      }
      return respond(u);
    });
    const material = await gatherMaterial(topic, { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(epmcCalls).toBe(2);
    expect(material.passages.filter((p) => p.ref.name.startsWith('Europe PMC'))).toHaveLength(2);
  });

  it('keeps going when one source is down', async () => {
    const log = vi.fn();
    const fetchImpl = vi.fn(async (url: string | URL | Request) => (String(url).includes('europepmc') ? new Response('boom', { status: 503 }) : respond(String(url))));
    const material = await gatherMaterial(topic, { fetchImpl: fetchImpl as unknown as typeof fetch, log });
    expect(material.passages).toHaveLength(1);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Europe PMC failed'));
  });

  it('strips quotes from the query so it cannot break out of the phrase', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    await gatherMaterial({ ...topic, query: 'x" OR "y' }, { fetchImpl: fetchImpl as unknown as typeof fetch });
    const epmc = fetchImpl.mock.calls.map((c) => decodeURIComponent(String((c as unknown[])[0]))).find((u) => u.includes('europepmc'))!;
    expect(epmc).toContain('("x  OR  y")');
  });
});

describe('isSufficient / sourceRefs', () => {
  it('needs substance and two distinct sources', () => {
    expect(isSufficient(makeMaterial())).toBe(true);
    const one = makeMaterial();
    one.passages = [one.passages[0]];
    expect(isSufficient(one)).toBe(false);
    const thin = makeMaterial();
    thin.passages = thin.passages.map((p) => ({ ...p, text: 'short' }));
    expect(isSufficient(thin)).toBe(false);
    const dup = makeMaterial();
    dup.passages = [dup.passages[0], dup.passages[0]];
    expect(isSufficient(dup)).toBe(false);
  });

  it('lists each source once', () => {
    const m = makeMaterial();
    m.passages.push(m.passages[0]);
    expect(sourceRefs(m)).toHaveLength(2);
  });
});
