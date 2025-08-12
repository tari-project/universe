import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const ContentWrapper = styled.div`
    width: 100%;
    padding: 0 12px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 100%;
`;

export const Content = styled.div`
    display: flex;
    gap: 4px;
    flex-direction: row;
    align-items: center;
    height: 100%;
`;

export const TitleWrapper = styled(Typography)`
    display: flex;
    color: ${({ theme }) => theme.palette.text.primary};

    font-size: 12px;
    font-weight: 500;
    line-height: 1.3;
    letter-spacing: -0.24px;
`;
