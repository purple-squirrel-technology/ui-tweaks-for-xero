import type { MenuFlyout } from './flyouts';
import type { ToggleState } from './toggles';

/** Active MutationObservers waiting for a target element to appear, keyed by flyout id. */
const pendingObservers = new Map<string, MutationObserver>();

/** Cleanup functions (remove panel + listeners) keyed by flyout id. */
const cleanups = new Map<string, () => void>();

/**
 * Attaches or detaches flyout panels based on the current toggle state.
 * Idempotent — safe to call repeatedly. Uses a MutationObserver internally
 * when a target element isn't in the DOM yet (handles SPA lazy rendering).
 */
export function applyFlyouts(flyouts: MenuFlyout[], state: ToggleState): void {
  for (const flyout of flyouts) {
    const isOn = Boolean(state[flyout.id]);
    const isAttached = document.querySelector(`[data-tfx-flyout-id="${flyout.id}"]`) !== null;

    pendingObservers.get(flyout.id)?.disconnect();
    pendingObservers.delete(flyout.id);

    if (isOn && !isAttached) {
      if (!tryAttachFlyout(flyout)) {
        // Target not in DOM yet — watch for it (common on SPA initial load).
        const observer = new MutationObserver(() => {
          if (tryAttachFlyout(flyout)) {
            observer.disconnect();
            pendingObservers.delete(flyout.id);
          }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        pendingObservers.set(flyout.id, observer);
      }
    } else if (!isOn && isAttached) {
      detachFlyout(flyout);
    }
  }
}

/**
 * Attaches a hover-triggered floating panel to the target menu item.
 * The original <li> is left intact — only a marker attribute and hover
 * listeners are added. Returns true on success, false if the target isn't
 * found in the DOM yet.
 */
function tryAttachFlyout(flyout: MenuFlyout): boolean {
  const anchor = document.querySelector(flyout.anchorSelector);
  if (!anchor) return false;

  const li = anchor.closest('li');
  if (!li) return false;

  li.setAttribute('data-tfx-flyout-id', flyout.id);

  const panel = buildPanel(flyout);
  document.body.appendChild(panel);

  const controller = new AbortController();
  const { signal } = controller;
  let hideTimeout: ReturnType<typeof setTimeout> | undefined;

  const showPanel = () => {
    clearTimeout(hideTimeout);
    const rect = li.getBoundingClientRect();
    panel.style.top = `${rect.top}px`;
    panel.style.left = `${rect.right + 4}px`;
    panel.hidden = false;
  };

  const scheduleHide = () => {
    hideTimeout = setTimeout(() => {
      panel.hidden = true;
    }, 150);
  };

  li.addEventListener('mouseenter', showPanel, { signal });
  li.addEventListener('mouseleave', scheduleHide, { signal });
  panel.addEventListener('mouseenter', () => clearTimeout(hideTimeout), { signal });
  panel.addEventListener('mouseleave', scheduleHide, { signal });

  cleanups.set(flyout.id, () => {
    controller.abort();
    clearTimeout(hideTimeout);
    panel.remove();
    li.removeAttribute('data-tfx-flyout-id');
  });

  return true;
}

function detachFlyout(flyout: MenuFlyout): void {
  cleanups.get(flyout.id)?.();
  cleanups.delete(flyout.id);
}

function buildPanel(flyout: MenuFlyout): HTMLDivElement {
  const panel = document.createElement('div');
  panel.hidden = true;
  panel.setAttribute('data-tfx-panel-id', flyout.id);

  Object.assign(panel.style, {
    position: 'fixed',
    zIndex: '999999',
    background: '#fff',
    border: '1px solid #d8d8d8',
    borderRadius: '4px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    minWidth: '180px',
    padding: '4px 0',
  });

  const ul = document.createElement('ul');
  Object.assign(ul.style, { listStyle: 'none', margin: '0', padding: '0' });
  ul.setAttribute('role', 'menu');

  for (const item of flyout.items) {
    const li = document.createElement('li');
    li.setAttribute('role', 'none');

    const a = document.createElement('a');
    a.href = item.href;
    a.setAttribute('role', 'menuitem');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = item.label;

    Object.assign(a.style, {
      display: 'block',
      padding: '6px 16px',
      fontSize: '13px',
      color: '#1c1c1c',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
    });

    a.addEventListener('mouseenter', () => {
      a.style.background = '#f5f5f5';
    });
    a.addEventListener('mouseleave', () => {
      a.style.background = '';
    });

    li.appendChild(a);
    ul.appendChild(li);
  }

  panel.appendChild(ul);
  return panel;
}

