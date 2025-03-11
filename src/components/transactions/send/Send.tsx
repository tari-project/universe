import { Controller, useForm } from 'react-hook-form';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TxInput, TxInputProps } from '@app/components/transactions/components/TxInput.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { DividerIcon, FormFieldsWrapper, SendDivider, StyledForm } from './Send.styles';
import { FaArrowDown } from 'react-icons/fa6';
import { setError as setStoreError } from '@app/store';
import { Confirmation } from './Confirmation.tsx';
import { AnimatePresence } from 'motion/react';

interface SendInputs {
    tx_message: string;
    address: string;
    amount: string;
}
type InputName = keyof SendInputs;

export function Send() {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const defaultValues = { tx_message: '', address: '', amount: '' };

    const { control, handleSubmit, reset, formState, clearErrors, setError, setValue } = useForm<SendInputs>({
        defaultValues,
        mode: 'all',
    });

    const { isSubmitted, isSubmitting, isValid, errors, isSubmitSuccessful } = formState;

    useEffect(() => {
        if (isSubmitted) {
            if (isSubmitSuccessful && !errors.root) {
                setShowConfirmation(true);
            }
            const submitTimeout = setTimeout(() => {
                setShowConfirmation(false);
                reset(defaultValues);
            }, 3000);

            return () => {
                clearTimeout(submitTimeout);
            };
        }
    }, [isSubmitted, isSubmitSuccessful, errors]);

    const renderField = useCallback(({ name, placeholder, icon, label, required = false }: TxInputProps) => {
        function handleChange(e: ChangeEvent<HTMLInputElement>, name: InputName) {
            setValue(name, e.target.value);
            clearErrors(name);
        }
        return (
            <Controller
                control={control}
                name={name as InputName}
                rules={{
                    required: {
                        value: required,
                        message: `${name} is required`,
                    },
                }}
                render={({ field: { ref: _ref, name, ...rest }, fieldState }) => {
                    return (
                        <TxInput
                            {...rest}
                            name={name}
                            onChange={(e) => handleChange(e, name)}
                            placeholder={placeholder}
                            label={label}
                            icon={icon}
                            errorMessage={fieldState.error?.message}
                        />
                    );
                }}
            />
        );
    }, []);

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
            setStoreError(`Error sending transaction: ${error}`);
            setError(`root.invoke_error`, {
                message: `Error sending transaction: ${error}`,
            });
        }
    }, []);

    return (
        <>
            <StyledForm onSubmit={handleSubmit(handleSend)}>
                {fieldMarkup}
                {isSubmitting && <CircularProgress />}
                <Button disabled={isSubmitting || !isValid} type="submit" fluid>
                    {`Send Tari`}
                </Button>
            </StyledForm>
            <AnimatePresence>{showConfirmation && <Confirmation />}</AnimatePresence>
        </>
    );
}
