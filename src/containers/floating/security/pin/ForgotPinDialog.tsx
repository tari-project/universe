import { useTranslation } from 'react-i18next';

import { setError, useSecurityStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';

import { Header, Heading, Wrapper } from './styles.ts';
import { FormProvider, useForm } from 'react-hook-form';

import { InputArea } from '@app/containers/floating/Settings/sections/wallet/styles.ts';
import { Edit } from '@app/components/wallet/seedwords/components/Edit.tsx';
import { Form } from '@app/components/wallet/seedwords/components/edit.styles.ts';
import { invoke } from '@tauri-apps/api/core';

import { Button } from '@app/components/elements/buttons/Button.tsx';
import { CTAWrapper } from '@app/components/security/pin/styles.ts';

export default function ForgotPinDialog() {
    const { t } = useTranslation('wallet');
    const modal = useSecurityStore((s) => s.modal);
    const setModal = useSecurityStore((s) => s.setModal);

    const isOpen = modal === 'forgot_pin';

    const methods = useForm({ defaultValues: { seedWords: '' } });
    const { isValid } = methods.formState;

    const handleApply = async (data: { seedWords: string }) => {
        methods.reset({ seedWords: '' });
        if (!isValid) {
            return;
        }

        try {
            await invoke('forgot_pin', { seedWords: data.seedWords.split(' ') });
        } catch (error) {
            setError('Could not reset PIN: ' + error);
        }
    };

    function handleClose() {
        methods.reset({ seedWords: '' });
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
                            <CTAWrapper>
                                <Button fluid type="submit" variant="black" size="xlarge">
                                    {t('security.pin.forgot')}
                                </Button>
                            </CTAWrapper>
                        </Form>
                    </FormProvider>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
