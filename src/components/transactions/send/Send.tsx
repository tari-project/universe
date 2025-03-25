import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';
import { invoke } from '@tauri-apps/api/core';
import { useForm } from 'react-hook-form';
import { FaArrowDown } from 'react-icons/fa6';

import { setError as setStoreError } from '@app/store';

import { Button } from '@app/components/elements/buttons/Button.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

import type { SendInputs, InputName } from './types.ts';
import { Confirmation } from './Confirmation.tsx';
import { FormField } from './FormField.tsx';

import { BottomWrapper, DividerIcon, ErrorMessageWrapper, FormFieldsWrapper, StyledForm, Wrapper } from './Send.styles';

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
            if (isSubmitSuccessful && !errors?.root) {
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

    function handleChange(e: ChangeEvent<HTMLInputElement>, name: InputName) {
        setValue(name, e.target.value, { shouldValidate: true });
        clearErrors(name);
    }

    const paymentIdField = <FormField control={control} handleChange={handleChange} name="message" />;
    const addressField = <FormField control={control} handleChange={handleChange} name="address" required />;
    const amountField = (
        <FormField
            control={control}
            handleChange={handleChange}
            name="amount"
            required
            icon={<TariOutlineSVG />}
            accent={
                <DividerIcon>
                    <FaArrowDown size={18} />
                </DividerIcon>
            }
        />
    );

    const fieldMarkup = (
        <FormFieldsWrapper>
            {paymentIdField}
            {addressField}
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
        <Wrapper $isLoading={isSubmitting}>
            <StyledForm onSubmit={handleSubmit(handleSend)}>
                {fieldMarkup}
                <BottomWrapper>
                    <Button
                        disabled={isSubmitting || !isValid}
                        type="submit"
                        fluid
                        backgroundColor="greyscale"
                        loader={<CircularProgress />}
                        isLoading={isSubmitting}
                    >
                        {t('send.cta-send')}
                    </Button>
                    <ErrorMessageWrapper>
                        <Typography variant="p">{errors.address?.message}</Typography>
                        <Typography variant="p">{errors.amount?.message}</Typography>
                    </ErrorMessageWrapper>
                </BottomWrapper>
            </StyledForm>
            <AnimatePresence>{showConfirmation && <Confirmation />}</AnimatePresence>
        </Wrapper>
    );
}
