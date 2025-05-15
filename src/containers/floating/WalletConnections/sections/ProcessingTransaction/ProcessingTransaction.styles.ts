import styled from 'styled-components';
import { SwapStatus } from './ProcessingTransaction';

export const StatusValue = styled.div<{ $status: SwapStatus }>`
    font-family: Poppins;
    font-weight: bold;
    font-size: 14px;
    line-height: 117%;
    letter-spacing: -3%;
    color: ${({ $status: status, theme }) => {
        switch (status) {
            case 'processingapproval':
            case 'processingswap':
                return '#FF7700';
            case 'success':
                return theme.mode === 'dark' ? '#00ff00' : '#36C475';
            case 'error':
                return '#ff0000';
            default:
                return '#000000';
        }
    }};
`;

export const ProcessingDetailsWrapper = styled.div`
    padding: 20px;
`;

export const ProcessingItemDetailValue = styled.div`
    color: black;
    font-family: Poppins;
    font-weight: 500;
    font-size: 14px;
    line-height: 117%;
    letter-spacing: -3%;
    display: flex;
    justify-content: space-between;
    > span {
        font-family: Poppins;
        font-weight: 500;
        font-size: 10px;
        line-height: 100%;
        letter-spacing: -3%;
    }
`;

export const LoadingDots = styled.span`
    color: currentColor;
    display: inline-block;
    width: 24px;
    height: 15px;
    text-align: left;
    position: relative;

    span {
        position: absolute;
        opacity: 0.3;
        font-size: 35px;
        line-height: 0;
        animation: dotFade 1.5s infinite;

        &:nth-child(1) {
            left: 0;
        }
        &:nth-child(2) {
            left: 8px;
            animation-delay: 0.5s;
        }
        &:nth-child(3) {
            left: 16px;
            animation-delay: 1s;
        }
    }

    @keyframes dotFade {
        0%,
        100% {
            opacity: 0.3;
        }
        50% {
            opacity: 1;
        }
    }
`;
