import { describe, it, expect } from 'vitest';
import {
    isAddress,
    toChecksumAddress,
    isChecksumAddress,
    isTariBase58Address,
    isTariEmojiAddress,
    isTariAddress,
    shortenAddress,
    formatAddress,
    keccak256,
} from './address';

describe('address utils', () => {
    describe('keccak256', () => {
        it('hashes empty string correctly', () => {
            expect(keccak256('')).toBe('c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
        });

        it('hashes standard message correctly', () => {
            expect(keccak256('hello world')).toBe('47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad');
        });
    });

    describe('isAddress', () => {
        const validChecksum = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
        const validLower = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';
        const validUpper = '0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED';
        const invalidChecksum = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeD'; // wrong case on last char

        it('validates checksummed address', () => {
            expect(isAddress(validChecksum)).toBe(true);
        });

        it('validates all lowercase address', () => {
            expect(isAddress(validLower)).toBe(true);
        });

        it('validates all uppercase address', () => {
            expect(isAddress(validUpper)).toBe(true);
        });

        it('rejects mixed case with invalid checksum', () => {
            expect(isAddress(invalidChecksum)).toBe(false);
        });

        it('enforces strict checksum when requested', () => {
            expect(isAddress(validChecksum, { strictChecksum: true })).toBe(true);
            expect(isAddress(validLower, { strictChecksum: true })).toBe(false);
            expect(isAddress(validUpper, { strictChecksum: true })).toBe(false);
        });

        it('rejects invalid inputs', () => {
            expect(isAddress('')).toBe(false);
            expect(isAddress(null)).toBe(false);
            expect(isAddress(undefined)).toBe(false);
            expect(isAddress(12345)).toBe(false);
            expect(isAddress({})).toBe(false);
            expect(isAddress('0x123')).toBe(false);
            expect(isAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed11')).toBe(false);
            expect(isAddress('5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toBe(false);
            expect(isAddress('0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ')).toBe(false);
        });
    });

    describe('toChecksumAddress', () => {
        it('calculates EIP-55 checksum correctly', () => {
            expect(toChecksumAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toBe(
                '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
            );
            expect(toChecksumAddress('0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359')).toBe(
                '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359'
            );
            expect(toChecksumAddress('0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb')).toBe(
                '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB'
            );
            expect(toChecksumAddress('0xd1220a0cf47c7b9be7a2e6ba89f429762e7b9adb')).toBe(
                '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb'
            );
        });

        it('handles address without 0x prefix', () => {
            expect(toChecksumAddress('5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toBe(
                '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
            );
        });

        it('throws TypeError for invalid address', () => {
            expect(() => toChecksumAddress('0x123')).toThrow(TypeError);
            expect(() => toChecksumAddress('' as unknown as string)).toThrow(TypeError);
        });
    });

    describe('isChecksumAddress', () => {
        it('identifies correctly checksummed addresses', () => {
            expect(isChecksumAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);
            expect(isChecksumAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toBe(false);
            expect(isChecksumAddress('0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED')).toBe(false);
        });
    });

    describe('Tari address validation', () => {
        const tariBase58 =
            'f25eNHz2YnBVKHaqNuacGyDFB321RwwCnTr4vb2SjQCgDZVXyNNthc7zftQKRDu6evLjvSUD8W5akpPMdhS4HQ9kF3g';
        const tariEmoji =
            '🍗🌊😇🦀🚽💈🎠🍚🦂🌕🎩💨👂🏰📜👞🎵🐬🐚💄🚨🔋🐀🐯💻👗🐊👠🦀🐝🚦🍌🎋🎼🍗🎮🎉👗🐮🎨👾🔧🤖💋🐾💨🎃🍀🦂🐀🐬🔱🥝👕🎳⏰🎃🐉💍🙈🍉🔱🎣🐢👒🍊👅';

        it('validates Tari Base58 address', () => {
            expect(isTariBase58Address(tariBase58)).toBe(true);
            expect(isTariAddress(tariBase58)).toBe(true);
            expect(isTariBase58Address('short')).toBe(false);
            expect(isTariBase58Address('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(false);
        });

        it('validates Tari Emoji address', () => {
            expect(isTariEmojiAddress(tariEmoji)).toBe(true);
            expect(isTariAddress(tariEmoji)).toBe(true);
            expect(isTariEmojiAddress('mixed🦀text')).toBe(false);
            expect(isTariEmojiAddress('')).toBe(false);
        });
    });

    describe('shortenAddress and formatAddress', () => {
        it('shortens hex address correctly', () => {
            const addr = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
            expect(shortenAddress(addr, 6, 4)).toBe('0x5aAe...eAed');
        });

        it('shortens emoji address correctly', () => {
            const emojiAddr = '🌟🌙⭐💫✨🌟🌙⭐💫✨';
            expect(shortenAddress(emojiAddr, 2, 2)).toBe('🌟🌙...💫✨');
        });

        it('formats address according to preset', () => {
            const addr = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';
            expect(formatAddress(addr, 'checksum')).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
            expect(formatAddress(addr, 'lowercase')).toBe(addr);
            expect(formatAddress(addr, 'shortened')).toBe('0x5aae...eaed');
        });
    });
});
