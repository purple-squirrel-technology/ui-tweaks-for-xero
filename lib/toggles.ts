export interface ElementToggle {
  /** Stable identifier persisted in storage as the toggle's key. Never reuse an id for a different element. */
  id: string;
  /** Label shown next to the checkbox in the popup. */
  label: string;
  /** CSS selectors targeted while this toggle is on. */
  selectors: string[];
  /** CSS declarations applied to the selectors while this toggle is on. */
  css: string;
}

/**
 * Known Xero UI regions users can style. Selectors are placeholders — Xero's
 * DOM/class names must be confirmed by inspecting the live app and updated
 * here before this is usable end to end.
 */
export const TOGGLES: ElementToggle[] = [
  {
    id: 'setup-guide',
    label: 'Setup guide',
    selectors: ['[data-automationid="guidedSetupMfe"]'],
    css: 'display: none !important;',
  },
  {
    id: 'example-data-toggle',
    label: 'Example data toggle',
    selectors: ['.dashboard-template-toggle'],
    css: 'display: none !important;',
  },
  {
    id: 'stripe-auto-pay',
    label: 'Stripe Auto pay',
    selectors: ['.x-paymentservices-tip', 'x-paymentservices-activation'],
    css: 'display: none !important;',
  },
  {
    id: 'nav-bar',
    label: 'Navigation bar',
    selectors: ['div#shell-nav','div#header'],
    css: 'position: sticky; z-index: 1000; width: 100%; top: 0;',
  }
];

export type ToggleState = Record<string, boolean>;
