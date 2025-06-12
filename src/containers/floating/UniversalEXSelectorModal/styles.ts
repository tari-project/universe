import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: min(480px, 40vw);
    padding: 20px;
    overflow: hidden;
    height: 100%;
    gap: 10px;
`;
export const HeaderSection = styled.div`
    display: flex;
    padding: 0 20px;
    flex-direction: column;
    gap: 15px;
`;
export const Heading = styled(Typography)`
    line-height: 1.2;
    font-size: 20px;
    font-weight: 500;
`;

export const MainLogoContainer = styled.div`
    width: 100%;
    position: relative;
    border-radius: 24px;
    height: 144px;
    display: flex;
    flex-shrink: 1;
    overflow: hidden;
    @media (max-height: 690px) {
        height: 110px;
    }
`;

export const MainLogoImageWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-shrink: 0;
    img {
        max-width: 100%;
    }
`;

export const MainLogoBottomRow = styled.div`
    display: flex;
    flex-direction: row;
    gap: 20px;
    align-items: center;
`;

export const MainLogoTitle = styled(Typography).attrs({ variant: 'h1' })`
    text-transform: uppercase;
    background: linear-gradient(90deg, #ffd231 0%, #ffe37c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-family: 'Fugaz One', sans-serif;
`;

export const MainLogoDescription = styled(Typography).attrs({ variant: 'p' })`
    font-weight: 600;
    max-width: 50%;
`;
