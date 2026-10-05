import { Source_Serif_4 } from 'next/font/google';

/**
 * Display face for clinic and blog pages. Fraunces has no Cyrillic,
 * so ru/tg/kk/ky headings fell back to a system serif. Must live in its own module:
 * next/font loaders are evaluated once, at module scope.
 */
export const clinicSerif = Source_Serif_4({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-clinic-serif',
  display: 'swap',
  axes: ['opsz'],
});
