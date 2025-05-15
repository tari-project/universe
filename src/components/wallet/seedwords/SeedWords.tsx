import Display from './components/Display.tsx';
import { useGetSeedWords } from '@app/containers/floating/Settings/sections/wallet/SeedWordsMarkup/useGetSeedWords.ts';
import { useCopyToClipboard } from '@app/hooks';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { useCallback, useState } from 'react';

interface SeedWordsProps {
    isMonero?: boolean;
}
export default function SeedWords({ isMonero = false }: SeedWordsProps) {
    const [copyFetchLoading, setCopyFetchLoading] = useState(false);
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords({
        fetchMoneroSeeds: isMonero,
    });

    async function onToggleClick() {
        if (!seedWords?.length || !seedWordsFetched) {
            await getSeedWords();
        }
    }

    const handleCopyClick = useCallback(async () => {
        if (seedWords && seedWordsFetched) {
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

    console.debug(`seedWords= `, seedWords);
    return (
        <>
            <Display words={seedWords} isLoading={seedWordsFetching} onToggleClick={onToggleClick} />
            <IconButton onClick={() => handleCopyClick()}>
                {!isCopied ? copyFetchLoading ? <CircularProgress /> : <IoCopyOutline /> : <IoCheckmarkOutline />}
            </IconButton>
        </>
    );
}
