import { emit } from '@tauri-apps/api/event';
import { useTranslation } from 'react-i18next';
import { useSecurityStore } from '@app/store/useSecurityStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import EnterPin from '@app/components/security/pin/EnterPin.tsx';
import { TransactionContextSummary } from '@app/components/transactions/send/TransactionContextSummary.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Header, Heading, Wrapper } from './styles.ts';

export default function EnterPinDialog() {
    const { t } = useTranslation('wallet');
    const modal = useSecurityStore((s) => s.modal);
    const setModal = useSecurityStore((s) => s.setModal);
    const pinResolver = useSecurityStore((s) => s.pinResolver);
    const pinContext = useSecurityStore((s) => s.pinContext);

    const isOpen = modal === 'enter_pin';
    // Only shown when the backend told us what the PIN is for. Everything else keeps the
    // plain "Enter your PIN" dialog.
    const sendContext = pinContext?.kind === 'send' ? pinContext : null;
    const reasonKey =
        pinContext?.kind === 'restore_wallet_details'
            ? 'security.pin.restore-wallet-details'
            : pinContext?.kind === 'seed_needs_pin'
              ? 'security.pin.seed-needs-pin'
              : null;

    function handleClose() {
        if (pinResolver) {
            pinResolver(undefined);
            useSecurityStore.setState({ pinResolver: null, pinContext: null });
            setModal(null);
        } else {
            void emit('pin-dialog-response', { pin: undefined });
            useSecurityStore.setState({ pinContext: null });
            setModal(null);
        }
    }

    function handleSubmit(pin: string) {
        if (pinResolver) {
            pinResolver(pin);
            useSecurityStore.setState({ pinResolver: null, pinContext: null });
            setModal(null);
        } else {
            emit('pin-dialog-response', Number(pin)).finally(() => {
                useSecurityStore.setState({ pinContext: null });
                setModal(null);
            });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent variant="transparent">
                <Wrapper>
                    <Header>
                        <Heading>{sendContext ? t('security.pin.approve-send') : t('security.pin.enter')}</Heading>{' '}
                        <CloseButton onClick={handleClose} />
                    </Header>
                    {reasonKey && (
                        <Typography variant="p" style={{ opacity: 0.5, fontSize: 12 }}>
                            {t(reasonKey)}
                        </Typography>
                    )}
                    {sendContext && (
                        <TransactionContextSummary
                            amountMicroMinotari={sendContext.amount_micro_minotari}
                            destination={sendContext.destination}
                            paymentId={sendContext.payment_id}
                            subtitle={t('security.pin.approve-send-subtitle')}
                        />
                    )}
                    <EnterPin onSubmit={handleSubmit} />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
