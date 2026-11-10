import { FormProvider, useForm, type UseFormSetError } from 'react-hook-form';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';

import { commandErrorMessage, sendErrorKey, type SendInputs } from '@app/components/transactions/send/types.ts';

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

const fetchEffectivePaymentId = (data: SendInputs) =>
    invoke<EffectiveL1PaymentId>('effective_l1_payment_id', {
        destination: data.address,
        paymentId: data.message,
    });

// Resolves the L1 send fee and effective payment ID in parallel before transitioning to the review screen.
async function estimateSendReview(
    data: SendInputs,
    setError: UseFormSetError<SendInputs>
): Promise<{ fee: number | null; paymentId: EffectiveL1PaymentId } | 'aborted'> {
    const feePromise = data.amount
        ? invoke('estimate_l1_send_fee', {
              destination: data.address,
              amount: data.amount.toString(),
              paymentId: data.message,
          })
        : Promise.resolve(null);
    const [fee, effective] = await Promise.allSettled([feePromise, fetchEffectivePaymentId(data)]);
    if (fee.status === 'rejected') {
        setError('amount', { message: `${fee.reason}` });
        return 'aborted';
    }
    if (effective.status === 'rejected') {
        setError('address', { message: `${effective.reason}` });
        return 'aborted';
    }
    return {
        fee: typeof fee.value === 'number' ? fee.value : null,
        paymentId: effective.value,
    };
}

function reportSendFailure(error: unknown, setError: UseFormSetError<SendInputs>, t: TFunction) {
    // The backend gates the send itself (PIN dialog, or an approve/deny dialog
    // when no PIN is set), so "the user said no" and "nobody answered in time"
    // are normal outcomes here, not failures worth a scary error toast.
    const knownKey = sendErrorKey(error);
    if (knownKey) {
        setError('root.invoke_error', { message: t(knownKey) });
        return;
    }
    const message = commandErrorMessage(error);
    setStoreError(`Error sending transaction: ${message}`);
    setError('root.invoke_error', {
        message: `${t('send.error-message')} ${message}`,
    });
}

function getModalTitle(status: SendStatus, t: TFunction): string | undefined {
    if (status === 'processing' || status === 'completed') {
        return undefined;
    }
    if (status === 'reviewing') {
        return t('send.review-title');
    }
    return `${t('tabs.send')} ${t('tari')}`;
}

interface SubmitSendContext {
    data: SendInputs;
    status: SendStatus;
    hasReviewStep: boolean;
    estimateRequestIdRef: MutableRefObject<number>;
    setError: UseFormSetError<SendInputs>;
    setFeeMicroMinotari: (fee: number | null) => void;
    setResolvedPaymentId: (paymentId: EffectiveL1PaymentId | null) => void;
    setNotAcceptedYet: (notAccepted: boolean) => void;
    setStatus: (status: SendStatus) => void;
    t: TFunction;
}

async function runReviewStepEstimation(ctx: SubmitSendContext): Promise<void> {
    const requestId = ++ctx.estimateRequestIdRef.current;
    const result = await estimateSendReview(ctx.data, ctx.setError);
    if (ctx.estimateRequestIdRef.current !== requestId) return;
    if (result === 'aborted') {
        ctx.setFeeMicroMinotari(null);
        ctx.setResolvedPaymentId(null);
        return;
    }
    ctx.setFeeMicroMinotari(result.fee);
    ctx.setResolvedPaymentId(result.paymentId);
    ctx.setStatus('reviewing');
}

async function executeL1Send(ctx: SubmitSendContext): Promise<void> {
    if (!ctx.data.address) {
        ctx.setError('address', { message: ctx.t('send.error-address-required') });
        return;
    }
    if (!ctx.data.amount) {
        ctx.setError('amount', { message: ctx.t('send.error-amount-required') });
        return;
    }
    const receipt = await invoke<{ accepted_by_node?: boolean }>('send_one_sided_to_stealth_address', {
        destination: ctx.data.address,
        paymentId: ctx.data.message,
        amount: ctx.data.amount.toString(),
    });
    ctx.setNotAcceptedYet(receipt?.accepted_by_node === false);
    await queryClient.invalidateQueries({ queryKey: ['transactions'] });
    ctx.setStatus('completed');
}

async function submitL1SendForm(ctx: SubmitSendContext): Promise<void> {
    if (ctx.status === 'fields' && ctx.hasReviewStep) {
        await runReviewStepEstimation(ctx);
        return;
    }
    // No PIN: the backend dialog is the review, but the status screens below still
    // show the payment id that is sent, not the typed Message.
    if (!ctx.hasReviewStep) {
        try {
            ctx.setResolvedPaymentId(await fetchEffectivePaymentId(ctx.data));
        } catch (error) {
            ctx.setResolvedPaymentId(null);
            ctx.setError('address', { message: `${error}` });
            return;
        }
    }
    ctx.setStatus('processing');
    try {
        await executeL1Send(ctx);
    } catch (error) {
        reportSendFailure(error, ctx.setError, ctx.t);
        ctx.setStatus('fields');
    }
}

export default function SendModal({ section, setSection }: SendModalProps) {
    const { t } = useTranslation('wallet');
    const [status, setStatus] = useState<SendStatus>('fields');
    const [isBack, setIsBack] = useState(false);
    const [notAcceptedYet, setNotAcceptedYet] = useState(false);
    const [feeMicroMinotari, setFeeMicroMinotari] = useState<number | null>(null);
    const [resolvedPaymentId, setResolvedPaymentId] = useState<EffectiveL1PaymentId | null>(null);
    // Without a confirmed PIN the backend's confirmation dialog serves as the review step.
    const hasReviewStep = useWalletStore((s) => s.is_pin_locked === true);

    const methods = useForm<SendInputs>({
        defaultValues,
        mode: 'all',
    });

    const { reset, setError } = methods;
    const estimateRequestIdRef = useRef(0);

    useEffect(() => {
        if (section !== 'send') {
            estimateRequestIdRef.current += 1;
        }
    }, [section]);

    const handleClose = () => {
        estimateRequestIdRef.current += 1;
        reset();
        setIsBack(false);
        setNotAcceptedYet(false);
        setFeeMicroMinotari(null);
        setResolvedPaymentId(null);
        setStatus('fields');
        setSection('history');
    };

    const handleBack = () => {
        estimateRequestIdRef.current += 1;
        setResolvedPaymentId(null);
        setStatus('fields');
        setIsBack(true);
    };

    const handleFormSubmit = useCallback(
        (data: SendInputs) =>
            submitL1SendForm({
                data,
                status,
                hasReviewStep,
                estimateRequestIdRef,
                setError,
                setFeeMicroMinotari,
                setResolvedPaymentId,
                setNotAcceptedYet,
                setStatus,
                t,
            }),
        [status, hasReviewStep, setError, t]
    );

    const values = methods.getValues();
    const effectiveMessage = resolvedPaymentId ? (resolvedPaymentId.payment_id ?? undefined) : values.message;

    return (
        <TransactionModal
            show={section === 'send'}
            title={getModalTitle(status, t)}
            handleClose={status !== 'reviewing' ? handleClose : undefined}
            handleBack={status === 'reviewing' ? handleBack : undefined}
        >
            <FormProvider {...methods}>
                <Wrapper $isLoading={methods.formState.isSubmitting}>
                    <StyledForm onSubmit={methods.handleSubmit(handleFormSubmit)}>
                        <FormRootError />
                        {status === 'fields' ? (
                            <SendForm isBack={isBack} hasReviewStep={hasReviewStep} />
                        ) : (
                            <SendReview
                                status={status}
                                setStatus={setStatus}
                                amount={values.amount}
                                address={values.address}
                                message={effectiveMessage}
                                paymentIdOverridden={resolvedPaymentId?.payment_id_overridden}
                                notAcceptedYet={notAcceptedYet}
                                feeMicroMinotari={feeMicroMinotari}
                                handleClose={handleClose}
                            />
                        )}
                    </StyledForm>
                </Wrapper>
            </FormProvider>
        </TransactionModal>
    );
}
