import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const KEY = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
const call = (key: string) => GET(new Request(`https://www.duxtur.org/${key}.txt`), { params: Promise.resolve({ key }) });

afterEach(() => vi.unstubAllEnvs());

describe('IndexNow key file', () => {
  it('serves the configured key as plain text', async () => {
    vi.stubEnv('INDEXNOW_KEY', KEY);
    const res = await call(KEY);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(await res.text()).toBe(KEY);
  });

  it('answers 404 for any other name', async () => {
    vi.stubEnv('INDEXNOW_KEY', KEY);
    expect((await call('ffffffffffffffffffffffffffffffff')).status).toBe(404);
  });

  it('answers 404 when no key is configured', async () => {
    vi.stubEnv('INDEXNOW_KEY', '');
    expect((await call(KEY)).status).toBe(404);
  });
});
