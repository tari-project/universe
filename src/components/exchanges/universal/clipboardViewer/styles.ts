import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Container = styled.div`
    display: flex;
    flex-direction: row;
    gap: 6px;
    padding: 10px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    width: 100%;
`;

export const ClipboardIcon = styled.img`
    width: 36px;
    height: 36px;
    color: #3b82f6;
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
    color: #111827;
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
    color: #374151;
    line-height: 1.3;
`;
