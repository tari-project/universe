import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';
import { ButtonWrapper, Wrapper } from './KeyringAccessDialog.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Trans, useTranslation } from 'react-i18next';
import { addToast } from '@app/components/ToastStack/useToastStore.tsx';
import { memo } from 'react';

const KeyringAccessDialog = memo(function KeyringAccessDialog() {
    const { t } = useTranslation(['wallet', 'common']);
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);

    function handleClose() {
        setDialogToShow(null);
    }

    function handleKeychain() {
        addToast({
            title: 'Add to keychain',
            text: 'BE stuff should happen now',
        });
    }
    return (
        <Dialog open={dialogToShow === 'keyring'}>
            <DialogContent $unPadded>
                <Wrapper>
                    <Typography variant="h2">{t('keychain-access')}</Typography>
                    <Typography>
                        <Trans
                            i18nKey="wallet:keychain-access-copy"
                            components={{
                                span: <span />,
                            }}
                        />
                    </Typography>

                    <ButtonWrapper>
                        <Button color="warning" onClick={() => handleClose()}>
                            {t('common:dismiss')}
                        </Button>
                        <Button onClick={() => handleKeychain()}>{t('common:yes')}</Button>
                    </ButtonWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
});

export default KeyringAccessDialog;
