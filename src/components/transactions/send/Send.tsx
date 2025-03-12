import { Controller, useForm } from 'react-hook-form';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TxInput, TxInputProps } from '@app/components/transactions/components/TxInput.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import {
    BottomWrapper,
    DividerIcon,
    ErrorMessageWrapper,
    FormFieldsWrapper,
    SendDivider,
    StyledForm,
} from './Send.styles';
import { FaArrowDown } from 'react-icons/fa6';
import { setError as setStoreError } from '@app/store';
import { Confirmation } from './Confirmation.tsx';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';

interface SendInputs {
    message: string;
    address: string;
    amount: string;
}
type InputName = keyof SendInputs;

const defaultValues = { message: '', address: '', amount: '' };
export function Send() {
    const { t } = useTranslation('wallet');
    const [showConfirmation, setShowConfirmation] = useState(false);

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
    }, [isSubmitted, isSubmitSuccessful, errors, reset]);

    const renderField = useCallback(
        ({ name, icon, required = false }: TxInputProps) => {
            const labelT = t(`send.label`, { context: name });
            const placeholderT = t(`send.placeholder`, { context: name });
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
                            message: t('send.required', { fieldName: name }),
                        },
                    }}
                    render={({ field: { ref: _ref, name, ...rest }, fieldState }) => {
                        return (
                            <TxInput
                                {...rest}
                                name={name}
                                onChange={(e) => handleChange(e, name)}
                                placeholder={placeholderT}
                                label={labelT}
                                icon={icon}
                                errorMessage={fieldState.error?.message}
                            />
                        );
                    }}
                />
            );
        },
        [clearErrors, control, setValue, t]
    );

    const paymentIdField = renderField({ name: 'message' });
    const addressField = renderField({
        name: 'address',
        required: true,
    });
    const amountField = renderField({
        name: 'amount',
        required: true,
        icon: <TariOutlineSVG />,
    });

    const fieldMarkup = (
        <FormFieldsWrapper>
            {paymentIdField}
            {addressField}
            <SendDivider>
                <DividerIcon>
                    <FaArrowDown size={18} />
                </DividerIcon>
            </SendDivider>
            {amountField}
        </FormFieldsWrapper>
    );

    const handleSend = useCallback(
        async (data: SendInputs) => {
            try {
                await invoke('send_one_sided_to_stealth_address', {
                    amount: data.amount,
                    destination: data.address,
                    paymentId: data.message,
                });
            } catch (error) {
                setStoreError(`Error sending transaction: ${error}`);
                setError(`root.invoke_error`, {
                    message: `${t('send.error-message')} ${error}`,
                });
            }
        },
        [setError, t]
    );

    return (
        <>
            <StyledForm onSubmit={handleSubmit(handleSend)}>
                {fieldMarkup}
                <BottomWrapper>
                    <ErrorMessageWrapper>
                        <Typography variant="p">{errors.address?.message}</Typography>
                        <Typography variant="p">{errors.amount?.message}</Typography>
                    </ErrorMessageWrapper>
                    <Button
                        disabled={isSubmitting || !isValid}
                        type="submit"
                        fluid
                        loader={<CircularProgress />}
                        isLoading={isSubmitting}
                    >
                        {t('send.cta-send')}
                    </Button>
                </BottomWrapper>
            </StyledForm>
            <AnimatePresence>{showConfirmation && <Confirmation />}</AnimatePresence>
        </>
    );
}
