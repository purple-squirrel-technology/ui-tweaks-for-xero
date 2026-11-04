import type {DarkReaderSettings} from './darkreader-settings.ts';

export const UPDATE_THEME_MESSAGE = 'tfx:update-theme';

export type ThemeUpdateResponse =
    | {ok: true; settings: DarkReaderSettings}
    | {ok: false; error: string};

export function isThemeUpdate(value: unknown): value is Partial<DarkReaderSettings> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const ranges: Record<string, [number, number]> = {
        brightness: [50, 150],
        contrast: [50, 150],
        sepia: [0, 100],
        grayscale: [0, 100],
    };
    return Object.entries(value).every(([key, setting]) => {
        if (key === 'mode') return ['system', 'dark', 'light'].includes(setting);
        const range = ranges[key];
        return range !== undefined && typeof setting === 'number' &&
            Number.isInteger(setting) && setting >= range[0] && setting <= range[1];
    });
}
