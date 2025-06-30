import { useEffect } from 'react';
import { InputArea } from '@app/containers/floating/Settings/sections/wallet/styles';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { IconWrapper, ClearIcon, StyledForm, StyledInput, StyledInputWrapper } from './styles';
import { ClipboardViewer } from '../clipboardViewer/ClipboardViewer';
import { useTranslation } from 'react-i18next';
import CheckIcon from '@app/components/transactions/components/CheckIcon.tsx';
import { IoClose } from 'react-icons/io5';
import { useValidate } from '@app/hooks/wallet/useValidate.ts';

interface ExchangeAddressProps {
    handleIsAddressValid: (isValid: boolean) => void;
    handleAddressChanged: (address: string) => void;
    value?: string;
    disabled?: boolean;
}
export const ExchangeAddress = ({
    handleIsAddressValid,
    handleAddressChanged: handleAddressChange,
    value,
    disabled,
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

    const { validateAddress } = useValidate();
    useEffect(() => {
        trigger('address');
        handleAddressChange(address || '');
    }, [address, trigger, handleAddressChange]);

    useEffect(() => {
        if (value) {
            setValue('address', value);
        }
    }, [value, setValue]);

    const handlePaste = useCallback(
        (value: string) => {
            console.info('Pasted value:', value);
            setValue('address', value);
        },
        [setValue]
    );

    const validationRules = {
        validate: async (value: string) => {
            const isValid = await validateAddress(value);
            handleIsAddressValid(isValid);
            return isValid || 'Invalid address format';
        },
    };

    const handleReset = useCallback(() => {
        if (disabled) return;
        reset({ address: '' });
    }, [reset, disabled]);

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
                                        disabled={disabled}
                                        type="text"
                                        placeholder={t('wallet-address')}
                                        hasError={!!errors.address}
                                        onFocus={handleFocus}
                                    />
                                    <IconWrapper>
                                        {errors.address ? (
                                            disabled ? null : (
                                                <ClearIcon onClick={handleReset}>
                                                    <IoClose size={18} />
                                                </ClearIcon>
                                            )
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
