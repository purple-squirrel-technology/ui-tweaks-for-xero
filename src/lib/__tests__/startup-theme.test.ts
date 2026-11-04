import {describe, expect, it, vi} from 'vitest';
import type {browser} from 'wxt/browser';
import dark from '../../../public/theme-startup-dark.css?raw';
import system from '../../../public/theme-startup-system.css?raw';
import {DEFAULT_DARK_READER_SETTINGS, type DarkReaderMode} from '../darkreader-settings.ts';
import {createStartupThemeCoordinator, STARTUP_THEME_ID, XERO_MATCHES} from '../startup-theme.ts';
import {isThemeUpdate} from '../theme-messages.ts';

function fixture(mode: DarkReaderMode = 'system') {
    let settings = {...DEFAULT_DARK_READER_SETTINGS, mode};
    let registered: Parameters<typeof browser.scripting.registerContentScripts>[0] = [];
    const calls: string[] = [];
    const scripting = {
        getRegisteredContentScripts: vi.fn(async () => registered),
        registerContentScripts: vi.fn(async (scripts: typeof registered) => {
            calls.push(`register:${scripts[0]?.css?.[0]}`);
            registered = scripts;
        }),
        unregisterContentScripts: vi.fn(async () => {
            calls.push('remove');
            registered = [];
        }),
    };
    const storage = {
        getValue: vi.fn(async () => settings),
        setValue: vi.fn(async (value: typeof settings) => {
            calls.push(`save:${value.mode}`);
            settings = value;
        }),
    };
    return {scripting, storage, calls, coordinator: createStartupThemeCoordinator(scripting, storage)};
}

describe('startup theme registration', () => {
    it.each(['dark', 'system', 'light'] as const)('registers appropriate CSS for %s', async mode => {
        const {coordinator, scripting} = fixture(mode);
        await coordinator.reconcile();
        if (mode === 'light') {
            expect(scripting.registerContentScripts).not.toHaveBeenCalled();
        } else {
            expect(scripting.registerContentScripts).toHaveBeenCalledWith([{
                id: STARTUP_THEME_ID,
                css: [`theme-startup-${mode}.css`],
                matches: XERO_MATCHES,
                runAt: 'document_start',
                allFrames: true,
                matchOriginAsFallback: true,
                persistAcrossSessions: true,
            }]);
        }
        expect(scripting.getRegisteredContentScripts).toHaveBeenCalledWith({ids: [STARTUP_THEME_ID]});
    });

    it('reuses persisted registrations on startup and appearance-only updates', async () => {
        const {coordinator, scripting} = fixture('dark');
        await coordinator.reconcile();
        await coordinator.reconcile();
        await coordinator.update({brightness: 80});
        expect(scripting.registerContentScripts).toHaveBeenCalledTimes(1);
        expect(scripting.unregisterContentScripts).not.toHaveBeenCalled();
    });

    it('serializes rapid changes and removes old CSS before saving the new mode', async () => {
        const {coordinator, calls, storage} = fixture('dark');
        await coordinator.reconcile();
        calls.length = 0;
        await Promise.all([
            coordinator.update({mode: 'light'}),
            coordinator.update({mode: 'system'}),
            coordinator.update({contrast: 120}),
        ]);
        expect(calls).toEqual([
            'remove', 'save:light', 'save:system', 'register:theme-startup-system.css', 'save:system',
        ]);
        expect(await storage.getValue()).toMatchObject({mode: 'system', contrast: 120});
    });

    it('does not save Light if removing Dark CSS fails, and keeps the queue usable', async () => {
        const {coordinator, scripting, storage} = fixture('dark');
        await coordinator.reconcile();
        scripting.unregisterContentScripts.mockRejectedValueOnce(new Error('remove failed'));
        await expect(coordinator.update({mode: 'light'})).rejects.toThrow('remove failed');
        expect(storage.setValue).not.toHaveBeenCalled();
        await coordinator.update({mode: 'light'});
        expect(await storage.getValue()).toMatchObject({mode: 'light'});
    });

    it('restores the saved mode registration after a storage write failure', async () => {
        const {coordinator, scripting, storage} = fixture('dark');
        await coordinator.reconcile();
        storage.setValue.mockRejectedValueOnce(new Error('write failed'));
        await expect(coordinator.update({mode: 'light'})).rejects.toThrow('write failed');
        expect(await storage.getValue()).toMatchObject({mode: 'dark'});
        expect(scripting.registerContentScripts).toHaveBeenCalledTimes(2);
    });

    it('reports registration failures even when reconciliation repairs them', async () => {
        const {coordinator, scripting, storage} = fixture('light');
        scripting.registerContentScripts.mockRejectedValueOnce(new Error('register failed'));
        await expect(coordinator.update({mode: 'dark'})).rejects.toThrow('register failed');
        expect(await storage.getValue()).toMatchObject({mode: 'dark'});
        expect(scripting.registerContentScripts).toHaveBeenCalledTimes(2);
    });

    it('logs failed repairs without swallowing the original error', async () => {
        const {coordinator, scripting} = fixture('light');
        const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        scripting.registerContentScripts.mockRejectedValue(new Error('register failed'));
        await expect(coordinator.update({mode: 'dark'})).rejects.toThrow('register failed');
        expect(log).toHaveBeenCalledWith(
            'Failed to reconcile startup theme after saving error', expect.any(Error),
        );
        log.mockRestore();
    });

    it('removes a stale registration when storage changes outside the popup', async () => {
        const {coordinator, scripting, storage} = fixture('dark');
        await coordinator.reconcile();
        await storage.setValue({...DEFAULT_DARK_READER_SETTINGS, mode: 'light'});
        await coordinator.reconcile();
        expect(scripting.unregisterContentScripts).toHaveBeenCalledWith({ids: [STARTUP_THEME_ID]});
    });
});

describe('startup CSS assets', () => {
    it('gates only System CSS on the OS preference and gates both on the handoff attribute', () => {
        expect(dark).not.toContain('@media');
        expect(system.trim()).toBe(`@media (prefers-color-scheme: dark) {\n${dark.trimEnd().split('\n').map(line => `    ${line}`).join('\n')}\n}`);
        expect(dark).toContain('html:not([data-tfx-theme-ready]) body');
        expect(dark).not.toMatch(/visibility|display|opacity|filter/);
    });
});

describe('theme message validation', () => {
    it.each([null, [], {mode: 'unknown'}, {contrast: 151}, {brightness: NaN},
        {sepia: -1}, {grayscale: 1.5}, {extra: true}])('rejects invalid updates: %j', value => {
        expect(isThemeUpdate(value)).toBe(false);
    });

    it('accepts supported partial settings only', () => {
        expect(isThemeUpdate({mode: 'light', brightness: 50, contrast: 150, sepia: 0, grayscale: 100})).toBe(true);
    });
});
