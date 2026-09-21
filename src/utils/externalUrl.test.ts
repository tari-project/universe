import { describe, it, expect } from 'vitest';
import { isAllowedExternalUrl } from './externalUrl';

describe('isAllowedExternalUrl', () => {
    it('allows http and https urls', () => {
        expect(isAllowedExternalUrl('https://tari.com')).toBe(true);
        expect(isAllowedExternalUrl('http://127.0.0.1:1420/index.html')).toBe(true);
    });

    it('rejects javascript urls', () => {
        expect(isAllowedExternalUrl('javascript:alert(1)')).toBe(false);
        expect(isAllowedExternalUrl('JavaScript:alert(1)')).toBe(false);
    });

    it('rejects file urls', () => {
        expect(isAllowedExternalUrl('file:///etc/passwd')).toBe(false);
    });

    it('rejects custom and shell-handled schemes', () => {
        expect(isAllowedExternalUrl('tari://send')).toBe(false);
        expect(isAllowedExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
        expect(isAllowedExternalUrl('vscode://file/etc/passwd')).toBe(false);
        expect(isAllowedExternalUrl('smb://attacker.example/share')).toBe(false);
    });

    it('rejects relative or unparsable values', () => {
        expect(isAllowedExternalUrl('//evil.example')).toBe(false);
        expect(isAllowedExternalUrl('/settings')).toBe(false);
        expect(isAllowedExternalUrl('')).toBe(false);
    });

    it('rejects non-string values', () => {
        expect(isAllowedExternalUrl(undefined)).toBe(false);
        expect(isAllowedExternalUrl(null)).toBe(false);
        expect(isAllowedExternalUrl({ toString: () => 'https://tari.com' })).toBe(false);
    });
});
