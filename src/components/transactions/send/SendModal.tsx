import { FormProvider, useForm } from 'react-hook-form';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import type { SendInputs } from '@app/components/transactions/send/types.ts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SendForm } from './SendForm.tsx';
import { SendReview } from './SendReview/SendReview.tsx';
import { StyledForm, Wrapper } from './Send.styles.ts';
import { FormRootError } from './FormRootError.tsx';
import { invoke } from '@tauri-apps/api/core';
import { setError as setStoreError } from '@app/store';
import { PIN_CANCELLED_RE } from '@app/store/actions/l2WalletStoreActions.ts';
import { queryClient } from '@app/App/queryClient.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';

interface SendModalProps {
    section: string;
    setSection: (section: string) => void;
}
export type SendStatus = 'fields' | 'reviewing' | 'processing' | 'completed';
const defaultValues = { message: undefined, address: '', amount: undefined };

export default function SendModal({ section, setSection }: SendModalProps) {
    const { t } = useTranslation('wallet');
    const [status, setStatus] = useState<SendStatus>('fields');
    const [isBack, setIsBack] = useState(false);
    const [feeMicroMinotari, setFeeMicroMinotari] = useState<number | null>(null);
    // Without a PIN the backend's confirmation dialog is the review step.
    const hasReviewStep = useWalletStore((s) => s.is_pin_locked);

    const methods = useForm<SendInputs>({
        defaultValues,
        mode: 'all',
    });

    const { reset } = methods;
    const estimateRequestIdRef = useRef(0);

    useEffect(() => {
        if (section !== 'send') {
            estimateRequestIdRef.current += 1;
        }
    }, [section]);

    const resetForm = () => {
        estimateRequestIdRef.current += 1;
        reset();
        setIsBack(false);
        setFeeMicroMinotari(null);
        setStatus('fields');
    };

    function handleClose() {
        resetForm();
        setSection('history');
    }

    function handleBack() {
        estimateRequestIdRef.current += 1;
        setStatus('fields');
        setIsBack(true);
    }

    const setError = methods.setError;

    const handleFormSubmit = useCallback(
        async (data: SendInputs) => {
            if (status === 'fields' && hasReviewStep) {
                const requestId = ++estimateRequestIdRef.current;
                if (data.amount) {
                    try {
                        const estimatedFee = await invoke('estimate_l1_send_fee', {
                            destination: data.address,
                            amount: data.amount.toString(),
                            paymentId: data.message,
                        });
                        if (estimateRequestIdRef.current !== requestId) {
                            return;
                        }
                        setFeeMicroMinotari(typeof estimatedFee === 'number' ? estimatedFee : null);
                    } catch (error) {
                        if (estimateRequestIdRef.current !== requestId) {
                            return;
                        }
                        setFeeMicroMinotari(null);
                        setError('amount', { message: `${error}` });
                        return;
                    }
                }
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
                await queryClient.invalidateQueries({ queryKey: ['transactions'] });
                setStatus('completed');
            } catch (error) {
                // The backend gates the send itself (PIN dialog, or an approve/deny dialog
                // when no PIN is set), so "the user said no" and "nobody answered in time"
                // are normal outcomes here, not failures worth a scary error toast.
                const message = `${error}`;
                const wasCancelled = PIN_CANCELLED_RE.test(message);
                const timedOut = /timed out waiting for confirmation/i.test(message);

                if (wasCancelled || timedOut) {
                    setError(`root.invoke_error`, {
                        message: wasCancelled ? t('send.error-denied') : t('send.error-timeout'),
                    });
                } else {
                    setStoreError(`Error sending transaction: ${error}`);
                    setError(`root.invoke_error`, {
                        message: `${t('send.error-message')} ${error}`,
                    });
                }
                setStatus('fields');
            }
        },
        [status, hasReviewStep, setStatus, setError, t]
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

    const formContentMarkup =
        status === 'fields' ? (
            <SendForm isBack={isBack} hasReviewStep={hasReviewStep} />
        ) : (
            <SendReview
                status={status}
                setStatus={setStatus}
                amount={methods.getValues().amount}
                address={methods.getValues().address}
                message={methods.getValues().message}
                feeMicroMinotari={feeMicroMinotari}
                handleClose={handleClose}
            />
        );

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
                        <FormRootError />
                        {formContentMarkup}
                    </StyledForm>
                </Wrapper>
            </FormProvider>
        </TransactionModal>
    );
}
