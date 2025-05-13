import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px;
`;
export const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
`;
export const LogoContainer = styled.div`
    height: 80px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 30px;
    font-weight: 700;
`;
export const LogoImg = styled.img`
    max-width: 100%;
`;

export const Heading = styled(Typography).attrs({ variant: 'h1' })`
    font-size: 36px;
    line-height: 1.1;
`;
