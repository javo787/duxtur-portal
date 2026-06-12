const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv();
addFormats(ajv);

const medicalClinicSchema = {
  type: 'object',
  properties: {
    '@context': { type: 'string', pattern: '^https?://schema.org' },
    '@type': { type: 'string', enum: ['MedicalClinic', 'Clinic'] },
    name: { type: 'string' },
    url: { type: 'string', format: 'uri' },
    address: {
      type: 'object',
      properties: {
        '@type': { type: 'string', enum: ['PostalAddress'] },
        streetAddress: { type: 'string' },
        addressLocality: { type: 'string' },
        addressCountry: { type: 'string' }
      },
      required: ['@type', 'streetAddress', 'addressLocality']
    }
  },
  required: ['@context', '@type', 'name', 'address']
};

const itemListSchema = {
  type: 'object',
  properties: {
    '@context': { type: 'string', pattern: '^https?://schema.org' },
    '@type': { type: 'string', enum: ['ItemList'] },
    itemListElement: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          '@type': { type: 'string', enum: ['ListItem'] },
          position: { type: 'number' },
          item: { type: 'object' }
        },
        required: ['@type', 'position', 'item']
      }
    }
  },
  required: ['@context', '@type', 'itemListElement']
};

const validateClinic = ajv.compile(medicalClinicSchema);
const validateItemList = ajv.compile(itemListSchema);

// Example test cases (representing what's generated in our components)
const testData = [
  {
    name: 'MedicalClinic (Slug Page)',
    validator: validateClinic,
    data: {
      '@context': 'https://schema.org',
      '@type': 'MedicalClinic',
      name: 'Test Clinic',
      url: 'https://duxtur.org/ru/clinics/test-clinic',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Main St 10',
        addressLocality: 'Tashkent',
        addressCountry: 'UZ'
      }
    }
  },
  {
    name: 'ItemList (Directory Page)',
    validator: validateItemList,
    data: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'MedicalClinic',
            name: 'Clinic 1'
          }
        }
      ]
    }
  }
];

let hasError = false;
testData.forEach(test => {
  const valid = test.validator(test.data);
  if (!valid) {
    console.error(`Validation failed for ${test.name}:`);
    console.error(test.validator.errors);
    hasError = true;
  } else {
    console.log(`✅ ${test.name} is valid.`);
  }
});

if (hasError) {
  process.exit(1);
}
console.log('All SEO JSON-LD schemas validated successfully.');
