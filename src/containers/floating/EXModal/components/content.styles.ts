import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils/convertHex.ts';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Container = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px;
    gap: 12px;
`;
export const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
`;
export const LogoContainer = styled.div`
    height: 60px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 30px;
    font-weight: 700;
    width: 90%;
`;
export const LogoImg = styled.img`
    max-width: 100%;
    height: 100%;
    color: ${({ theme }) => theme.palette.text.primary};
`;

export const Heading = styled(Typography).attrs({ variant: 'h1' })`
    font-size: 36px;
    line-height: 1;
`;

export const BodyCopy = styled(Typography).attrs({ variant: 'p' })`
    color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.7)};
    font-size: 16px;
    line-height: 1.4;
    strong {
        font-weight: 600;
    }
`;
