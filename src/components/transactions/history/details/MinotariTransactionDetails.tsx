import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { AccordionItem } from '@app/components/transactions/components/AccordionItem/AccordionItem.tsx';
import { MinotariWalletTransaction } from '@app/types/app-status.ts';
import {
    getMinotariListEntries,
    getOperationDetails,
    getOutputDetails,
} from '../minotariWallet/getMinotariListEntries.tsx';
import { Wrapper, OperationsSection, OperationsTitle } from './styles.ts';

interface MinotariTransactionDetailsProps {
    transaction: MinotariWalletTransaction;
    expanded: boolean;
    handleClose: () => void;
}

export const MinotariTransactionDetails = ({ transaction, expanded, handleClose }: MinotariTransactionDetailsProps) => {
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

    const mainEntries = getMinotariListEntries(transaction);
    const copyIcon = !isCopied ? <IoCopyOutline size={12} /> : <IoCheckmarkOutline size={12} />;

    return (
        <TransactionModal show={expanded} title={t(`history.transaction-details`)} handleClose={handleClose}>
            <Wrapper>
                {/* Main transaction details */}
                <StatusList entries={mainEntries} />

                {/* Operations section */}
                {transaction.operations.length > 0 && (
                    <OperationsSection>
                        <OperationsTitle>{`Operations (${transaction.operations.length})`}</OperationsTitle>

                        {transaction.operations.map((operation, index) => {
                            const operationEntries = getOperationDetails(operation, index);
                            const hasReceivedOutput = !!operation.recieved_output_details;
                            const hasSpentOutput = !!operation.spent_output_details;

                            // Create a better subtitle showing both credit and debit if both exist
                            let subtitle: string | undefined = undefined;
                            if (operation.balance_credit > 0 && operation.balance_debit > 0) {
                                subtitle = `Credit: ${operation.balance_credit} µXTM • Debit: ${operation.balance_debit} µXTM`;
                            } else if (operation.balance_credit > 0) {
                                subtitle = `Credit: ${operation.balance_credit} µXTM`;
                            } else if (operation.balance_debit > 0) {
                                subtitle = `Debit: ${operation.balance_debit} µXTM`;
                            }

                            return (
                                <AccordionItem
                                    key={`operation-${index}`}
                                    title={operation.description || `Operation #${index + 1}`}
                                    subtitle={subtitle}
                                    isOpen={openOperations.has(index)}
                                    onToggle={() => toggleOperation(index)}
                                    content={
                                        <>
                                            <StatusList entries={operationEntries} />

                                            {/* Seamlessly integrated output details */}
                                            {hasReceivedOutput && (
                                                <StatusList
                                                    entries={getOutputDetails(operation.recieved_output_details!)}
                                                />
                                            )}

                                            {hasSpentOutput && (
                                                <StatusList
                                                    entries={getOutputDetails(operation.spent_output_details!)}
                                                />
                                            )}
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
