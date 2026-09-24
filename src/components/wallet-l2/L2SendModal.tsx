import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
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
import useDebouncedValue from '@app/hooks/helpers/useDebounce.ts';
import { setError as setStoreError } from '@app/store';

interface L2SendModalProps {
    show: boolean;
    account: string;
    onClose: () => void;
}

const defaultValues: SendInputs = { address: '', amount: undefined, l2Address: '' };

function L2SendForm() {
    const { t } = useTranslation('wallet');
    const { control, formState, setError, setValue, clearErrors } = useFormContext<SendInputs>();
    const { isSubmitting, errors } = formState;
    const address = useWatch({ control, name: 'l2Address' }) ?? '';
    const amount = useWatch({ control, name: 'amount' });
    const debouncedAddress = useDebouncedValue(address, 350);
    const [isAddressValid, setIsAddressValid] = useState(false);
    const isAmountValid = Number(amount) > 0;
    const isValid = isAddressValid && isAmountValid && !errors.amount;

    // The backend parses the address the same way the send does, so a typo is caught
    // here and never reaches the review step or the PIN prompt.
    useEffect(() => {
        setIsAddressValid(false);
        if (!debouncedAddress) return;
        invoke('l2_validate_address', { address: debouncedAddress })
            .then(() => {
                clearErrors('l2Address');
                setIsAddressValid(true);
            })
            .catch(() => setError('l2Address', { message: t('l2.send.error-invalid-address') }));
    }, [debouncedAddress, clearErrors, setError, t]);

    function handleAddressChange(e: ChangeEvent<HTMLInputElement>, name: InputName) {
        setValue(name, e.target.value.replace(/\s/g, ''), { shouldValidate: true });
    }

    function handleAmountBlur() {
        if (amount === undefined || `${amount}`.trim() === '') return;
        if (isAmountValid) {
            clearErrors('amount');
        } else {
            setError('amount', { message: t('send.error-invalid-amount') });
        }
    }

    return (
        <>
            <FormFieldsWrapper>
                <FormField
                    control={control}
                    name="l2Address"
                    handleChange={handleAddressChange}
                    required
                    autoFocus
                    truncateOnBlur
                    isValid={isAddressValid}
                    errorText={errors.l2Address?.message}
                />
                <FormField
                    control={control}
                    name="amount"
                    onBlur={handleAmountBlur}
                    required
                    icon={<TariOutlineSVG />}
                    errorText={errors.amount?.message}
                />
            </FormFieldsWrapper>
            <BottomWrapper>
                <Button
                    disabled={isSubmitting || !isValid}
                    type="submit"
                    fluid
                    variant="green"
                    size="xlarge"
                    data-testid="l2-send-review-button"
                >
                    {t('l2.send.cta-review')}
                </Button>
            </BottomWrapper>
        </>
    );
}

export default function L2SendModal({ show, account, onClose }: L2SendModalProps) {
    const { t } = useTranslation('wallet');
    const [status, setStatus] = useState<SendStatus>('fields');
    const [txId, setTxId] = useState<string | null>(null);
    const methods = useForm<SendInputs>({ defaultValues, mode: 'all' });
    const { reset, setError } = methods;

    function handleClose() {
        reset();
        setTxId(null);
        setStatus('fields');
        onClose();
    }

    const handleFormSubmit = useCallback(
        async (data: SendInputs) => {
            if (status === 'fields') {
                setStatus('reviewing');
                return;
            }
            setStatus('processing');
            try {
                const id = await invoke<string>('l2_send', {
                    account,
                    destination: data.l2Address,
                    amount: `${data.amount}`,
                });
                setTxId(id);
                setStatus('completed');
            } catch (error) {
                // Same outcomes as an L1 send: the backend's PIN gate said no.
                const message = `${error}`;
                if (/denied by user|PIN entry cancelled/i.test(message)) {
                    setError('root.invoke_error', { message: t('send.error-denied') });
                } else {
                    setStoreError(`${t('l2.send.error-message')}${error}`);
                    setError('root.invoke_error', { message: `${t('l2.send.error-message')}${error}` });
                }
                setStatus('fields');
            }
        },
        [status, account, setError, t]
    );

    const values = methods.getValues();
    const amountMicro = Math.round(Number(values.amount || 0) * 1_000_000);

    const statusEntries: StatusListEntry[] = [
        {
            label: t('send.status'),
            value: status === 'processing' ? t('send.processing') : t('send.broadcast'),
            status,
        },
        { label: t('l2.send.address'), value: values.l2Address },
        { label: t('send.transaction-id'), value: txId },
    ];

    const title =
        status === 'fields' ? t('l2.send.title') : status === 'reviewing' ? t('l2.send.review-title') : undefined;

    return (
        <TransactionModal
            show={show}
            title={title}
            handleClose={status !== 'reviewing' ? handleClose : undefined}
            handleBack={status === 'reviewing' ? () => setStatus('fields') : undefined}
        >
            <FormProvider {...methods}>
                <Wrapper $isLoading={methods.formState.isSubmitting}>
                    <StyledForm onSubmit={methods.handleSubmit(handleFormSubmit)}>
                        {status === 'fields' && <L2SendForm />}
                        {status === 'reviewing' && (
                            <>
                                <TransactionContextSummary
                                    kind="l2_send"
                                    amountMicroMinotari={amountMicro}
                                    destination={values.l2Address ?? ''}
                                />
                                <Button
                                    type="submit"
                                    fluid
                                    size="xlarge"
                                    variant="green"
                                    data-testid="l2-send-confirm-button"
                                >
                                    {t('l2.send.cta-confirm')}
                                </Button>
                            </>
                        )}
                        {(status === 'processing' || status === 'completed') && (
                            <div data-testid="l2-send-status">
                                {status === 'processing' ? (
                                    <StatusHero icon={<ProcessingIcon />} title={t('l2.send.processing-title')}>
                                        {t('l2.send.processing-text')}
                                    </StatusHero>
                                ) : (
                                    <StatusHero icon={<CompletedIcon />} title={t('l2.send.completed-title')}>
                                        {t('l2.send.completed-text')}
                                    </StatusHero>
                                )}
                                <StatusList entries={statusEntries} />
                                <Button
                                    type="button"
                                    fluid
                                    size="xlarge"
                                    variant="purple"
                                    disabled={status === 'processing'}
                                    onClick={handleClose}
                                    data-testid="l2-send-done-button"
                                >
                                    {status === 'processing' ? t('send.processing-button') : t('send.done-button')}
                                </Button>
                            </div>
                        )}
                    </StyledForm>
                </Wrapper>
            </FormProvider>
        </TransactionModal>
    );
}
