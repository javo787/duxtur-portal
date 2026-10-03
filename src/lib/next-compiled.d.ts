// Next.js ships its bundled path-to-regexp without type declarations. It is the matcher Next itself uses for
// redirects/rewrites, so the edu redirect test imports it to check next.config rules against real behaviour.
declare module 'next/dist/compiled/path-to-regexp' {
  export function match(path: string): (pathname: string) => false | { params: Record<string, unknown> };
}
