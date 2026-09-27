import { useTranslation } from 'react-i18next';
import { respondToPin, useSecurityStore } from '@app/store/useSecurityStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import CloseButton from '@app/components/elements/buttons/CloseButton.tsx';
import EnterPin from '@app/components/security/pin/EnterPin.tsx';
import { TransactionContextSummary } from '@app/components/transactions/send/TransactionContextSummary.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import type { PinPromptContext } from '@app/types/events-payloads.ts';
import { Header, Heading, Wrapper } from './styles.ts';

// The prompts with no amount to show say in one line what the PIN authorises.
const REASON_KEYS: Partial<Record<PinPromptContext['kind'], string>> = {
    restore_wallet_details: 'security.pin.restore-wallet-details',
    seed_needs_pin: 'security.pin.seed-needs-pin',
    l2_unlock: 'security.pin.l2-unlock',
    l2_seed_export: 'security.pin.l2-seed-export',
    l2_seed_import: 'security.pin.l2-seed-import',
    l2_seed_reset: 'security.pin.l2-seed-reset',
};

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
    const burnContext = pinContext?.kind === 'burn' ? pinContext : null;
    const l2SendContext = pinContext?.kind === 'l2_send' ? pinContext : null;
    const l2ClaimContext = pinContext?.kind === 'l2_claim' ? pinContext : null;
    const reasonKey = pinContext ? REASON_KEYS[pinContext.kind] : undefined;

    function handleClose() {
        if (pinResolver) {
            pinResolver(undefined);
            useSecurityStore.setState({ pinResolver: null, pinContext: null });
            setModal(null);
        } else {
            void respondToPin();
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
            respondToPin(pin).finally(() => {
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
                        <Heading>
                            {burnContext
                                ? t('security.pin.approve-burn')
                                : l2ClaimContext
                                  ? t('l2.claim.approve')
                                  : sendContext || l2SendContext
                                    ? t('security.pin.approve-send')
                                    : t('security.pin.enter')}
                        </Heading>{' '}
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
                    {burnContext && (
                        <TransactionContextSummary
                            kind="burn"
                            amountMicroMinotari={burnContext.amount_micro_minotari}
                            destination={burnContext.claim_public_key}
                            paymentId={burnContext.payment_id}
                            subtitle={t('security.pin.approve-burn-subtitle')}
                        />
                    )}
                    {l2SendContext && (
                        <TransactionContextSummary
                            kind="l2_send"
                            amountMicroMinotari={l2SendContext.amount_micro_minotari}
                            destination={l2SendContext.destination}
                            subtitle={t('security.pin.approve-send-subtitle')}
                        />
                    )}
                    {l2ClaimContext && (
                        <TransactionContextSummary
                            kind="l2_claim"
                            amountMicroMinotari={l2ClaimContext.amount_micro_minotari}
                            destination={l2ClaimContext.commitment}
                            subtitle={t('l2.claim.approve-subtitle')}
                        />
                    )}
                    <EnterPin onSubmit={handleSubmit} />
                </Wrapper>
            </DialogContent>
        </Dialog>
    );
}
