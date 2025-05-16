import styled from 'styled-components';
import { m } from 'motion/react';

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 100%;
    padding: 0 10px 10px;
    text-align: center;
`;

export const ConnectHeader = styled.div`
    font-family: Poppins, sans-serif;
    font-size: 21px;
    font-style: normal;
    font-weight: 600;
    line-height: 31px;
    width: 500px;
`;

export const ConnectSubHeader = styled.div`
    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 21px;
    max-width: 280px;
`;

export const QrWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 200px;
    height: 200px;
    overflow: hidden;
    border-radius: 10px;
`;

// Inner square with shimmer animation
export const LoadingQrInner = styled(m.div)`
    width: 300px;
    height: 180px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
`;

export const ConnectingProgress = styled.div`
    gap: 10px;
    border-radius: 60px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    margin-top: 10px;
`;

export const GreenDot = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #1b941d;
`;

export const LoadingCopy = styled.div`
    font-family: Poppins, sans-serif;
    font-weight: 500;
    font-size: 14px;
`;
