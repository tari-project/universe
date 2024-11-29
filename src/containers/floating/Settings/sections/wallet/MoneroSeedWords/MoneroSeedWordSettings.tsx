import { Typography } from '@app/components/elements/Typography.tsx';
import {
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard';
import { useCallback, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { IoCheckmarkOutline, IoCopyOutline, IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useTranslation } from 'react-i18next';

import { SeedWords } from '../components/SeedWords.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { useAppStateStore } from '@app/store/appStateStore.ts';

export default function MoneroSeedWordSettings() {
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const { t } = useTranslation('settings', { useSuspense: false });
    const setError = useAppStateStore((s) => s.setError);
    const [showSeedWords, setShowSeedWords] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [seedWords, setSeedWords] = useState<string[]>([]);
    const [copyFetchLoading, setCopyFetchLoading] = useState(false);

    const hasFetched = useRef(false);

    const getSeedWords = useCallback(async () => {
        setIsFetching(true);
        try {
            const mSeedWords = await invoke('get_monero_seed_words');
            if (mSeedWords) {
                setSeedWords(mSeedWords);
                hasFetched.current = true;
                return mSeedWords;
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

    const handleCopyClick = useCallback(async () => {
        // TODO: dedupe from OG seed words again
        if (seedWords && hasFetched.current) {
            copyToClipboard(seedWords.join(' '));
        } else {
            setCopyFetchLoading(true);
            getSeedWords().then((r) => {
                setCopyFetchLoading(false);

                if (r?.length) {
                    copyToClipboard(r.join(' '));
                }
            });
        }
    }, [copyToClipboard, getSeedWords, seedWords]);
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

            <Stack direction="row" justifyContent="stretch" alignItems="center" style={{ width: '100%' }} gap={10}>
                <SeedWords seedWords={seedWords} showSeedWords={showSeedWords && !!seedWords?.length} />
                {!showSeedWords && (
                    <IconButton size="small" onClick={() => handleCopyClick()}>
                        {!isCopied ? (
                            copyFetchLoading ? (
                                <CircularProgress />
                            ) : (
                                <IoCopyOutline />
                            )
                        ) : (
                            <IoCheckmarkOutline />
                        )}
                    </IconButton>
                )}
            </Stack>
        </SettingsGroupWrapper>
    );
}
