import { useEffect } from 'react';
import { InputArea } from '@app/containers/floating/Settings/sections/wallet/styles';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { IconWrapper, ClearIcon, StyledForm, StyledInput, StyledInputWrapper } from './styles';
import { ClipboardViewer } from '../clipboardViewer/ClipboardViewer';
import { useTranslation } from 'react-i18next';
import CheckIcon from '@app/components/transactions/components/CheckIcon.tsx';
import { IoClose } from 'react-icons/io5';

interface ExchangeAddressProps {
    handleIsAddressValid: (isValid: boolean) => void;
    handleAddressChanged: (address: string) => void;
}
export const ExchangeAddress = ({
    handleIsAddressValid,
    handleAddressChanged: handleAddressChange,
}: ExchangeAddressProps) => {
    const { t } = useTranslation('exchange');
    const {
        control,
        watch,
        reset,
        trigger,
        setValue,
        formState: { errors, isValid },
    } = useForm();
    const [showClipboard, setShowClipboard] = useState(false);
    const address = watch('address');
    useEffect(() => {
        trigger('address');
        handleAddressChange(address || '');
    }, [address, trigger, handleAddressChange]);
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
        setShowClipboard((c) => !c);
    }, []);
    return (
        <>
            <StyledForm onReset={handleReset}>
                <InputArea>
                    <Controller
                        name="address"
                        control={control}
                        rules={validationRules}
                        render={({ field }) => {
                            return (
                                <StyledInputWrapper>
                                    <StyledInput
                                        {...field}
                                        type="text"
                                        placeholder={t('wallet-address')}
                                        hasError={!!errors.address}
                                        onFocus={handleFocus}
                                    />
                                    <IconWrapper>
                                        {errors.address ? (
                                            <ClearIcon onClick={handleReset}>
                                                <IoClose size={18} />
                                            </ClearIcon>
                                        ) : isValid ? (
                                            <CheckIcon />
                                        ) : null}
                                    </IconWrapper>
                                </StyledInputWrapper>
                            );
                        }}
                    />
                </InputArea>
            </StyledForm>
            {showClipboard && !address && <ClipboardViewer handlePaste={handlePaste} />}
        </>
    );
};
