// @vitest-environment jsdom

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {DEFAULT_DARK_READER_SETTINGS, type DarkReaderMode, type DarkReaderSettings} from '../darkreader-settings.ts';
import {startThemeController, THEME_READY_ATTRIBUTE} from '../theme-controller.ts';

function fixture(mode: DarkReaderMode, darkOS: boolean, installStyles = true) {
    let watch: (settings: DarkReaderSettings) => void = () => undefined;
    const source = {
        getValue: vi.fn(async () => ({...DEFAULT_DARK_READER_SETTINGS, mode})),
        watch: vi.fn((callback: typeof watch) => {
            watch = callback;
            return unwatch;
        }),
    };
    const unwatch = vi.fn();
    const media = Object.assign(new EventTarget(), {
        matches: darkOS,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
    });
    const engine = {
        enable: vi.fn(() => {
            if (installStyles && !document.querySelector('.darkreader--user-agent')) {
                const style = document.createElement('style');
                style.className = 'darkreader--user-agent';
                style.textContent = 'html { background: #181a1b; }';
                document.head.append(style);
            }
        }),
        disable: vi.fn(),
    };
    const start = () => startThemeController(source, engine, media, document);
    return {
        source, engine, media, start, unwatch,
        update: (settings: DarkReaderSettings) => watch(settings),
    };
}

describe('theme lifecycle', () => {
    beforeEach(() => {
        document.documentElement.removeAttribute(THEME_READY_ATTRIBUTE);
        document.documentElement.removeAttribute('data-darkreader-mode');
        document.head.innerHTML = '';
        vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    });
    afterEach(() => vi.restoreAllMocks());

    it.each([
        ['dark', false, true], ['dark', true, true],
        ['light', false, false], ['light', true, false],
        ['system', false, false], ['system', true, true],
    ] as const)('respects %s mode with OS dark=%s', async (mode, os, effectiveDark) => {
        const f = fixture(mode, os);
        const stop = f.start();
        await Promise.resolve();
        expect(f.engine.enable).toHaveBeenCalledTimes(effectiveDark ? 1 : 0);
        expect(f.engine.disable).not.toHaveBeenCalled();
        expect(document.documentElement.hasAttribute(THEME_READY_ATTRIBUTE)).toBe(true);
        stop();
    });

    it('updates dark settings and Dark/System transitions without tearing down styles', async () => {
        const f = fixture('dark', true);
        const stop = f.start();
        await Promise.resolve();
        f.update({...DEFAULT_DARK_READER_SETTINGS, mode: 'dark', brightness: 80});
        f.update({...DEFAULT_DARK_READER_SETTINGS, mode: 'system'});
        expect(f.engine.enable).toHaveBeenCalledTimes(3);
        expect(f.engine.disable).not.toHaveBeenCalled();
        stop();
    });

    it('handles live OS changes only when Follow system is selected', async () => {
        const f = fixture('system', false);
        const stop = f.start();
        await Promise.resolve();
        f.media.matches = true;
        f.media.dispatchEvent(new Event('change'));
        expect(f.engine.enable).toHaveBeenCalledTimes(1);
        f.media.matches = false;
        f.media.dispatchEvent(new Event('change'));
        expect(f.engine.disable).toHaveBeenCalledTimes(1);
        f.update({...DEFAULT_DARK_READER_SETTINGS, mode: 'light'});
        f.media.matches = true;
        f.media.dispatchEvent(new Event('change'));
        expect(f.engine.enable).toHaveBeenCalledTimes(1);
        stop();
    });

    it('waits for actual base styles rather than enable returning or a root marker', async () => {
        const f = fixture('dark', false, false);
        const stop = f.start();
        await Promise.resolve();
        document.documentElement.setAttribute('data-darkreader-mode', 'dynamic');
        const style = document.createElement('style');
        style.className = 'darkreader--user-agent';
        document.head.append(style);
        await Promise.resolve();
        expect(document.documentElement.hasAttribute(THEME_READY_ATTRIBUTE)).toBe(false);
        style.textContent = 'html { background: black; }';
        await Promise.resolve();
        expect(document.documentElement.hasAttribute(THEME_READY_ATTRIBUTE)).toBe(true);
        stop();
    });

    it('releases temporary styling immediately on Light during deferred initialization', async () => {
        const f = fixture('dark', true, false);
        const stop = f.start();
        await Promise.resolve();
        f.update({...DEFAULT_DARK_READER_SETTINGS, mode: 'light'});
        expect(document.documentElement.hasAttribute(THEME_READY_ATTRIBUTE)).toBe(true);
        expect(f.engine.disable).toHaveBeenCalledTimes(1);
        stop();
    });

    it('handles a head that is created after document-start initialization', async () => {
        const f = fixture('dark', true, false);
        const head = document.head;
        head.remove();
        const stop = f.start();
        await Promise.resolve();
        expect(document.documentElement.hasAttribute(THEME_READY_ATTRIBUTE)).toBe(false);
        const style = document.createElement('style');
        style.className = 'darkreader--fallback';
        style.textContent = 'html { background: black; }';
        head.append(style);
        document.documentElement.prepend(head);
        await Promise.resolve();
        expect(document.documentElement.hasAttribute(THEME_READY_ATTRIBUTE)).toBe(true);
        stop();
    });

    it('releases startup styling and reports errors thrown by the engine', async () => {
        const f = fixture('dark', true);
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        f.engine.enable.mockImplementation(() => { throw new Error('engine failed'); });
        const stop = f.start();
        await Promise.resolve();
        expect(document.documentElement.hasAttribute(THEME_READY_ATTRIBUTE)).toBe(true);
        expect(f.engine.disable).toHaveBeenCalledTimes(1);
        expect(error).toHaveBeenCalledWith('Failed to apply theme settings', expect.any(Error));
        stop();
    });

    it('does not let a stale initial storage read overwrite a watch notification', async () => {
        const f = fixture('dark', true);
        let resolve!: (settings: DarkReaderSettings) => void;
        f.source.getValue.mockReturnValue(new Promise(done => { resolve = done; }));
        const stop = f.start();
        f.update({...DEFAULT_DARK_READER_SETTINGS, mode: 'light'});
        resolve({...DEFAULT_DARK_READER_SETTINGS, mode: 'dark'});
        await Promise.resolve();
        expect(f.engine.enable).not.toHaveBeenCalled();
        stop();
    });

    it('releases the fallback and reports failed settings reads', async () => {
        const f = fixture('dark', true);
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        f.source.getValue.mockRejectedValue(new Error('storage failed'));
        const stop = f.start();
        await Promise.resolve();
        await Promise.resolve();
        expect(document.documentElement.hasAttribute(THEME_READY_ATTRIBUTE)).toBe(true);
        expect(error).toHaveBeenCalled();
        stop();
    });

    it('bounds deferred observation to DOM readiness and reports missing engine styles', async () => {
        const f = fixture('dark', true, false);
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const stop = f.start();
        await Promise.resolve();
        vi.spyOn(document, 'readyState', 'get').mockReturnValue('interactive');
        document.dispatchEvent(new Event('DOMContentLoaded'));
        expect(document.documentElement.hasAttribute(THEME_READY_ATTRIBUTE)).toBe(true);
        expect(error).toHaveBeenCalled();
        expect(f.engine.disable).toHaveBeenCalledTimes(1);
        stop();
    });

    it('cleans up subscriptions and ignores reads or updates after invalidation', async () => {
        const f = fixture('dark', true);
        const stop = f.start();
        stop();
        await Promise.resolve();
        f.update({...DEFAULT_DARK_READER_SETTINGS, mode: 'dark'});
        f.media.dispatchEvent(new Event('change'));
        expect(f.unwatch).toHaveBeenCalledTimes(1);
        expect(f.engine.enable).not.toHaveBeenCalled();
    });
});
