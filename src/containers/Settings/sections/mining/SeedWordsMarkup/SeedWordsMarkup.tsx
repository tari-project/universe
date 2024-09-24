import { useCallback, useState } from 'react';
import { useGetSeedWords } from './useGetSeedWords';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { IconButton } from '@app/components/elements/Button.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { SeedWords } from './SeedWords';
import { SettingsGroupWrapper } from '@app/containers/Settings/components/SettingsGroup.styles.ts';

const SeedWordsMarkup = () => {
    const [showSeedWords, setShowSeedWords] = useState(false);
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords();

    const toggleSeedWordsVisibility = useCallback(async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }
        setShowSeedWords((prev) => !prev);
    }, [seedWordsFetched, getSeedWords]);

    return (
        <SettingsGroupWrapper>
            <Stack direction="row" justifyContent="flex-start" alignItems="center">
                <Typography variant="h6">Seed Words</Typography>
                <IconButton onClick={toggleSeedWordsVisibility} disabled={seedWordsFetching}>
                    {seedWordsFetching ? (
                        <CircularProgress />
                    ) : showSeedWords ? (
                        <IoEyeOffOutline size={18} />
                    ) : (
                        <IoEyeOutline size={18} />
                    )}
                </IconButton>
            </Stack>
            <SeedWords showSeedWords={showSeedWords} seedWords={seedWords} />
        </SettingsGroupWrapper>
    );
};

export default SeedWordsMarkup;
