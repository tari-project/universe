import * as m from 'motion/react-m';
import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled(m.div)`
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: ${({ theme }) => theme.palette.background.tooltip};
    padding: 10px;
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
`;
export const CTASection = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;

export const Icon = styled.img`
    height: 12px;
    display: flex;
`;
