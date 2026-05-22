import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripHtml(str: string): string {
  if (!str) return '';
  return str.replace(/(<([^>]+)>)/gi, '');
}

const translitMap: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
  'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
  'ӣ':'i','ӯ':'u','ҳ':'h','қ':'q','ғ':'g','ҷ':'j',
  'ң':'n','ү':'u','ұ':'u','ө':'o','ә':'a','і':'i',
  'ʻ':'','ʼ':'',
};

export function generateSlug(name: string): string {
  return name.toLowerCase().split('').map(c => translitMap[c] ?? c).join('')
    .replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-').replace(/^-+|-+$/g, '')
    .substring(0, 60) + '-' + Date.now().toString().slice(-4);
}
