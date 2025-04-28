import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useFormContext } from 'react-hook-form';

import { Button } from '@app/components/elements/buttons/Button.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';

import type { InputName, SendInputs } from './types.ts';
import { FormField } from './FormField.tsx';

import { BottomWrapper, FormFieldsWrapper } from './Send.styles';
import { useTariBalance } from '@app/hooks/wallet/useTariBalance.ts';
import useDebouncedValue from '@app/hooks/helpers/useDebounce.ts';

interface Props {
    isBack?: boolean;
}

export function SendForm({ isBack }: Props) {
    const { t } = useTranslation('wallet');

    const [address, setAddress] = useState('');
    const debouncedAddress = useDebouncedValue(address, 350);
    const [isAddressValid, setIsAddressValid] = useState(false);
    const [isAddressEmpty, setIsAddressEmpty] = useState(true);

    const { isWalletScanning, numericAvailableBalance } = useTariBalance();

    const { control, formState, setError, setValue, clearErrors, getValues } = useFormContext<SendInputs>();
    const { isSubmitting, isValid, errors } = formState;

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
        void validateAddress(debouncedAddress);
    }, [debouncedAddress, validateAddress]);

    useEffect(() => {
        const address = getValues().address;
        setIsAddressEmpty(address.length === 0);
        void validateAddress(address);
    }, [getValues, validateAddress]);

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

    const handleAddressBlur = async () => {
        const address = getValues().address;
        await validateAddress(address);
    };

    const handleAmountBlur = async () => {
        const amount = getValues().amount;
        if (amount) {
            await validateAmount(amount.toString().trim());
        }
    };

    return (
        <>
            <FormFieldsWrapper>
                <FormField
                    control={control}
                    name="address"
                    handleChange={handleAddressChange}
                    onBlur={handleAddressBlur}
                    required
                    autoFocus={!isBack}
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
                    autoFocus={isBack}
                    secondaryField={
                        <FormField
                            control={control}
                            name="message"
                            handleChange={handleChange}
                            disabled={isAddressEmpty}
                            isSecondary={true}
                        />
                    }
                    secondaryText={!isWalletScanning ? `${t('send.max-available')} ${numericAvailableBalance} XTM` : ''}
                    miniButton={
                        <>
                            {!isWalletScanning && (
                                <Button
                                    variant="outlined"
                                    size="xs"
                                    color="grey"
                                    backgroundColor="transparent"
                                    type="button"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setValue('amount', numericAvailableBalance, {
                                            shouldValidate: true,
                                        });
                                        await handleAmountBlur();
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
                <Button disabled={isSubmitting || !isValid} type="submit" fluid variant="green" size="xlarge">
                    {t('send.cta-review')}
                </Button>
            </BottomWrapper>
        </>
    );
}
