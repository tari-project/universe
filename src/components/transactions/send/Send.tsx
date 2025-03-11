import { Controller, useForm } from 'react-hook-form';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TxInput } from '@app/components/transactions/components/TxInput.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { DividerIcon, FormFieldsWrapper, SendDivider, StyledForm } from './Send.styles';
import { FaArrowDown } from 'react-icons/fa6';

interface SendInputs {
    tx_message: string;
    tx_address: string;
    tx_amount: string;
}

export function Send() {
    const {
        control,
        handleSubmit,
        setValue,
        formState: { isSubmitting },
    } = useForm<SendInputs>({
        shouldUseNativeValidation: true,
        defaultValues: { tx_message: '', tx_address: '', tx_amount: '' },
    });

    const paymentIdField = (
        <Controller
            name="tx_message"
            control={control}
            render={({ field }) => (
                <TxInput
                    id="tx_message"
                    name="tx_message"
                    onChange={(e) => setValue(field.name, e.target.value)}
                    placeholder={`Enter message`}
                    label={`Payment ID`}
                />
            )}
        />
    );
    const addressField = (
        <Controller
            name="tx_address"
            control={control}
            render={({ field }) => (
                <TxInput
                    id="tx_address"
                    name="tx_address"
                    onChange={(e) => setValue(field.name, e.target.value)}
                    placeholder={`Enter `}
                    label={`Tari Wallet Address`}
                />
            )}
        />
    );
    const amountField = (
        <Controller
            name="tx_amount"
            control={control}
            render={({ field }) => (
                <TxInput
                    id="tx_amount"
                    name="tx_amount"
                    onChange={(e) => setValue(field.name, e.target.value)}
                    placeholder={`100`}
                    label={`Amount`}
                    icon={<TariOutlineSVG />}
                />
            )}
        />
    );

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
                amount: data.tx_amount,
                destination: data.tx_address,
                paymentId: data.tx_message,
            });
        } catch (error) {
            console.error('Error sending transaction:', error);
            alert('Error sending transaction');
        }
    }, []);

    return (
        <StyledForm onSubmit={handleSubmit(handleSend)}>
            {fieldMarkup}
            {isSubmitting && <CircularProgress />}
            <Button disabled={isSubmitting} type="submit" fluid>
                {`Send Tari`}
            </Button>
        </StyledForm>
    );
}
