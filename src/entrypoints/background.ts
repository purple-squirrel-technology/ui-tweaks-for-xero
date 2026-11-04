import {browser} from 'wxt/browser';
import {darkReaderSettingsItem} from '../lib/storage.ts';
import {createStartupThemeCoordinator} from '../lib/startup-theme.ts';
import {isThemeUpdate, UPDATE_THEME_MESSAGE, type ThemeUpdateResponse} from '../lib/theme-messages.ts';

export default defineBackground(() => {
    const coordinator = createStartupThemeCoordinator(browser.scripting, darkReaderSettingsItem);
    const reconcile = () => {
        void coordinator.reconcile().catch(error =>
            console.error('Failed to register startup theme', error));
    };

    browser.runtime.onMessage.addListener((message, sender) => {
        if (message?.type !== UPDATE_THEME_MESSAGE) return;
        if (sender.id !== browser.runtime.id || sender.url !== browser.runtime.getURL('/popup.html') ||
            !isThemeUpdate(message.update)) {
            return Promise.resolve<ThemeUpdateResponse>({ok: false, error: 'Invalid theme settings request'});
        }
        return coordinator.update(message.update).then(
            (settings): ThemeUpdateResponse => ({ok: true, settings}),
            (error): ThemeUpdateResponse => {
                console.error('Failed to save theme settings', error);
                return {ok: false, error: error instanceof Error ? error.message : String(error)};
            },
        );
    });

    browser.runtime.onInstalled.addListener(reconcile);
    browser.runtime.onStartup.addListener(reconcile);
    darkReaderSettingsItem.watch(reconcile);
    reconcile();
});
