import * as Sentry from '@sentry/react';
import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
<<<<<<< HEAD
import { useAppStateStore } from '@app/store/appStateStore.ts';
=======
>>>>>>> main

export function useGetSeedWords() {
    const [seedWords, setSeedWords] = useState<string[]>([]);
    const [seedWordsFetching, setSeedWordsFetching] = useState(false);
    const setError = useAppStateStore((s) => s.setError);

    const getSeedWords = useCallback(async () => {
        setSeedWordsFetching(true);
        try {
            const seedWords = await invoke('get_seed_words');
            setSeedWords(seedWords);
        } catch (e) {
            console.error('Could not get seed words', e);
        } finally {
            setSeedWordsFetching(false);
        }
    }, [setError]);

    return {
        seedWords,
        getSeedWords,
        seedWordsFetched: seedWords.length > 0,
        seedWordsFetching,
    };
}
