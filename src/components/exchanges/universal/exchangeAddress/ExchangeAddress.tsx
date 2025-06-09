import { IconButton } from '@app/components/elements/buttons/IconButton';
import { InputArea } from '@app/containers/floating/Settings/sections/wallet/styles';
import { invoke } from '@tauri-apps/api/core';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { IoCheckmarkOutline, IoCloseOutline } from 'react-icons/io5';
import { StyledForm, StyledInput } from './styles';
import ClipboardViewer from '../clipboardViewer/ClipboardViewer';

interface ExchangeAddressProps {
    initialAddress: string;
    confirmExchangeMiner: (newAddress) => Promise<void>;
}
export const ExchangeAddress = ({ initialAddress, confirmExchangeMiner }: ExchangeAddressProps) => {
    const {
        control,
        watch,
        handleSubmit,
        setValue,
        setFocus,
        reset,
        trigger,
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: { address: initialAddress },
    });
    const [showClipboard, setShowClipboard] = useState(false);
    const validateAddress = useCallback(async (value: string) => {
        try {
            await invoke('verify_address_for_send', { address: value });
            return true;
        } catch (_) {
            return false;
        }
    }, []);

    const validationRules = {
        validate: async (value) => {
            const isValid = await validateAddress(value);

            return isValid || 'Invalid address format';
        },
    };

    const handleReset = useCallback(() => {
        reset({ address: '' });
    }, [reset]);

    const handleFocus = useCallback(() => {
        setShowClipboard(true);
    }, []);

    const handleBlur = useCallback(() => {
        setShowClipboard(false);
    }, []);

    return (
        <div style={{ width: '100%' }}>
            <StyledForm onSubmit={handleSubmit(confirmExchangeMiner)} onReset={handleReset}>
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
                                    hasError={!!errors.address}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                            );
                        }}
                    />
                    <div>
                        {!errors.address ? (
                            <IconButton
                                style={{
                                    width: 30,
                                    height: 30,
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
                                    width: 30,
                                    height: 30,
                                    fontSize: 24,
                                    backgroundColor: '#00800020',
                                }}
                                aria-label="Valid"
                            >
                                <IoCheckmarkOutline />
                            </IconButton>
                        )}
                    </div>
                </InputArea>

                {errors.address && <span style={{ color: 'red', fontSize: '12px' }}>{errors.address.message}</span>}
            </StyledForm>
            {showClipboard && <ClipboardViewer />}
        </div>
    );
};
