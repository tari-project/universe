import { InputHTMLAttributes, ReactNode } from 'react';

import { Wrapper, IconWrapper, ContentWrapper, StyledInput, Label, AccentWrapper } from './TxInput.style.ts';

type TxInputBase = Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>;
export interface TxInputProps extends TxInputBase {
    name: string;
    icon?: ReactNode;
    accent?: ReactNode;
    label?: string;
    errorMessage?: string;
}

export function TxInput(props: TxInputProps) {
    const { name, icon, label, errorMessage, accent, ...rest } = props;
    return (
        <Wrapper key={name}>
            {accent && <AccentWrapper>{accent}</AccentWrapper>}
            {label && <Label>{label}</Label>}
            <ContentWrapper>
                {icon ? <IconWrapper>{icon}</IconWrapper> : null}
                <StyledInput id={name} name={name} $hasIcon={!!icon} {...rest} aria-errormessage={errorMessage} />
            </ContentWrapper>
        </Wrapper>
    );
}
