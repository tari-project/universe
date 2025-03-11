import { InputHTMLAttributes, ReactNode } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Wrapper, IconWrapper, ContentWrapper, StyledInput, ErrorMessage } from './TxInput.style.ts';

type TxInputBase = Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>;
export interface TxInputProps extends TxInputBase {
    name: string;
    icon?: ReactNode;
    label?: string;
    errorMessage?: string;
}

export function TxInput(props: TxInputProps) {
    const { name, icon, label, errorMessage, ...rest } = props;
    return (
        <Wrapper key={name}>
            {label && <Typography variant="p">{label}</Typography>}
            <ContentWrapper $hasError={!!errorMessage?.length}>
                {icon ? <IconWrapper>{icon}</IconWrapper> : null}
                <StyledInput id={name} name={name} $hasIcon={!!icon} {...rest} />
            </ContentWrapper>
            <ErrorMessage>{errorMessage?.length && <Typography variant="p">{errorMessage}</Typography>}</ErrorMessage>
        </Wrapper>
    );
}
