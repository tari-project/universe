import styled from 'styled-components';
import { InputHTMLAttributes, ReactNode } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
    padding: 4px;
`;

const StyledInput = styled.input<{ $hasIcon?: boolean }>`
    display: flex;
    padding: ${({ $hasIcon }) => ($hasIcon ? `10px 0 10px 28px` : `10px 0`)};
    width: 100%;
    opacity: 0.9;
    &:focus {
        outline: none;
        opacity: 1;
    }
`;

const ContentWrapper = styled.div`
    display: flex;
    position: relative;
    width: 100%;
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 18px;
    height: 18px;
    position: absolute;
    transform: translateY(-50%);
    top: 50%;
    left: 4px;
`;

type TxInputBase = Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>;
export interface TxInputProps extends TxInputBase {
    name: string;
    icon?: ReactNode;
    label?: string;
}
export function TxInput({ name, icon, label, ...props }: TxInputProps) {
    return (
        <Wrapper key={name}>
            {label && <Typography variant="p">{label}</Typography>}
            <ContentWrapper>
                {icon ? <IconWrapper>{icon}</IconWrapper> : null}
                <StyledInput id={name} name={name} $hasIcon={!!icon} {...props} />
            </ContentWrapper>
        </Wrapper>
    );
}
