import { ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useFormContext } from 'react-hook-form';

import { Button } from '@app/components/elements/buttons/Button.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';

import type { InputName, SendInputs } from './types.ts';
import { FormField } from './FormField.tsx';

import { BottomWrapper, FormFieldsWrapper } from './Send.styles';

import useDebouncedValue from '@app/hooks/helpers/useDebounce.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useValidate } from '@app/hooks/wallet/useValidate.ts';

interface Props {
    isBack?: boolean;
}

export function SendForm({ isBack }: Props) {
    const { t } = useTranslation('wallet');
    const { validateAddress, validateAmount, validationErrorMessage } = useValidate();
    const [address, setAddress] = useState('');
    const debouncedAddress = useDebouncedValue(address, 350);
    const [isAddressEmpty, setIsAddressEmpty] = useState(true);
    const availableBalance = useWalletStore((s) => s.balance?.available_balance);

    const numericAvailableBalance = Number(Math.floor((availableBalance || 0) / 1_000_000).toFixed(2));
    const isWalletScanning = useWalletStore((s) => s.wallet_scanning?.is_scanning);

    const { control, formState, setError, setValue, clearErrors, getValues } = useFormContext<SendInputs>();
    const { isSubmitting, errors } = formState;
    const isAddressValid = !errors.address;
    const isAmountValid = !errors.amount;
    const isValid = isAddressValid && isAmountValid;

    useEffect(() => {
        if (debouncedAddress?.length === 0) return;
        validateAddress(debouncedAddress).then((isValid) => {
            if (isValid) {
                clearErrors('address');
            } else {
                setError('address', { message: t('send.error-invalid-address') });
            }
        });
    }, [clearErrors, debouncedAddress, setError, t, validateAddress]);

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
            const amountTrimmed = amount.toString().trim();

            if (amountTrimmed.length === 0) return;

            if (Number(amount) === 0) {
                console.error('Error in validateAmount: value is invalid: ', amount);
                setError('amount', { message: t('send.error-invalid-amount') });
                return;
            }

            if (Number(availableBalance) <= 0) {
                console.error('Error in validateAmount: no available balance');
                setError('amount', { message: t('send.error-invalid-amount') });
            }

            const isValid = await validateAmount(amountTrimmed);
            if (isValid) {
                clearErrors('amount');
            } else {
                console.error('Error in validateAmount:', validationErrorMessage);
                setError('amount', { message: t('send.error-invalid-amount') });
            }
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
