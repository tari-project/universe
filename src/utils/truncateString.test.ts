import { describe, it, expect } from 'vitest';
import { truncateMiddle } from './truncateString';

describe('truncateMiddle', () => {
    describe('basic truncation', () => {
        it('returns original string if shorter than limit', () => {
            expect(truncateMiddle('hello', 10)).toBe('hello');
        });

        it('returns original string if equal to limit', () => {
            expect(truncateMiddle('hello', 5)).toBe('hello');
        });

        it('truncates long strings with default separator', () => {
            const result = truncateMiddle('abcdefghij', 3);
            expect(result).toBe('abc...hij');
        });

        it('uses custom separator', () => {
            const result = truncateMiddle('abcdefghij', 3, '---');
            expect(result).toBe('abc---hij');
        });
    });

    describe('edge cases', () => {
        it('handles empty string', () => {
            expect(truncateMiddle('', 5)).toBe('');
        });

        it('handles single character limit', () => {
            const result = truncateMiddle('abcdef', 1);
            expect(result).toBe('a...f');
        });

        it('handles limit of 2', () => {
            const result = truncateMiddle('abcdefgh', 2);
            expect(result).toBe('ab...gh');
        });
    });

    describe('wallet address formatting', () => {
        it('truncates base58 addresses correctly', () => {
            const address = 'f4JqEQNnzg8VoL4dMYYZjNPwUMkpjUNnvT9FeHvhYZsC';
            const result = truncateMiddle(address, 6);
            expect(result).toBe('f4JqEQ...vhYZsC');
            expect(result.length).toBeLessThan(address.length);
        });

        it('truncates hex addresses correctly', () => {
            const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f7bDe1';
            const result = truncateMiddle(address, 6);
            expect(result).toBe('0x742d...f7bDe1');
        });
    });

    describe('separator variations', () => {
        it('works with empty separator', () => {
            const result = truncateMiddle('abcdefghij', 3, '');
            expect(result).toBe('abchij');
        });

        it('works with single char separator', () => {
            const result = truncateMiddle('abcdefghij', 3, '…');
            expect(result).toBe('abc…hij');
        });

        it('works with long separator', () => {
            const result = truncateMiddle('abcdefghij', 2, ' [truncated] ');
            expect(result).toBe('ab [truncated] ij');
        });
    });

    describe('emoji handling', () => {
        it('handles strings with emojis', () => {
            const emojiString = '😀😃😄😁😆😅🤣😂';
            const result = truncateMiddle(emojiString, 2);
            expect(result).toBe('😀😃...🤣😂');
        });

        it('handles mixed emoji and text', () => {
            const mixed = '🏠abc🏠abc🏠';
            const result = truncateMiddle(mixed, 2);
            expect(result).toBe('🏠🏠...🏠🏠');
        });

        it('handles emoji-only addresses', () => {
            const emojiAddress = '🌟🌙⭐💫✨🌟🌙⭐💫✨';
            const result = truncateMiddle(emojiAddress, 3);
            expect(result).toBe('🌟🌙⭐...⭐💫✨');
        });
    });

    describe('unicode handling', () => {
        it('handles unicode characters', () => {
            const unicode = 'αβγδεζηθ';
            const result = truncateMiddle(unicode, 2);
            expect(result).toBe('αβ...ηθ');
        });
    });
});
