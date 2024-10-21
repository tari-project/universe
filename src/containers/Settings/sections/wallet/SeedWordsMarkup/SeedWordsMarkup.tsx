import { useCallback, useState } from 'react';
import { useGetSeedWords } from './useGetSeedWords';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { IconButton } from '@app/components/elements/Button.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { SeedWordsView } from './SeedWordsView';
import { SettingsGroupWrapper } from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { SeedWordsEdit } from './SeedWordsEdit';
import { SeedWords } from '@app/containers/Settings/components/SeedWords.tsx';

const SeedWordsMarkup = () => {
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
                <Typography variant="h6">Seed Words</Typography>
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
                <SeedWords showSeedWords={showSeedWords} seedWords={seedWords} />
            )}
        </SettingsGroupWrapper>
    );
};

export default SeedWordsMarkup;
