import { describe, expect, it } from 'vitest';
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN, averageRating, maskName, parseReviewInput, toPublicReview } from './reviews';

describe('maskName', () => {
  it.each([
    ['Жавохир Нурматов', 'Жа*** Н.'],
    ['Анна', 'Ан***'],
    ['Ли Ван', 'Л*** В.'],
    ['Ann', 'A***'],
    ['  Dilshod   Rakhimov  ', 'Di*** R.'],
    ['Мария Ивановна Петрова', 'Ма*** И.'],
    ['анна-мария ли', 'ан*** Л.'],
    ['🔥 javo_77', 'ja***'],
    ['@javo', 'ja***'],
  ])('%j -> %j', (name, masked) => {
    expect(maskName(name)).toBe(masked);
  });

  it.each([undefined, null, 5, '', '   ', '12345', '🔥🔥', '___'])('gives nothing for %j', name => {
    expect(maskName(name)).toBe('');
  });

  it('never shows more than two letters of the first name or one of the second', () => {
    const masked = maskName('Александр Македонский');
    expect(masked).toBe('Ал*** М.');
    expect(masked).not.toContain('Македонский');
    expect(masked).not.toContain('Александр');
  });

  it('does not split a letter with a combining mark', () => {
    // "й" written as "и" + combining breve
    expect(maskName('Ийса Ли')).toBe(`${'Ий'.normalize('NFC').slice(0, 2)}*** Л.`);
  });
});

describe('parseReviewInput', () => {
  const text = 'Спасибо, всё понятно объяснил.';

  it('accepts a good review and defaults to showing the masked name', () => {
    expect(parseReviewInput({ rating: 5, text })).toEqual({ ok: true, value: { rating: 5, text, isAnonymous: false } });
  });

  it('keeps "anonymous" only when it is exactly true', () => {
    expect(parseReviewInput({ rating: 4, text, isAnonymous: true })).toMatchObject({ ok: true, value: { isAnonymous: true } });
    expect(parseReviewInput({ rating: 4, text, isAnonymous: 'true' })).toMatchObject({ ok: true, value: { isAnonymous: false } });
  });

  it.each([0, 6, 3.5, -1, '5', null, undefined, NaN])('rejects rating %j', rating => {
    expect(parseReviewInput({ rating, text })).toEqual({ ok: false, error: 'rating' });
  });

  it('rejects text that is missing, too short or too long, counted after trimming', () => {
    expect(parseReviewInput({ rating: 5 })).toEqual({ ok: false, error: 'text_short' });
    expect(parseReviewInput({ rating: 5, text: 42 })).toEqual({ ok: false, error: 'text_short' });
    expect(parseReviewInput({ rating: 5, text: `   ${'а'.repeat(REVIEW_TEXT_MIN - 1)}   ` })).toEqual({ ok: false, error: 'text_short' });
    expect(parseReviewInput({ rating: 5, text: 'а'.repeat(REVIEW_TEXT_MIN) })).toMatchObject({ ok: true });
    expect(parseReviewInput({ rating: 5, text: 'а'.repeat(REVIEW_TEXT_MAX) })).toMatchObject({ ok: true });
    expect(parseReviewInput({ rating: 5, text: 'а'.repeat(REVIEW_TEXT_MAX + 1) })).toEqual({ ok: false, error: 'text_long' });
  });

  it('cleans the text: control characters out, line breaks kept and limited', () => {
    const parsed = parseReviewInput({ rating: 5, text: `  Хороший\u0000 врач\u0007\r\n\r\n\r\n\r\nрекомендую  ` });
    expect(parsed).toEqual({ ok: true, value: { rating: 5, text: 'Хороший врач\n\nрекомендую', isAnonymous: false } });
  });

  it('survives garbage bodies', () => {
    for (const body of [null, undefined, 'x', 7, [], true]) {
      expect(parseReviewInput(body)).toEqual({ ok: false, error: 'rating' });
    }
  });
});

describe('toPublicReview', () => {
  const stored = {
    _id: { toString: () => '65f0c0ffee0c0ffee0c0ffee' },
    patientId: '65f0aaaaaaaaaaaaaaaaaaaa',
    doctorId: { _id: 'x', name: 'Др. Каримов', userId: 'secret' },
    clinicId: '65f0bbbbbbbbbbbbbbbbbbbb',
    rating: 4,
    text: 'Всё хорошо',
    isVerified: true,
    isAnonymous: false,
    authorName: 'Жа*** Н.',
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-02T10:00:00Z'),
    __v: 0,
  };

  it('keeps only what a visitor may see', () => {
    const view = toPublicReview(stored);
    expect(view).toEqual({
      id: '65f0c0ffee0c0ffee0c0ffee',
      rating: 4,
      text: 'Всё хорошо',
      createdAt: '2026-10-01T10:00:00.000Z',
      anonymous: false,
      author: 'Жа*** Н.',
      doctorName: 'Др. Каримов',
    });
    expect(JSON.stringify(view)).not.toMatch(/patientId|65f0aaaa|secret|clinicId|isVerified/);
  });

  it('hides the masked name too when the review is anonymous', () => {
    const view = toPublicReview({ ...stored, isAnonymous: true });
    expect(view.anonymous).toBe(true);
    expect(view.author).toBe('');
  });

  it('treats a review with no flag as anonymous', () => {
    const { isAnonymous: _ignored, ...rest } = stored;
    void _ignored;
    expect(toPublicReview(rest)).toMatchObject({ anonymous: true, author: '' });
  });

  it('has no doctor name when the doctor is not loaded', () => {
    expect(toPublicReview({ ...stored, doctorId: '65f0dddddddddddddddddddd' })).not.toHaveProperty('doctorName');
    expect(toPublicReview({ ...stored, doctorId: undefined })).not.toHaveProperty('doctorName');
  });

  it('reviews written before names were stored show no author', () => {
    const { authorName: _ignored, ...rest } = stored;
    void _ignored;
    expect(toPublicReview(rest)).toMatchObject({ anonymous: false, author: '' });
  });
});

describe('averageRating', () => {
  it('rounds to one decimal and copes with no votes', () => {
    expect(averageRating(0, 0)).toBe(0);
    expect(averageRating(14, 3)).toBe(4.7);
    expect(averageRating(10, 2)).toBe(5);
  });
});
