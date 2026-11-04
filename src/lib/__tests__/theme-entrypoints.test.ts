// @vitest-environment jsdom

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {DEFAULT_DARK_READER_SETTINGS, type DarkReaderSettings} from '../darkreader-settings.ts';
import {UPDATE_THEME_MESSAGE, type ThemeUpdateResponse} from '../theme-messages.ts';

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
    toggleStateItem: {getValue: async () => ({})},
}));

beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    mocks.getSettings.mockResolvedValue({...DEFAULT_DARK_READER_SETTINGS, mode: 'light'});
    mocks.reconcile.mockResolvedValue();
    mocks.update.mockResolvedValue({...DEFAULT_DARK_READER_SETTINGS, mode: 'dark'});
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
        document.body.innerHTML = '<p id="theme-error" role="alert"></p><div id="toggles"></div>';
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        await import('../../entrypoints/popup/main.ts');
        await vi.waitFor(() => expect(document.querySelector('select')).not.toBeNull());
        const select = document.querySelector('select')!;
        select.value = 'dark';
        select.dispatchEvent(new Event('change'));
    }

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
        await vi.waitFor(() => {
            expect(document.getElementById('theme-error')?.textContent).toContain('Could not fully save');
            expect(document.querySelector('select')?.value).toBe('light');
        });
    });
});
