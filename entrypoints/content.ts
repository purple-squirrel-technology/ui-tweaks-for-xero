import { applyFlyouts } from '../lib/apply-flyouts';
import { buildHideStyle } from '../lib/hide-style';
import { toggleStateItem } from '../lib/storage';
import { FLYOUTS } from '../lib/flyouts';
import { TOGGLES } from '../lib/toggles';

export default defineContentScript({
  matches: ['https://go.xero.com/*'],
  main() {
    const styleEl = document.createElement('style');
    styleEl.id = 'tools-for-xero-hide-style';
    document.documentElement.appendChild(styleEl);

    const applyState = (state: Record<string, boolean>) => {
      styleEl.textContent = buildHideStyle(TOGGLES, state);
      applyFlyouts(FLYOUTS, state);
    };

    toggleStateItem.getValue().then(applyState);
    toggleStateItem.watch(applyState);
  },
});
