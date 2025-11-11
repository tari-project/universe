import { useCallback, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { setError } from '@app/store';

interface Arguments {
    fetchMoneroSeeds?: boolean;
}
export function useGetSeedWords(args?: Arguments) {
    const hasFetched = useRef(false);
    const [seedWords, setSeedWords] = useState<string[]>([]);
    const [seedWordsFetching, setSeedWordsFetching] = useState(false);

    const { fetchMoneroSeeds = false } = args || {};

    const getSeedWords = useCallback(async () => {
        setSeedWordsFetching(true);

        const commandName = fetchMoneroSeeds ? 'get_monero_seed_words' : 'get_seed_words';
        try {
            const seedWords: string[] = await invoke(commandName);
            if (seedWords.length) {
                hasFetched.current = true;
                setSeedWords(seedWords);
                return seedWords;
            }
        } catch (e) {
            const errorMessage = e as unknown as string;
            if (
                !errorMessage.includes('User canceled the operation') &&
                !errorMessage.includes('PIN entry cancelled')
            ) {
                setError(errorMessage);
            }
            console.error('Could not get seed words', e);
            return [];
        } finally {
            setSeedWordsFetching(false);
        }
    }, [fetchMoneroSeeds]);

    return {
        seedWords,
        getSeedWords,
        setSeedWords,
        seedWordsFetched: hasFetched.current,
        seedWordsFetching,
    };
}
