import { FormProvider, useForm } from 'react-hook-form';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';

import { commandErrorMessage, sendErrorKey, type SendInputs } from '@app/components/transactions/send/types.ts';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SendForm } from './SendForm.tsx';
import { SendReview } from './SendReview/SendReview.tsx';
import { StyledForm, Wrapper } from './Send.styles.ts';
import { FormRootError } from './FormRootError.tsx';
import { invoke } from '@tauri-apps/api/core';
import { setError as setStoreError } from '@app/store';
import { queryClient } from '@app/App/queryClient.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import type { EffectiveL1PaymentId } from '@app/types/events-payloads.ts';

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

    const [notAcceptedYet, setNotAcceptedYet] = useState(false);

    const [feeMicroMinotari, setFeeMicroMinotari] = useState<number | null>(null);
    const [resolvedPaymentId, setResolvedPaymentId] = useState<EffectiveL1PaymentId | null>(null);
    // Without a PIN the backend's confirmation dialog is the review step.
    // While the PIN state is still loading (undefined), treat it as requiring the review step
    // rather than assuming no PIN is set.
    const hasReviewStep = useWalletStore((s) => s.is_pin_locked !== false);

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

        setNotAcceptedYet(false);

        setFeeMicroMinotari(null);
        setResolvedPaymentId(null);
        setStatus('fields');
    };

    function handleClose() {
        resetForm();
        setSection('history');
    }

    function handleBack() {
        estimateRequestIdRef.current += 1;
        setResolvedPaymentId(null);
        setStatus('fields');
        setIsBack(true);
    }

    const setError = methods.setError;

    const handleFormSubmit = useCallback(
        async (data: SendInputs) => {
            const effectivePaymentId = () =>
                invoke('effective_l1_payment_id', { destination: data.address, paymentId: data.message });

            if (status === 'fields' && hasReviewStep) {
                const requestId = ++estimateRequestIdRef.current;
                const [fee, effective] = await Promise.allSettled([
                    data.amount
                        ? invoke('estimate_l1_send_fee', {
                              destination: data.address,
                              amount: data.amount.toString(),
                              paymentId: data.message,
                          })
                        : Promise.resolve(null),
                    effectivePaymentId(),
                ]);
                if (estimateRequestIdRef.current !== requestId) {
                    return;
                }
                if (fee.status === 'rejected') {
                    setFeeMicroMinotari(null);
                    setError('amount', { message: `${fee.reason}` });
                    return;
                }
                if (effective.status === 'rejected') {
                    setResolvedPaymentId(null);
                    setError('address', { message: `${effective.reason}` });
                    return;
                }
                setFeeMicroMinotari(typeof fee.value === 'number' ? fee.value : null);
                setResolvedPaymentId(effective.value);
                setStatus('reviewing');
                return;
            }

            // No PIN: the backend dialog is the review, but the status screens below still
            // show the payment id that is sent, not the typed Message.
            if (!hasReviewStep) {
                try {
                    setResolvedPaymentId(await effectivePaymentId());
                } catch (error) {
                    setResolvedPaymentId(null);
                    setError('address', { message: `${error}` });
                    return;
                }
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
                const receipt = await invoke('send_one_sided_to_stealth_address', {
                    ...payload,
                    amount: payload.amount.toString(),
                });
                setNotAcceptedYet(receipt?.accepted_by_node === false);
                await queryClient.invalidateQueries({ queryKey: ['transactions'] });
                setStatus('completed');
            } catch (error) {
                // The backend gates the send itself (PIN dialog, or an approve/deny dialog
                // when no PIN is set), so "the user said no" and "nobody answered in time"
                // are normal outcomes here, not failures worth a scary error toast.
                const knownKey = sendErrorKey(error);
                if (knownKey) {
                    setError(`root.invoke_error`, { message: t(knownKey) });
                } else {
                    const message = commandErrorMessage(error);
                    setStoreError(`Error sending transaction: ${message}`);
                    setError(`root.invoke_error`, {
                        message: `${t('send.error-message')} ${message}`,
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
                message={resolvedPaymentId ? (resolvedPaymentId.payment_id ?? undefined) : methods.getValues().message}
                paymentIdOverridden={resolvedPaymentId?.payment_id_overridden}
                notAcceptedYet={notAcceptedYet}
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
