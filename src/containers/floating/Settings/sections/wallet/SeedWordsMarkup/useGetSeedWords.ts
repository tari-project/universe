import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useWalletStore } from '@app/store';

export function useGetSeedWords() {
    const tari_address_is_generated = useWalletStore((s) => s.is_tari_address_generated);
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
        seedWords: tari_address_is_generated ? seedWords : [],
        getSeedWords,
        seedWordsFetched: seedWords.length > 0,
        seedWordsFetching,
    };
}
