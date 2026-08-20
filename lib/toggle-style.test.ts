import {describe, expect, it} from 'vitest';
import {buildToggleStyle} from './toggle-style';
import type {ElementToggle} from './toggles';

const toggles: ElementToggle[] = [
    {id: 'a', label: 'A', selectors: ['.a'], css: 'display: none !important;'},
    {id: 'b', label: 'B', selectors: ['.b1', '.b2'], css: 'opacity: 0.5;\npointer-events: none;'},
];

describe('buildToggleStyle', () => {
    it('returns an empty string when no toggles are on', () => {
        expect(buildToggleStyle(toggles, {})).toBe('');
    });

    it('includes only the CSS rules for toggles that are on', () => {
        const css = buildToggleStyle(toggles, {a: true, b: false});
        expect(css).toContain('.a');
        expect(css).toContain('display: none !important;');
        expect(css).not.toContain('.b1');
    });

    it('includes every selector and declaration for a multi-selector toggle', () => {
        const css = buildToggleStyle(toggles, {b: true});
        expect(css).toContain('.b1');
        expect(css).toContain('.b2');
        expect(css).toContain('opacity: 0.5;');
        expect(css).toContain('pointer-events: none;');
    });
});
