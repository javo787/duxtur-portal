import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// The promises of MOTION.md, checked in the stylesheet itself so a later edit cannot break them quietly.
const css = readFileSync(join(__dirname, 'globals.css'), 'utf8');

/** The body of the first rule that starts with `selector {` */
function rule(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, `${selector} exists`).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf('}', start));
}

describe('motion contract (globals.css)', () => {
  it('server HTML is the visible state: only the pending state hides anything', () => {
    expect(rule("[data-reveal='pending']")).toContain('opacity: 0');
    expect(rule("[data-reveal='shown']")).toContain('opacity: 1');
    // no bare [data-reveal] / .hero-rise rule may start from opacity 0 outside an animation
    expect(css).not.toMatch(/\[data-reveal\]\s*\{[^}]*opacity:\s*0/);
    expect(rule('.hero-rise')).not.toMatch(/opacity:\s*0/);
  });

  it('reduced motion forces content visible and switches animations off', () => {
    const reduced = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toContain('[data-reveal]');
    expect(reduced).toMatch(/opacity:\s*1\s*!important/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\*,\s*\*::before,\s*\*::after\s*\{\s*animation: none !important;\s*transition: none !important;/);
  });

  it('the motion system itself never loops and never uses linear easing', () => {
    // comments explain the rules in words, so look at the declarations only
    const system = css.slice(css.indexOf('/* ───────── Motion')).replace(/\/\*[\s\S]*?\*\//g, '');
    expect(system).not.toMatch(/infinite/);
    expect(system).not.toMatch(/\blinear\b/);
  });

  it('the entrance and reveal animate transform and opacity only', () => {
    for (const body of [rule('@keyframes rise'), rule("[data-reveal='pending']"), rule("[data-reveal='shown']")]) {
      const props = [...body.matchAll(/([a-z-]+)\s*:/g)].map(m => m[1]);
      for (const prop of props) {
        expect(['from', 'to', 'opacity', 'transform', 'transition', 'transition-delay']).toContain(prop);
      }
    }
  });
});
