import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { IoCopyOutline, IoCheckmarkOutline, IoCloseOutline } from 'react-icons/io5';
import { Stack } from '@app/components/elements/Stack.tsx';
import { IconButton } from '@app/components/elements/Button.tsx';
import { Input } from '@app/components/elements/inputs/Input';
import styled from 'styled-components';

const moneroAddressRegex = /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/;
interface MoneroAddressEditorProps {
    initialAddress: string;
    onApply: (newAddress: string) => Promise<void>;
}

const StyledStack = styled(Stack)(() => ({
    width: '100%',
}));

const StyledInput = styled(Input)(() => ({
    padding: '8px',
    fontSize: '12px',
}));

const StyledForm = styled('form')(() => ({
    width: '100%',
    // Reserve space for error message
    minHeight: '53px',
}));

const MoneroAddressEditor: React.FC<MoneroAddressEditorProps> = ({ initialAddress, onApply }) => {
    const {
        control,
        watch,
        handleSubmit,
        setValue,
        reset,
        trigger,
        formState: { errors },
    } = useForm({
        defaultValues: { address: initialAddress },
    });
    const [isCopyTooltipHidden, setIsCopyTooltipHidden] = useState(true);
    const address = watch('address');

    useEffect(() => {
        setValue('address', initialAddress);
    }, [initialAddress, setValue]);

    const handleApply = useCallback(
        async (data: { address: string }) => {
            await onApply(data.address);
        },
        [onApply]
    );

    const handleReset = useCallback(() => {
        reset({ address: initialAddress });
    }, [initialAddress, reset]);

    const copyToClipboard = useCallback(async () => {
        setIsCopyTooltipHidden(false);
        await navigator.clipboard.writeText(address);
        setTimeout(() => setIsCopyTooltipHidden(true), 1000);
    }, [address]);

    useEffect(() => {
        trigger('address');
    }, [address, trigger]);

    return (
        <StyledForm onSubmit={handleSubmit(handleApply)} onReset={handleReset}>
            <StyledStack direction="row" alignItems="center" gap={1}>
                <Controller
                    name="address"
                    control={control}
                    rules={{
                        pattern: {
                            value: moneroAddressRegex,
                            message: 'Invalid Monero address format',
                        },
                    }}
                    render={({ field }) => <StyledInput type="text" {...field} hasError={!!errors.address} />}
                />
                {address !== initialAddress ? (
                    <>
                        {!errors.address && (
                            <IconButton type="submit">
                                <IoCheckmarkOutline />
                            </IconButton>
                        )}
                        <IconButton type="reset">
                            <IoCloseOutline />
                        </IconButton>
                    </>
                ) : (
                    <IconButton onClick={copyToClipboard}>
                        {isCopyTooltipHidden ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                    </IconButton>
                )}
            </StyledStack>
            {errors.address && <span style={{ color: 'red', fontSize: '12px' }}>{errors.address.message}</span>}
        </StyledForm>
    );
};

export default MoneroAddressEditor;
