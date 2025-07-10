import { Content, Header, Subtitle, Title, Wrapper } from './styles.ts';
import { useTranslation } from 'react-i18next';
import { setDialogToShow, useUIStore } from '@app/store';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { AlertChip } from '@app/components/security/alert-chip/AlertChip.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';

export default function SecurityPromptDialog() {
    const { t } = useTranslation('wallet');
    const dialogToShow = useUIStore((s) => s.dialogToShow);
    const isOpen = dialogToShow === 'security';

    function handleClose() {
        setDialogToShow(null);
    }
    return (
        <Dialog open={true} onOpenChange={handleClose}>
            <DialogContent $transparentBg $unPadded>
                <Wrapper>
                    <Header>
                        <CloseButton onClick={handleClose} />
                    </Header>
                    <Content>
                        <AlertChip />
                        <Title>{`You've won your first Tari reward!\nLet’s secure your wallet.`}</Title>
                        <Subtitle>{`You now have your first Tari tokens. Let’s quickly protect your wallet in two easy steps.`}</Subtitle>
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
