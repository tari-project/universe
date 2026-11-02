import { ChangeEvent, ReactNode, FocusEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Control, Controller } from 'react-hook-form';
import { type InputName, SendInputs } from '@app/components/transactions/send/types.ts';
import { TxInput } from '@app/components/transactions/components/TxInput.tsx';

/**
 * Change outputs carry a `TransactionInfo` memo of 116 bytes of metadata (recipient
 * dual address + amount/fee/flags + 1 sent output hash + length overhead) plus the
 * payment ID inside the 256-byte `MAX_PAYMENT_ID_SIZE` limit (`256 - 116 = 140`).
 */
export const MAX_PAYMENT_ID_BYTES = 140;

export function truncateToUtf8Bytes(value: string, maxBytes: number): string {
    const encoder = new TextEncoder();
    if (encoder.encode(value).byteLength <= maxBytes) {
        return value;
    }
    let usedBytes = 0;
    let result = '';
    for (const char of value) {
        const charBytes = encoder.encode(char).byteLength;
        if (usedBytes + charBytes > maxBytes) {
            break;
        }
        usedBytes += charBytes;
        result += char;
    }
    return result;
}

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
                        maxLength={name === 'message' ? MAX_PAYMENT_ID_BYTES : undefined}
                        onChange={(e) => {
                            if (name === 'message') {
                                e.target.value = truncateToUtf8Bytes(e.target.value, MAX_PAYMENT_ID_BYTES);
                            }
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
                    />
                );
            }}
        />
    );
}
