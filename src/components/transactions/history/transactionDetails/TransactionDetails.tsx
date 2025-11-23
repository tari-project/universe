import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { AccordionItem } from '@app/components/transactions/components/AccordionItem/AccordionItem.tsx';
import { WalletTransaction } from '@app/types/app-status.ts';
import { getTransactionListEntries, getOperationDetails } from './getTransactionListEntries.tsx';
import { Wrapper, OperationsSection, OperationsTitle } from './styles.ts';

interface TransactionDetailsProps {
    transaction: WalletTransaction;
    expanded: boolean;
    handleClose: () => void;
}

export const TransactionDetails = ({ transaction, expanded, handleClose }: TransactionDetailsProps) => {
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const { t } = useTranslation('wallet');

    // Track which accordions are open
    const [openOperations, setOpenOperations] = useState<Set<number>>(new Set());

    const toggleOperation = (index: number) => {
        setOpenOperations((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const mainEntries = getTransactionListEntries(transaction);
    const copyIcon = !isCopied ? <IoCopyOutline size={12} /> : <IoCheckmarkOutline size={12} />;

    // Combine inputs and outputs for display
    const allDetails = [...transaction.inputs, ...transaction.outputs];

    return (
        <TransactionModal show={expanded} title={t(`history.transaction-details`)} handleClose={handleClose}>
            <Wrapper>
                {/* Main transaction details */}
                <StatusList entries={mainEntries} />

                {/* Operations section */}
                {allDetails.length > 0 && (
                    <OperationsSection>
                        <OperationsTitle>{`Details (${allDetails.length})`}</OperationsTitle>

                        {allDetails.map((detail, index) => {
                            const operationEntries = getOperationDetails(detail, index);

                            // Create a better subtitle showing both credit and debit if both exist
                            let subtitle: string | undefined = undefined;
                            if (detail.balance_credit > 0 && detail.balance_debit > 0) {
                                subtitle = `Credit: ${detail.balance_credit} µXTM • Debit: ${detail.balance_debit} µXTM`;
                            } else if (detail.balance_credit > 0) {
                                subtitle = `Credit: ${detail.balance_credit} µXTM`;
                            } else if (detail.balance_debit > 0) {
                                subtitle = `Debit: ${detail.balance_debit} µXTM`;
                            }

                            return (
                                <AccordionItem
                                    key={`detail-${index}`}
                                    title={detail.description || `Detail #${index + 1}`}
                                    subtitle={subtitle}
                                    isOpen={openOperations.has(index)}
                                    onToggle={() => toggleOperation(index)}
                                    content={
                                        <>
                                            <StatusList entries={operationEntries} />
                                        </>
                                    }
                                />
                            );
                        })}
                    </OperationsSection>
                )}
            </Wrapper>

            <Button
                size="large"
                fluid
                icon={copyIcon}
                onClick={() => copyToClipboard(JSON.stringify(transaction, null, 2))}
            >
                {t('send.transaction-copy-raw')}
            </Button>
        </TransactionModal>
    );
};
