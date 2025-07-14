import styled from 'styled-components';
import { CloseSVG } from '@app/assets/icons/close.tsx';
import { ButtonHTMLAttributes } from 'react';
import { convertHexToRGBA } from '@app/utils';

const StyledCloseButton = styled.button`
    display: flex;
    width: 30px;
    height: 30px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
    border-radius: 1000px;
    background: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
`;
export default function CloseButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <StyledCloseButton {...props}>
            <CloseSVG />
        </StyledCloseButton>
    );
}
