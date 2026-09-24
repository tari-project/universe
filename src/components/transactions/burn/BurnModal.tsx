import { ChangeEvent, useCallback, useState } from 'react';
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { FormField } from '@app/components/transactions/send/FormField.tsx';
import type { InputName, SendInputs } from '@app/components/transactions/send/types.ts';
import type { SendStatus } from '@app/components/transactions/send/SendModal.tsx';
import {
    BottomWrapper,
    FormFieldsWrapper,
    StyledForm,
    Wrapper,
} from '@app/components/transactions/send/Send.styles.ts';
import { TransactionContextSummary } from '@app/components/transactions/send/TransactionContextSummary.tsx';
import { StatusHero } from '@app/components/transactions/components/StatusHero/StatusHero';
import { StatusList, StatusListEntry } from '@app/components/transactions/components/StatusList/StatusList';
import ProcessingIcon from '@app/components/transactions/send/SendReview/icons/ProcessingIcon';
import CompletedIcon from '@app/components/transactions/send/SendReview/icons/CompletedIcon';
import { useValidateTariAddress } from '@app/hooks/wallet/useValidate.ts';
import { setError as setStoreError } from '@app/store';
import { queryClient } from '@app/App/queryClient.ts';

interface BurnModalProps {
    section: string;
    setSection: (section: string) => void;
}

interface BurnReceipt {
    tx_id: string;
    output_hash: string;
    proof_file: string;
}

const CLAIM_KEY_RE = /^[0-9a-fA-F]{64}$/;
const defaultValues: SendInputs = { message: undefined, address: '', amount: undefined, claimPublicKey: '' };

function BurnForm() {
    const { t } = useTranslation('wallet');
    const { validateAmount } = useValidateTariAddress();
    const { control, formState, setError, setValue, clearErrors, getValues } = useFormContext<SendInputs>();
    const { isSubmitting, errors } = formState;
    const claimKey = useWatch({ control, name: 'claimPublicKey' }) ?? '';
    const amount = useWatch({ control, name: 'amount' });
    const isClaimKeyValid = CLAIM_KEY_RE.test(claimKey);
    const isValid = isClaimKeyValid && !errors.amount && Boolean(amount);

    function handleChange(e: ChangeEvent<HTMLInputElement>, name: InputName) {
        setValue(name, e.target.value, { shouldValidate: true });
        clearErrors(name);
    }

    function handleClaimKeyChange(e: ChangeEvent<HTMLInputElement>, name: InputName) {
        const value = e.target.value.replace(/\s/g, '');
        setValue(name, value, { shouldValidate: true });
        if (value.length === 0 || CLAIM_KEY_RE.test(value)) {
            clearErrors(name);
        } else {
            setError(name, { message: t('burn.error-invalid-claim-key') });
        }
    }

    const handleAmountBlur = async () => {
        const amount = getValues().amount;
        if (!amount) return;
        const isAmountValid = Number(amount) > 0 && (await validateAmount(amount.toString().trim()));
        if (isAmountValid) {
            clearErrors('amount');
        } else {
            setError('amount', { message: t('send.error-invalid-amount') });
        }
    };

    return (
        <>
            <Typography variant="p" style={{ opacity: 0.7, fontSize: 12 }}>
                {t('burn.warning')}
            </Typography>
            <FormFieldsWrapper>
                <FormField
                    control={control}
                    name="claimPublicKey"
                    handleChange={handleClaimKeyChange}
                    required
                    autoFocus
                    truncateOnBlur
                    isValid={isClaimKeyValid}
                    errorText={errors.claimPublicKey?.message}
                />
                <FormField
                    control={control}
                    name="amount"
                    onBlur={handleAmountBlur}
                    required
                    icon={<TariOutlineSVG />}
                    secondaryField={
                        <FormField control={control} name="message" handleChange={handleChange} isSecondary={true} />
                    }
                />
            </FormFieldsWrapper>
            <BottomWrapper>
                <Button
                    disabled={isSubmitting || !isValid}
                    type="submit"
                    fluid
                    variant="green"
                    size="xlarge"
                    data-testid="burn-review-button"
                >
                    {t('burn.cta-review')}
                </Button>
            </BottomWrapper>
        </>
    );
}

export default function BurnModal({ section, setSection }: BurnModalProps) {
    const { t } = useTranslation('wallet');
    const [status, setStatus] = useState<SendStatus>('fields');
    const [receipt, setReceipt] = useState<BurnReceipt | null>(null);
    const methods = useForm<SendInputs>({ defaultValues, mode: 'all' });
    const { reset, setError } = methods;

    function handleClose() {
        reset();
        setReceipt(null);
        setStatus('fields');
        setSection('history');
    }

    const handleFormSubmit = useCallback(
        async (data: SendInputs) => {
            if (status === 'fields') {
                setStatus('reviewing');
                return;
            }
            setStatus('processing');
            try {
                const result = await invoke<BurnReceipt>('burn_to_l2', {
                    amount: `${data.amount}`,
                    claimPublicKey: data.claimPublicKey,
                    paymentId: data.message,
                });
                setReceipt(result);
                await queryClient.invalidateQueries({ queryKey: ['transactions'] });
                setStatus('completed');
            } catch (error) {
                // Same outcomes as a send: the backend's PIN / confirmation gate said no.
                const message = `${error}`;
                const wasCancelled = /denied by user|PIN entry cancelled/i.test(message);
                const timedOut = /timed out waiting for confirmation/i.test(message);
                if (wasCancelled || timedOut) {
                    setError('root.invoke_error', {
                        message: wasCancelled ? t('send.error-denied') : t('send.error-timeout'),
                    });
                } else {
                    setStoreError(`${t('burn.error-message')}${error}`);
                    setError('root.invoke_error', { message: `${t('burn.error-message')}${error}` });
                }
                setStatus('fields');
            }
        },
        [status, setError, t]
    );

    const values = methods.getValues();
    const amountMicro = Math.round(Number(values.amount || 0) * 1_000_000);

    const statusEntries: StatusListEntry[] = [
        {
            label: t('send.status'),
            value: status === 'processing' ? t('send.processing') : t('send.broadcast'),
            status,
        },
        { label: t('burn.claim-public-key'), value: values.claimPublicKey },
        { label: t('send.transaction-id'), value: receipt?.tx_id },
    ];

    const title = status === 'fields' ? t('burn.title') : status === 'reviewing' ? t('burn.review-title') : undefined;

    return (
        <TransactionModal
            show={section === 'burn'}
            title={title}
            handleClose={status !== 'reviewing' ? handleClose : undefined}
            handleBack={status === 'reviewing' ? () => setStatus('fields') : undefined}
        >
            <FormProvider {...methods}>
                <Wrapper $isLoading={methods.formState.isSubmitting}>
                    <StyledForm onSubmit={methods.handleSubmit(handleFormSubmit)}>
                        {status === 'fields' && <BurnForm />}
                        {status === 'reviewing' && (
                            <>
                                <TransactionContextSummary
                                    kind="burn"
                                    amountMicroMinotari={amountMicro}
                                    destination={values.claimPublicKey ?? ''}
                                    paymentId={values.message}
                                    subtitle={t('burn.warning')}
                                />
                                <Button
                                    type="submit"
                                    fluid
                                    size="xlarge"
                                    variant="green"
                                    data-testid="burn-confirm-button"
                                >
                                    {t('burn.cta-confirm')}
                                </Button>
                            </>
                        )}
                        {(status === 'processing' || status === 'completed') && (
                            <div data-testid="burn-status">
                                {status === 'processing' ? (
                                    <StatusHero icon={<ProcessingIcon />} title={t('burn.processing-title')}>
                                        {t('burn.processing-text')}
                                    </StatusHero>
                                ) : (
                                    <StatusHero icon={<CompletedIcon />} title={t('burn.completed-title')}>
                                        <>
                                            {t('burn.completed-text')}
                                            <br />
                                            <strong style={{ wordBreak: 'break-all' }}>{receipt?.proof_file}</strong>
                                        </>
                                    </StatusHero>
                                )}
                                <StatusList entries={statusEntries} />
                                {status === 'processing' ? (
                                    <Button type="button" fluid size="xlarge" variant="purple" disabled={true}>
                                        {t('send.processing-button')}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        fluid
                                        size="xlarge"
                                        variant="purple"
                                        onClick={handleClose}
                                        data-testid="burn-done-button"
                                    >
                                        {t('send.done-button')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </StyledForm>
                </Wrapper>
            </FormProvider>
        </TransactionModal>
    );
}
