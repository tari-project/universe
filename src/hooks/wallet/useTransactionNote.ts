import { useCallback, useState } from 'react';

// Notes are a local annotation only: the wallet backend has no note field, so they live in
// localStorage keyed by transaction id and never leave the device.
const STORAGE_KEY = 'tari-universe:transaction-notes';

function readNotes(): Record<string, string> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, string>;
        }
        return {};
    } catch {
        return {};
    }
}

function writeNotes(notes: Record<string, string>): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
        console.warn('Could not save transaction note:', e);
    }
}

/** A user-written note attached to a transaction, persisted in localStorage. */
export function useTransactionNote(transactionId: number): [string, (note: string) => void] {
    const [note, setNote] = useState<string>(() => readNotes()[String(transactionId)] ?? '');

    const saveNote = useCallback(
        (value: string) => {
            setNote(value);
            const notes = readNotes();
            if (value) {
                notes[String(transactionId)] = value;
            } else {
                delete notes[String(transactionId)];
            }
            writeNotes(notes);
        },
        [transactionId]
    );

    return [note, saveNote];
}
