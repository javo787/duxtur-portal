import { describe, expect, it } from 'vitest';
import {
  completions,
  correctQuery,
  correctToken,
  editDistance,
  excerptAround,
  MAX_QUERY_LENGTH,
  normalizeQuery,
  plainText,
  relevance,
  splitHighlight,
  stem,
  stemsOf,
  tokenize,
  type Vocabulary,
} from './search-text';

describe('normalizeQuery', () => {
  it('collapses whitespace and control characters, and trims', () => {
    expect(normalizeQuery('  давление \n\t без   таблеток\u0000 ')).toBe('давление без таблеток');
  });
  it('cuts to the maximum length', () => {
    expect(normalizeQuery('а'.repeat(500))).toHaveLength(MAX_QUERY_LENGTH);
  });
  it('gives an empty string for anything that is not text', () => {
    for (const v of [undefined, null, 5, {}, ['a']]) expect(normalizeQuery(v)).toBe('');
  });
  it('does not touch regular expression characters (they are escaped where the pattern is built)', () => {
    expect(normalizeQuery('(a+)+$')).toBe('(a+)+$');
  });
});

describe('tokenize and stem', () => {
  it('splits on anything that is not a letter or a digit, drops one-letter words and repeats', () => {
    expect(tokenize('Боль, в спине! боль 2024')).toEqual(['боль', 'спине', '2024']);
  });
  it('keeps at most six words', () => {
    expect(tokenize('аа бб вв гг дд ее жж зз')).toHaveLength(6);
  });
  it('works for Tajik, Uzbek and Kazakh letters', () => {
    expect(tokenize('Ҳамширагӣ қанд диабети')).toEqual(['ҳамширагӣ', 'қанд', 'диабети']);
    expect(tokenize('Oʻzbekcha yurak')).toEqual(['oʻzbekcha', 'yurak']);
  });
  it('lets word forms meet on one stem', () => {
    const forms = ['давление', 'давления', 'давлению'].map(stem);
    expect(new Set(forms).size).toBe(1);
    expect(stem('таблеток')).toBe(stem('таблетки'));
  });
  it('leaves short words alone', () => {
    expect(stem('боль')).toBe('боль');
    expect(stemsOf('ЭКГ')).toEqual(['экг']);
  });
});

describe('splitHighlight', () => {
  const joined = (s: { text: string }[]) => s.map(x => x.text).join('');
  it('marks the whole word that starts with the stem, in any case, and keeps all the text', () => {
    const segs = splitHighlight('Высокое Давление без таблеток', stemsOf('давление'));
    expect(segs.filter(s => s.match).map(s => s.text)).toEqual(['Давление']);
    expect(joined(segs)).toBe('Высокое Давление без таблеток');
  });
  it('does not mark a stem in the middle of a word', () => {
    expect(splitHighlight('холестерин', ['олест']).some(s => s.match)).toBe(false);
  });
  it('is safe with characters that mean something in a pattern', () => {
    expect(() => splitHighlight('цена (руб.) [1+1]', stemsOf('(руб. [1+'))).not.toThrow();
    expect(joined(splitHighlight('a.b*c', ['a.b']))).toBe('a.b*c');
  });
  it('returns the text unchanged when there is nothing to mark', () => {
    expect(splitHighlight('текст', [])).toEqual([{ text: 'текст', match: false }]);
    expect(splitHighlight('', ['а'])).toEqual([{ text: '', match: false }]);
  });
  it('marks several words', () => {
    const segs = splitHighlight('Боль в спине и боль в шее', stemsOf('боль спине'));
    expect(segs.filter(s => s.match).map(s => s.text)).toEqual(['Боль', 'спине', 'боль']);
  });
});

describe('excerptAround', () => {
  it('returns short text as it is, without markup', () => {
    expect(excerptAround('## Заголовок **жирный** текст', [])).toBe('Заголовок жирный текст');
  });
  it('centres a long text on the first match and marks the cut', () => {
    const text = 'Вступление. '.repeat(30) + 'Здесь говорится о давлении крови. ' + 'Продолжение. '.repeat(30);
    const out = excerptAround(text, stemsOf('давлении'), 120);
    expect(out).toContain('давлении');
    expect(out.startsWith('…')).toBe(true);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(125);
  });
  it('starts at the beginning when nothing matches', () => {
    const out = excerptAround('слово '.repeat(100), ['нет'], 50);
    expect(out.startsWith('…')).toBe(false);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('relevance', () => {
  const stems = stemsOf('давление');
  it('ranks a title above an overview and a word start above the inside of a word', () => {
    const inTitle = relevance([{ text: 'Давление и пульс', weight: 3 }, { text: '', weight: 1 }], stems, 'давление');
    const inOverview = relevance([{ text: 'Другое', weight: 3 }, { text: 'Про давление', weight: 1 }], stems, 'давление');
    expect(inTitle).toBeGreaterThan(inOverview);
    expect(inOverview).toBeGreaterThan(0);
    const atStart = relevance([{ text: 'Давление', weight: 3 }], stems, 'давление');
    const inside = relevance([{ text: 'Антидавленческий', weight: 3 }], stems, 'давление');
    expect(atStart).toBeGreaterThan(inside);
    expect(inside).toBeGreaterThan(0);
    expect(relevance([{ text: 'Совсем другое', weight: 3 }], stems, 'давление')).toBe(0);
  });
  it('gives a bonus to the whole phrase', () => {
    const phrase = relevance([{ text: 'боль в спине', weight: 3 }], stemsOf('боль спине'), 'боль в спине');
    const apart = relevance([{ text: 'боль, а потом спине', weight: 3 }], stemsOf('боль спине'), 'боль в спине');
    expect(phrase).toBeGreaterThan(apart);
  });
});

describe('plainText', () => {
  it('removes markdown marks', () => {
    expect(plainText('# Т\n\n> *а* `б` [в]')).toBe('Т а б в');
  });
});

describe('editDistance', () => {
  it('counts insertions, deletions and substitutions', () => {
    expect(editDistance('диабет', 'диабет')).toBe(0);
    expect(editDistance('диабед', 'диабет')).toBe(1);
    expect(editDistance('диабт', 'диабет')).toBe(1);
    expect(editDistance('диабеет', 'диабет')).toBe(1);
  });
  it('counts two swapped neighbours as one change', () => {
    expect(editDistance('кадриолог', 'кардиолог')).toBe(1);
  });
  it('gives up early when the words are too different', () => {
    expect(editDistance('аб', 'абвгде', 2)).toBe(3);
    expect(editDistance('абвгде', 'жзиклм', 2)).toBe(3);
  });
});

const vocab: Vocabulary = new Map([
  ['кардиология', 5],
  ['кардиолог', 4],
  ['диабет', 6],
  ['давление', 9],
  ['холестерин', 3],
  ['беременность', 2],
  ['боль', 8],
]);

describe('correctToken and correctQuery', () => {
  it('corrects a typo inside a word', () => {
    expect(correctToken('кардеология', vocab)).toBe('кардиология');
    expect(correctToken('халестерин', vocab)).toBe('холестерин');
  });
  it('corrects swapped letters', () => {
    expect(correctToken('кадриолог', vocab)).toBe('кардиолог');
    expect(correctToken('давелние', vocab)).toBe('давление');
  });
  it('corrects a word that is still being typed (the commoner completion wins)', () => {
    expect(correctToken('кардеол', vocab)).toBe('кардиология');
  });
  it('prefers a whole-word match to a half-word match, however common the other is', () => {
    expect(correctToken('кадриолог', vocab)).toBe('кардиолог'); // "кардиология" is commoner but only matches the start
  });
  it('does not touch a typo in the last letters of a long word: the stem already absorbs it', () => {
    expect(correctToken('холестерен', vocab)).toBeNull(); // "холестер" still finds "холестерин"
    expect(correctToken('диабед', vocab)).toBeNull();
  });
  it('leaves a good word, and a word form, alone', () => {
    expect(correctToken('давление', vocab)).toBeNull();
    expect(correctToken('давлению', vocab)).toBeNull();
    expect(correctToken('диабет', vocab)).toBeNull();
  });
  it('does not guess for short words or words with nothing close', () => {
    expect(correctToken('бол', vocab)).toBeNull();
    expect(correctToken('квантовый', vocab)).toBeNull();
  });
  it('allows one change in a short word, two in a long one', () => {
    expect(correctToken('дибет', vocab)).toBe('диабет'); // one change
    expect(correctToken('дибат', vocab)).toBeNull(); // two changes in a five-letter word: too far to guess
    expect(correctToken('беремннсть', vocab)).toBe('беременность'); // two changes in a long word
  });
  it('prefers the commoner word when two are equally close', () => {
    const v: Vocabulary = new Map([['мама', 1], ['мара', 7]]);
    expect(correctToken('марка', v)).toBe('мара');
  });
  it('corrects only the broken words of a query', () => {
    expect(correctQuery('давление кардеология', vocab)).toBe('давление кардиология');
    expect(correctQuery('давление кардиология', vocab)).toBeNull();
    expect(correctQuery('', vocab)).toBeNull();
  });
});

describe('completions', () => {
  it('completes the last word with the commonest words that start with it', () => {
    expect(completions('кард', vocab)).toEqual(['кардиология', 'кардиолог']);
    expect(completions('кард', vocab, 1)).toEqual(['кардиология']);
  });
  it('keeps the words before it', () => {
    expect(completions('боль давл', vocab)).toEqual(['боль давление']);
  });
  it('gives nothing for a finished word, a short start or no match', () => {
    expect(completions('давление', vocab)).toEqual([]);
    expect(completions('д', vocab)).toEqual([]);
    expect(completions('ццц', vocab)).toEqual([]);
  });
});
