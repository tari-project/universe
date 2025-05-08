import { InputHTMLAttributes, ReactNode, useCallback, useState, forwardRef } from 'react';
import { InputWrapper, StyledInput, StyledInputLabel } from './Input.styles.ts';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    subIcon?: ReactNode;
    labelText?: string;
    endAdornment?: ReactNode;
    hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ labelText, endAdornment, hasError, ...props }, ref) => {
        const isNumber = props.type == 'number';
        const [value, setValue] = useState(isNumber ? 0 : '');
        const inputName = props.name || 'input-x';

        const handleChange = useCallback(
            (e) => {
                const canShowNumber = !isNaN(parseFloat(e?.target?.value));
                if (isNumber && !canShowNumber) {
                    return;
                } else {
                    setValue(e.target.value);
                }
                props.onChange?.(e);
            },
            [isNumber, props]
        );

        return (
            <InputWrapper>
                {labelText ? <StyledInputLabel htmlFor={inputName}>{labelText}</StyledInputLabel> : null}
                <StyledInput
                    id={inputName}
                    name={inputName}
                    onChange={handleChange}
                    value={value}
                    $hasError={hasError}
                    ref={ref}
                    {...props}
                />
                <div>{endAdornment}</div>
            </InputWrapper>
        );
    }
);

Input.displayName = 'Input';
