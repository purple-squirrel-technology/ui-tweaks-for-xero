export interface ElementToggle {
  /** Stable identifier, persisted in storage as the toggle's key. Never reuse an id for a different element. */
  id: string;
  /** Label shown next to the checkbox in the popup. */
  label: string;
  /** CSS selectors that, when matched, are hidden while this toggle is on. */
  selectors: string[];
}

/**
 * Known Xero UI regions users can hide. Selectors are placeholders — Xero's
 * DOM/class names must be confirmed by inspecting the live app and updated
 * here before this is usable end to end.
 */
export const TOGGLES: ElementToggle[] = [
  {
    id: 'setup-guide',
    label: 'Setup guide',
    selectors: ['[data-automationid="guidedSetupMfe"]'],
  },
  {
    id: 'example-data-toggle',
    label: 'Example data toggle',
    selectors: ['.dashboard-template-toggle'],
  },
];

export type ToggleState = Record<string, boolean>;
