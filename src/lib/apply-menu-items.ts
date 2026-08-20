import type {MenuItemPosition, MenuItemToggle} from './menu-items.ts';
import type {ToggleState} from './toggles.ts';

/** Active MutationObservers waiting for menu nodes to appear, keyed by menu item id. */
const pendingObservers = new Map<string, MutationObserver>();

/**
 * Attaches or detaches inserted menu items based on the current toggle state.
 * Idempotent — safe to call repeatedly.
 */
export function applyMenuItems(menuItems: MenuItemToggle[], state: ToggleState): void {
    for (const menuItem of menuItems) {
        const isOn = Boolean(state[menuItem.id]);
        const existing = document.querySelector(`[data-tfx-menu-item-id="${menuItem.id}"]`);

        pendingObservers.get(menuItem.id)?.disconnect();
        pendingObservers.delete(menuItem.id);

        if (isOn && !existing) {
            if (!tryInsertMenuItem(menuItem)) {
                const observer = new MutationObserver(() => {
                    if (tryInsertMenuItem(menuItem)) {
                        observer.disconnect();
                        pendingObservers.delete(menuItem.id);
                    }
                });
                observer.observe(document.documentElement, {childList: true, subtree: true});
                pendingObservers.set(menuItem.id, observer);
            }
        } else if (!isOn && existing) {
            existing.remove();
        }
    }
}

function tryInsertMenuItem(menuItem: MenuItemToggle): boolean {
    const menu = document.querySelector(menuItem.menuSelector);
    if (!(menu instanceof HTMLElement)) return false;

    if (menu.querySelector(`[data-tfx-menu-item-id="${menuItem.id}"]`)) return true;

    if (menuItem.position.type === 'before' || menuItem.position.type === 'after') {
        const reference = findReferenceLi(menu, menuItem.position);
        if (!reference) return false;
    }

    const li = buildInsertedLi(menu, menuItem);
    return insertLi(menu, li, menuItem.position);
}

function findReferenceLi(menu: HTMLElement, position: Extract<MenuItemPosition, {
    type: 'before' | 'after'
}>): HTMLLIElement | null {
    if (position.referenceSelector) {
        const reference = menu.querySelector(position.referenceSelector);
        if (!reference) return null;
        const li = reference.closest('li');
        return li instanceof HTMLLIElement ? li : null;
    }

    if (position.referenceText) {
        const items = Array.from(menu.querySelectorAll('li'));
        for (const item of items) {
            if (!(item instanceof HTMLLIElement)) continue;
            if (hasExactText(item, position.referenceText)) return item;
        }
    }

    return null;
}

function hasExactText(container: HTMLElement, text: string): boolean {
    const needles = Array.from(container.querySelectorAll('a, button, span, [role="menuitem"]'));
    return needles.some((el) => el.textContent?.trim() === text);
}

function insertLi(menu: HTMLElement, li: HTMLLIElement, position: MenuItemPosition): boolean {
    if (position.type === 'start') {
        menu.prepend(li);
        return true;
    }

    if (position.type === 'end') {
        menu.append(li);
        return true;
    }

    const reference = findReferenceLi(menu, position);
    if (!reference) return false;

    if (position.type === 'before') {
        menu.insertBefore(li, reference);
        return true;
    }

    reference.after(li);
    return true;
}

function buildInsertedLi(menu: HTMLElement, menuItem: MenuItemToggle): HTMLLIElement {
    const template = menu.querySelector('li:not([data-tfx-menu-item-id])');
    const li = template instanceof HTMLLIElement ? (template.cloneNode(true) as HTMLLIElement) : document.createElement('li');
    const anchor = li.querySelector('a') ?? document.createElement('a');

    if (!anchor.parentElement) li.append(anchor);
    li.setAttribute('data-tfx-menu-item-id', menuItem.id);
    li.removeAttribute('id');

    anchor.setAttribute('href', menuItem.href);
    anchor.removeAttribute('id');

    const templateSpan = anchor.querySelector('span');
    anchor.replaceChildren();
    if (templateSpan instanceof HTMLSpanElement) {
        const textSpan = templateSpan.cloneNode(false) as HTMLSpanElement;
        textSpan.textContent = menuItem.text;
        anchor.append(textSpan);
    } else {
        anchor.textContent = menuItem.text;
    }

    return li;
}
