import Display from './components/Display.tsx';
import { useGetSeedWords } from '@app/containers/floating/Settings/sections/wallet/SeedWordsMarkup/useGetSeedWords.ts';
import { useCopyToClipboard } from '@app/hooks';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { IoCheckmarkOutline, IoCloseOutline, IoCopyOutline, IoPencil } from 'react-icons/io5';
import { useCallback, useState } from 'react';
import { IconWrapper, Wrapper } from './styles.ts';
import { CTASArea, InputArea, WalletSettingsGrid } from '@app/containers/floating/Settings/sections/wallet/styles.ts';
import { Edit } from '@app/components/wallet/seedwords/components/Edit.tsx';
import { FormProvider, useForm } from 'react-hook-form';

interface SeedWordsProps {
    isMonero?: boolean;
}
export default function SeedWords({ isMonero = false }: SeedWordsProps) {
    const [isEditView, setIsEditView] = useState(false);
    const [copyFetchLoading, setCopyFetchLoading] = useState(false);

    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords({
        fetchMoneroSeeds: isMonero,
    });
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const methods = useForm({ defaultValues: { seedWords: seedWords?.join(' ').trim() } });

    async function onToggleVisibility() {
        if (!seedWords?.length || !seedWordsFetched) {
            await getSeedWords();
        }
    }

    function onToggleEdit() {
        setIsEditView((c) => !c);
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

    const displayCTAs = (
        <IconWrapper>
            <IconButton size="small" onClick={() => handleCopyClick()}>
                {!isCopied ? copyFetchLoading ? <CircularProgress /> : <IoCopyOutline /> : <IoCheckmarkOutline />}
            </IconButton>
            <IconButton size="small" onClick={onToggleEdit}>
                <IoPencil />
            </IconButton>
        </IconWrapper>
    );

    const editCTAs = (
        <IconWrapper>
            <IconButton size="small" type="submit">
                <IoCheckmarkOutline />
            </IconButton>
            <IconButton size="small" type="reset" onClick={onToggleEdit}>
                <IoCloseOutline />
            </IconButton>
        </IconWrapper>
    );

    return (
        <Wrapper key={isMonero ? 'monero' : 'tari'}>
            <FormProvider {...methods}>
                <WalletSettingsGrid>
                    <InputArea>
                        {isEditView ? (
                            <Edit />
                        ) : (
                            <Display
                                words={seedWords}
                                isLoading={seedWordsFetching}
                                onToggleClick={onToggleVisibility}
                            />
                        )}
                    </InputArea>
                    <CTASArea>{isEditView ? editCTAs : displayCTAs}</CTASArea>
                </WalletSettingsGrid>
            </FormProvider>
        </Wrapper>
    );
}
