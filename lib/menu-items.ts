export type MenuItemPosition =
  | { type: 'start' }
  | { type: 'end' }
  | { type: 'before'; referenceSelector?: string; referenceText?: string }
  | { type: 'after'; referenceSelector?: string; referenceText?: string };

export interface MenuItemToggle {
  /** Stable id persisted in storage as the toggle key. Never reuse for a different item. */
  id: string;
  /** Label shown next to the checkbox in the popup. */
  label: string;
  /** CSS selector for the target menu list (usually a <ul>). */
  menuSelector: string;
  /** Link text for the inserted menu item. */
  text: string;
  /** Link URL for the inserted menu item. */
  href: string;
  /**
   * Where to place the inserted item.
   * For before/after, use either a selector or visible text from an existing item.
   */
  position: MenuItemPosition;
}

export const MENU_ITEMS: MenuItemToggle[] = [
  {
    id: 'sales-statements-menu-item',
    label: 'Sales menu: Statements',
    menuSelector: '#sales-sub-nav > ul',
    text: 'Statements',
    href: 'https://go.xero.com/AccountsReceivable/Statements.aspx',
    position: { type: 'after', referenceText: 'Customers' },
  },
];
