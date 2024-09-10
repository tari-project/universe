import { useCallback, useState } from 'react';
import { useGetSeedWords } from './useGetSeedWords';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { IconButton } from '@app/components/elements/Button.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { IoCopyOutline, IoEyeOutline, IoEyeOffOutline, IoCheckmarkOutline } from 'react-icons/io5';
import { SeedWords } from './SeedWords';

const SeedWordsMarkup = () => {
    const [showSeedWords, setShowSeedWords] = useState(false);
    const [isCopyTooltipHidden, setIsCopyTooltipHidden] = useState(true);
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords();

    const toggleSeedWordsVisibility = useCallback(async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }
        setShowSeedWords((prev) => !prev);
    }, [seedWordsFetched, getSeedWords]);

    const copySeedWords = useCallback(async () => {
        if (!seedWordsFetched) {
            await getSeedWords();
        }
        setIsCopyTooltipHidden(false);
        await navigator.clipboard.writeText(seedWords.join(' '));
        setTimeout(() => setIsCopyTooltipHidden(true), 1000);
    }, [seedWords, seedWordsFetched, getSeedWords]);

    return (
        <Stack>
            <Stack direction="row" justifyContent="space-between" style={{ height: 40 }}>
                <Typography variant="h6">Seed Words</Typography>
                {showSeedWords && seedWordsFetched && (
                    <IconButton onClick={copySeedWords}>
                        {isCopyTooltipHidden ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                    </IconButton>
                )}
            </Stack>
            <Stack direction="row" justifyContent="space-between">
                <SeedWords showSeedWords={showSeedWords} seedWords={seedWords} />
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
        </Stack>
    );
};

export default SeedWordsMarkup;
