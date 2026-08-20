// @vitest-environment jsdom

import {beforeEach, describe, expect, it, vi} from 'vitest';
import {applyFlyouts} from '../apply-flyouts.ts';
import type {MenuFlyout} from '../flyouts.ts';

const flyouts: MenuFlyout[] = [
    {
        id: 'reports-flyout',
        label: 'Reports',
        anchorSelector: 'a[href="#reports"]',
        items: [
            {label: 'Summary', href: '#summary'},
            {label: 'Details', href: '#details'},
        ],
    },
];

describe('applyFlyouts', () => {
    beforeEach(() => {
        vi.useRealTimers();
        // noinspection HtmlUnknownAnchorTarget
        document.body.innerHTML = `
            <nav>
                <ul>
                    <li><a href="#reports">Reports</a></li>
                </ul>
            </nav>
        `;
    });

    it('attaches a flyout panel and populates it with links when enabled', () => {
        applyFlyouts(flyouts, {'reports-flyout': true});

        const li = document.querySelector('li');
        const panel = document.querySelector('[data-tfx-panel-id="reports-flyout"]');
        const links = Array.from(panel?.querySelectorAll('a') ?? []);

        expect(li?.getAttribute('data-tfx-flyout-id')).toBe('reports-flyout');
        expect(panel).not.toBeNull();
        expect(links).toHaveLength(2);
        expect(links.map((link) => link.textContent?.trim())).toEqual(['Summary', 'Details']);
        expect(links.map((link) => link.getAttribute('href'))).toEqual(['#summary', '#details']);
    });

    it('shows and hides the panel on hover transitions', () => {
        vi.useFakeTimers();
        applyFlyouts(flyouts, {'reports-flyout': true});

        const li = document.querySelector('li');
        const panel = document.querySelector('[data-tfx-panel-id="reports-flyout"]') as HTMLDivElement | null;

        expect(panel).not.toBeNull();
        expect(panel?.hidden).toBe(true);

        li?.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true}));
        expect(panel?.hidden).toBe(false);

        li?.dispatchEvent(new MouseEvent('mouseleave', {bubbles: true}));
        vi.advanceTimersByTime(150);
        expect(panel?.hidden).toBe(true);
    });

    it('removes the flyout when the toggle is disabled and waits for late DOM insertion', async () => {
        document.body.innerHTML = '<nav><ul></ul></nav>';
        applyFlyouts(flyouts, {'reports-flyout': true});

        expect(document.querySelector('[data-tfx-panel-id="reports-flyout"]')).toBeNull();

        const list = document.querySelector('ul');
        // noinspection HtmlUnknownAnchorTarget
        list?.insertAdjacentHTML('beforeend', '<li><a href="#reports">Reports</a></li>');
        await Promise.resolve();

        expect(document.querySelector('[data-tfx-flyout-id="reports-flyout"]')).not.toBeNull();

        applyFlyouts(flyouts, {'reports-flyout': false});

        expect(document.querySelector('[data-tfx-flyout-id="reports-flyout"]')).toBeNull();
        expect(document.querySelector('[data-tfx-panel-id="reports-flyout"]')).toBeNull();
    });
});
