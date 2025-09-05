import styled from 'styled-components';
import { ButtonHTMLAttributes } from 'react';
import { convertHexToRGBA } from '@app/utils';
import { IoClose } from 'react-icons/io5';

const StyledCloseButton = styled.button`
    display: flex;
    width: 30px;
    height: 30px;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    transition: opacity 0.1s scale 0.08s;
    @media (max-height: 690px) {
        width: 26px;
        height: 26px;
    }

    svg {
        display: flex;
        max-width: 100%;
    }

    &:hover {
        opacity: 0.8;
        scale: 1.05;
    }
`;
export default function CloseButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <StyledCloseButton {...props} tabIndex={0}>
            <IoClose />
        </StyledCloseButton>
    );
}
