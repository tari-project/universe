import { Controller, useForm } from 'react-hook-form';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TxInput, TxInputProps } from '@app/components/transactions/components/TxInput.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { DividerIcon, FormFieldsWrapper, SendDivider, StyledForm } from './Send.styles';
import { FaArrowDown } from 'react-icons/fa6';
import { setError } from '@app/store';

interface SendInputs {
    tx_message: string;
    address: string;
    amount: string;
}

export function Send() {
    const defaultValues = { tx_message: '', address: '', amount: '' };
    const { control, handleSubmit, setValue, reset, formState } = useForm<SendInputs>({
        defaultValues,
        shouldUseNativeValidation: true,
        mode: 'all',
    });

    const renderField = ({ name, placeholder, icon, label, required = false }: TxInputProps) => (
        <Controller
            name={name as keyof SendInputs}
            control={control}
            rules={{
                required: {
                    value: required,
                    message: `${name} is required`,
                },
            }}
            render={({ field: { name, ...rest }, fieldState }) => {
                return (
                    <TxInput
                        id={name}
                        name={name}
                        {...rest}
                        onChange={(e) => setValue(name, e.target.value)}
                        placeholder={placeholder}
                        label={label}
                        icon={icon}
                        errorMessage={fieldState.error?.message}
                    />
                );
            }}
        />
    );

    const paymentIdField = renderField({ name: 'tx_message', placeholder: `Enter message`, label: `Payment ID` });
    const addressField = renderField({
        name: 'address',
        placeholder: `Enter address`,
        label: `Tari Wallet Address`,
        required: true,
    });
    const amountField = renderField({
        name: 'amount',
        placeholder: `100`,
        label: `Amount`,
        required: true,
        icon: <TariOutlineSVG />,
    });

    const fieldMarkup = (
        <FormFieldsWrapper>
            {paymentIdField}
            {addressField}
            <SendDivider>
                <DividerIcon>
                    <FaArrowDown size={28} />
                </DividerIcon>
            </SendDivider>
            {amountField}
        </FormFieldsWrapper>
    );

    const handleSend = useCallback(async (data: SendInputs) => {
        try {
            await invoke('send_one_sided_to_stealth_address', {
                amount: data.amount,
                destination: data.address,
                paymentId: data.tx_message,
            });
        } catch (error) {
            setError(`Error sending transaction: ${error}`);
        } finally {
            reset(defaultValues, {
                keepErrors: true,
            });
        }
    }, []);

    return (
        <StyledForm onSubmit={handleSubmit(handleSend)}>
            {fieldMarkup}
            {formState.isSubmitting && <CircularProgress />}
            <Button disabled={formState.isSubmitting || !formState.isValid} type="submit" fluid>
                {`Send Tari`}
            </Button>
        </StyledForm>
    );
}
