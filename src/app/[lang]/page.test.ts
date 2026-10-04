import { describe, it, expect, vi } from 'vitest';
import type { ReactElement } from 'react';

// A chainable stand-in for a Mongoose query: any method returns the chain, awaiting it gives an empty list.
function emptyQuery(): unknown {
  const chain: unknown = new Proxy(function () {}, {
    get: (_target, prop) => {
      if (prop === 'then') return (resolve: (v: unknown[]) => unknown) => Promise.resolve([]).then(resolve);
      return () => chain;
    },
    apply: () => chain,
  });
  return chain;
}

vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/models/Article', () => ({ default: { find: () => emptyQuery(), aggregate: () => emptyQuery() } }));
vi.mock('@/models/Doctor', () => ({ default: { find: () => emptyQuery() } }));

import Home from './page';
import HomeHeader from '@/components/home/HomeHeader';
import { eduNavLabels } from '@/lib/edu-labels';
import { i18n } from '../../i18n-config';

function findByType(node: unknown, type: unknown): ReactElement | null {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findByType(child, type);
      if (hit) return hit;
    }
    return null;
  }
  const element = node as ReactElement<{ children?: unknown }>;
  if (element.type === type) return element;
  return findByType(element.props?.children, type);
}

// The real home page, with the database stubbed out. Guards the contract between the page and its header:
// the page once passed t('nav.edu') through its local t(field) helper, which returns '' for a UI key, and the
// two Edu links rendered with no text at all.
describe('home page -> HomeHeader Edu labels', () => {
  it.each(i18n.locales)('%s: both labels are passed, non-empty and translated', async locale => {
    const tree = await Home({ params: Promise.resolve({ lang: locale }) });
    const header = findByType(tree, HomeHeader) as ReactElement<{ eduLabel: string; eduTeacherLabel: string }> | null;

    expect(header, 'HomeHeader is rendered on the home page').not.toBeNull();
    const expected = eduNavLabels(locale);
    expect(header!.props.eduLabel).toBe(expected.students);
    expect(header!.props.eduTeacherLabel).toBe(expected.teachers);
    expect(header!.props.eduLabel.trim()).not.toBe('');
    expect(header!.props.eduTeacherLabel.trim()).not.toBe('');
  });
});
