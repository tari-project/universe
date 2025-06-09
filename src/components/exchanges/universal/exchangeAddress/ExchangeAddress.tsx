import { useEffect } from 'react';
import { IconButton } from '@app/components/elements/buttons/IconButton';
import { InputArea } from '@app/containers/floating/Settings/sections/wallet/styles';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { IoCheckmarkOutline, IoCloseOutline } from 'react-icons/io5';
import { StyledForm, StyledInput } from './styles';
import ClipboardViewer from '../clipboardViewer/ClipboardViewer';
import { IconContainer } from '@app/containers/floating/XSpaceBanner/XSpaceBanner.style';
import { useTranslation } from 'react-i18next';

interface ExchangeAddressProps {
    handleIsAddressValid: (isValid: boolean) => void;
}
export const ExchangeAddress = ({ handleIsAddressValid }: ExchangeAddressProps) => {
    const { t } = useTranslation('exchange');
    const {
        control,
        watch,
        reset,
        trigger,
        setValue,
        formState: { errors },
    } = useForm();
    const [showClipboard, setShowClipboard] = useState(false);
    const address = watch('address');
    useEffect(() => {
        trigger('address');
    }, [address, trigger]);
    const handlePaste = useCallback(
        (value: string) => {
            console.info('Pasted value:', value);
            setValue('address', value);
        },
        [setValue]
    );
    const validateAddress = useCallback(async (value: string) => {
        try {
            await invoke('verify_address_for_send', { address: value });
            return true;
        } catch (_) {
            return false;
        }
    }, []);

    const validationRules = {
        validate: async (value: string) => {
            const isValid = await validateAddress(value);
            handleIsAddressValid(isValid);
            return isValid || 'Invalid address format';
        },
    };

    const handleReset = useCallback(() => {
        reset({ address: '' });
    }, [reset]);

    const handleFocus = useCallback(() => {
        setShowClipboard(true);
    }, []);

    return (
        <div style={{ width: '100%' }}>
            <StyledForm onReset={handleReset}>
                <InputArea>
                    <Controller
                        name="address"
                        control={control}
                        rules={validationRules}
                        render={({ field }) => {
                            return (
                                <StyledInput
                                    {...field}
                                    type="text"
                                    placeholder={t('wallet-address')}
                                    hasError={!!errors.address}
                                    onFocus={handleFocus}
                                />
                            );
                        }}
                    />
                    <IconContainer>
                        {errors.address ? (
                            <IconButton
                                style={{
                                    fontSize: 24,
                                    backgroundColor: '#0000001A',
                                }}
                                aria-label="Clear"
                                type="reset"
                            >
                                <IoCloseOutline />
                            </IconButton>
                        ) : (
                            <IconButton
                                style={{
                                    fontSize: 24,
                                    backgroundColor: '#00800020',
                                }}
                                aria-label="Valid"
                            >
                                <IoCheckmarkOutline />
                            </IconButton>
                        )}
                    </IconContainer>
                </InputArea>
            </StyledForm>
            {showClipboard && <ClipboardViewer handlePaste={handlePaste} />}
        </div>
    );
};
