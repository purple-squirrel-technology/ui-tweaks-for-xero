import type { MenuFlyout } from './flyouts';
import type { ToggleState } from './toggles';

/** Original <li> elements saved before replacement, keyed by flyout id. */
const originals = new Map<string, Element>();

/** Active MutationObservers waiting for a target element to appear, keyed by flyout id. */
const pendingObservers = new Map<string, MutationObserver>();

/**
 * Applies or removes flyout submenus based on the current toggle state.
 * Idempotent — safe to call repeatedly. Uses a MutationObserver internally
 * when a target element isn't in the DOM yet (handles SPA lazy rendering).
 */
export function applyFlyouts(flyouts: MenuFlyout[], state: ToggleState): void {
  for (const flyout of flyouts) {
    const isOn = Boolean(state[flyout.id]);
    const isInjected = document.querySelector(`[data-tfx-flyout-id="${flyout.id}"]`) !== null;

    // Cancel any pending observer for this flyout before re-evaluating state.
    pendingObservers.get(flyout.id)?.disconnect();
    pendingObservers.delete(flyout.id);

    if (isOn && !isInjected) {
      if (!tryInjectFlyout(flyout)) {
        // Target not in DOM yet — watch for it (common on SPA initial load).
        const observer = new MutationObserver(() => {
          if (tryInjectFlyout(flyout)) {
            observer.disconnect();
            pendingObservers.delete(flyout.id);
          }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        pendingObservers.set(flyout.id, observer);
      }
    } else if (!isOn && isInjected) {
      removeFlyout(flyout);
    }
  }
}

/** Attempts to inject the flyout. Returns true on success, false if target not found. */
function tryInjectFlyout(flyout: MenuFlyout): boolean {
  const anchor = document.querySelector(flyout.anchorSelector);
  if (!anchor) return false;

  const originalLi = anchor.closest('li');
  if (!originalLi) return false;

  const itemLabel =
    anchor.querySelector('.x-nav--nav-item-text')?.textContent ?? flyout.label;

  originals.set(flyout.id, originalLi.cloneNode(true) as Element);

  const subNavId = `tfx-flyout-${flyout.id}`;

  const newLi = document.createElement('li');
  newLi.className = 'x-nav--nav-item x-nav--nav-item-menu';
  newLi.setAttribute('data-tfx-flyout-id', flyout.id);

  const button = document.createElement('button');
  button.className =
    'x-nav-xui-button x-nav-xui-button-borderless-standard x-nav-xui-button-small x-nav-xui-button-fullwidth';
  button.type = 'button';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', subNavId);

  const buttonSpan = document.createElement('span');
  buttonSpan.className = 'x-nav--nav-item-text';
  buttonSpan.setAttribute('role', 'none');
  buttonSpan.textContent = itemLabel;
  button.appendChild(buttonSpan);

  const subNavDiv = document.createElement('div');
  subNavDiv.className = 'x-nav--sub-nav-container';
  subNavDiv.id = subNavId;
  subNavDiv.hidden = true;

  const ul = document.createElement('ul');
  ul.className = 'x-nav--nav-item-list x-nav--nav-item-list-level-3';
  ul.setAttribute('aria-label', `${itemLabel} sub-menu`);

  for (const item of flyout.items) {
    const itemLi = document.createElement('li');
    itemLi.className = 'x-nav--nav-item x-nav--nav-item-link';

    const a = document.createElement('a');
    a.className =
      'x-nav-xui-button x-nav-xui-button-borderless-standard x-nav-xui-button-small x-nav-xui-button-fullwidth';
    a.href = item.href;
    a.setAttribute('rel', 'noopener noreferrer');
    a.setAttribute('role', 'link');
    a.tabIndex = 0;

    const span = document.createElement('span');
    span.className = 'x-nav--nav-item-text';
    span.setAttribute('role', 'none');
    span.textContent = item.label;

    a.appendChild(span);
    itemLi.appendChild(a);
    ul.appendChild(itemLi);
  }

  subNavDiv.appendChild(ul);
  newLi.appendChild(button);
  newLi.appendChild(subNavDiv);

  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    subNavDiv.hidden = expanded;
  });

  originalLi.replaceWith(newLi);
  return true;
}

function removeFlyout(flyout: MenuFlyout): void {
  const injectedLi = document.querySelector(`[data-tfx-flyout-id="${flyout.id}"]`);
  if (!injectedLi) return;

  const original = originals.get(flyout.id);
  if (original) {
    injectedLi.replaceWith(original.cloneNode(true));
    originals.delete(flyout.id);
  } else {
    injectedLi.remove();
  }
}
