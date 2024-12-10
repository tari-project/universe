import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { useUIStore } from '@app/store/useUIStore.ts';
import { ButtonWrapper, Wrapper } from './KeyringAccessDialog.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { useTranslation } from 'react-i18next';

export const KeyringAccessDialog = () => {
    const { t } = useTranslation(['wallet', 'common']);
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);

    function handleClose() {
        setDialogToShow(null);
    }
    return (
        <Dialog open={dialogToShow === 'keyring'}>
            <DialogContent $unPadded>
                <Wrapper>
                    <Typography variant="h2">{t('keychain-access')}</Typography>
                    <Typography>{t('keychain-access-copy')}</Typography>

                    <ButtonWrapper>
                        <Button color="warning" onClick={() => handleClose()}>
                            {t('common:dismiss')}
                        </Button>
                        <Button>{t('common:yes')}</Button>
                    </ButtonWrapper>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
};
