export interface FlyoutItem {
  /** Display text for the link. */
  label: string;
  /** URL the link points to. Use '#' as a placeholder until real URLs are known. */
  href: string;
}

export interface MenuFlyout {
  /** Stable id persisted in storage as the toggle key. Never reuse for a different flyout. */
  id: string;
  /** Label shown next to the checkbox in the popup. */
  label: string;
  /**
   * CSS selector that uniquely matches the existing <a> element within the target menu item.
   * The parent <li> will be replaced with a flyout menu item while the toggle is on.
   */
  anchorSelector: string;
  /** Items to display in the flyout submenu. */
  items: FlyoutItem[];
}

export const FLYOUTS: MenuFlyout[] = [
  {
    id: 'invoices-flyout',
    label: 'Invoices flyout menu',
    anchorSelector: 'a[href="https://go.xero.com/AccountsReceivable/Search.aspx"]',
    items: [
      { label: 'All', href: '#' },
      { label: 'Draft', href: '#' },
      { label: 'Awaiting Approval', href: '#' },
      { label: 'Awaiting Payment', href: '#' },
      { label: 'Paid', href: '#' },
    ],
  },
];
