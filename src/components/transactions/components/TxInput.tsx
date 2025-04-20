import { InputHTMLAttributes, ReactNode, ChangeEvent, FocusEvent, useRef, useState } from 'react';

import {
    Wrapper,
    IconWrapper,
    ContentWrapper,
    StyledInput,
    Label,
    AccentWrapper,
    CheckIconWrapper,
    ErrorText,
} from './TxInput.style.ts';
import CheckIcon from './CheckIcon.tsx';
import { AnimatePresence } from 'motion/react';

type TxInputBase = Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>;
export interface TxInputProps extends TxInputBase {
    value?: string | number;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
    onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
    name: string;
    placeholder: string;
    icon?: ReactNode;
    accent?: ReactNode;
    label?: string;
    errorMessage?: string;
    autoFocus?: boolean;
    truncateOnBlur?: boolean;
    truncateText?: string;
    isValid?: boolean;
    disabled?: boolean;
}

export function TxInput({
    value,
    onChange,
    onBlur,
    onFocus,
    name,
    placeholder,
    icon,
    accent,
    label,
    errorMessage,
    autoFocus,
    truncateOnBlur,
    truncateText,
    isValid,
    disabled = false,
    ...rest
}: TxInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const ref = useRef<HTMLInputElement | null>(null);

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const displayValue =
        !isFocused && truncateOnBlur && truncateText
            ? truncateText.length > 15
                ? `${truncateText.substring(0, 7)}...${truncateText.substring(truncateText.length - 7)}`
                : truncateText
            : value;

    return (
        <Wrapper
            key={name}
            onClick={() => ref.current?.focus()}
            $hasError={!!errorMessage}
            $disabled={disabled && !isFocused}
        >
            {accent && <AccentWrapper>{accent}</AccentWrapper>}
            {label && <Label>{label}</Label>}
            <ContentWrapper>
                {icon ? <IconWrapper>{icon}</IconWrapper> : null}
                <StyledInput
                    as="input"
                    ref={ref}
                    id={name}
                    name={name}
                    value={displayValue}
                    onChange={onChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    $hasIcon={!!icon}
                    {...rest}
                    aria-errormessage={errorMessage}
                />

                {isValid && !isFocused && (
                    <CheckIconWrapper initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
                        <CheckIcon />
                    </CheckIconWrapper>
                )}
            </ContentWrapper>
            <AnimatePresence>
                {errorMessage && (
                    <ErrorText
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        {errorMessage}
                    </ErrorText>
                )}
            </AnimatePresence>
        </Wrapper>
    );
}
