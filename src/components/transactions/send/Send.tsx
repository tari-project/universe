import { ChangeEvent, useCallback, useEffect, useState, FocusEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';
import { invoke } from '@tauri-apps/api/core';
import { useForm } from 'react-hook-form';

import { addPendingTransaction, setError as setStoreError } from '@app/store';

import { Button } from '@app/components/elements/buttons/Button.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';

import type { InputName, SendInputs } from './types.ts';
import { Confirmation } from './Confirmation.tsx';
import { FormField } from './FormField.tsx';

import { BottomWrapper, FormFieldsWrapper, StyledForm, Wrapper } from './Send.styles';

const defaultValues = { message: '', address: '', amount: undefined };

interface Props {
    section: string;
    setSection: (section: string) => void;
}

export function Send({ setSection }: Props) {
    const { t } = useTranslation('wallet');
    const [showConfirmation, setShowConfirmation] = useState(false);

    const [isAddressValid, setIsAddressValid] = useState(false);
    const [isAddressEmpty, setIsAddressEmpty] = useState(true);

    const { control, handleSubmit, reset, formState, setError, setValue, clearErrors, getValues } = useForm<SendInputs>(
        {
            defaultValues,
            mode: 'all',
        }
    );

    const { isSubmitted, isSubmitting, isValid, errors, isSubmitSuccessful } = formState;

    useEffect(() => {
        if (isSubmitted) {
            if (isSubmitSuccessful && !errors?.root) {
                setShowConfirmation(true);
            }
            const submitTimeout = setTimeout(() => {
                setShowConfirmation(false);
                reset(defaultValues);
            }, 3000);

            return () => {
                clearTimeout(submitTimeout);
            };
        }
    }, [isSubmitted, isSubmitSuccessful, errors, reset]);

    const handleSend = useCallback(
        async (data: SendInputs) => {
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
        [setSection, setError, t]
    );

    function handleChange(e: ChangeEvent<HTMLInputElement>, name: InputName) {
        const value = e.target.value;
        setValue(name, value, { shouldValidate: true });
        clearErrors(name);
    }

    function handleAddressChange(e: ChangeEvent<HTMLInputElement>, name: InputName) {
        const value = e.target.value;
        setValue(name, value, { shouldValidate: true });
        clearErrors(name);
        setIsAddressValid(false);
        setIsAddressEmpty(value.length === 0);
    }

    const validateAddress = async (address: string) => {
        if (address.length === 0) return;

        try {
            await invoke('verify_address_for_send', { address });
            setIsAddressValid(true);
        } catch (_error) {
            setIsAddressValid(false);
            setError('address', { message: t('send.error-invalid-address') });
        }
    };

    const validateAmount = async (amount: string) => {
        if (amount.length === 0) return;

        try {
            await invoke('validate_minotari_amount', { amount });
        } catch (error) {
            console.error('Error in validateAmount:', error);
            setError('amount', { message: t('send.error-invalid-amount') });
        }
    };

    const handleAddressBlur = (e: FocusEvent<HTMLInputElement>) => {
        const address = e.target.value;
        validateAddress(address);
    };

    const handleAmountBlur = () => {
        const amount = getValues().amount;
        if (amount) {
            validateAmount(amount.toString());
        }
    };

    return (
        <Wrapper $isLoading={isSubmitting}>
            <StyledForm onSubmit={handleSubmit(handleSend)}>
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
                        secondaryText={`Balance 2,512,239.21 XTM`}
                        miniButton={
                            <Button
                                variant="outlined"
                                size="xs"
                                color="grey"
                                backgroundColor="transparent"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setValue('amount', 2512239.21, { shouldValidate: true });
                                    clearErrors('amount');
                                }}
                            >
                                {`Max`}
                            </Button>
                        }
                    />
                </FormFieldsWrapper>
                <BottomWrapper>
                    <Button
                        disabled={isSubmitting || !isValid}
                        type="submit"
                        fluid
                        loader={<CircularProgress />}
                        isLoading={isSubmitting}
                        size="xlarge"
                    >
                        {t('send.cta-review')}
                    </Button>
                </BottomWrapper>
            </StyledForm>
            <AnimatePresence>{showConfirmation && <Confirmation />}</AnimatePresence>
        </Wrapper>
    );
}
