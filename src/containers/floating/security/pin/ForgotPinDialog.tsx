import { useTranslation } from 'react-i18next';

import { setError, useSecurityStore } from '@app/store';
import { useConfigWalletStore } from '@app/store/useAppConfigStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

import { Header, Heading, Wrapper } from './styles.ts';
import { FormProvider, useForm } from 'react-hook-form';

import { InputArea } from '@app/containers/floating/Settings/sections/wallet/styles.ts';
import { Edit, splitSeedWordsInput } from '@app/components/wallet/seedwords/components/Edit.tsx';
import { Form, StyledTextArea } from '@app/components/wallet/seedwords/components/edit.styles.ts';
import { invoke } from '@tauri-apps/api/core';

import { Button } from '@app/components/elements/buttons/Button.tsx';
import { CTAWrapper } from '@app/components/security/pin/styles.ts';

const EMPTY_FORM = { seedWords: '', moneroSeedWords: '' };

export default function ForgotPinDialog() {
    const { t } = useTranslation('wallet');
    const modal = useSecurityStore((s) => s.modal);
    const setModal = useSecurityStore((s) => s.setModal);
    const moneroAddressIsGenerated = useConfigWalletStore((s) => s.monero_address_is_generated);

    const isOpen = modal === 'forgot_pin';

    const methods = useForm({ defaultValues: EMPTY_FORM });
    const { isValid } = methods.formState;
    // The Monero credential is enciphered with the forgotten PIN. Without these words recovery
    // replaces the Monero wallet, so the button says so.
    const replacesMoneroWallet = moneroAddressIsGenerated && !methods.watch('moneroSeedWords').trim();

    const handleApply = async (data: { seedWords: string; moneroSeedWords: string }) => {
        methods.reset(EMPTY_FORM);
        if (!isValid) {
            return;
        }

        const moneroSeedWords = splitSeedWordsInput(data.moneroSeedWords);
        try {
            await invoke('forgot_pin', {
                seedWords: splitSeedWordsInput(data.seedWords),
                moneroSeedWords: moneroSeedWords.length ? moneroSeedWords : null,
            });
        } catch (error) {
            setError('Could not reset PIN: ' + error);
        }
    };

    function handleClose() {
        methods.reset(EMPTY_FORM);
        setModal(null);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent variant="transparent">
                <Wrapper>
                    <Header>
                        <Heading>{t('security.pin.forgot')}</Heading> <CloseButton onClick={handleClose} />
                    </Header>
                    <FormProvider {...methods}>
                        <Form onSubmit={methods.handleSubmit(handleApply)}>
                            <InputArea>
                                <Edit />
                            </InputArea>
                            {moneroAddressIsGenerated && (
                                <>
                                    <Typography variant="p">{t('security.pin.forgot-monero-warning')}</Typography>
                                    <InputArea>
                                        <StyledTextArea
                                            $hasError={false}
                                            placeholder={t('security.pin.forgot-monero-placeholder')}
                                            {...methods.register('moneroSeedWords')}
                                        />
                                    </InputArea>
                                </>
                            )}
                            <CTAWrapper>
                                <Button fluid type="submit" variant="black" size="xlarge">
                                    {replacesMoneroWallet
                                        ? t('security.pin.forgot-monero-replace')
                                        : t('security.pin.forgot')}
                                </Button>
                            </CTAWrapper>
                        </Form>
                    </FormProvider>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
