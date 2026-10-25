const fs = require('fs');
const path = require('path');
const { renderCardHTML } = require('./src/template');

const sampleDoctor = {
  name: 'Нуридинов Джавохир',
  image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop',
  specialty: 'Нейрохирургия',
  workplace: 'Клиника TGMU, Душанбе',
  bio: '',
  mission: 'Помогаю пациентам достичь лучшего здоровья и качества жизни, используя современные методы нейрохирургии',
  categoryKey: 'neurology',
  experience: 4,
  languages: ['Русский', 'Тоҷикӣ', 'O\u02bbzbek'],
  phone: '+992901234567',
  instagram: 'https://instagram.com/javo.md',
  telegram: 'https://t.me/javo787',
  whatsapp: 'https://wa.me/992901234567',
  workingHours: 'Пн–Пт, 9:00–16:00',
  accentColor: '#2563eb',
  cardTheme: 'dark',
  licenseNumber: '1234567',
  articlesCount: 3,
  slug: 'nuridinov-javokhir',
};

const lang = process.argv[2] || 'ru';
const html = renderCardHTML(sampleDoctor, lang, 'https://duxtur.org');

const outPath = path.join(__dirname, `preview-${lang}.html`);
fs.writeFileSync(outPath, html);
console.log('Card HTML written to', outPath);
