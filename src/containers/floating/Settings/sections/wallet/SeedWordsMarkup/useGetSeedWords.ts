import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function useGetSeedWords() {
    const [seedWords, setSeedWords] = useState<string[]>([]);
    const [seedWordsFetching, setSeedWordsFetching] = useState(false);

    const getSeedWords = useCallback(async () => {
        setSeedWordsFetching(true);
        try {
            const seedWords = await invoke('get_seed_words');
            setSeedWords(seedWords);

            if (seedWords.length) {
                return seedWords;
            }
        } catch (e) {
            console.error('Could not get seed words', e);
        } finally {
            setSeedWordsFetching(false);
        }
    }, []);

    return {
        seedWords,
        getSeedWords,
        seedWordsFetched: seedWords.length > 0,
        seedWordsFetching,
    };
}
