import { useEffect, useCallback, useState } from 'react';
import { useForm, Controller, RegisterOptions } from 'react-hook-form';
import { IoCopyOutline, IoCheckmarkOutline, IoCloseOutline, IoPencil } from 'react-icons/io5';
import styled from 'styled-components';
import { Input } from '@app/components/elements/inputs/Input';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { CTASArea, InputArea, WalletSettingsGrid } from '../styles';

interface AddressEditorProps {
    initialAddress: string;
    isWXTM?: boolean;
    onApply: (newAddress: string) => Promise<void>;
    rules:
        | Omit<
              RegisterOptions<
                  {
                      address: string;
                  },
                  'address'
              >,
              'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
          >
        | undefined;
}

const StyledInput = styled(Input)`
    font-size: 12px;
`;

const StyledForm = styled.form`
    width: 100%;
    // Reserve space for error message
    min-height: 64px;
`;

const AddressEditor = ({ initialAddress, onApply, rules, isWXTM }: AddressEditorProps) => {
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
    const [editing, setEditing] = useState(false);
    const { copyToClipboard, isCopied } = useCopyToClipboard();
    const address = watch('address');

    function handleEditClick() {
        setFocus('address', { shouldSelect: true });
        setEditing(true);
    }
    useEffect(() => {
        setValue('address', initialAddress);
    }, [initialAddress, setValue]);

    const handleApply = useCallback(
        async (data: { address: string }) => {
            await onApply(data.address);
            setEditing(false);
        },
        [onApply]
    );

    const handleReset = useCallback(() => {
        reset({ address: initialAddress });
        setEditing(false);
    }, [initialAddress, reset]);

    useEffect(() => {
        trigger('address');
    }, [address, trigger]);

    const editIconMarkup = !editing ? (
        <IconButton size="small" onClick={() => handleEditClick()} type="button">
            <IoPencil />
        </IconButton>
    ) : null;

    const hideValidationError = isWXTM && address === initialAddress;
    return (
        <StyledForm onSubmit={handleSubmit(handleApply)} onReset={handleReset}>
            <WalletSettingsGrid>
                <InputArea>
                    <Controller
                        name="address"
                        control={control}
                        rules={rules}
                        render={({ field }) => {
                            return (
                                <StyledInput
                                    {...field}
                                    type="text"
                                    hasError={!!errors.address}
                                    onFocus={() => setEditing(true)}
                                />
                            );
                        }}
                    />
                </InputArea>
                <CTASArea>
                    {editIconMarkup}
                    {editing ? (
                        <>
                            <IconButton type="submit" size="small" disabled={!isDirty || !!errors.address}>
                                <IoCheckmarkOutline />
                            </IconButton>
                            <IconButton type="reset" size="small">
                                <IoCloseOutline />
                            </IconButton>
                        </>
                    ) : (
                        <IconButton
                            size="small"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                copyToClipboard(address);
                            }}
                        >
                            {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                        </IconButton>
                    )}
                </CTASArea>
            </WalletSettingsGrid>

            {errors.address && !hideValidationError && (
                <span style={{ color: 'red', fontSize: '12px' }}>{errors.address.message}</span>
            )}
        </StyledForm>
    );
};

export default AddressEditor;
