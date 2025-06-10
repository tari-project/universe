import { ChangeEvent, ReactNode, FocusEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Control, Controller } from 'react-hook-form';
import { type InputName, SendInputs } from '@app/components/transactions/send/types.ts';
import { TxInput } from '@app/components/transactions/components/TxInput.tsx';

interface FormFieldProps {
    name: string;
    control: Control<SendInputs>;
    handleChange?: (e: ChangeEvent<HTMLInputElement>, name: InputName) => void;
    onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
    onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
    icon?: ReactNode;
    accent?: ReactNode;
    required?: boolean;
    autoFocus?: boolean;
    truncateOnBlur?: boolean;
    isValid?: boolean;
    errorText?: string;
    disabled?: boolean;
    secondaryField?: ReactNode;
    secondaryText?: string;
    miniButton?: ReactNode;
    isSecondary?: boolean;
    as?: 'input' | 'textarea';
}
export function FormField({
    control,
    name,
    handleChange,
    icon,
    required = false,
    accent,
    autoFocus,
    truncateOnBlur,
    onBlur,
    onFocus,
    isValid,
    errorText,
    disabled = false,
    secondaryField,
    secondaryText,
    miniButton,
    isSecondary,
    as = 'input',
}: FormFieldProps) {
    const { t } = useTranslation('wallet');
    const labelT = t(`send.label`, { context: name });
    const placeholderT = t(`send.placeholder`, { context: name });

    const amountRules =
        name === 'amount'
            ? {
                  pattern: /^[0-9]+$/,
              }
            : undefined;
    const rules = {
        required: {
            value: required,
            message: t('send.required', { fieldName: name }),
        },
        amountRules,
    };

    return (
        <Controller
            control={control}
            name={name as InputName}
            rules={rules}
            render={({ field: { ref: _ref, name, value, ...rest }, fieldState }) => {
                return (
                    <TxInput
                        {...rest}
                        name={name}
                        onChange={(e) => {
                            const value = e.target.value;
                            const valueIsNaN = isNaN(Number(value));
                            if (name === 'amount' && valueIsNaN) {
                                return;
                            }
                            if (handleChange) {
                                handleChange(e, name as InputName);
                            } else {
                                rest.onChange(e);
                            }
                        }}
                        onBlur={onBlur || undefined}
                        onFocus={onFocus || undefined}
                        placeholder={placeholderT}
                        label={labelT}
                        icon={icon}
                        accent={accent}
                        errorMessage={errorText || fieldState.error?.message}
                        autoFocus={autoFocus}
                        truncateOnBlur={truncateOnBlur}
                        value={value}
                        truncateText={truncateOnBlur && value ? String(value) : undefined}
                        isValid={isValid}
                        disabled={disabled}
                        secondaryField={secondaryField}
                        secondaryText={secondaryText}
                        miniButton={miniButton}
                        isSecondary={isSecondary}
                        as={as}
                    />
                );
            }}
        />
    );
}
