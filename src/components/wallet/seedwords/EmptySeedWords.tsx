import Display from './components/Display.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoAddCircleOutline, IoCheckmarkOutline, IoCloseOutline } from 'react-icons/io5';
import { useCallback, useState } from 'react';
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

export default function EmptySeedWords() {
    const isWalletImporting = useWalletStore((s) => s.is_wallet_importing);

    const [isEditView, setIsEditView] = useState(false);
    const [newSeedWords, setNewSeedWords] = useState<string[]>();
    const [showConfirm, setShowConfirm] = useState(false);

    const { t } = useTranslation('settings', { useSuspense: false });

    const methods = useForm<{ seedWords: string }>({ defaultValues: { seedWords: '' } });
    const { isValid } = methods.formState;

    const handleConfirmed = useCallback(async () => {
        if (!isValid || !newSeedWords) return;
        await importSeedWords(newSeedWords).finally(() => setShowConfirm(false));
        setIsEditView(false);
    }, [isValid, newSeedWords]);

    const handleApply = (data: { seedWords: string }) => {
        const resolvedSeedWords = data.seedWords.split(' ');
        setNewSeedWords(resolvedSeedWords);
        setShowConfirm(true);
    };

    function onToggleEdit() {
        setIsEditView((c) => !c);
    }
    function handleReset() {
        methods.reset();
        onToggleEdit();
    }

    const displayCTAs = (
        <IconButton size="small" onClick={onToggleEdit} type="button">
            <IoAddCircleOutline />
        </IconButton>
    );

    const editCTAs = (
        <>
            <IconButton size="small" type="submit" disabled={!isValid}>
                <IoCheckmarkOutline />
            </IconButton>
            <IconButton size="small" type="reset">
                <IoCloseOutline />
            </IconButton>
        </>
    );

    return (
        <>
            <Wrapper key={'tari'}>
                <FormProvider {...methods}>
                    <Form onSubmit={methods.handleSubmit(handleApply)} onReset={handleReset}>
                        <WalletSettingsGrid>
                            <InputArea>
                                {isEditView ? (
                                    <Edit />
                                ) : (
                                    <Display words={[]} isSeedlessUI isLoading={false} isVisible={false} />
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
