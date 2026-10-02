/** Duxtur Edu (active_study) is mounted under this path via a rewrite in next.config.ts. */
export const EDU_BASE = '/edu';

export function isEduPath(pathname: string): boolean {
  return pathname === EDU_BASE || pathname.startsWith(`${EDU_BASE}/`);
}
