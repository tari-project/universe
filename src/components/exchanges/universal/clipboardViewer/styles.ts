import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Container = styled.div`
    display: flex;
    flex-direction: row;
    gap: 6px;
    padding: 10px;
    background-color: ${({ theme }) => theme.palette.background.default};
    border-radius: 10px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid ${({ theme }) => theme.palette.divider};
    width: 100%;
`;

export const ClipboardIcon = styled.img`
    width: 36px;
    height: 36px;
    cursor: pointer;
`;

export const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 6px;
`;

export const Title = styled(Typography).attrs({ variant: 'h3' })`
    font-size: 14px;
    font-weight: 500;
`;

export const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

export const ClipboardText = styled(Typography)`
    font-size: 13px;
    letter-spacing: 0.05rem;
    white-space: pre-wrap;
    word-break: break-word;
    color: ${({ theme }) => theme.palette.text.secondary};
    line-height: 1.3;
`;
