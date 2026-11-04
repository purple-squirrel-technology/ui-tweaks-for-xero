import {describe, expect, it} from 'vitest';
import {
    DEFAULT_DARK_READER_SETTINGS,
    getDarkReaderOptions,
} from '../darkreader-settings.ts';

describe('Dark Reader settings', () => {
    it('defaults to following the system with neutral adjustments', () => {
        expect(DEFAULT_DARK_READER_SETTINGS).toEqual({
            mode: 'system',
            brightness: 100,
            contrast: 100,
            sepia: 0,
            grayscale: 0,
        });
    });

    it('maps saved appearance controls to Dark Reader options', () => {
        expect(getDarkReaderOptions({
            mode: 'dark',
            brightness: 90,
            contrast: 110,
            sepia: 10,
            grayscale: 20,
        })).toEqual({
            mode: 1,
            brightness: 90,
            contrast: 110,
            sepia: 10,
            grayscale: 20,
        });
    });
});
