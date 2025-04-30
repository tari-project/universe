import { FormProvider, useForm } from 'react-hook-form';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import type { SendInputs } from '@app/components/transactions/send/types.ts';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SendForm } from './SendForm.tsx';
import { SendReview } from './SendReview/SendReview.tsx';
import { StyledForm, Wrapper } from './Send.styles.ts';
import { invoke } from '@tauri-apps/api/core';
import { addPendingTransaction, setError as setStoreError } from '@app/store';

interface SendModalProps {
    section: string;
    setSection: (section: string) => void;
}
export type SendStatus = 'fields' | 'reviewing' | 'processing' | 'completed';
const defaultValues = { message: '', address: '', amount: undefined };

export default function SendModal({ section, setSection }: SendModalProps) {
    const { t } = useTranslation('wallet');
    const [status, setStatus] = useState<SendStatus>('fields');
    const [isBack, setIsBack] = useState(false);

    const methods = useForm<SendInputs>({
        defaultValues,
        mode: 'all',
    });

    const { setError, reset } = methods;

    const resetForm = () => {
        setStatus('fields');
        setIsBack(false);
        reset();
    };

    function handleClose() {
        resetForm();
        setSection('history');
    }

    function handleBack() {
        setStatus('fields');
        setIsBack(true);
    }

    const handleFormSubmit = useCallback(
        async (data: SendInputs) => {
            if (status === 'fields') {
                setStatus('reviewing');
                return;
            }

            setStatus('processing');

            try {
                if (!data.address) {
                    setError('address', { message: t('send.error-address-required') });
                    return;
                }
                if (!data.amount) {
                    setError('amount', { message: t('send.error-amount-required') });
                    return;
                }

                const payload = {
                    amount: data.amount,
                    destination: data.address,
                    paymentId: data.message,
                };
                await invoke('send_one_sided_to_stealth_address', {
                    ...payload,
                    amount: payload.amount.toString(),
                });
                addPendingTransaction(payload);
                setStatus('completed');
            } catch (error) {
                setStoreError(`Error sending transaction: ${error}`);
                setError(`root.invoke_error`, {
                    message: `${t('send.error-message')} ${error}`,
                });
                setStatus('fields');
            }
        },
        [status, setStatus, setError, t]
    );

    const getModalTitle = () => {
        if (status === 'processing' || status === 'completed') {
            return undefined;
        }
        if (status === 'reviewing') {
            return t('send.review-title');
        }
        return `${t('tabs.send')} ${t('tari')}`;
    };

    return (
        <TransactionModal
            show={section === 'send'}
            title={getModalTitle()}
            handleClose={status !== 'reviewing' ? handleClose : undefined}
            handleBack={status === 'reviewing' ? handleBack : undefined}
        >
            <FormProvider {...methods}>
                <Wrapper $isLoading={methods.formState.isSubmitting}>
                    <StyledForm onSubmit={methods.handleSubmit(handleFormSubmit)}>
                        {status === 'fields' ? (
                            <SendForm isBack={isBack} />
                        ) : (
                            <SendReview
                                status={status}
                                setStatus={setStatus}
                                amount={methods.getValues().amount}
                                address={methods.getValues().address}
                                message={methods.getValues().message}
                                networkFee={0.06}
                                feePercentage={0.02}
                                handleClose={handleClose}
                            />
                        )}
                    </StyledForm>
                </Wrapper>
            </FormProvider>
        </TransactionModal>
    );
}
