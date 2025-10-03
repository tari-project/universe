import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: ${({ theme }) => theme.palette.background.tooltip};
    box-shadow: 0 4px 40px 3px rgba(0, 0, 0, 0.05);
    padding: 15px;
    border-radius: 10px;
`;

export const Title = styled(Typography).attrs({
    variant: 'h6',
})`
    color: ${({ theme }) => theme.palette.text.primary};
    white-space: pre;
    line-height: 1.1;
    font-weight: 600;
`;

export const BodyTextWrapper = styled.div`
    color: ${({ theme }) => theme.palette.text.accent};
    white-space: pre-line;
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const CTAContent = styled.div`
    display: flex;
    align-items: center;
    font-weight: 500;
    gap: 2px;
`;
export const CTASection = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    gap: 6px;
`;

export const Icon = styled.img`
    height: 11px;
    display: flex;
`;
