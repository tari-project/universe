import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard';
import { useCallback, useState } from 'react';
import { useGetSeedWords } from './useGetSeedWords';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { IoEyeOutline, IoEyeOffOutline, IoCopyOutline, IoCheckmarkOutline } from 'react-icons/io5';

import { SeedWordsEdit } from './SeedWordsEdit';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { SeedWords } from '../components/SeedWords';

const SeedWordsMarkup = () => {
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const { t } = useTranslation('settings', { useSuspense: false });
    const [showSeedWords, setShowSeedWords] = useState(false);
    const [copyFetchLoading, setCopyFetchLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords();

    const toggleSeedWordsVisibility = useCallback(async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }
        setShowSeedWords((prev) => !prev);
    }, [seedWordsFetched, getSeedWords]);

    const handleCopyClick = useCallback(() => {
        if (seedWordsFetched && seedWords) {
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
    }, [copyToClipboard, getSeedWords, seedWords, seedWordsFetched]);

    const toggleEdit = useCallback(async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }

        setIsEditing((p) => !p);
    }, [getSeedWords, seedWordsFetched]);

    const showView = !isEditing;
    const showCopy = !showSeedWords && !isEditing;

    return (
        <SettingsGroupWrapper $subGroup>
            <Stack direction="row" justifyContent="flex-start" alignItems="center" style={{ height: '34px' }}>
                <Typography variant="h6">{t('seed-words')}</Typography>
                {showView && (
                    <IconButton onClick={toggleSeedWordsVisibility} disabled={seedWordsFetching}>
                        {seedWordsFetching && !copyFetchLoading ? (
                            <CircularProgress />
                        ) : showSeedWords ? (
                            <IoEyeOffOutline />
                        ) : (
                            <IoEyeOutline />
                        )}
                    </IconButton>
                )}
            </Stack>
            {isEditing ? (
                <SeedWordsEdit seedWordsFetching={seedWordsFetching} seedWords={seedWords} toggleEdit={toggleEdit} />
            ) : null}
            <Stack direction="row" justifyContent="stretch" alignItems="center" style={{ width: '100%' }}>
                {!isEditing ? (
                    <SeedWords
                        showSeedWords={showSeedWords && !!seedWords?.length}
                        seedWords={seedWords}
                        editable
                        onToggleEdit={toggleEdit}
                    />
                ) : null}
                {showCopy && (
                    <IconButton size="small" onClick={handleCopyClick}>
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
};

export default SeedWordsMarkup;
