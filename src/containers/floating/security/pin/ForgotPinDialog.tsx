import { useTranslation } from 'react-i18next';

import { setDialogToShow, setError, useUIStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';

import { Header, Heading, Wrapper } from './styles.ts';
import { FormCTA } from '@app/components/security/pin/styles.ts';
import { FormProvider, useForm } from 'react-hook-form';

import { InputArea, WalletSettingsGrid } from '@app/containers/floating/Settings/sections/wallet/styles.ts';
import { Edit } from '@app/components/wallet/seedwords/components/Edit.tsx';
import { Form } from '@app/components/wallet/seedwords/components/edit.styles.ts';
import { invoke } from '@tauri-apps/api/core';

export default function ForgotPinDialog() {
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const isOpen = dialogToShow === 'forgotPin';

    const { t } = useTranslation('wallet');
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
        setDialogToShow(null);
        methods.reset({ seedWords: '' });
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <Header>
                        <Heading>{t('security.pin.forgot')}</Heading> <CloseButton onClick={handleClose} />
                    </Header>
                    <FormProvider {...methods}>
                        <Form onSubmit={methods.handleSubmit(handleApply)}>
                            <WalletSettingsGrid>
                                <InputArea>
                                    <Edit />
                                </InputArea>
                            </WalletSettingsGrid>
                            <FormCTA fluid type="submit">
                                {t('security.pin.forgot')}
                            </FormCTA>
                        </Form>
                    </FormProvider>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
