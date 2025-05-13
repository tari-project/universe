import { useForm } from 'react-hook-form';
import { invoke } from '@tauri-apps/api/core';
import { useExchangeStore } from '@app/store/useExchangeStore.ts';
import {
    Wrapper,
    CTA,
    CTAText,
    ConnectForm,
    AddressInputWrapper,
    AddressInput,
    AddressInputLabel,
} from './connect.styles.ts';
import { useCallback, useEffect, useState } from 'react';
import useDebouncedValue from '@app/hooks/helpers/useDebounce.ts';
import { truncateMiddle } from '@app/utils';
import { CheckIconWrapper } from '@app/components/transactions/components/TxInput.style.ts'; // TODO - make reusable address input
import CheckIcon from '@app/components/transactions/components/CheckIcon.tsx';

interface ConnectFormFields {
    address: string;
}

export const Connect = () => {
    const data = useExchangeStore((s) => s.content);
    const [address, setAddress] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [addressIsValid, setAddressIsValid] = useState(false);
    const [displayAddress, setDisplayAddress] = useState(address);

    const debouncedAddress = useDebouncedValue(address, 350);

    const { register, handleSubmit, setError, formState } = useForm<ConnectFormFields>({
        defaultValues: { address: '' },
    });

    function handleAddressChange(e) {
        const address = e.target.value;
        setAddress(address);
        setDisplayAddress(truncateMiddle(address, 4));
    }
    function handleFocus(focused: boolean) {
        setIsFocused(focused);
    }
    const validateAddress = useCallback(
        (address: string) => {
            if (!address.length) {
                setError('address', { message: 'Address cannot be empty.' });
                return;
            }
            invoke('verify_address_for_send', { address })
                .then(() => {
                    setAddressIsValid(true);
                })
                .catch((e) => {
                    setError('address', { message: e });
                    setAddressIsValid(false);
                });
        },
        [setError]
    );

    useEffect(() => {
        void validateAddress(debouncedAddress);
    }, [debouncedAddress, validateAddress]);

    function onSubmit(data: ConnectFormFields) {
        console.debug('onSubmit!', data);
    }
    return (
        <Wrapper>
            <ConnectForm onSubmit={handleSubmit(onSubmit)}>
                <AddressInputLabel>{data.exchange_wallet_label}</AddressInputLabel>
                <AddressInputWrapper>
                    <AddressInput
                        {...register('address', {
                            required: true,
                            onBlur: () => handleFocus(false),
                            onChange: handleAddressChange,
                        })}
                        onFocus={() => handleFocus(true)}
                        value={isFocused ? address : displayAddress}
                    />

                    {addressIsValid && (
                        <CheckIconWrapper initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
                            <CheckIcon />
                        </CheckIconWrapper>
                    )}
                </AddressInputWrapper>
                <CTA
                    $backgroundCol={data.primary_col}
                    type="submit"
                    disabled={formState.isSubmitting || !formState.isValid}
                >
                    <CTAText>{`Connect`}</CTAText>
                </CTA>
            </ConnectForm>
        </Wrapper>
    );
};
