import styled from 'styled-components';
import { InputHTMLAttributes, ReactNode } from 'react';

const Wrapper = styled.div`
    display: flex;
    position: relative;
    width: 100%;
`;

const IconWrapper = styled.div`
    display: flex;
    svg {
        position: absolute;
        transform: translateY(-50%);
        top: 50%;
        width: 18px;
        left: 10px;
    }
`;

const StyledInput = styled.input<{ $hasIcon?: boolean }>`
    display: flex;
    padding: ${({ $hasIcon }) => ($hasIcon ? `10px 20px 10px 40px` : `10px 20px`)};
    background: ${({ theme }) => theme.palette.background.accent};
    border-radius: 25px;
    width: 100%;
    box-sizing: border-box;
`;

interface TxInputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: ReactNode;
}
function TxInput(props: TxInputProps) {
    return (
        <Wrapper>
            <IconWrapper>{props.icon}</IconWrapper>
            <StyledInput $hasIcon={!!props.icon} {...props} />
        </Wrapper>
    );
}

export { TxInput };
