import { ChangeEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Control, Controller } from 'react-hook-form';
import { type InputName, SendInputs } from '@app/components/transactions/send/types.ts';
import { TxInput } from '@app/components/transactions/components/TxInput.tsx';

interface FormFieldProps {
    name: string;
    control: Control<SendInputs>;
    handleChange?: (e: ChangeEvent<HTMLInputElement>, name: InputName) => void;
    icon?: ReactNode;
    accent?: ReactNode;
    required?: boolean;
    autoFocus?: boolean;
    truncateOnBlur?: boolean;
    isValid?: boolean;
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
    isValid,
}: FormFieldProps) {
    const { t } = useTranslation('wallet');
    const labelT = t(`send.label`, { context: name });
    const placeholderT = t(`send.placeholder`, { context: name });

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
                        onChange={(e) => {
                            rest.onChange(e);
                            if (handleChange) {
                                handleChange(e, name as InputName);
                            }
                        }}
                        placeholder={placeholderT}
                        label={labelT}
                        icon={icon}
                        accent={accent}
                        errorMessage={fieldState.error?.message}
                        autoFocus={autoFocus}
                        truncateOnBlur={truncateOnBlur}
                        truncateText={truncateOnBlur && rest.value ? String(rest.value) : undefined}
                        isValid={isValid}
                    />
                );
            }}
        />
    );
}
