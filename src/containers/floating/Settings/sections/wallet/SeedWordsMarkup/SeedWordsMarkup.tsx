import { SettingsGroupWrapper } from '@app/containers/floating/Settings/components/SettingsGroup.styles';
import { useCallback, useState } from 'react';
import { useGetSeedWords } from './useGetSeedWords';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { SeedWordsView } from './SeedWordsView';

import { SeedWordsEdit } from './SeedWordsEdit';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

const SeedWordsMarkup = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const [showSeedWords, setShowSeedWords] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords();

    const toggleSeedWordsVisibility = useCallback(async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }
        setShowSeedWords((prev) => !prev);
    }, [seedWordsFetched, getSeedWords]);

    const toggleEdit = useCallback(async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }

        setIsEditing((p) => !p);
    }, [getSeedWords, seedWordsFetched]);

    return (
        <SettingsGroupWrapper>
            <Stack direction="row" justifyContent="flex-start" alignItems="center" style={{ height: '34px' }}>
                <Typography variant="h6">{t('seed-words')}</Typography>
                {!isEditing && (
                    <IconButton onClick={toggleSeedWordsVisibility} disabled={seedWordsFetching}>
                        {seedWordsFetching ? (
                            <CircularProgress />
                        ) : showSeedWords ? (
                            <IoEyeOffOutline size={18} />
                        ) : (
                            <IoEyeOutline size={18} />
                        )}
                    </IconButton>
                )}
            </Stack>
            {isEditing ? (
                <SeedWordsEdit seedWordsFetching={seedWordsFetching} seedWords={seedWords} toggleEdit={toggleEdit} />
            ) : (
                <SeedWordsView
                    showSeedWords={showSeedWords}
                    seedWords={seedWords}
                    toggleEdit={toggleEdit}
                    getSeedWords={getSeedWords}
                    seedWordsFetched={seedWordsFetched}
                />
            )}
        </SettingsGroupWrapper>
    );
};

export default SeedWordsMarkup;
