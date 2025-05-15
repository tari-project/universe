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
import { importSeedWords, useWalletStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';
import { useTranslation } from 'react-i18next';
import { Form } from '@app/components/wallet/seedwords/components/edit.styles.ts';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';

interface SeedWordsProps {
    isMonero?: boolean;
}
const dialogStyles = {
    width: '380px',
    padding: '16px 30px',
    gap: 16,
};
export default function SeedWords({ isMonero = false }: SeedWordsProps) {
    const isWalletImporting = useWalletStore((s) => s.is_wallet_importing);
    const [isEditView, setIsEditView] = useState(false);
    const [newSeedWords, setNewSeedWords] = useState<string[]>();
    const [showConfirm, setShowConfirm] = useState(false);
    const [copyFetchLoading, setCopyFetchLoading] = useState(false);
    const { t } = useTranslation('settings', { useSuspense: false });
    const { seedWords, getSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords({
        fetchMoneroSeeds: isMonero,
    });
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const methods = useForm({ defaultValues: { seedWords: seedWords?.join(' ').trim() } });
    const { isDirty, isValid } = methods.formState;

    const handleConfirmed = useCallback(async () => {
        if (!isDirty || !isValid || !newSeedWords) return;
        await importSeedWords(newSeedWords);
    }, [isDirty, isValid, newSeedWords]);

    const handleApply = (data: { seedWords: string }) => {
        console.debug(`seedWords= `, data.seedWords);
        setNewSeedWords(data.seedWords.split(' '));
        setShowConfirm(true);
    };

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

    function handleReset() {
        methods.reset();
        onToggleEdit();
    }

    const editCTAs = (
        <IconWrapper>
            <IconButton size="small" type="submit">
                <IoCheckmarkOutline />
            </IconButton>
            <IconButton size="small" type="reset">
                <IoCloseOutline />
            </IconButton>
        </IconWrapper>
    );

    return (
        <>
            <Wrapper key={isMonero ? 'monero' : 'tari'}>
                <FormProvider {...methods}>
                    <Form onSubmit={methods.handleSubmit(handleApply)} onReset={handleReset}>
                        <WalletSettingsGrid>
                            <InputArea>
                                {isEditView ? (
                                    <Edit />
                                ) : (
                                    <Display
                                        words={seedWords}
                                        isLoading={seedWordsFetching || copyFetchLoading}
                                        onToggleClick={onToggleVisibility}
                                    />
                                )}
                            </InputArea>
                            <CTASArea>{isEditView ? editCTAs : displayCTAs}</CTASArea>
                        </WalletSettingsGrid>
                    </Form>
                </FormProvider>
            </Wrapper>
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent $unPadded>
                    <Stack direction="column" alignItems="center" justifyContent="space-between" style={dialogStyles}>
                        <Typography variant="h3">{t('confirm-import-wallet')}</Typography>
                        <Typography variant="p" style={{ whiteSpace: 'pre', textAlign: 'center' }}>
                            {t('confirm-import-wallet-copy')}
                        </Typography>
                        {isWalletImporting ? (
                            <LoadingDots />
                        ) : (
                            <Stack direction="row" gap={8}>
                                <SquaredButton onClick={() => setShowConfirm(false)}>{t('cancel')}</SquaredButton>
                                <SquaredButton color="orange" onClick={() => handleConfirmed()}>
                                    {t('yes')}
                                </SquaredButton>
                            </Stack>
                        )}
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
}
