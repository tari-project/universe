import { useForm } from 'react-hook-form';
import { invoke } from '@tauri-apps/api/core';
import { setShowExchangeModal, useExchangeStore } from '@app/store/useExchangeStore.ts';
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
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { setSeedlessUI } from '@app/store/actions/uiStoreActions.ts';
import { setWalletAddress } from '@app/store';

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

    async function onSubmit(_unused: ConnectFormFields) {
        try {
            await invoke('confirm_exchange_address', { address });
            setSeedlessUI(true);
            setShowExchangeModal(false);
        } catch (e) {
            console.error('Error confirming exchange address:', e);
        }
    }
    return (
        <Wrapper>
            <ConnectForm onSubmit={handleSubmit(onSubmit)}>
                <AddressInputLabel>{`Enter your ${data?.name} Tari Address`}</AddressInputLabel>
                <AddressInputWrapper>
                    <AddressInput
                        {...register('address', {
                            required: true,
                            onBlur: () => handleFocus(false),
                            onChange: handleAddressChange,
                        })}
                        onFocus={() => handleFocus(true)}
                        value={isFocused ? address : displayAddress}
                        placeholder="Enter Address"
                    />

                    {addressIsValid && (
                        <CheckIconWrapper initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
                            <CheckIcon />
                        </CheckIconWrapper>
                    )}
                </AddressInputWrapper>
                <CTA
                    $backgroundCol={data?.primary_colour}
                    type="submit"
                    disabled={formState.isSubmitting || !formState.isValid}
                >
                    {formState.isSubmitting || formState.isLoading ? (
                        <LoadingDots />
                    ) : (
                        <CTAText>{data?.campaign_cta || `Connect`}</CTAText>
                    )}
                </CTA>
            </ConnectForm>
        </Wrapper>
    );
};
