// @vitest-environment jsdom

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {DEFAULT_DARK_READER_SETTINGS, type DarkReaderSettings} from '../darkreader-settings.ts';
import {UPDATE_THEME_MESSAGE, type ThemeUpdateResponse} from '../theme-messages.ts';
import popupHtml from '../../entrypoints/popup/index.html?raw';
import {TOGGLES} from '../toggles.ts';
import {FLYOUTS} from '../flyouts.ts';
import {MENU_ITEMS} from '../menu-items.ts';

type MessageListener = (message: {type: string; update: unknown}, sender: {id?: string; url?: string}) =>
    Promise<ThemeUpdateResponse> | undefined;

const mocks = vi.hoisted(() => ({
    update: vi.fn<(update: Partial<DarkReaderSettings>) => Promise<DarkReaderSettings>>(),
    reconcile: vi.fn<() => Promise<void>>(),
    onMessage: vi.fn<(listener: MessageListener) => void>(),
    onInstalled: vi.fn(),
    onStartup: vi.fn(),
    watch: vi.fn(),
    getSettings: vi.fn<() => Promise<DarkReaderSettings>>(),
    sendMessage: vi.fn<(...args: unknown[]) => Promise<ThemeUpdateResponse | undefined>>(),
    getToggleState: vi.fn<() => Promise<Record<string, boolean>>>(),
    setToggleState: vi.fn(),
}));

vi.mock('wxt/browser', () => ({
    browser: {
        scripting: {},
        runtime: {
            id: 'test-extension',
            getURL: (path: string) => `moz-extension://test${path}`,
            onMessage: {addListener: mocks.onMessage},
            onInstalled: {addListener: mocks.onInstalled},
            onStartup: {addListener: mocks.onStartup},
            sendMessage: mocks.sendMessage,
        },
    },
}));
vi.mock('../startup-theme.ts', () => ({
    createStartupThemeCoordinator: () => ({update: mocks.update, reconcile: mocks.reconcile}),
}));
vi.mock('../storage.ts', () => ({
    darkReaderSettingsItem: {getValue: mocks.getSettings, watch: mocks.watch},
    toggleStateItem: {getValue: mocks.getToggleState, setValue: mocks.setToggleState},
}));

beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    mocks.getSettings.mockResolvedValue({...DEFAULT_DARK_READER_SETTINGS, mode: 'light'});
    mocks.reconcile.mockResolvedValue();
    mocks.update.mockResolvedValue({...DEFAULT_DARK_READER_SETTINGS, mode: 'dark'});
    mocks.getToggleState.mockResolvedValue({});
});
afterEach(() => vi.restoreAllMocks());

describe('background theme coordination', () => {
    async function start() {
        const {default: background} = await import('../../entrypoints/background.ts');
        background.main();
        const listener = mocks.onMessage.mock.calls[0]?.[0];
        if (!listener) throw new Error('Background message handler was not registered');
        return listener;
    }
    const sender = {id: 'test-extension', url: 'moz-extension://test/popup.html'};

    it('reconciles at initialization and subscribes to install/startup/storage changes', async () => {
        await start();
        expect(mocks.reconcile).toHaveBeenCalledTimes(1);
        expect(mocks.onInstalled).toHaveBeenCalledWith(expect.any(Function));
        expect(mocks.onStartup).toHaveBeenCalledWith(expect.any(Function));
        expect(mocks.watch).toHaveBeenCalledWith(expect.any(Function));
    });

    it('accepts validated popup changes and returns the authoritative settings', async () => {
        const listener = await start();
        const response = await listener({type: UPDATE_THEME_MESSAGE, update: {mode: 'dark'}}, sender);
        expect(mocks.update).toHaveBeenCalledWith({mode: 'dark'});
        expect(response).toMatchObject({ok: true, settings: {mode: 'dark'}});
    });

    it('ignores unrelated messages and rejects other senders and invalid values', async () => {
        const listener = await start();
        expect(listener({type: 'unrelated', update: {}}, sender)).toBeUndefined();
        expect(await listener({type: UPDATE_THEME_MESSAGE, update: {mode: 'dark'}},
            {...sender, url: 'https://go.xero.com/'})).toMatchObject({ok: false});
        expect(await listener({type: UPDATE_THEME_MESSAGE, update: {contrast: 900}}, sender))
            .toMatchObject({ok: false});
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it('returns an explicit failure when coordination fails', async () => {
        const listener = await start();
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        mocks.update.mockRejectedValue(new Error('registration failed'));
        expect(await listener({type: UPDATE_THEME_MESSAGE, update: {mode: 'dark'}}, sender))
            .toEqual({ok: false, error: 'registration failed'});
    });
});

describe('popup theme saves', () => {
    async function start() {
        await startPopup();
        const select = document.querySelector('select')!;
        select.value = 'dark';
        select.dispatchEvent(new Event('change'));
    }

    async function startPopup() {
        const popup = new DOMParser().parseFromString(popupHtml, 'text/html');
        document.body.innerHTML = popup.body.innerHTML;
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        await import('../../entrypoints/popup/main.ts');
        await vi.waitFor(() => expect(document.querySelector('select')).not.toBeNull());
    }

    function expectActiveTab(id: string) {
        for (const tab of document.querySelectorAll<HTMLButtonElement>('[role="tab"]')) {
            const active = tab.id === id;
            expect(tab.getAttribute('aria-selected')).toBe(String(active));
            expect(tab.tabIndex).toBe(active ? 0 : -1);
            const panel = document.getElementById(tab.getAttribute('aria-controls')!)!;
            expect(panel.getAttribute('role')).toBe('tabpanel');
            expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
            expect(panel.hidden).toBe(!active);
        }
    }

    it('opens on Dark Mode with controls in their respective panels and a blank About', async () => {
        await startPopup();
        expect(Array.from(document.querySelectorAll('[role="tab"]'), tab => tab.textContent))
            .toEqual(['Dark Mode', 'Styles', 'About']);
        expectActiveTab('dark-mode-tab');
        expect(document.querySelectorAll('#dark-mode-panel select')).toHaveLength(1);
        expect(document.querySelectorAll('#dark-mode-panel input[type="range"]')).toHaveLength(4);
        expect(document.querySelectorAll('#dark-mode-panel input[type="checkbox"]')).toHaveLength(0);
        const labels = Array.from(document.querySelectorAll('#styles-panel label'), label => label.textContent);
        expect(labels).toEqual([...TOGGLES, ...FLYOUTS, ...MENU_ITEMS].map(item => item.label));
        expect(document.querySelectorAll('#styles-panel select, #styles-panel input[type="range"]')).toHaveLength(0);
        expect(document.getElementById('about-panel')!.innerHTML).toBe('');
    });

    it('switches tabs by click without saving settings', async () => {
        await startPopup();
        for (const id of ['styles-tab', 'about-tab', 'dark-mode-tab']) {
            document.getElementById(id)!.click();
            expectActiveTab(id);
        }
        expect(mocks.sendMessage).not.toHaveBeenCalled();
        expect(mocks.setToggleState).not.toHaveBeenCalled();
    });

    it('supports arrow wrapping, Home and End with automatic activation and focus', async () => {
        await startPopup();
        document.getElementById('dark-mode-tab')!.focus();
        for (const [key, id] of [
            ['ArrowLeft', 'about-tab'],
            ['ArrowRight', 'dark-mode-tab'],
            ['ArrowRight', 'styles-tab'],
            ['End', 'about-tab'],
            ['Home', 'dark-mode-tab'],
        ]) {
            const event = new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true});
            document.activeElement!.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
            expectActiveTab(id!);
            expect(document.activeElement?.id).toBe(id);
        }
        expect(mocks.sendMessage).not.toHaveBeenCalled();
        expect(mocks.setToggleState).not.toHaveBeenCalled();
    });

    it('preserves stored toggles when saving a checkbox in Styles', async () => {
        mocks.getToggleState.mockResolvedValue({'existing-toggle': true, [TOGGLES[0]!.id]: true});
        await startPopup();
        document.getElementById('styles-tab')!.click();
        const checkbox = document.querySelector<HTMLInputElement>('#styles-panel input[type="checkbox"]')!;
        expect(checkbox.checked).toBe(true);
        checkbox.click();
        await vi.waitFor(() => expect(mocks.setToggleState).toHaveBeenCalledWith({
            'existing-toggle': true,
            [TOGGLES[0]!.id]: false,
        }));
        expect(mocks.sendMessage).not.toHaveBeenCalled();
    });

    it('sends changes to the background coordinator', async () => {
        mocks.sendMessage.mockResolvedValue({ok: true, settings: {...DEFAULT_DARK_READER_SETTINGS, mode: 'dark'}});
        await start();
        await vi.waitFor(() => expect(mocks.sendMessage).toHaveBeenCalledWith({
            type: UPDATE_THEME_MESSAGE, update: {mode: 'dark'},
        }));
        expect(document.getElementById('theme-error')?.textContent).toBe('');
    });

    it.each(['response', 'connection'] as const)('shows %s failures and restores saved controls', async failure => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        if (failure === 'response') mocks.sendMessage.mockResolvedValue({ok: false, error: 'save failed'});
        else mocks.sendMessage.mockRejectedValue(new Error('background unavailable'));
        await start();
        const stylesTab = document.getElementById('styles-tab')!;
        stylesTab.click();
        stylesTab.focus();
        await vi.waitFor(() => {
            expect(document.getElementById('theme-error')?.textContent).toContain('Could not fully save');
            expect(document.querySelector('select')?.value).toBe('light');
        });
        expectActiveTab('styles-tab');
        expect(document.activeElement).toBe(stylesTab);
        document.getElementById('dark-mode-tab')!.click();
        expect(document.getElementById('theme-error')!.closest('[role="tabpanel"]')!.hasAttribute('hidden'))
            .toBe(false);
    });
});
