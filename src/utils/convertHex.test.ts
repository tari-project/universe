import { describe, it, expect } from 'vitest';
import { convertHexToRGBA } from './convertHex';

describe('convertHexToRGBA', () => {
    describe('6-character hex codes', () => {
        it('converts black (#000000) to rgba', () => {
            expect(convertHexToRGBA('#000000')).toBe('rgba(0,0,0,1)');
        });

        it('converts white (#FFFFFF) to rgba', () => {
            expect(convertHexToRGBA('#FFFFFF')).toBe('rgba(255,255,255,1)');
        });

        it('converts red (#FF0000) to rgba', () => {
            expect(convertHexToRGBA('#FF0000')).toBe('rgba(255,0,0,1)');
        });

        it('converts green (#00FF00) to rgba', () => {
            expect(convertHexToRGBA('#00FF00')).toBe('rgba(0,255,0,1)');
        });

        it('converts blue (#0000FF) to rgba', () => {
            expect(convertHexToRGBA('#0000FF')).toBe('rgba(0,0,255,1)');
        });

        it('converts purple (#813bf5) to rgba', () => {
            expect(convertHexToRGBA('#813bf5')).toBe('rgba(129,59,245,1)');
        });

        it('converts cyan (#00d9ff) to rgba', () => {
            expect(convertHexToRGBA('#00d9ff')).toBe('rgba(0,217,255,1)');
        });

        it('converts a dark gray (#212121) to rgba', () => {
            expect(convertHexToRGBA('#212121')).toBe('rgba(33,33,33,1)');
        });
    });

    describe('3-character hex codes (shorthand)', () => {
        it('converts #000 to rgba', () => {
            expect(convertHexToRGBA('#000')).toBe('rgba(0,0,0,1)');
        });

        it('converts #FFF to rgba', () => {
            expect(convertHexToRGBA('#FFF')).toBe('rgba(255,255,255,1)');
        });

        it('converts #F00 to rgba', () => {
            expect(convertHexToRGBA('#F00')).toBe('rgba(255,0,0,1)');
        });

        it('converts #0F0 to rgba', () => {
            expect(convertHexToRGBA('#0F0')).toBe('rgba(0,255,0,1)');
        });

        it('converts #00F to rgba', () => {
            expect(convertHexToRGBA('#00F')).toBe('rgba(0,0,255,1)');
        });

        it('converts #abc to rgba', () => {
            expect(convertHexToRGBA('#abc')).toBe('rgba(170,187,204,1)');
        });

        it('converts #123 to rgba', () => {
            expect(convertHexToRGBA('#123')).toBe('rgba(17,34,51,1)');
        });
    });

    describe('hex codes without hash', () => {
        it('converts 000000 to rgba', () => {
            expect(convertHexToRGBA('000000')).toBe('rgba(0,0,0,1)');
        });

        it('converts FFFFFF to rgba', () => {
            expect(convertHexToRGBA('FFFFFF')).toBe('rgba(255,255,255,1)');
        });

        it('converts 813bf5 to rgba', () => {
            expect(convertHexToRGBA('813bf5')).toBe('rgba(129,59,245,1)');
        });

        it('converts fff (shorthand) to rgba', () => {
            expect(convertHexToRGBA('fff')).toBe('rgba(255,255,255,1)');
        });
    });

    describe('opacity parameter (decimal 0-1)', () => {
        it('applies 0.5 opacity', () => {
            expect(convertHexToRGBA('#000000', 0.5)).toBe('rgba(0,0,0,0.5)');
        });

        it('applies 0 opacity (fully transparent)', () => {
            expect(convertHexToRGBA('#FFFFFF', 0)).toBe('rgba(255,255,255,0)');
        });

        it('applies 1 opacity (fully opaque)', () => {
            expect(convertHexToRGBA('#FF0000', 1)).toBe('rgba(255,0,0,1)');
        });

        it('applies 0.25 opacity', () => {
            expect(convertHexToRGBA('#00FF00', 0.25)).toBe('rgba(0,255,0,0.25)');
        });

        it('applies 0.75 opacity', () => {
            expect(convertHexToRGBA('#0000FF', 0.75)).toBe('rgba(0,0,255,0.75)');
        });

        it('applies 0.1 opacity', () => {
            expect(convertHexToRGBA('#813bf5', 0.1)).toBe('rgba(129,59,245,0.1)');
        });

        it('applies 0.9 opacity', () => {
            expect(convertHexToRGBA('#813bf5', 0.9)).toBe('rgba(129,59,245,0.9)');
        });
    });

    describe('opacity parameter (percentage 1-100)', () => {
        it('converts 50 to 0.5 opacity', () => {
            expect(convertHexToRGBA('#000000', 50)).toBe('rgba(0,0,0,0.5)');
        });

        it('converts 100 to 1 opacity', () => {
            expect(convertHexToRGBA('#FFFFFF', 100)).toBe('rgba(255,255,255,1)');
        });

        it('converts 25 to 0.25 opacity', () => {
            expect(convertHexToRGBA('#FF0000', 25)).toBe('rgba(255,0,0,0.25)');
        });

        it('converts 75 to 0.75 opacity', () => {
            expect(convertHexToRGBA('#00FF00', 75)).toBe('rgba(0,255,0,0.75)');
        });

        it('converts 10 to 0.1 opacity', () => {
            expect(convertHexToRGBA('#0000FF', 10)).toBe('rgba(0,0,255,0.1)');
        });

        it('converts 90 to 0.9 opacity', () => {
            expect(convertHexToRGBA('#813bf5', 90)).toBe('rgba(129,59,245,0.9)');
        });

        it('converts 2 to 0.02 opacity', () => {
            expect(convertHexToRGBA('#000000', 2)).toBe('rgba(0,0,0,0.02)');
        });
    });

    describe('edge cases', () => {
        it('handles lowercase hex', () => {
            expect(convertHexToRGBA('#ffffff')).toBe('rgba(255,255,255,1)');
        });

        it('handles uppercase hex', () => {
            expect(convertHexToRGBA('#FFFFFF')).toBe('rgba(255,255,255,1)');
        });

        it('handles mixed case hex', () => {
            expect(convertHexToRGBA('#FfFfFf')).toBe('rgba(255,255,255,1)');
        });

        it('defaults to opacity 1 when not provided', () => {
            expect(convertHexToRGBA('#000000')).toBe('rgba(0,0,0,1)');
        });

        it('handles opacity exactly at 1 (boundary)', () => {
            expect(convertHexToRGBA('#000000', 1)).toBe('rgba(0,0,0,1)');
        });

        it('handles opacity just above 1 (percentage conversion)', () => {
            // 1.5 is > 1 but <= 100, so it should be converted to 0.015
            expect(convertHexToRGBA('#000000', 1.5)).toBe('rgba(0,0,0,0.015)');
        });
    });

    describe('real-world theme colors', () => {
        it('converts Tari purple theme color', () => {
            expect(convertHexToRGBA('#813bf5', 0.8)).toBe('rgba(129,59,245,0.8)');
        });

        it('converts Tari success color', () => {
            expect(convertHexToRGBA('#c9eb00')).toBe('rgba(201,235,0,1)');
        });

        it('converts Tari fail color', () => {
            expect(convertHexToRGBA('#ff5610')).toBe('rgba(255,86,16,1)');
        });

        it('converts Tari main blue color', () => {
            expect(convertHexToRGBA('#0096ff')).toBe('rgba(0,150,255,1)');
        });

        it('converts Tari green color', () => {
            expect(convertHexToRGBA('#00c881')).toBe('rgba(0,200,129,1)');
        });

        it('converts Tari dark background', () => {
            expect(convertHexToRGBA('#212121')).toBe('rgba(33,33,33,1)');
        });

        it('converts Tari neutral color', () => {
            expect(convertHexToRGBA('#040723')).toBe('rgba(4,7,35,1)');
        });
    });
});
