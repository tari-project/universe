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
import { CheckIconWrapper } from '@app/components/transactions/components/TxInput.style.ts';
import CheckIcon from '@app/components/transactions/components/CheckIcon.tsx';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { setSeedlessUI, setShouldShowExchangeSpecificModal } from '@app/store/actions/uiStoreActions.ts';
import { ToggleSwitch } from '@app/components/elements/inputs/switch/ToggleSwitch.tsx';
import { setAllowTelemetry, useConfigCoreStore } from '@app/store';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { useValidateTariAddress } from '@app/hooks/wallet/useValidate.ts';
import { convertEthAddressToTariAddress } from '@app/store/actions/bridgeApiActions.ts';
import { isAddress } from 'ethers';
import { useTranslation } from 'react-i18next';

interface ConnectFormFields {
    address: string;
}

export const Connect = () => {
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
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
            const isValid = isAddress(debouncedAddress);
            setAddressIsValid(isValid);
            if (!isValid) {
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
    }, [data?.wxtm_mode, debouncedAddress, setError, validateAddress, validationErrorMessage]);

    const handleWXTMSubmit = useCallback(async () => {
        const encodedAddress = await convertEthAddressToTariAddress(address, data?.id || 'unknown');
        console.info('Original Tari address:', address);
        console.info('Encoded Tari address:', encodedAddress);
        return encodedAddress;
    }, [address, data?.id]);

    const onSubmit = useCallback(
        async (_unused: ConnectFormFields) => {
            let tariAddress = address;
            try {
                if (data?.wxtm_mode) {
                    // In wxtm_mode we are converting the ETH address to a Tari address
                    tariAddress = await handleWXTMSubmit();
                }

                await invoke('confirm_exchange_address', { address: tariAddress });
                setSeedlessUI(true);
                setShowExchangeModal(false);
                setShouldShowExchangeSpecificModal(false);
            } catch (e) {
                console.error('Error confirming exchange address:', e);
            }
        },
        [address, data?.wxtm_mode, handleWXTMSubmit]
    );

    const labelCopy = data?.wxtm_mode
        ? `Enter your ${data?.name} ETH Address`
        : `Enter your ${data?.name} Tari Address`;

    const CTACopy = data?.wxtm_mode ? `Mine wXTM on ${data?.name}` : data?.campaign_cta || `Connect`;

    return isPending ? (
        <LoadingDots />
    ) : (
        <Wrapper>
            <ConnectForm onSubmit={handleSubmit(onSubmit)}>
                <AddressInputLabel>{labelCopy}</AddressInputLabel>
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
                    <Typography variant="p">{t('permissionNoGems.text')}</Typography>
                    <ToggleSwitch checked={allowTelemetry} onChange={handleToggle} />
                </OptInWrapper>
                <CTA
                    $backgroundCol={data?.primary_colour}
                    type="submit"
                    disabled={!allowTelemetry || formState.isSubmitting || !addressIsValid}
                >
                    {formState.isSubmitting || formState.isLoading ? <LoadingDots /> : <CTAText>{CTACopy}</CTAText>}
                </CTA>
            </ConnectForm>
        </Wrapper>
    );
};
