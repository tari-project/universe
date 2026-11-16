import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTransactionNote } from './useTransactionNote.ts';

const STORAGE_KEY = 'tari-universe:transaction-notes';

describe('useTransactionNote', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('starts empty when no note was saved', () => {
        const { result } = renderHook(() => useTransactionNote(42));
        expect(result.current[0]).toBe('');
    });

    it('persists the note in localStorage keyed by transaction id', () => {
        const { result } = renderHook(() => useTransactionNote(42));
        act(() => result.current[1]('rent for March'));
        expect(result.current[0]).toBe('rent for March');
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ '42': 'rent for March' });
    });

    it('reads back a previously saved note', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ '7': 'saved earlier' }));
        const { result } = renderHook(() => useTransactionNote(7));
        expect(result.current[0]).toBe('saved earlier');
    });

    it('keeps notes of other transactions and removes the entry when cleared', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ '7': 'keep me' }));
        const { result } = renderHook(() => useTransactionNote(42));
        act(() => result.current[1]('temporary'));
        act(() => result.current[1](''));
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({ '7': 'keep me' });
    });

    it('falls back to empty when storage holds invalid JSON', () => {
        localStorage.setItem(STORAGE_KEY, 'not json');
        const { result } = renderHook(() => useTransactionNote(1));
        expect(result.current[0]).toBe('');
    });
});
