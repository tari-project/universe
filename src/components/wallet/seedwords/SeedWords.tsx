import Display from './components/Display.tsx';
import { useGetSeedWords } from '@app/containers/floating/Settings/sections/wallet/SeedWordsMarkup/useGetSeedWords.ts';
import { useCopyToClipboard } from '@app/hooks';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { useCallback, useState } from 'react';
import { IconWrapper, Wrapper } from './styles.ts';
import { CTASArea, InputArea, WalletSettingsGrid } from '@app/containers/floating/Settings/sections/wallet/styles.ts';
import { Edit } from '@app/components/wallet/seedwords/components/Edit.tsx';

interface SeedWordsProps {
    isMonero?: boolean;
}
export default function SeedWords({ isMonero = false }: SeedWordsProps) {
    const [isEditView, setIsEditView] = useState(true);
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

    return (
        <Wrapper key={isMonero ? 'monero' : 'tari'}>
            <WalletSettingsGrid>
                <InputArea>
                    {isEditView ? (
                        <Edit onEditClick={() => setIsEditView((c) => !c)} />
                    ) : (
                        <Display words={seedWords} isLoading={seedWordsFetching} onToggleClick={onToggleClick} />
                    )}
                </InputArea>
                <CTASArea>
                    <IconWrapper>
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
                    </IconWrapper>
                </CTASArea>
            </WalletSettingsGrid>
        </Wrapper>
    );
}
