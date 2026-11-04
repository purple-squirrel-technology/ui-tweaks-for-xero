import type {browser} from 'wxt/browser';
import type {DarkReaderSettings} from './darkreader-settings.ts';

export const STARTUP_THEME_ID = 'tfx-startup-theme';
export const XERO_MATCHES = ['https://go.xero.com/*', 'https://reporting.xero.com/*'];

type ThemeStorage = {
    getValue(): Promise<DarkReaderSettings>;
    setValue(value: DarkReaderSettings): Promise<void>;
};
type Scripting = Pick<typeof browser.scripting,
    'getRegisteredContentScripts' | 'registerContentScripts' | 'unregisterContentScripts'>;

export function createStartupThemeCoordinator(scripting: Scripting, storage: ThemeStorage) {
    let queue: Promise<unknown> = Promise.resolve();

    function serialize<T>(operation: () => Promise<T>): Promise<T> {
        const result = queue.then(operation);
        queue = result.catch(() => undefined);
        return result;
    }

    async function remove() {
        const registered = await scripting.getRegisteredContentScripts({ids: [STARTUP_THEME_ID]});
        if (registered.length) {
            await scripting.unregisterContentScripts({ids: [STARTUP_THEME_ID]});
        }
    }

    async function reconcile() {
        const settings = await storage.getValue();
        const css = settings.mode === 'light' ? undefined : `theme-startup-${settings.mode}.css`;
        const registered = await scripting.getRegisteredContentScripts({ids: [STARTUP_THEME_ID]});
        const existing = registered[0];
        if (!css) {
            await remove();
        } else if (!existing || registered.length !== 1 || existing.css?.[0] !== css ||
            existing.css.length !== 1 ||
            existing.runAt !== 'document_start' || !existing.allFrames ||
            !existing.persistAcrossSessions || !existing.matchOriginAsFallback ||
            JSON.stringify(existing.matches) !== JSON.stringify(XERO_MATCHES)) {
            await remove();
            await scripting.registerContentScripts([{
                id: STARTUP_THEME_ID,
                matches: XERO_MATCHES,
                css: [css],
                runAt: 'document_start',
                allFrames: true,
                matchOriginAsFallback: true,
                persistAcrossSessions: true,
            }]);
        }
    }

    return {
        reconcile: () => serialize(reconcile),
        update: (update: Partial<DarkReaderSettings>) => serialize(async () => {
            try {
                const current = await storage.getValue();
                const settings = {...current, ...update};
                // Remove stale dark CSS before saving Light (or System on a light OS).
                if (settings.mode !== current.mode) await remove();
                await storage.setValue(settings);
                await reconcile();
                return settings;
            } catch (error) {
                try {
                    await reconcile();
                } catch (repairError) {
                    console.error('Failed to reconcile startup theme after saving error', repairError);
                }
                throw error;
            }
        }),
    };
}
