import {storage} from '#imports';
import type {ToggleState} from './toggles.ts';
import {DEFAULT_DARK_READER_SETTINGS, type DarkReaderSettings} from './darkreader-settings.ts';

/** Per-toggle on/off state, shared between the popup and the content script. */
export const toggleStateItem = storage.defineItem<ToggleState>('local:toggleState', {
    fallback: {},
});

/** Dark Reader mode and appearance settings shared between popup and content script. */
export const darkReaderSettingsItem = storage.defineItem<DarkReaderSettings>('local:darkReaderSettings', {
    fallback: DEFAULT_DARK_READER_SETTINGS,
});
