import { convertHexToRGBA } from '@app/utils';
import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: clamp(10vh, 400px, 45vh);
`;

export const BuyTariButton = styled.button`
    margin-top: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding: 16px;
    border-radius: 72px;
    background: #188750;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;

    &:hover {
        opacity: 0.9;
    }

    font-family: Poppins;
    font-weight: 600;
    font-size: 13px;
    line-height: 100%;
    text-align: center;
`;

export const TabsWarapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding: 0 6px;

    transform: translateY(-3px);
`;

export const TabsTitle = styled.div`
    color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.5)};
    font-family: Poppins, sans-serif;
    font-size: 11px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
`;

export const SyncButton = styled.button`
    color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.5)};
    font-family: Poppins, sans-serif;
    font-size: 11px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.44px;

    display: flex;
    align-items: center;
    gap: 6px;

    background: transparent;
    border: none;
    cursor: pointer;

    transition: color 0.2s ease-in-out;

    svg {
        stroke: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.5)};
        transition: stroke 0.2s ease-in-out;
    }

    &:hover {
        color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 1)};

        svg {
            stroke: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 1)};
        }
    }
`;
