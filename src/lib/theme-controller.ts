import type {DarkReaderSettings} from './darkreader-settings.ts';

export const THEME_READY_ATTRIBUTE = 'data-tfx-theme-ready';

interface ThemeSource {
    getValue(): Promise<DarkReaderSettings>;
    watch(callback: (settings: DarkReaderSettings) => void): () => void;
}

interface ThemeEngine {
    enable(settings: DarkReaderSettings): void;
    disable(): void;
}

// These base styles are installed by the bundled Dark Reader API before dynamic CSS is ready.
function hasDarkReaderBaseStyle(document: Document): boolean {
    return Array.from(document.querySelectorAll<HTMLStyleElement>(
        'style.darkreader--fallback, style.darkreader--user-agent',
    )).some(style => Boolean(style.sheet?.cssRules.length));
}

export function startThemeController(
    source: ThemeSource,
    engine: ThemeEngine,
    media: MediaQueryList,
    document: Document,
): () => void {
    let settings: DarkReaderSettings | undefined;
    let active = false;
    let stopped = false;
    let revision = 0;
    let observer: MutationObserver | undefined;

    const releaseFallback = () => {
        document.documentElement?.setAttribute(THEME_READY_ATTRIBUTE, '');
        observer?.disconnect();
        observer = undefined;
        document.removeEventListener('DOMContentLoaded', finishHandoff);
    };

    const fail = (error: unknown) => {
        console.error('Failed to apply theme settings', error);
        releaseFallback();
        if (active) {
            active = false;
            engine.disable();
        }
    };

    function finishHandoff() {
        if (hasDarkReaderBaseStyle(document)) {
            releaseFallback();
        } else if (document.readyState !== 'loading') {
            fail(new Error('Dark Reader did not install its startup styles'));
        }
    }

    function apply() {
        if (stopped || !settings) return;
        try {
            const dark = settings.mode === 'dark' || (settings.mode === 'system' && media.matches);
            if (!dark) {
                releaseFallback();
                if (active) {
                    active = false;
                    engine.disable();
                }
                return;
            }
            active = true;
            engine.enable(settings);
            if (document.documentElement?.hasAttribute(THEME_READY_ATTRIBUTE)) return;
            if (!hasDarkReaderBaseStyle(document) && document.readyState === 'loading' && !observer) {
                observer = new MutationObserver(finishHandoff);
                observer.observe(document, {childList: true, subtree: true, characterData: true});
                document.addEventListener('DOMContentLoaded', finishHandoff, {once: true});
            }
            finishHandoff();
        } catch (error) {
            fail(error);
        }
    }

    media.addEventListener('change', apply);
    const unwatch = source.watch(value => {
        revision++;
        settings = value;
        apply();
    });
    const initialRevision = revision;
    void source.getValue().then(value => {
        if (stopped || revision !== initialRevision) return;
        settings = value;
        apply();
    }).catch(error => {
        if (!stopped && revision === initialRevision) fail(error);
    });

    return () => {
        stopped = true;
        unwatch();
        media.removeEventListener('change', apply);
        releaseFallback();
        if (active) {
            active = false;
            engine.disable();
        }
    };
}
