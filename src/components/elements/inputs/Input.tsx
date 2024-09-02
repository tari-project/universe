import { InputHTMLAttributes, ReactNode, useCallback, useState } from 'react';
import { InputWrapper, StyledInput, StyledInputLabel } from './Input.styles.ts';

type InputPattern = 'text' | 'wholeNumber' | 'wholeNumberPositive' | 'number';
interface Props extends InputHTMLAttributes<HTMLInputElement> {
    subIcon?: ReactNode;
    labelText?: string;
    patternType?: InputPattern;
}

export function Input({ labelText, ...props }: Props) {
    const isNumber = props.type == 'number';
    const [value, setValue] = useState(isNumber ? 0 : '');
    const inputName = props.name || 'input-x';

    const handleChange = useCallback(
        (e) => {
            const canShowNumber = !isNaN(parseFloat(e.target.value));
            if (isNumber && !canShowNumber) {
                return;
            } else {
                setValue(e.target.value);
            }
        },
        [isNumber]
    );

    return (
        <InputWrapper>
            {labelText ? <StyledInputLabel htmlFor={inputName}>{labelText}</StyledInputLabel> : null}
            <StyledInput id={inputName} name={inputName} onChange={handleChange} value={value} {...props} />
        </InputWrapper>
    );
}
