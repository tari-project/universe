import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: min(480px, 40vw);
    padding: 20px;
    overflow: hidden;
    height: 100%;
    min-height: 60vh;
    gap: 10px;
`;
export const HeaderSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 20px 45px 5px 10px;
`;

export const Heading = styled(Typography)`
    line-height: 1.2;
    font-size: 20px;
    font-weight: 500;
`;

export const RewardBanner = styled.div`
    width: 100%;
    position: relative;
    border-radius: 24px;
    height: 144px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 7px;
    flex-shrink: 0;
    overflow: hidden;
    background-image: url('/assets/img/exchange_miner_header.png');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    padding: 18px;

    @media (max-height: 750px) {
        height: auto;
    }
`;

export const BannerHeading = styled(Typography)`
    font-family: 'Fugaz One', sans-serif;
    font-size: 30px;
    font-weight: 400;
    line-height: 0.88;
    letter-spacing: -0.6px;
    text-transform: uppercase;
    white-space: pre-wrap;
    margin: 0;
`;

export const BannerSubheading = styled(Typography).attrs({ variant: 'h5' })`
    color: #fff;
    font-size: 12px;
    font-weight: 600;
`;

export const CountdownWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;
export const CountdownExplainerText = styled(Typography)`
    color: #fff;
    font-size: 12px;
    font-weight: 500;
`;
