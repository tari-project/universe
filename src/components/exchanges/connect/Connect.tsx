import { useForm } from 'react-hook-form';
import { invoke } from '@tauri-apps/api/core';
import { setShowExchangeModal } from '@app/store/useExchangeStore.ts';
import {
    Wrapper,
    CTA,
    CTAText,
    ConnectForm,
    AddressInputWrapper,
    AddressInput,
    AddressInputLabel,
    OptInWrapper,
} from './connect.styles.ts';
import { useCallback, useEffect, useState } from 'react';
import useDebouncedValue from '@app/hooks/helpers/useDebounce.ts';
import { truncateMiddle } from '@app/utils';
import { CheckIconWrapper } from '@app/components/transactions/components/TxInput.style.ts'; // TODO - make reusable address input
import CheckIcon from '@app/components/transactions/components/CheckIcon.tsx';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { setSeedlessUI, setShouldShowExchangeSpecificModal } from '@app/store/actions/uiStoreActions.ts';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { setAllowTelemetry, useConfigCoreStore } from '@app/store';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';

interface ConnectFormFields {
    address: string;
}

export const Connect = () => {
    const { data } = useFetchExchangeBranding();
    const [address, setAddress] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [addressIsValid, setAddressIsValid] = useState(false);
    const [displayAddress, setDisplayAddress] = useState(address);
    const allowTelemetry = useConfigCoreStore((s) => s.allow_telemetry);
    const debouncedAddress = useDebouncedValue(address, 350);

    const { register, handleSubmit, setError, formState } = useForm<ConnectFormFields>({
        defaultValues: { address: '' },
    });

    async function handleToggle() {
        await setAllowTelemetry(!allowTelemetry);
    }

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
            setShouldShowExchangeSpecificModal(false);
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
                        $hasError={!!address.length && !addressIsValid}
                        value={isFocused ? address : displayAddress}
                        placeholder="Enter Address"
                    />

                    {addressIsValid && (
                        <CheckIconWrapper initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
                            <CheckIcon />
                        </CheckIconWrapper>
                    )}
                </AddressInputWrapper>
                <OptInWrapper>
                    <Typography variant="p">{`Tari Universe would like to use analytics to improve your experience.`}</Typography>
                    <ToggleSwitch checked={allowTelemetry} onChange={handleToggle} />
                </OptInWrapper>
                <CTA
                    $backgroundCol={data?.primary_colour}
                    type="submit"
                    disabled={!allowTelemetry || formState.isSubmitting || !formState.isValid}
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
