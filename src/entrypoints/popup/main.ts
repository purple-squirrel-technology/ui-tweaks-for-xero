import {darkReaderSettingsItem, toggleStateItem} from '@/lib/storage.ts';
import type {DarkReaderSettings} from '@/lib/darkreader-settings.ts';
import {browser} from 'wxt/browser';
import {UPDATE_THEME_MESSAGE, type ThemeUpdateResponse} from '@/lib/theme-messages.ts';
import {FLYOUTS} from '@/lib/flyouts.ts';
import {MENU_ITEMS} from '@/lib/menu-items.ts';
import {TOGGLES} from '@/lib/toggles.ts';

type AppearanceSetting = 'brightness' | 'contrast' | 'sepia' | 'grayscale';

let settingsUpdateQueue = Promise.resolve();

function initializeTabs() {
    const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));

    function activateTab(selected: HTMLButtonElement) {
        for (const tab of tabs) {
            const active = tab === selected;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
            document.getElementById(tab.getAttribute('aria-controls')!)!.hidden = !active;
        }
    }

    for (const [index, tab] of tabs.entries()) {
        tab.addEventListener('click', () => activateTab(tab));
        tab.addEventListener('keydown', event => {
            let nextIndex: number;
            switch (event.key) {
                case 'ArrowRight':
                    nextIndex = (index + 1) % tabs.length;
                    break;
                case 'ArrowLeft':
                    nextIndex = (index - 1 + tabs.length) % tabs.length;
                    break;
                case 'Home':
                    nextIndex = 0;
                    break;
                case 'End':
                    nextIndex = tabs.length - 1;
                    break;
                default:
                    return;
            }
            event.preventDefault();
            const nextTab = tabs[nextIndex]!;
            activateTab(nextTab);
            nextTab.focus();
        });
    }
}

function updateDarkReaderSettings(update: Partial<DarkReaderSettings>) {
    settingsUpdateQueue = settingsUpdateQueue.then(async () => {
        const response: ThemeUpdateResponse | undefined = await browser.runtime.sendMessage({
            type: UPDATE_THEME_MESSAGE,
            update,
        });
        if (!response?.ok) throw new Error(response?.error ?? 'Theme settings could not be saved');
        document.getElementById('theme-error')!.textContent = '';
    }).catch(async error => {
        console.error('Failed to save Dark Reader settings', error);
        document.getElementById('theme-error')!.textContent =
            'Could not fully save dark mode settings. Please try again.';
        try {
            await render();
        } catch (reloadError) {
            console.error('Failed to reload saved theme settings', reloadError);
        }
    });
    return settingsUpdateQueue;
}

function makeAppearanceControl(
    label: string,
    setting: AppearanceSetting,
    min: number,
    max: number,
    settings: DarkReaderSettings,
): HTMLLabelElement {
    const labelEl = document.createElement('label');
    labelEl.className = 'appearance-control';

    const title = document.createElement('span');
    title.textContent = label;

    const value = document.createElement('output');
    value.textContent = String(settings[setting]);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = '1';
    input.value = String(settings[setting]);
    input.addEventListener('input', () => {
        value.textContent = input.value;
    });
    input.addEventListener('change', () => {
        const update: Partial<DarkReaderSettings> = {};
        update[setting] = Number(input.value);
        void updateDarkReaderSettings(update);
    });

    labelEl.append(title, value, input);
    return labelEl;
}

function makeDarkReaderControls(settings: DarkReaderSettings): HTMLElement {
    const section = document.createElement('section');

    const heading = document.createElement('h2');
    heading.textContent = 'Dark mode';

    const modeLabel = document.createElement('label');
    modeLabel.className = 'mode-control';
    modeLabel.append('Mode');
    const mode = document.createElement('select');
    const modes: Array<[DarkReaderSettings['mode'], string]> = [
        ['system', 'Follow system'],
        ['dark', 'Dark'],
        ['light', 'Light'],
    ];
    for (const [value, text] of modes) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        mode.appendChild(option);
    }
    mode.value = settings.mode;
    mode.addEventListener('change', () => {
        if (mode.value === 'system' || mode.value === 'dark' || mode.value === 'light') {
            void updateDarkReaderSettings({mode: mode.value});
        }
    });
    modeLabel.appendChild(mode);

    section.append(
        heading,
        modeLabel,
        makeAppearanceControl('Brightness', 'brightness', 50, 150, settings),
        makeAppearanceControl('Contrast', 'contrast', 50, 150, settings),
        makeAppearanceControl('Sepia', 'sepia', 0, 100, settings),
        makeAppearanceControl('Grayscale', 'grayscale', 0, 100, settings),
    );
    return section;
}

function makeToggleLabel(
    id: string,
    label: string,
    state: Record<string, boolean>,
): HTMLLabelElement {
    const labelEl = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(state[id]);
    checkbox.addEventListener('change', async () => {
        const current = await toggleStateItem.getValue();
        await toggleStateItem.setValue({...current, [id]: checkbox.checked});
    });
    labelEl.appendChild(checkbox);
    labelEl.append(label);
    return labelEl;
}

async function render() {
    const container = document.getElementById('toggles');
    const darkModeContainer = document.getElementById('dark-mode-controls');
    if (!container || !darkModeContainer) return;

    const state = await toggleStateItem.getValue();
    const darkReaderSettings = await darkReaderSettingsItem.getValue();
    const children: Node[] = [];
    darkModeContainer.replaceChildren(makeDarkReaderControls(darkReaderSettings));

    if (TOGGLES.length > 0) {
        const heading = document.createElement('h2');
        heading.textContent = 'Styles';
        children.push(heading);
        for (const t of TOGGLES) children.push(makeToggleLabel(t.id, t.label, state));
    }

    if (FLYOUTS.length > 0) {
        const heading = document.createElement('h2');
        heading.textContent = 'Menu flyouts';
        children.push(heading);
        for (const f of FLYOUTS) children.push(makeToggleLabel(f.id, f.label, state));
    }

    if (MENU_ITEMS.length > 0) {
        const heading = document.createElement('h2');
        heading.textContent = 'Menu items';
        children.push(heading);
        for (const m of MENU_ITEMS) children.push(makeToggleLabel(m.id, m.label, state));
    }

    container.replaceChildren(...children);
}

initializeTabs();
render().then(r => console.log('Popup rendered', r)).catch(e => console.error('Error rendering popup', e));
