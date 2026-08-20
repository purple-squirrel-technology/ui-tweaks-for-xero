// @vitest-environment jsdom

import {beforeEach, describe, expect, it} from 'vitest';
import {applyMenuItems} from '../apply-menu-items.ts';
import type {MenuItemToggle} from '../menu-items.ts';

const menuItems: MenuItemToggle[] = [
    {
        id: 'sales-statements-menu-item',
        label: 'Sales menu: Statements',
        menuSelector: '#sales-sub-nav > ul',
        text: 'Statements',
        href: '#',
        position: {type: 'after', referenceText: 'Customers'},
    },
];

describe('applyMenuItems', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="sales-sub-nav">
        <ul>
          <li><a href="/sales-overview"><span>Sales overview</span></a></li>
          <li><a href="/customers"><span>Customers</span></a></li>
          <li><a href="/sales-settings"><span>Sales settings</span></a></li>
        </ul>
      </div>
    `;
    });

    it('inserts menu items after the configured reference item', () => {
        applyMenuItems(menuItems, {'sales-statements-menu-item': true});

        const labels = Array.from(document.querySelectorAll('#sales-sub-nav li span')).map((el) => el.textContent?.trim());
        expect(labels).toEqual(['Sales overview', 'Customers', 'Statements', 'Sales settings']);
    });

    it('removes inserted menu items when the toggle is off', () => {
        applyMenuItems(menuItems, {'sales-statements-menu-item': true});
        applyMenuItems(menuItems, {'sales-statements-menu-item': false});

        const inserted = document.querySelector('[data-tfx-menu-item-id="sales-statements-menu-item"]');
        expect(inserted).toBeNull();
    });
});
