import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    gap: 20px;
    height: min(483px, 80vh);
    max-width: 740px;
    position: relative;
`;

export const CloseButton = styled.button`
    display: flex;
    position: absolute;
    top: 10px;
    right: 10px;
    width: 34px;
    height: 34px;
    align-items: center;
    justify-content: center;
    border-radius: 100%;
    border: 1px solid ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.5)};
    color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.5)};
    transition: transform 0.2s ease-in-out;
    svg {
        display: flex;
    }
    &:hover {
        transform: scale(1.03);
    }
`;
