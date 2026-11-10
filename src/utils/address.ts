import emojiRegex from 'emoji-regex';

/**
 * Keccak-256 round constants (24 rounds)
 */
const RC: bigint[] = [
    0x0000000000000001n,
    0x0000000000008082n,
    0x800000000000808an,
    0x8000000080008000n,
    0x000000000000808bn,
    0x0000000080000001n,
    0x8000000080008081n,
    0x8000000000008009n,
    0x000000000000008an,
    0x0000000000000088n,
    0x0000000080008009n,
    0x000000008000000an,
    0x000000008000808bn,
    0x800000000000008bn,
    0x8000000000008089n,
    0x8000000000008003n,
    0x8000000000008002n,
    0x8000000000000080n,
    0x000000000000800an,
    0x800000008000000an,
    0x8000000080008081n,
    0x8000000000008080n,
    0x0000000080000001n,
    0x8000000080008008n,
];

/**
 * Keccak-256 rotation offsets
 */
const ROT: number[][] = [
    [0, 36, 3, 41, 18],
    [1, 44, 10, 45, 2],
    [62, 6, 43, 15, 61],
    [28, 55, 25, 21, 56],
    [27, 20, 39, 8, 14],
];

/**
 * 64-bit circular left shift
 */
function rotl64(x: bigint, n: number): bigint {
    if (n === 0) return x;
    const shift = BigInt(n);
    return ((x << shift) | (x >> (64n - shift))) & 0xffffffffffffffffn;
}

/**
 * Pure TypeScript zero-dependency Keccak-256 implementation (standard Ethereum hash)
 * @param data String or Uint8Array to hash
 * @returns 64-character lowercase hex digest
 */
export function keccak256(data: string | Uint8Array): string {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const rate = 136; // 1088 bits
    const state = new BigUint64Array(25);

    // Keccak padding: 0x01 ... 0x80
    const totalLen = Math.ceil((bytes.length + 1) / rate) * rate;
    const padded = new Uint8Array(totalLen);
    padded.set(bytes);
    padded[bytes.length] = 0x01;
    padded[totalLen - 1] |= 0x80;

    for (let offset = 0; offset < totalLen; offset += rate) {
        const block = padded.subarray(offset, offset + rate);
        const dataView = new DataView(block.buffer, block.byteOffset, rate);
        for (let i = 0; i < rate / 8; i++) {
            state[i] ^= dataView.getBigUint64(i * 8, true);
        }
        for (let round = 0; round < 24; round++) {
            const C = new BigUint64Array(5);
            for (let x = 0; x < 5; x++) {
                C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
            }
            const D = new BigUint64Array(5);
            for (let x = 0; x < 5; x++) {
                D[x] = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1);
            }
            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    state[x + y * 5] ^= D[x];
                }
            }
            const B = new BigUint64Array(25);
            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    B[y + ((2 * x + 3 * y) % 5) * 5] = rotl64(state[x + y * 5], ROT[x][y]);
                }
            }
            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    state[x + y * 5] = B[x + y * 5] ^ (~B[((x + 1) % 5) + y * 5] & B[((x + 2) % 5) + y * 5]);
                }
            }
            state[0] ^= RC[round];
        }
    }

    const outBytes = new Uint8Array(32);
    const outView = new DataView(outBytes.buffer);
    for (let i = 0; i < 4; i++) {
        outView.setBigUint64(i * 8, state[i], true);
    }
    return Array.from(outBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

const ETH_ADDRESS_BASIC_REGEX = /^0x[0-9a-fA-F]{40}$/;
const ETH_ADDRESS_ALL_LOWER_REGEX = /^0x[0-9a-f]{40}$/;
const ETH_ADDRESS_ALL_UPPER_REGEX = /^0x[0-9A-F]{40}$/;
const TARI_BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{60,120}$/;

export interface IsAddressOptions {
    /**
     * When true, enforces strict EIP-55 mixed-case checksum.
     * When false (default), accepts all-lowercase, all-uppercase, and valid checksummed mixed-case addresses.
     */
    strictChecksum?: boolean;
}

/**
 * Converts an Ethereum/EVM hex address to its EIP-55 checksummed format.
 * Compatible with `ethers.getAddress`.
 * @param address Ethereum address with or without '0x' prefix
 * @returns 0x-prefixed EIP-55 checksummed address
 */
export function toChecksumAddress(address: string): string {
    if (typeof address !== 'string') {
        throw new TypeError('Address must be a string');
    }
    const clean = address.startsWith('0x') || address.startsWith('0X') ? address.slice(2) : address;
    if (clean.length !== 40 || !/^[0-9a-fA-F]{40}$/.test(clean)) {
        throw new TypeError(`Invalid Ethereum address: ${address}`);
    }
    const lower = clean.toLowerCase();
    const hash = keccak256(lower);
    let checksum = '0x';
    for (let i = 0; i < 40; i++) {
        const char = lower[i];
        if (/[a-f]/.test(char)) {
            const nibble = parseInt(hash[i], 16);
            checksum += nibble >= 8 ? char.toUpperCase() : char;
        } else {
            checksum += char;
        }
    }
    return checksum;
}

/**
 * Checks whether the given address is already in valid EIP-55 checksum format.
 */
export function isChecksumAddress(address: string): boolean {
    if (typeof address !== 'string' || !ETH_ADDRESS_BASIC_REGEX.test(address)) {
        return false;
    }
    return toChecksumAddress(address) === address;
}

/**
 * Validates an Ethereum/EVM address.
 * Drop-in lightweight replacement for `ethers.isAddress`.
 *
 * Rules:
 * - Must be a string of exactly 42 characters starting with '0x' followed by 40 hex digits.
 * - If all-lowercase or all-uppercase: valid format.
 * - If mixed-case: strictly validates the EIP-55 checksum.
 * - If `strictChecksum` is enabled: enforces EIP-55 checksum regardless of casing.
 */
export function isAddress(address: unknown, options?: IsAddressOptions): boolean {
    if (typeof address !== 'string' || !ETH_ADDRESS_BASIC_REGEX.test(address)) {
        return false;
    }
    if (options?.strictChecksum) {
        return toChecksumAddress(address) === address;
    }
    // If all lowercase or all uppercase, it's valid unchecksummed
    if (ETH_ADDRESS_ALL_LOWER_REGEX.test(address) || ETH_ADDRESS_ALL_UPPER_REGEX.test(address)) {
        return true;
    }
    // Mixed case must match EIP-55 checksum
    return toChecksumAddress(address) === address;
}

/**
 * Validates a Tari Base58 address string.
 */
export function isTariBase58Address(address: unknown): boolean {
    if (typeof address !== 'string') return false;
    return TARI_BASE58_REGEX.test(address);
}

/**
 * Validates a Tari Emoji address string.
 */
export function isTariEmojiAddress(address: unknown): boolean {
    if (typeof address !== 'string' || !address.trim().length) return false;
    const regex = emojiRegex();
    const matches = address.match(regex);
    return matches !== null && matches.join('') === address;
}

/**
 * Validates whether an address is a valid Tari address (either Base58 or Emoji).
 */
export function isTariAddress(address: unknown): boolean {
    return isTariBase58Address(address) || isTariEmojiAddress(address);
}

/**
 * Shortens an address for UI display, preserving start and end characters.
 * Handles Ethereum addresses, Tari Base58 addresses, and Tari Emoji addresses.
 *
 * @param address The address string to shorten
 * @param startChars Number of characters/emojis to keep at the start (default 6)
 * @param endChars Number of characters/emojis to keep at the end (default 4)
 * @param separator Separator between start and end (default '...')
 */
export function shortenAddress(address: string, startChars = 6, endChars = 4, separator = '...'): string {
    if (typeof address !== 'string' || !address) return '';

    const regex = emojiRegex();
    const emojiMatches = address.match(regex);
    if (emojiMatches && emojiMatches.join('') === address) {
        if (emojiMatches.length <= startChars + endChars) return address;
        const start = emojiMatches.slice(0, startChars).join('');
        const end = emojiMatches.slice(-endChars).join('');
        return `${start}${separator}${end}`;
    }

    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}${separator}${address.slice(-endChars)}`;
}

/**
 * Formats an address according to the specified preset.
 */
export function formatAddress(address: string, preset: 'checksum' | 'lowercase' | 'shortened' = 'checksum'): string {
    switch (preset) {
        case 'checksum':
            return isAddress(address) ? toChecksumAddress(address) : address;
        case 'lowercase':
            return address.toLowerCase();
        case 'shortened':
            return shortenAddress(address);
        default:
            return address;
    }
}
