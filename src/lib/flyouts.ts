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
        label: 'Invoices',
        anchorSelector: 'a[href="https://go.xero.com/AccountsReceivable/Search.aspx"]',
        items: [
            {label: 'All', href: 'https://go.xero.com/AccountsReceivable/Search.aspx'},
            {
                label: 'Draft',
                href: 'https://go.xero.com/AccountsReceivable/Search.aspx?invoiceStatus=INVOICESTATUS/DRAFT'
            },
            {
                label: 'Awaiting Approval',
                href: 'https://go.xero.com/AccountsReceivable/Search.aspx?invoiceStatus=INVOICESTATUS/SUBMITTED'
            },
            {
                label: 'Awaiting Payment',
                href: 'https://go.xero.com/AccountsReceivable/Search.aspx?invoiceStatus=INVOICESTATUS/AUTHORISED'
            },
            {
                label: 'Paid',
                href: 'https://go.xero.com/AccountsReceivable/Search.aspx?invoiceStatus=INVOICESTATUS/PAID'
            },
            {label: 'Repeating', href: 'https://go.xero.com/AccountsReceivable/SearchRepeating.aspx'},
        ],
    }, {
        id: 'quotes-flyout',
        label: 'Quotes',
        anchorSelector: 'a[href^="https://go.xero.com/Accounts/Receivable/Quotes/Search"]',
        items: [
            {label: 'All', href: 'https://go.xero.com/Accounts/Receivable/Quotes/Search'},
            {label: 'Draft', href: 'https://go.xero.com/app/quotes-list/quotes/draft?status=draft'},
            {label: 'Sent', href: 'https://go.xero.com/app/quotes-list/quotes/sent?status=sent'},
            {label: 'Declined', href: 'https://go.xero.com/app/quotes-list/quotes/declined?status=declined'},
            {label: 'Accepted', href: 'https://go.xero.com/app/quotes-list/quotes/accepted?status=accepted'},
            {label: 'Invoiced', href: 'https://go.xero.com/app/quotes-list/quotes/invoiced?status=invoiced'},
        ],
    }, {
        id: 'bills-flyout',
        label: 'Bills',
        anchorSelector: 'a[href^="https://go.xero.com/app/"][href$="/bills"]',
        items: [
            {label: 'All', href: 'https://go.xero.com/app/bills/list/all'},
            {label: 'Draft', href: 'https://go.xero.com/app/bills/list/draft'},
            {label: 'Awaiting Approval', href: 'https://go.xero.com/app/bills/list/awaiting-approval'},
            {label: 'Awaiting Payment', href: 'https://go.xero.com/app//bills/list/awaiting-payment'},
            {label: 'Paid', href: 'https://go.xero.com/app/bills/list/paid'},
            {label: 'Repeating', href: 'https://go.xero.com/app/bills/list/repeating'},
        ],
    }, {
        id: 'purchase-orders-flyout',
        label: 'Purchase Orders',
        anchorSelector: 'a[href^="https://go.xero.com/Accounts/Payable/PurchaseOrders/Search"]',
        items: [
            {label: 'All', href: 'https://go.xero.com/Accounts/Payable/PurchaseOrders/Search'},
            {label: 'Draft', href: 'https://go.xero.com/app/purchase-orders/list/draft'},
            {label: 'Awaiting approval', href: 'https://go.xero.com/app/purchase-orders/list/awaiting-approval'},
            {label: 'Approved', href: 'https://go.xero.com/app/purchase-orders/list/approved'},
            {label: 'Billed', href: 'https://go.xero.com/app/!pd2jb/purchase-orders/list/billed'},
        ],
    }, {
        id: 'bank-rules-flyout',
        label: 'Bank Rules',
        anchorSelector: 'a[href^="https://go.xero.com/app/bank-rules"]',
        items: [
            {label: 'Spend rules', href: 'https://go.xero.com/app/bank-rules/spend'},
            {label: 'Receive rules', href: 'https://go.xero.com/app/bank-rules/receive'},
            {label: 'Transfer rules', href: 'https://go.xero.com/app/bank-rules/transfer'},
        ],
    }, {
        id: 'chart-of-accounts-flyout',
        label: 'Chart of Accounts',
        anchorSelector: 'a[href^="https://go.xero.com/GeneralLedger/ChartOfAccounts.aspx"]',
        items: [
            {label: 'All Accounts', href: 'https://go.xero.com/GeneralLedger/ChartOfAccounts.aspx'},
            {
                label: 'Assets',
                href: 'https://go.xero.com/GeneralLedger/ChartOfAccounts.aspx?accountClass=ACCTCLASS/ASSET&PageSize=200'
            },
            {
                label: 'Liabilities',
                href: 'https://go.xero.com/GeneralLedger/ChartOfAccounts.aspx?accountClass=ACCTCLASS/LIABILITY&PageSize=200'
            },
            {
                label: 'Equity',
                href: 'https://go.xero.com/GeneralLedger/ChartOfAccounts.aspx?accountClass=ACCTCLASS/EQUITY&PageSize=200'
            },
            {
                label: 'Expenses',
                href: 'https://go.xero.com/GeneralLedger/ChartOfAccounts.aspx?accountClass=ACCTCLASS/EXPENSE&PageSize=200'
            },
            {
                label: 'Revenue',
                href: 'https://go.xero.com/GeneralLedger/ChartOfAccounts.aspx?accountClass=ACCTCLASS/REVENUE&PageSize=200'
            },
            {
                label: 'Archive',
                href: 'https://go.xero.com/GeneralLedger/ChartOfAccounts.aspx?accountClass=ACCTSTATUS/ARCHIVED&PageSize=200'
            },
        ],
    }, {
        id: 'manual-journals-flyout',
        label: 'Manual Journals',
        anchorSelector: 'a[href^="https://go.xero.com/Journal/Search.aspx"]',
        items: [
            {label: 'All Items', href: 'https://go.xero.com/app/journals?journalStatus=ALL_ITEMS'},
            {label: 'Draft', href: 'https://go.xero.com/app/journals?journalStatus=DRAFT'},
            {label: 'Posted', href: 'https://go.xero.com/app/journals'},
            {label: 'Voided', href: 'https://go.xero.com/app/journals?journalStatus=VOIDED'},
            {label: 'Repeating', href: 'https://go.xero.com/app/journals?type=REPEATING'},
            {label: 'Archived', href: 'https://go.xero.com/app/journals?journalStatus=ARCHIVED'},
        ],
    }, {
        id: 'assurrance-dashboard-flyout',
        label: 'Assurance Dashboard',
        anchorSelector: 'a[href^="https://go.xero.com/app/"][href$="/assurance-dashboard"]',
        items: [
            {label: 'User Activity', href: 'https://go.xero.com/app/assurance-dashboard/UserActivity'},
            {label: 'Bank Accounts', href: 'https://go.xero.com/app/assurance-dashboard/BankAccounts'},
            {label: 'Contacts', href: 'https://go.xero.com/app/assurance-dashboard/Contacts'},
            {label: 'Invoices & Bills', href: 'https://go.xero.com/app/assurance-dashboard/InvoicesAndBills'},
        ],
    }
];
