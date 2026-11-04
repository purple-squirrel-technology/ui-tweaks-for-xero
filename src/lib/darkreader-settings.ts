export type DarkReaderMode = 'system' | 'dark' | 'light';

export interface DarkReaderSettings {
    mode: DarkReaderMode;
    brightness: number;
    contrast: number;
    sepia: number;
    grayscale: number;
}

export interface DarkReaderOptions {
    mode: 1;
    brightness: number;
    contrast: number;
    sepia: number;
    grayscale: number;
}

export const DEFAULT_DARK_READER_SETTINGS: DarkReaderSettings = {
    mode: 'system',
    brightness: 100,
    contrast: 100,
    sepia: 0,
    grayscale: 0,
};

export function getDarkReaderOptions(settings: DarkReaderSettings): DarkReaderOptions {
    return {
        mode: 1,
        brightness: settings.brightness,
        contrast: settings.contrast,
        sepia: settings.sepia,
        grayscale: settings.grayscale,
    };
}
