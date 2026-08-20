import {storage} from '#imports';
import type {ToggleState} from './toggles.ts';

/** Per-toggle on/off state, shared between the popup and the content script. */
export const toggleStateItem = storage.defineItem<ToggleState>('local:toggleState', {
    fallback: {},
});
