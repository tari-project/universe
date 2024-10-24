import { SettingsGroupTitle, SettingsGroupWrapper } from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useCallback, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useTranslation } from 'react-i18next';

import { SeedWords } from '@app/containers/Settings/components/SeedWords.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { useAppStateStore } from '@app/store/appStateStore.ts';

export default function MoneroSeedWordSettings() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const setError = useAppStateStore((s) => s.setError);
    const [showSeedWords, setShowSeedWords] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [seedWords, setSeedWords] = useState<string[]>([]);

    const hasFetched = useRef(false);

    const getSeedWords = useCallback(async () => {
        setIsFetching(true);
        try {
            const mSeedWords = await invoke('get_monero_seed_words');
            if (mSeedWords) {
                setSeedWords(mSeedWords);
                hasFetched.current = true;
            }
        } catch (e) {
            const errorMessage = e as unknown as string;
            if (errorMessage && errorMessage.includes('Keychain access')) {
                setError(errorMessage);
            }
            console.error('Could not get Monero seed words', e);
        } finally {
            setIsFetching(false);
        }
    }, [setError]);
    const toggleSeedWordsVisibility = useCallback(async () => {
        if (!hasFetched.current) {
            await getSeedWords();
        }
        setShowSeedWords((prev) => !prev);
    }, [getSeedWords]);

    return (
        <SettingsGroupWrapper $subGroup>
            <SettingsGroupTitle>
                <Stack direction="row" justifyContent="flex-start" alignItems="center" style={{ height: '34px' }}>
                    <Typography variant="h6">{t('monero-seed-words')}</Typography>

                    <IconButton onClick={toggleSeedWordsVisibility} disabled={isFetching}>
                        {isFetching ? (
                            <CircularProgress />
                        ) : showSeedWords ? (
                            <IoEyeOffOutline size={18} />
                        ) : (
                            <IoEyeOutline size={18} />
                        )}
                    </IconButton>
                </Stack>
            </SettingsGroupTitle>

            <SeedWords seedWords={seedWords} showSeedWords={showSeedWords && !!seedWords?.length} />
        </SettingsGroupWrapper>
    );
}
