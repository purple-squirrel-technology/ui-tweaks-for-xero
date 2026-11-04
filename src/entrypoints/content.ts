// noinspection JSUnusedGlobalSymbols

import {auto as followSystemColorScheme, disable, enable, setFetchMethod} from 'darkreader';
import {applyFlyouts} from '../lib/apply-flyouts.ts';
import {applyMenuItems} from '../lib/apply-menu-items.ts';
import {buildToggleStyle} from '../lib/toggle-style.ts';
import {darkReaderSettingsItem, toggleStateItem} from '../lib/storage.ts';
import {getDarkReaderOptions, type DarkReaderSettings} from '../lib/darkreader-settings.ts';
import {FLYOUTS} from '../lib/flyouts.ts';
import {MENU_ITEMS} from '../lib/menu-items.ts';
import {TOGGLES, type ToggleState} from '../lib/toggles.ts';

const darkReaderFixes: NonNullable<Parameters<typeof enable>[1]> = {
    css: `
        nav.x-nav--top {
            background: \${white} !important;
        }
        select.xui-datepicker--heading-select {
            background: \${white} !important;
        }
        div.action-bar {
            background: \${white} !important;
        }
        div.button {
            background: \${white} !important;
        }
        #sbContainer_ {
            background: \${white} !important;
        }
        div.document div.button a:link, div.document div.button a:visited, div.document div.button a:active, div.document div.button a:hover {
            background: unset !important;
        }
        
        div.document div.button a:link, div.document div.button a:visited, div.document div.button a:active, div.document div.button a:hover {
            background-image: unset !important;
        }
        div.page-title {
            background: \${white} !important;
        }
        div.bubbleToolbar {
            background: \${white} !important;
        }
    `,
    invert: [],
    ignoreInlineStyle: [],
    ignoreImageAnalysis: [],
    disableStyleSheetsProxy: false,
    ignoreCSSUrl: [],
};

export default defineContentScript({
    matches: ['https://*.xero.com/*'],
    runAt: 'document_start',
    allFrames: true,
    matchAboutBlank: true,
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

        const applyDarkReaderSettings = (settings: DarkReaderSettings) => {
            setFetchMethod(window.fetch.bind(window));
            followSystemColorScheme(false);
            disable();

            if (settings.mode === 'system') {
                followSystemColorScheme(getDarkReaderOptions(settings), darkReaderFixes);
            } else if (settings.mode === 'dark') {
                enable(getDarkReaderOptions(settings), darkReaderFixes);
            }
        };

        darkReaderSettingsItem.getValue()
            .then(applyDarkReaderSettings)
            .catch(error => console.error('Failed to load Dark Reader settings', error));
        darkReaderSettingsItem.watch(applyDarkReaderSettings);
    },
});
