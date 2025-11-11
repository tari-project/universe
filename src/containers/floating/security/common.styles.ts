import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    width: clamp(610px, 46vw, 710px);
    flex-direction: column;
    padding: 6px;

    @media (max-height: 730px) {
        padding: 18px;
    }
`;

export const Header = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: end;
`;

export const Content = styled.div`
    display: flex;
    width: 100%;
    gap: 20px;
    padding: 0 20px;
    flex-direction: column;

    @media (max-height: 730px) {
        gap: 8px;
        padding: 0 16px;
    }
`;

export const ContentWrapper = styled.div`
    display: flex;
    width: 100%;
    gap: 10px;
    padding: 20px 0;
    flex-direction: column;

    @media (max-height: 730px) {
        padding: 14px 0;
        gap: 10px;
    }
`;

export const Title = styled(Typography).attrs({ variant: 'h1' })`
    line-height: 1;
    white-space: pre-wrap;

    @media (max-height: 730px) {
        font-size: 28px;
    }
`;

export const Subtitle = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const CTAWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    font-weight: 600;
`;

export const StepChip = styled.div`
    border-radius: 50px;
    background-color: ${({ theme }) => theme.palette.contrast};
    color: ${({ theme }) => theme.palette.text.contrast};
    display: flex;
    width: max-content;
    height: 33px;
    padding: 0 8px;
    align-items: center;

    text-align: center;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
`;
