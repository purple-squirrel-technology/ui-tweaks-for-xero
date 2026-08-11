import { describe, expect, it } from 'vitest';
import { buildHideStyle } from './hide-style';
import type { ElementToggle } from './toggles';

const toggles: ElementToggle[] = [
  { id: 'a', label: 'A', selectors: ['.a'] },
  { id: 'b', label: 'B', selectors: ['.b1', '.b2'] },
];

describe('buildHideStyle', () => {
  it('returns an empty string when no toggles are on', () => {
    expect(buildHideStyle(toggles, {})).toBe('');
  });

  it('hides only the selectors for toggles that are on', () => {
    const css = buildHideStyle(toggles, { a: true, b: false });
    expect(css).toContain('.a');
    expect(css).not.toContain('.b1');
  });

  it('includes every selector for a multi-selector toggle', () => {
    const css = buildHideStyle(toggles, { b: true });
    expect(css).toContain('.b1');
    expect(css).toContain('.b2');
  });
});
