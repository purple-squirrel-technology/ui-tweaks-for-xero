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
      { label: 'All', href: 'https://go.xero.com/AccountsReceivable/Search.aspx' },
      { label: 'Draft', href: 'https://go.xero.com/AccountsReceivable/Search.aspx?invoiceStatus=INVOICESTATUS/DRAFT' },
      { label: 'Awaiting Approval', href: 'https://go.xero.com/AccountsReceivable/Search.aspx?invoiceStatus=INVOICESTATUS/SUBMITTED' },
      { label: 'Awaiting Payment', href: 'https://go.xero.com/AccountsReceivable/Search.aspx?invoiceStatus=INVOICESTATUS/AUTHORISED' },
      { label: 'Paid', href: 'https://go.xero.com/AccountsReceivable/Search.aspx?invoiceStatus=INVOICESTATUS/PAID' },
      { label: 'Repeating', href: 'https://go.xero.com/AccountsReceivable/SearchRepeating.aspx' },
    ],
  },{
    id: 'bills-flyout',
    label: 'Bills flyout menu',
    anchorSelector: 'a[href^="https://go.xero.com/app/"][href$="/bills"]',
    items: [
      { label: 'All', href: 'https://go.xero.com/app/bills/list/all' },
      { label: 'Draft', href: 'https://go.xero.com/app/bills/list/draft' },
      { label: 'Awaiting Approval', href: 'https://go.xero.com/app/bills/list/awaiting-approval' },
      { label: 'Awaiting Payment', href: 'https://go.xero.com/app//bills/list/awaiting-payment' },
      { label: 'Paid', href: 'https://go.xero.com/app/bills/list/paid' },
      { label: 'Repeating', href: 'https://go.xero.com/app/bills/list/repeating' },
    ],
  }
];
