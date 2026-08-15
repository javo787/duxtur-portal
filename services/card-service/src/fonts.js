const fs = require('fs');
const path = require('path');

const FONTS_DIR = path.join(__dirname, '..', 'assets', 'fonts');

function toDataUri(filename) {
  const buf = fs.readFileSync(path.join(FONTS_DIR, filename));
  return `data:font/woff2;base64,${buf.toString('base64')}`;
}

/**
 * Инлайним шрифты как base64 прямо в <style>, чтобы рендер не зависел
 * от сети (ни от Google Fonts CDN, ни от чего-либо ещё) в момент,
 * когда Puppeteer печатает PDF. Это то, из-за чего ломался предыдущий
 * заход на Vercel — там страдала не столько сеть, сколько сам процесс
 * headless Chrome; но раз мы это переписываем с нуля, не стоит
 * оставлять новую точку отказа на ровном месте.
 */
function buildFontFaceCSS() {
  return `
    @font-face {
      font-family: 'PT Serif';
      font-weight: 400;
      font-style: normal;
      src: url('${toDataUri('pt-serif-latin-400-normal.woff2')}') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    @font-face {
      font-family: 'PT Serif';
      font-weight: 400;
      font-style: normal;
      src: url('${toDataUri('pt-serif-cyrillic-400-normal.woff2')}') format('woff2');
      unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
    }
    @font-face {
      font-family: 'PT Serif';
      font-weight: 700;
      font-style: normal;
      src: url('${toDataUri('pt-serif-latin-700-normal.woff2')}') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    @font-face {
      font-family: 'PT Serif';
      font-weight: 700;
      font-style: normal;
      src: url('${toDataUri('pt-serif-cyrillic-700-normal.woff2')}') format('woff2');
      unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
    }
    @font-face {
      font-family: 'Inter';
      font-weight: 400;
      src: url('${toDataUri('inter-latin-400-normal.woff2')}') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    @font-face {
      font-family: 'Inter';
      font-weight: 400;
      src: url('${toDataUri('inter-cyrillic-400-normal.woff2')}') format('woff2');
      unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
    }
    @font-face {
      font-family: 'Inter';
      font-weight: 600;
      src: url('${toDataUri('inter-latin-600-normal.woff2')}') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    @font-face {
      font-family: 'Inter';
      font-weight: 600;
      src: url('${toDataUri('inter-cyrillic-600-normal.woff2')}') format('woff2');
      unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
    }
    @font-face {
      font-family: 'Inter';
      font-weight: 700;
      src: url('${toDataUri('inter-latin-700-normal.woff2')}') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    @font-face {
      font-family: 'Inter';
      font-weight: 700;
      src: url('${toDataUri('inter-cyrillic-700-normal.woff2')}') format('woff2');
      unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
    }
    @font-face {
      font-family: 'Inter';
      font-weight: 800;
      src: url('${toDataUri('inter-latin-800-normal.woff2')}') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    @font-face {
      font-family: 'Inter';
      font-weight: 800;
      src: url('${toDataUri('inter-cyrillic-800-normal.woff2')}') format('woff2');
      unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
    }
  `;
}

module.exports = { buildFontFaceCSS };
