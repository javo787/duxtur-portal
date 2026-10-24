import { describe, expect, it } from 'vitest';
import { TOPICS, pickTopic, topicByKey } from './topics';
import { CATEGORIES, type Topic } from './types';

describe('TOPICS', () => {
  it('has unique keys and valid categories', () => {
    const keys = TOPICS.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const t of TOPICS) expect(CATEGORIES).toContain(t.category);
  });

  it('has keys that are safe to put in a query string', () => {
    for (const t of TOPICS) expect(t.key).toMatch(/^[a-z0-9-]+$/);
  });

  it('covers every category with a useful number of topics, and about a year of content overall', () => {
    for (const c of CATEGORIES) expect(TOPICS.filter((t) => t.category === c).length).toBeGreaterThanOrEqual(10);
    expect(TOPICS.length).toBeGreaterThanOrEqual(100);
  });

  it('finds a topic by key', () => {
    expect(topicByKey('hypertension')?.category).toBe('cardiology');
    expect(topicByKey('nope')).toBeUndefined();
  });
});

describe('pickTopic', () => {
  const small: Topic[] = [
    { key: 'c1', category: 'cardiology', query: 'c1' },
    { key: 'c2', category: 'cardiology', query: 'c2' },
    { key: 'n1', category: 'neurology', query: 'n1' },
    { key: 'n2', category: 'neurology', query: 'n2' },
    { key: 'g1', category: 'general', query: 'g1' },
  ];

  it('starts with the first category in the fixed order when nothing was published', () => {
    expect(pickTopic([], [], small)?.key).toBe('c1');
  });

  it('rotates: the category written about longest ago goes next, never-used first', () => {
    const used = [{ topicKey: 'c1', category: 'cardiology', at: '2026-10-01' }];
    expect(pickTopic(used, [], small)?.key).toBe('n1'); // neurology never used
    const used2 = [...used, { topicKey: 'n1', category: 'neurology', at: '2026-10-04' }];
    expect(pickTopic(used2, [], small)?.key).toBe('g1'); // general never used
    const used3 = [...used2, { topicKey: 'g1', category: 'general', at: '2026-10-07' }];
    expect(pickTopic(used3, [], small)?.key).toBe('c2'); // cardiology is the oldest again
  });

  it('never repeats a used topic and honours skip', () => {
    const used = [{ topicKey: 'c1', category: 'cardiology', at: '2026-10-01' }];
    expect(pickTopic(used, ['n1'], small)?.key).toBe('n2');
  });

  it('returns null when everything is used or skipped', () => {
    const used = small.map((t, i) => ({ topicKey: t.key, category: t.category, at: new Date(2026, 9, i + 1) }));
    expect(pickTopic(used, [], small)).toBeNull();
    expect(pickTopic([], small.map((t) => t.key), small)).toBeNull();
  });

  it('skips a category that has no free topics left', () => {
    const used = [
      { topicKey: 'c1', category: 'cardiology', at: '2026-10-01' },
      { topicKey: 'c2', category: 'cardiology', at: '2026-10-02' },
    ];
    expect(pickTopic(used, [], small)?.category).toBe('neurology');
  });
});
