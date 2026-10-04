import { describe, it, expect } from 'vitest';
import { i18n } from '../i18n-config';
import { eduNavLabels } from './edu-labels';

describe('eduNavLabels', () => {
  it.each(i18n.locales)('%s has two non-empty, different labels', locale => {
    const { students, teachers } = eduNavLabels(locale);
    expect(students.trim().length).toBeGreaterThan(0);
    expect(teachers.trim().length).toBeGreaterThan(0);
    expect(students).not.toBe(teachers);
  });

  it('returns the Russian labels for ru', () => {
    expect(eduNavLabels('ru')).toEqual({ students: 'Студентам', teachers: 'Преподавателям' });
  });
});
