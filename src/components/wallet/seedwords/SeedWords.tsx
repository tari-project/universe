import Display from './components/Display.tsx';
import { useGetSeedWords } from '@app/containers/floating/Settings/sections/wallet/SeedWordsMarkup/useGetSeedWords.ts';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { IoCheckmarkOutline, IoCloseOutline, IoCopyOutline, IoPencil } from 'react-icons/io5';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Wrapper } from './styles.ts';
import { CTASArea, InputArea, WalletSettingsGrid } from '@app/containers/floating/Settings/sections/wallet/styles.ts';
import { Edit } from '@app/components/wallet/seedwords/components/Edit.tsx';
import { FormProvider, useForm } from 'react-hook-form';
import { importSeedWords, useWalletStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useTranslation } from 'react-i18next';
import { Form } from '@app/components/wallet/seedwords/components/edit.styles.ts';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { useCountdown } from './utils.ts';

// Controller component for edit/view seed words (both Tari & Monero)

const SEED_WORDS_COUNTDOWN_DURATION = 300; // 5mins (same as in paper wallet)

interface SeedWordsProps {
    isMonero?: boolean;
}
export default function SeedWords({ isMonero = false }: SeedWordsProps) {
    const isWalletImporting = useWalletStore((s) => s.is_wallet_importing);
    const [isPending, startTransition] = useTransition();
    const [isVisible, setIsVisible] = useState(false);
    const [isEditView, setIsEditView] = useState(false);
    const [newSeedWords, setNewSeedWords] = useState<string[]>();
    const [showConfirm, setShowConfirm] = useState(false);

    const { t } = useTranslation('settings', { useSuspense: false });
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const { seedWords, getSeedWords, setSeedWords, seedWordsFetched, seedWordsFetching } = useGetSeedWords({
        fetchMoneroSeeds: isMonero,
    });
    const methods = useForm({ defaultValues: { seedWords: seedWords?.join(' ').trim() } });
    const { isValid } = methods.formState;

    // Countdown hook for auto-hiding seed words
    const { start: startCountdown, stop: stopCountdown } = useCountdown({
        duration: SEED_WORDS_COUNTDOWN_DURATION,
        onComplete: () => {
            setShowConfirm(false);
            setIsEditView(false);
            setIsVisible(false);
            setSeedWords([]);
        },
    });
    useEffect(() => {
        if (isWalletImporting || isEditView) {
            setSeedWords([]);
            setIsVisible(false);
            stopCountdown();
        }
    }, [isEditView, isWalletImporting, setSeedWords, stopCountdown]);
    // Start countdown when seed words become visible
    useEffect(() => {
        if (isVisible && seedWords?.length && seedWordsFetched) {
            startCountdown();
        } else {
            stopCountdown();
        }
    }, [isVisible, seedWords, seedWordsFetched, startCountdown, stopCountdown]);

    const handleConfirmed = useCallback(async () => {
        if (!isValid || !newSeedWords) return;

        await importSeedWords(newSeedWords);
        setShowConfirm(false);
        setIsEditView(false);
    }, [isValid, newSeedWords]);

    const handleApply = (data: { seedWords: string }) => {
        setNewSeedWords(data.seedWords.split(' '));
        setShowConfirm(true);
    };

    function onToggleVisibility() {
        startTransition(() => {
            if (!seedWords?.length || !seedWordsFetched) {
                getSeedWords()
                    .then((r) => {
                        if (r?.length) {
                            setIsVisible((c) => !c);
                        }
                    })
                    .catch(() => {
                        setIsVisible(false);
                    });
            } else {
                setSeedWords([]);
                setIsVisible((c) => !c);
            }
        });
    }
    function onToggleEdit() {
        methods.reset();
        setIsEditView((c) => !c);
    }
    function handleReset() {
        methods.reset();
        onToggleEdit();
    }
    const handleCopyClick = useCallback(() => {
        startTransition(async () => {
            if (seedWords?.length && seedWordsFetched) {
                copyToClipboard(seedWords.join(' '));
            } else {
                getSeedWords().then((r) => {
                    if (r?.length) {
                        copyToClipboard(r.join(' '));
                        setSeedWords([]);
                    }
                });
            }
        });
    }, [copyToClipboard, getSeedWords, seedWords, setSeedWords, seedWordsFetched]);

    const displayCTAs = (
        <>
            {!isMonero ? (
                <IconButton size="small" disabled={isWalletImporting} onClick={onToggleEdit} type="button">
                    <IoPencil />
                </IconButton>
            ) : null}
            <IconButton size="small" type="button" onClick={() => handleCopyClick()}>
                {!isCopied ? isPending ? <CircularProgress /> : <IoCopyOutline /> : <IoCheckmarkOutline />}
            </IconButton>
        </>
    );

    const editCTAs = (
        <>
            <IconButton size="small" type="submit" disabled={!isValid || !seedWords}>
                <IoCheckmarkOutline />
            </IconButton>
            <IconButton size="small" type="reset">
                <IoCloseOutline />
            </IconButton>
        </>
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
                                        isVisible={isVisible}
                                        isLoading={isPending || seedWordsFetching}
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
                <DialogContent>
                    <Stack
                        direction="column"
                        alignItems="center"
                        justifyContent="space-between"
                        style={{ width: 400, height: 120 }}
                    >
                        <Typography variant="h3">{t('confirm-import-wallet')}</Typography>
                        <Typography variant="p" style={{ whiteSpace: 'pre', textAlign: 'center' }}>
                            {t('confirm-import-wallet-copy')}
                        </Typography>

                        {isWalletImporting ? (
                            <LoadingDots />
                        ) : (
                            <Stack direction="row" gap={8}>
                                <Button size="small" onClick={() => setShowConfirm(false)}>
                                    {t('cancel')}
                                </Button>
                                <Button size="small" color="warning" onClick={() => handleConfirmed()}>
                                    {t('yes')}
                                </Button>
                            </Stack>
                        )}
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
}
