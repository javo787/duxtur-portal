import { describe, expect, it } from 'vitest';
import { parseModelJson } from './ai-json';

describe('parseModelJson', () => {
  it('reads JSON inside code fences and prose', () => {
    expect(parseModelJson('Here:\n```json\n{"a": 1}\n```')).toEqual({ a: 1 });
  });
  it('fixes raw newlines inside strings and keeps escaped quotes', () => {
    expect(parseModelJson('{"t": "line1\nline2 \\"q\\""}')).toEqual({ t: 'line1\nline2 "q"' });
  });
});
