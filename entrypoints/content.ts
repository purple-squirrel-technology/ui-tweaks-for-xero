import { applyFlyouts } from '../lib/apply-flyouts';
import { buildToggleStyle } from '../lib/toggle-style';
import { toggleStateItem } from '../lib/storage';
import { FLYOUTS } from '../lib/flyouts';
import { TOGGLES, type ToggleState } from '../lib/toggles';

export default defineContentScript({
  matches: ['https://go.xero.com/*','https://reporting.xero.com/*'],
  main() {
    const styleEl = document.createElement('style');
    styleEl.id = 'tools-for-xero-toggle-style';
    document.documentElement.appendChild(styleEl);

    const applyState = (state: ToggleState) => {
      styleEl.textContent = buildToggleStyle(TOGGLES, state);
      applyFlyouts(FLYOUTS, state);
    };

    toggleStateItem.getValue().then(applyState);
    toggleStateItem.watch(applyState);
  },
});
