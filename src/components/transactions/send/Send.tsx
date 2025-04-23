import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useForm } from 'react-hook-form';

import { addPendingTransaction, setError as setStoreError } from '@app/store';

import { Button } from '@app/components/elements/buttons/Button.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';

import type { InputName, SendInputs } from './types.ts';
import { FormField } from './FormField.tsx';

import { BottomWrapper, FormFieldsWrapper, StyledForm, Wrapper } from './Send.styles';
import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';
import useDebouncedValue from '@app/hooks/helpers/useDebounce.ts';
import { SendReview } from './SendReview/SendReview.tsx';
import TransactionModal from '@app/components/TransactionModal/TransactionModal.tsx';

export type SendStatus = 'fields' | 'reviewing' | 'processing' | 'completed';

const defaultValues = { message: '', address: '', amount: undefined };

interface Props {
    section: string;
    setSection: (section: string) => void;
}

export function Send({ section, setSection }: Props) {
    const { t } = useTranslation('wallet');

    const [status, setStatus] = useState<SendStatus>('fields');
    const [address, setAddress] = useState('');
    const debouncedAddress = useDebouncedValue(address, 350);
    const [isAddressValid, setIsAddressValid] = useState(false);
    const [isAddressEmpty, setIsAddressEmpty] = useState(true);

    const { isWalletScanning, numericAvailableBalance } = useTariBalance();

    const { control, handleSubmit, formState, setError, setValue, clearErrors, getValues, reset } = useForm<SendInputs>(
        {
            defaultValues,
            mode: 'all',
        }
    );

    const { isSubmitted, isSubmitting, isValid, errors, isSubmitSuccessful } = formState;

    const resetForm = () => {
        setStatus('fields');
        setIsAddressValid(false);
        setIsAddressEmpty(true);
        reset();
    };

    const validateAmount = async (amount: string) => {
        if (amount.length === 0) return;

        try {
            await invoke('validate_minotari_amount', { amount });
            clearErrors('amount');
        } catch (error) {
            console.error('Error in validateAmount:', error);
            setError('amount', { message: t('send.error-invalid-amount') });
        }
    };

    const validateAddress = useCallback(
        async (address: string) => {
            if (address.length === 0) return;

            try {
                await invoke('verify_address_for_send', { address });
                setIsAddressValid(true);
            } catch (_error) {
                setIsAddressValid(false);
                setError('address', { message: t('send.error-invalid-address') });
            }
        },
        [setError, t]
    );

    useEffect(() => {
        validateAddress(debouncedAddress);
    }, [debouncedAddress, validateAddress]);

    const handleSend = useCallback(
        async (data: SendInputs) => {
            if (isAddressValid && isValid && status === 'fields') {
                setStatus('reviewing');
                return;
            }

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
                await invoke('send_one_sided_to_stealth_address', payload);

                addPendingTransaction(payload);
                setSection('history');
            } catch (error) {
                setStoreError(`Error sending transaction: ${error}`);
                setError(`root.invoke_error`, {
                    message: `${t('send.error-message')} ${error}`,
                });
            }
        },
        [setSection, setError, t, isAddressValid, isValid, status]
    );

    function handleChange(e: ChangeEvent<HTMLInputElement>, name: InputName) {
        const value = e.target.value;
        setValue(name, value, { shouldValidate: true });
        clearErrors(name);
    }

    function handleAddressChange(e: ChangeEvent<HTMLInputElement>, name: InputName) {
        const value = e.target.value.replace(/\s/g, '');
        setAddress(value);
        setValue(name, value, { shouldValidate: true });
        setIsAddressEmpty(value.length === 0);
    }

    const handleAddressBlur = () => {
        const address = getValues().address;
        validateAddress(address);
    };

    const handleAmountBlur = () => {
        const amount = getValues().amount;
        if (amount) {
            validateAmount(amount.toString().trim());
        }
    };

    const handleClose = () => {
        resetForm();
        setSection('history');
    };

    const getModalTitle = () => {
        if (status === 'processing' || status === 'completed') {
            return undefined;
        }

        if (status === 'reviewing') {
            return 'Review transaction';
        }

        return `${t('tabs.send')} ${t('tari')}`;
    };

    return (
        <TransactionModal
            show={section === 'send'}
            title={getModalTitle()}
            handleClose={handleClose}
            noClose={status === 'processing' || status === 'completed'}
        >
            <Wrapper $isLoading={isSubmitting}>
                <StyledForm onSubmit={handleSubmit(handleSend)}>
                    {status === 'fields' ? (
                        <>
                            <FormFieldsWrapper>
                                <FormField
                                    control={control}
                                    name="address"
                                    handleChange={handleAddressChange}
                                    onBlur={handleAddressBlur}
                                    required
                                    autoFocus
                                    truncateOnBlur
                                    isValid={isAddressValid}
                                    errorText={errors.address?.message}
                                />

                                <FormField
                                    control={control}
                                    name="amount"
                                    onBlur={handleAmountBlur}
                                    required
                                    icon={<TariOutlineSVG />}
                                    disabled={isAddressEmpty}
                                    secondaryField={
                                        <FormField
                                            control={control}
                                            name="message"
                                            handleChange={handleChange}
                                            disabled={isAddressEmpty}
                                            isSecondary={true}
                                        />
                                    }
                                    secondaryText={
                                        !isWalletScanning
                                            ? `${t('send.max-available')} ${numericAvailableBalance} XTM`
                                            : ''
                                    }
                                    miniButton={
                                        <>
                                            {!isWalletScanning && (
                                                <Button
                                                    variant="outlined"
                                                    size="xs"
                                                    color="grey"
                                                    backgroundColor="transparent"
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setValue('amount', numericAvailableBalance, {
                                                            shouldValidate: true,
                                                        });
                                                        handleAmountBlur();
                                                    }}
                                                >
                                                    {t('send.max')}
                                                </Button>
                                            )}
                                        </>
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
                                >
                                    {t('send.cta-review')}
                                </Button>
                            </BottomWrapper>
                        </>
                    ) : (
                        <SendReview
                            status={status}
                            setStatus={setStatus}
                            amount={getValues().amount}
                            address={getValues().address}
                            message={getValues().message}
                            networkFee={0.06}
                            feePercentage={0.02}
                            handleClose={handleClose}
                        />
                    )}
                </StyledForm>
            </Wrapper>
        </TransactionModal>
    );
}
