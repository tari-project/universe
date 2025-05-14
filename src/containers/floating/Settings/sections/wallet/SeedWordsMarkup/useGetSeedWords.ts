import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useWalletStore } from '@app/store';

interface Arguments {
    fetchMoneroSeeds?: boolean;
}
export function useGetSeedWords(args?: Arguments) {
    const tari_address_is_generated = useWalletStore((s) => s.is_tari_address_generated);
    const [seedWords, setSeedWords] = useState<string[]>([]);
    const [seedWordsFetching, setSeedWordsFetching] = useState(false);

    const { fetchMoneroSeeds = false } = args || {};

    const getSeedWords = useCallback(async () => {
        setSeedWordsFetching(true);
        const commandName = fetchMoneroSeeds ? 'get_monero_seed_words' : 'get_seed_words';
        try {
            const seedWords: string[] = await invoke(commandName);

            if (seedWords.length) {
                setSeedWords(seedWords);
                return seedWords;
            }
        } catch (e) {
            console.error('Could not get seed words', e);
        } finally {
            setSeedWordsFetching(false);
        }
    }, [fetchMoneroSeeds]);

    return {
        seedWords: tari_address_is_generated ? seedWords : [],
        getSeedWords,
        seedWordsFetched: seedWords.length > 0,
        seedWordsFetching,
    };
}
