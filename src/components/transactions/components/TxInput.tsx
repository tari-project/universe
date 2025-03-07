import styled from 'styled-components';
import { InputHTMLAttributes, ReactNode } from 'react';

const Wrapper = styled.div`
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
    left: 20px;
`;

const StyledInput = styled.input<{ $hasIcon?: boolean }>`
    display: flex;
    padding: ${({ $hasIcon }) => ($hasIcon ? `10px 20px 10px 44px` : `10px 20px`)};
    background: ${({ theme }) => theme.palette.background.paper};
    border-radius: 25px;
    width: 100%;
    box-sizing: border-box;
`;

type TxInputBase = Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>;
export interface TxInputProps extends TxInputBase {
    name: string;
    icon?: ReactNode;
}
export function TxInput({ name, icon, ...props }: TxInputProps) {
    return (
        <Wrapper key={name}>
            {icon ? <IconWrapper>{icon}</IconWrapper> : null}
            <StyledInput id={name} name={name} $hasIcon={!!icon} {...props} />
        </Wrapper>
    );
}
