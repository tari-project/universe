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
