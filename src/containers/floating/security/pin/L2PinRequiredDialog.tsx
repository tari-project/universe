import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { useSecurityStore } from '@app/store/useSecurityStore.ts';
import { createPinAndOpenL2 } from '@app/store/actions/l2OpenActions.ts';
import { Content, CTAWrapper, Header, Title, Wrapper } from '../common.styles.ts';

/** Shown when the sidebar's L2 button is clicked on a wallet with no PIN. */
export default function L2PinRequiredDialog() {
    const { t } = useTranslation(['wallet', 'common']);
    const isOpen = useSecurityStore((s) => s.modal === 'l2_pin_required');
    const setModal = useSecurityStore((s) => s.setModal);
    const close = () => setModal(null);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
            <DialogContent variant="transparent">
                <Wrapper data-testid="l2-pin-required-dialog">
                    <Header>
                        <CloseButton onClick={close} />
                    </Header>
                    <Content>
                        <Title>{t('l2.pin-dialog-title')}</Title>
                        <CTAWrapper>
                            <Button
                                fluid
                                variant="black"
                                size="xlarge"
                                data-testid="l2-pin-required-set"
                                onClick={() => {
                                    // The backend's create PIN dialog takes over the modal slot.
                                    close();
                                    void createPinAndOpenL2();
                                }}
                            >
                                {t('l2.pin-dialog-button')}
                            </Button>
                            <TextButton onClick={close}>{t('common:cancel')}</TextButton>
                        </CTAWrapper>
                    </Content>
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
