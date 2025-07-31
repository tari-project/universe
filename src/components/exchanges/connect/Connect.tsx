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
import { useEffect, useState } from 'react';
import useDebouncedValue from '@app/hooks/helpers/useDebounce.ts';
import { truncateMiddle } from '@app/utils';
import { CheckIconWrapper } from '@app/components/transactions/components/TxInput.style.ts';
import CheckIcon from '@app/components/transactions/components/CheckIcon.tsx';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { setSeedlessUI, setShouldShowExchangeSpecificModal } from '@app/store/actions/uiStoreActions.ts';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { setAllowTelemetry, useConfigCoreStore } from '@app/store';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { useValidateTariAddress } from '@app/hooks/wallet/useValidate.ts';
import { convertEthAddressToTariAddress } from '@app/store/actions/bridgeApiActions.ts';
import { isAddress } from 'ethers';

interface ConnectFormFields {
    address: string;
}

export const Connect = () => {
    const { data, isPending } = useFetchExchangeBranding();
    const [address, setAddress] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [addressIsValid, setAddressIsValid] = useState(false);
    const [displayAddress, setDisplayAddress] = useState(address);
    const allowTelemetry = useConfigCoreStore((s) => s.allow_telemetry);
    const debouncedAddress = useDebouncedValue(address, 350);
    const { validateAddress, validationErrorMessage } = useValidateTariAddress();

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

    useEffect(() => {
        if (!debouncedAddress.length) {
            setError('address', { message: 'Address cannot be empty.' });
            return;
        }
        if (data?.wxtm_mode) {
            if (isAddress(debouncedAddress)) {
                setAddressIsValid(true);
                setError('address', { message: 'Ethereum address is invalid.' });
            }
        } else {
            validateAddress(debouncedAddress).then((isValid) => {
                setAddressIsValid(isValid);
                if (!isValid) {
                    setError('address', { message: validationErrorMessage });
                }
            });
        }
    }, [debouncedAddress, setError, validateAddress, validationErrorMessage]);

    async function onSubmit(_unused: ConnectFormFields) {
        try {
            let tariAddress = address;

            // In wxtm_mode we are converting the ETH address to a Tari address
            if (data?.wxtm_mode) {
                const encodedAddress = await convertEthAddressToTariAddress(address, data?.id || 'unknown');
                console.info('Original Tari address:', address);
                console.info('Encoded Tari address:', encodedAddress);
                tariAddress = encodedAddress;
            }
            await invoke('confirm_exchange_address', { address: tariAddress });
            setSeedlessUI(true);
            setShowExchangeModal(false);
            setShouldShowExchangeSpecificModal(false);
        } catch (e) {
            console.error('Error confirming exchange address:', e);
        }
    }

    return isPending ? (
        <LoadingDots />
    ) : (
        <Wrapper>
            <ConnectForm onSubmit={handleSubmit(onSubmit)}>
                <AddressInputLabel>{`Enter your ${data?.name} Tari Address`}</AddressInputLabel>
                <AddressInputWrapper>
                    <AddressInput
                        {...register('address', {
                            required: true,
                            onBlur: () => {
                                handleFocus(false);
                            },
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
                    disabled={!allowTelemetry || formState.isSubmitting || !addressIsValid}
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
