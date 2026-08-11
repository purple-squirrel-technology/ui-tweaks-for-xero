import type { ElementToggle, ToggleState } from './toggles';

/**
 * Builds the CSS text that hides every selector belonging to a toggle
 * that is currently on. Pure function so it can be unit tested without a DOM.
 */
export function buildHideStyle(toggles: ElementToggle[], state: ToggleState): string {
  const selectors = toggles
    .filter((toggle) => state[toggle.id])
    .flatMap((toggle) => toggle.selectors);

  if (selectors.length === 0) {
    return '';
  }

  return `${selectors.join(',\n')} {\n  display: none !important;\n}`;
}
