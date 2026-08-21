// noinspection JSUnusedGlobalSymbols

import {applyFlyouts} from '../lib/apply-flyouts.ts';
import {applyMenuItems} from '../lib/apply-menu-items.ts';
import {buildToggleStyle} from '../lib/toggle-style.ts';
import {toggleStateItem} from '../lib/storage.ts';
import {FLYOUTS} from '../lib/flyouts.ts';
import {MENU_ITEMS} from '../lib/menu-items.ts';
import {TOGGLES, type ToggleState} from '../lib/toggles.ts';

export default defineContentScript({
    matches: ['https://go.xero.com/*', 'https://reporting.xero.com/*'],
    main() {
        const styleEl = document.createElement('style');
        styleEl.id = 'ui-tweaks-for-xero-toggle-style';
        document.documentElement.appendChild(styleEl);

        const applyState = (state: ToggleState) => {
            styleEl.textContent = buildToggleStyle(TOGGLES, state);
            applyFlyouts(FLYOUTS, state);
            applyMenuItems(MENU_ITEMS, state);
        };

        toggleStateItem.getValue().then(applyState);
        toggleStateItem.watch(applyState);
    },
});
