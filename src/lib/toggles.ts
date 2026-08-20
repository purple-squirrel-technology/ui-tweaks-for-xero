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
        id: 'nav-bar',
        label: 'Sticky navigation bar',
        selectors: ['div#shell-nav', 'div#header'],
        css: 'position: sticky; z-index: 1000; width: 100%; top: 0;',
    }
];

export type ToggleState = Record<string, boolean>;
