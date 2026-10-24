// Test helpers for the auto-blog. Not imported by production code.
import type { Lang, LocalizedArticle, SourceMaterial } from './types';

const SENTENCE: Record<Lang, string> = {
  ru: 'Высокое давление часто развивается незаметно, поэтому его важно регулярно измерять и обсуждать с врачом. ',
  uz: 'Yuqori qon bosimi koʻpincha sezilmasdan rivojlanadi, shuning uchun uni muntazam oʻlchash va shifokor bilan muhokama qilish muhim. ',
  tg: 'Фишори баланди хун аксар вақт ноаён инкишоф меёбад, бинобар ин ҳатмист онро ҳамеша чен кардан ва бо духтур ҳаматарафа маслиҳат кардан. ',
  kk: 'Қан қысымының жоғарылауы жиі байқалмай дамиды, сондықтан оны үнемі өлшеп, дәрігермен талқылау маңызды болып табылады. ',
  ky: 'Кан басымынын жогорулашы көбүнчө байкалбай өнүгөт, ошондуктан аны дайыма өлчөп, дарыгер менен талкуулоо өтө маанилүү. ',
};

const TITLE: Record<Lang, string> = {
  ru: 'Высокое давление: что важно знать каждому',
  uz: 'Yuqori qon bosimi: har kim bilishi kerak boʻlgan narsalar',
  tg: 'Фишори баланди хун: он чизе, ки ҳар кас бояд донад',
  kk: 'Қан қысымының жоғарылауы: әр адам білуі керек нәрсе',
  ky: 'Жогорку кан басымы: ар бир адам билиши керек нерсе',
};

const repeat = (s: string, n: number) => s.repeat(n).trim();

export function makeArticle(lang: Lang, overrides: Partial<LocalizedArticle> = {}): LocalizedArticle {
  return {
    title: TITLE[lang],
    overview: repeat(SENTENCE[lang], 2),
    sections: [1, 2, 3, 4, 5].map((i) => ({ title: `${TITLE[lang].slice(0, 20)} ${i}`, content: repeat(SENTENCE[lang], 5) })),
    ...overrides,
  };
}

export const SENTENCE_FOR = SENTENCE;

export function makeMaterial(overrides: { topicKey?: string } = {}): SourceMaterial {
  const text = 'High blood pressure means the force of blood against artery walls is too high. '.repeat(12);
  return {
    topic: { key: overrides.topicKey ?? 'hypertension', category: 'cardiology', query: 'high blood pressure' },
    passages: [
      {
        ref: { name: 'MedlinePlus (NLM)', title: 'High Blood Pressure', url: 'https://medlineplus.gov/highbloodpressure.html', license: 'Public domain' },
        text,
      },
      {
        ref: { name: 'Europe PMC: Some Journal, 2024', title: 'Hypertension review', url: 'https://doi.org/10.1000/xyz123', license: 'Open access (cc by)' },
        text,
      },
    ],
  };
}
