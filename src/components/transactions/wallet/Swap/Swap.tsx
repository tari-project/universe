import { BackButton, SectionHeaderWrapper, SwapsContainer } from './Swap.styles';
import { HeaderLabel, TabHeader } from '../../components/Tabs/tab.styles';
import {
    SwapConfirmation,
    SwapConfirmationTransactionProps,
} from '@app/containers/floating/SwapDialogs/sections/SwapConfirmation/SwapConfirmation';
import {
    ProccessingTransactionProps,
    ProcessingTransaction,
} from '@app/containers/floating/SwapDialogs/sections/ProcessingTransaction/ProcessingTransaction';

import { useState, memo, useCallback } from 'react'; // Added useRef
import { SignApprovalMessage } from '@app/containers/floating/SwapDialogs/sections/SignMessage/SignApprovalMessage';
import { useTranslation } from 'react-i18next';
import { setIsSwapping } from '@app/store/actions/walletStoreActions';
import { MessageType, useIframeMessage } from '@app/hooks/swap/useIframeMessage';

export const Swap = memo(function Swap() {
    const [processingOpen, setProcessingOpen] = useState(false);
    const [processingTransaction, setProcessingTransaction] = useState<ProccessingTransactionProps | null>(null);
    const [approving, setApproving] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [confirmingTransaction, setConfirmingTransaction] = useState<SwapConfirmationTransactionProps | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { t } = useTranslation(['wallet'], { useSuspense: false });

    const handleConfirm = useCallback(() => {
        console.info('confirming');
    }, []);

    useIframeMessage((event) => {
        if (event.data.type === MessageType.CONFIRM_REQUEST) {
            setConfirming(true);
            setConfirmingTransaction({
                fromTokenDisplay: event.data.payload.fromTokenDisplay,
                toTokenSymbol: event.data.payload.toTokenSymbol,
                transaction: event.data.payload.transaction,
            });
        }
        // console.info(event);
        // if (event.type === MessageType.APPROVE_REQUEST) {
        //     setApproving(true);
        // } else if (event.type === MessageType.APPROVE_SUCCESS) {
        //     setApproving(false);
        //     setConfirming(true);
        //     setConfirmingTransaction({
        //         fromTokenDisplay: event.data.payload.fromTokenDisplay,
        //         toTokenSymbol: event.data.payload.toTokenSymbol,
        //         transaction: event.data.payload.transaction,
        //     });
        // } else if (event.type === MessageType.CONFIRM_REQUEST) {
        //     setConfirming(true);
        //     setConfirmingTransaction({
        //         fromTokenDisplay: event.data.payload.fromTokenDisplay,
        //         toTokenSymbol: event.data.payload.toTokenSymbol,
        //         transaction: event.data.payload.transaction,
        //     });
        // } else if (event.type === MessageType.PROCESSING_STATUS) {
        //     setProcessingTransaction(event.data.payload);
        // } else if (event.type === MessageType.ERROR) {
        //     setError(event.data.payload.message);
        // }
    });

    return (
        <SwapsContainer>
            <TabHeader $noBorder>
                <SectionHeaderWrapper>
                    <HeaderLabel>{t('swap.buy-tari')}</HeaderLabel>
                    <BackButton onClick={() => setIsSwapping(false)}>{t('swap.back-button')}</BackButton>
                </SectionHeaderWrapper>
            </TabHeader>
            <div style={{ width: '100%', height: '100%', minHeight: '350px' }}>
                <iframe
                    src="http://localhost:3000/swaps"
                    title="swap"
                    style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '420px',
                        border: 'none',
                        pointerEvents: 'all',
                        borderRadius: '10px',
                        overflow: 'hidden',
                    }}
                />
            </div>
            {/* ////////////////////////////////// */}
            {/* Floating Elements */}
            <SwapConfirmation
                isOpen={confirming}
                setIsOpen={setConfirming}
                onConfirm={handleConfirm}
                transaction={confirmingTransaction?.transaction}
                fromTokenDisplay={confirmingTransaction?.fromTokenDisplay}
                toTokenSymbol={confirmingTransaction?.toTokenSymbol}
            />
            <ProcessingTransaction
                status={processingTransaction?.status}
                isOpen={processingOpen}
                setIsOpen={setProcessingOpen}
                fees={{
                    approval: processingTransaction?.fees?.approval ?? null,
                    swap: processingTransaction?.fees?.swap ?? null,
                }}
                txBlockHash={processingTransaction?.txBlockHash ?? undefined}
                transactionId={processingTransaction?.transactionId ?? undefined}
                errorMessage={error} // Pass the error message
            />
            <SignApprovalMessage isOpen={approving} setIsOpen={setProcessingOpen} />
        </SwapsContainer>
    );
});
