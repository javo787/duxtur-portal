import { CATEGORIES, type Category, type Topic } from './types';

/**
 * Curated topics, picked for the readers of the portal (Central Asia): common conditions plus the ones
 * that are specific to the region (brucellosis, echinococcosis, iodine deficiency, cutaneous leishmaniasis...).
 *
 * `query` is an English phrase: MedlinePlus and Europe PMC are English sources. The article itself is
 * written in all five portal languages afterwards.
 *
 * ~120 topics at one article per 3 days is about a year of content. When the list runs out the plan
 * endpoint says so (and the admin is told), instead of repeating.
 */
const RAW: ReadonlyArray<readonly [Category, string, string]> = [
  // cardiology
  ['cardiology', 'hypertension', 'high blood pressure'],
  ['cardiology', 'high-cholesterol', 'high blood cholesterol'],
  ['cardiology', 'heart-attack-signs', 'heart attack'],
  ['cardiology', 'atrial-fibrillation', 'atrial fibrillation'],
  ['cardiology', 'heart-failure', 'heart failure'],
  ['cardiology', 'atherosclerosis', 'atherosclerosis'],
  ['cardiology', 'coronary-artery-disease', 'coronary artery disease'],
  ['cardiology', 'peripheral-artery-disease', 'peripheral arterial disease'],
  ['cardiology', 'low-blood-pressure', 'low blood pressure'],
  ['cardiology', 'rheumatic-heart-disease', 'rheumatic heart disease'],
  ['cardiology', 'cardiomyopathy', 'cardiomyopathy'],
  ['cardiology', 'deep-vein-thrombosis', 'deep vein thrombosis'],
  ['cardiology', 'salt-and-blood-pressure', 'sodium in diet'],

  // neurology
  ['neurology', 'migraine', 'migraine'],
  ['neurology', 'stroke', 'stroke'],
  ['neurology', 'epilepsy', 'epilepsy'],
  ['neurology', 'parkinson-disease', 'Parkinson disease'],
  ['neurology', 'alzheimer-disease', 'Alzheimer disease'],
  ['neurology', 'tension-headache', 'headache'],
  ['neurology', 'sciatica', 'sciatica'],
  ['neurology', 'multiple-sclerosis', 'multiple sclerosis'],
  ['neurology', 'peripheral-neuropathy', 'peripheral neuropathy'],
  ['neurology', 'bell-palsy', 'Bell palsy'],
  ['neurology', 'concussion', 'concussion'],
  ['neurology', 'dizziness-vertigo', 'dizziness and vertigo'],
  ['neurology', 'restless-legs', 'restless legs syndrome'],
  ['neurology', 'dementia', 'dementia'],

  // dentistry
  ['dentistry', 'tooth-decay', 'tooth decay'],
  ['dentistry', 'gum-disease', 'gum disease'],
  ['dentistry', 'wisdom-teeth', 'wisdom tooth'],
  ['dentistry', 'dental-implants', 'dental implants'],
  ['dentistry', 'tooth-sensitivity', 'tooth sensitivity'],
  ['dentistry', 'fluoride', 'fluoride'],
  ['dentistry', 'bad-breath', 'bad breath'],
  ['dentistry', 'braces', 'orthodontics braces'],
  ['dentistry', 'dry-mouth', 'dry mouth'],
  ['dentistry', 'canker-sores', 'canker sores'],
  ['dentistry', 'teeth-grinding', 'bruxism'],
  ['dentistry', 'root-canal', 'root canal'],
  ['dentistry', 'oral-cancer', 'mouth cancer'],

  // pediatrics
  ['pediatrics', 'childhood-vaccines', 'childhood immunization'],
  ['pediatrics', 'fever-in-children', 'fever in children'],
  ['pediatrics', 'breastfeeding', 'breastfeeding'],
  ['pediatrics', 'infant-colic', 'colic'],
  ['pediatrics', 'childhood-asthma', 'asthma in children'],
  ['pediatrics', 'ear-infection', 'ear infections'],
  ['pediatrics', 'diarrhea-dehydration-children', 'diarrhea in children'],
  ['pediatrics', 'adhd', 'attention deficit hyperactivity disorder'],
  ['pediatrics', 'rickets', 'rickets'],
  ['pediatrics', 'childhood-obesity', 'obesity in children'],
  ['pediatrics', 'measles', 'measles'],
  ['pediatrics', 'chickenpox', 'chickenpox'],
  ['pediatrics', 'croup', 'croup'],
  ['pediatrics', 'bedwetting', 'bedwetting'],
  ['pediatrics', 'iron-deficiency-children', 'iron deficiency anemia in children'],
  ['pediatrics', 'hand-foot-mouth', 'hand, foot and mouth disease'],

  // dermatology
  ['dermatology', 'eczema', 'eczema'],
  ['dermatology', 'psoriasis', 'psoriasis'],
  ['dermatology', 'acne', 'acne'],
  ['dermatology', 'sun-protection', 'sun protection'],
  ['dermatology', 'skin-cancer', 'skin cancer'],
  ['dermatology', 'fungal-skin-infections', 'ringworm and fungal skin infections'],
  ['dermatology', 'hives', 'hives'],
  ['dermatology', 'rosacea', 'rosacea'],
  ['dermatology', 'scabies', 'scabies'],
  ['dermatology', 'warts', 'warts'],
  ['dermatology', 'hair-loss', 'hair loss'],
  ['dermatology', 'contact-dermatitis', 'contact dermatitis'],
  ['dermatology', 'vitiligo', 'vitiligo'],
  ['dermatology', 'cutaneous-leishmaniasis', 'leishmaniasis'],
  ['dermatology', 'head-lice', 'head lice'],

  // ophthalmology
  ['ophthalmology', 'cataract', 'cataract'],
  ['ophthalmology', 'glaucoma', 'glaucoma'],
  ['ophthalmology', 'dry-eye', 'dry eye'],
  ['ophthalmology', 'conjunctivitis', 'pink eye conjunctivitis'],
  ['ophthalmology', 'myopia', 'nearsightedness myopia'],
  ['ophthalmology', 'diabetic-retinopathy', 'diabetic eye problems'],
  ['ophthalmology', 'macular-degeneration', 'age-related macular degeneration'],
  ['ophthalmology', 'digital-eye-strain', 'eye strain'],
  ['ophthalmology', 'amblyopia', 'lazy eye amblyopia'],
  ['ophthalmology', 'eye-injuries', 'eye injuries'],
  ['ophthalmology', 'astigmatism', 'astigmatism'],
  ['ophthalmology', 'retinal-detachment', 'retinal detachment'],
  ['ophthalmology', 'stye', 'stye'],

  // surgery
  ['surgery', 'appendicitis', 'appendicitis'],
  ['surgery', 'hernia', 'hernia'],
  ['surgery', 'gallstones', 'gallstones'],
  ['surgery', 'varicose-veins', 'varicose veins'],
  ['surgery', 'hemorrhoids', 'hemorrhoids'],
  ['surgery', 'kidney-stones', 'kidney stones'],
  ['surgery', 'thyroid-nodules', 'thyroid nodules'],
  ['surgery', 'fracture-care', 'broken bones'],
  ['surgery', 'osteoarthritis', 'osteoarthritis'],
  ['surgery', 'back-pain', 'back pain'],
  ['surgery', 'anesthesia', 'anesthesia'],
  ['surgery', 'wound-care', 'wound healing'],
  ['surgery', 'burn-first-aid', 'burns'],
  ['surgery', 'scoliosis', 'scoliosis'],
  ['surgery', 'osteoporosis', 'osteoporosis'],
  ['surgery', 'hip-fracture', 'hip fracture'],

  // gynecology
  ['gynecology', 'first-trimester', 'pregnancy first trimester'],
  ['gynecology', 'prenatal-care', 'prenatal care'],
  ['gynecology', 'gestational-diabetes', 'gestational diabetes'],
  ['gynecology', 'menopause', 'menopause'],
  ['gynecology', 'pcos', 'polycystic ovary syndrome'],
  ['gynecology', 'endometriosis', 'endometriosis'],
  ['gynecology', 'cervical-cancer-screening', 'cervical cancer screening'],
  ['gynecology', 'mammography', 'mammography breast cancer screening'],
  ['gynecology', 'contraception', 'birth control methods'],
  ['gynecology', 'menstrual-cramps', 'menstrual cramps'],
  ['gynecology', 'uterine-fibroids', 'uterine fibroids'],
  ['gynecology', 'preeclampsia', 'preeclampsia'],
  ['gynecology', 'infertility', 'infertility'],
  ['gynecology', 'postpartum-depression', 'postpartum depression'],
  ['gynecology', 'anemia-in-pregnancy', 'anemia in pregnancy'],

  // general
  ['general', 'type-2-diabetes', 'type 2 diabetes'],
  ['general', 'prediabetes', 'prediabetes'],
  ['general', 'iron-deficiency-anemia', 'iron deficiency anemia'],
  ['general', 'vitamin-d-deficiency', 'vitamin D'],
  ['general', 'iodine-deficiency', 'iodine'],
  ['general', 'hepatitis-b', 'hepatitis B'],
  ['general', 'hepatitis-c', 'hepatitis C'],
  ['general', 'tuberculosis', 'tuberculosis'],
  ['general', 'brucellosis', 'brucellosis'],
  ['general', 'echinococcosis', 'echinococcosis hydatid disease'],
  ['general', 'food-poisoning', 'food poisoning'],
  ['general', 'influenza', 'influenza'],
  ['general', 'antibiotic-resistance', 'antibiotic resistance'],
  ['general', 'healthy-sleep', 'sleep'],
  ['general', 'physical-activity', 'exercise and physical fitness'],
  ['general', 'smoking-cessation', 'quitting smoking'],
  ['general', 'obesity', 'obesity in adults'],
  ['general', 'chronic-kidney-disease', 'chronic kidney disease'],
  ['general', 'fatty-liver', 'fatty liver disease'],
  ['general', 'anxiety', 'anxiety disorders'],
  ['general', 'depression', 'depression'],
  ['general', 'gerd', 'GERD acid reflux'],
  ['general', 'h-pylori', 'Helicobacter pylori infections'],
  ['general', 'irritable-bowel', 'irritable bowel syndrome'],
  ['general', 'hypothyroidism', 'hypothyroidism'],
  ['general', 'pneumonia', 'pneumonia'],
  ['general', 'copd', 'COPD'],
  ['general', 'heat-illness', 'heat stroke and heat exhaustion'],
  ['general', 'safe-drinking-water', 'water safety'],
];

export const TOPICS: readonly Topic[] = RAW.map(([category, key, query]) => ({ key, category, query }));

export const topicByKey = (key: string): Topic | undefined => TOPICS.find((t) => t.key === key);

export interface UsedTopic {
  topicKey: string;
  category: string;
  /** When the article was published. */
  at: Date | string | number;
}

/**
 * Next topic to write about, or null when every topic is used (or skipped).
 *
 * Rotates through categories so the blog does not run nine cardiology posts in a row: the category that was
 * written about longest ago goes first (a category never used counts as "longest ago"), ties are broken by
 * the order of CATEGORIES. Inside a category, topics go in list order.
 */
export function pickTopic(used: readonly UsedTopic[], skip: readonly string[] = [], topics: readonly Topic[] = TOPICS): Topic | null {
  const taken = new Set<string>([...used.map((u) => u.topicKey), ...skip]);
  const free = topics.filter((t) => !taken.has(t.key));
  if (free.length === 0) return null;

  const lastUse = new Map<string, number>();
  for (const u of used) {
    const at = new Date(u.at).getTime();
    if (Number.isFinite(at) && at > (lastUse.get(u.category) ?? -Infinity)) lastUse.set(u.category, at);
  }

  const categories = CATEGORIES.filter((c) => free.some((t) => t.category === c));
  const lastOf = (c: string) => lastUse.get(c) ?? -Infinity;
  // Explicit comparison: -Infinity minus -Infinity is NaN, which is not a valid comparator result.
  // Array.prototype.sort is stable, so equal timestamps keep the CATEGORIES order.
  categories.sort((a, b) => (lastOf(a) < lastOf(b) ? -1 : lastOf(a) > lastOf(b) ? 1 : 0));
  return free.find((t) => t.category === categories[0]) ?? null;
}
