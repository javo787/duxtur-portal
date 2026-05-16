import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripHtml(str: string): string {
  if (!str) return '';
  return str.replace(/(<([^>]+)>)/gi, '');
}
