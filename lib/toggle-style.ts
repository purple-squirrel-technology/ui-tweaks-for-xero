import type { ElementToggle, ToggleState } from './toggles';

function indentCss(css: string): string {
  return css
    .trim()
    .split('\n')
    .map((line) => `  ${line.trim()}`)
    .join('\n');
}

/**
 * Builds the CSS text for every toggle that is currently on. Pure function so
 * it can be unit tested without a DOM.
 */
export function buildToggleStyle(toggles: ElementToggle[], state: ToggleState): string {
  return toggles
    .filter((toggle) => state[toggle.id] && toggle.selectors.length > 0 && toggle.css.trim() !== '')
    .map((toggle) => `${toggle.selectors.join(',\n')} {\n${indentCss(toggle.css)}\n}`)
    .join('\n\n');
}
