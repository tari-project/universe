import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { StatusList } from '@app/components/transactions/components/StatusList/StatusList.tsx';
import { AccordionItem } from '@app/components/transactions/components/AccordionItem/AccordionItem.tsx';
import { DisplayedTransaction, TransactionInput, TransactionOutput } from '@app/types/app-status.ts';
import { getTransactionListEntries, getInputDetails, getOutputDetails } from './getTransactionListEntries.tsx';
import { Wrapper, OperationsSection, OperationsTitle } from './styles.ts';

interface TransactionDetailsProps {
    transaction: DisplayedTransaction;
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

    // Get inputs and outputs from details
    const inputs = transaction.details.inputs || [];
    const outputs = transaction.details.outputs || [];
    const hasDetails = inputs.length > 0 || outputs.length > 0;

    return (
        <TransactionModal show={expanded} title={t(`history.transaction-details`)} handleClose={handleClose}>
            <Wrapper>
                {/* Main transaction details */}
                <StatusList entries={mainEntries} />

                {/* Operations section */}
                {hasDetails && (
                    <OperationsSection>
                        <OperationsTitle>{`Details (${inputs.length + outputs.length})`}</OperationsTitle>

                        {/* Render inputs */}
                        {inputs.map((input: TransactionInput, index: number) => {
                            const operationEntries = getInputDetails(input);
                            const subtitle = `Amount: ${input.amount} µXTM`;

                            return (
                                <AccordionItem
                                    key={`input-${index}`}
                                    title={`Input #${index + 1}`}
                                    subtitle={subtitle}
                                    isOpen={openOperations.has(index)}
                                    onToggle={() => toggleOperation(index)}
                                    content={<StatusList entries={operationEntries} />}
                                />
                            );
                        })}

                        {/* Render outputs */}
                        {outputs.map((output: TransactionOutput, index: number) => {
                            const operationEntries = getOutputDetails(output);
                            const subtitle = `Amount: ${output.amount} µXTM • ${output.output_type}`;
                            const outputIndex = inputs.length + index;

                            return (
                                <AccordionItem
                                    key={`output-${index}`}
                                    title={output.is_change ? `Change Output #${index + 1}` : `Output #${index + 1}`}
                                    subtitle={subtitle}
                                    isOpen={openOperations.has(outputIndex)}
                                    onToggle={() => toggleOperation(outputIndex)}
                                    content={<StatusList entries={operationEntries} />}
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
