import { useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { IoCopyOutline, IoCheckmarkOutline, IoCloseOutline } from 'react-icons/io5';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Input } from '@app/components/elements/inputs/Input';
import styled from 'styled-components';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

const moneroAddressRegex = /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/;
interface MoneroAddressEditorProps {
    initialAddress: string;
    onApply: (newAddress: string) => Promise<void>;
}

const StyledStack = styled(Stack)`
    width: 100%;
`;

const StyledInput = styled(Input)`
    font-size: 12px;
`;

const StyledForm = styled.form`
    width: 100%;
    // Reserve space for error message
    min-height: 53px;
`;

const MoneroAddressEditor = ({ initialAddress, onApply }: MoneroAddressEditorProps) => {
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
    const { copyToClipboard, isCopied } = useCopyToClipboard();

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

    useEffect(() => {
        trigger('address');
    }, [address, trigger]);

    return (
        <StyledForm onSubmit={handleSubmit(handleApply)} onReset={handleReset}>
            <StyledStack direction="row" alignItems="center" gap={10}>
                <Controller
                    name="address"
                    control={control}
                    rules={{
                        pattern: {
                            value: moneroAddressRegex,
                            message: 'Invalid Monero address format',
                        },
                    }}
                    render={({ field }) => {
                        const { ref: _ref, ...rest } = field;
                        return <StyledInput type="text" hasError={!!errors.address} {...rest} />;
                    }}
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
                    <IconButton
                        onClick={(e) => {
                            e.preventDefault();
                            copyToClipboard(address);
                        }}
                    >
                        {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                    </IconButton>
                )}
            </StyledStack>
            {errors.address && <span style={{ color: 'red', fontSize: '12px' }}>{errors.address.message}</span>}
        </StyledForm>
    );
};

export default MoneroAddressEditor;
