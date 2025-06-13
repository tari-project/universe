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
