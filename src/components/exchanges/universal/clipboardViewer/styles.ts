import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    width: 100%;
`;

export const ClipboardIcon = styled.img`
    width: 24px;
    height: 24px;
    color: #3b82f6;
    flex-shrink: 0;
`;

export const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`;

export const Title = styled.h3`
    font-size: 14px;
    font-weight: 500;
    color: #111827;
    margin-bottom: 8px;
`;

export const TextContainer = styled.div`
    flex: 1;
`;

export const ErrorText = styled.p`
    font-size: 14px;
    color: #ef4444;
`;

export const ClipboardText = styled.p`
    font-size: 14px;
    color: #374151;
    white-space: pre-wrap;
    word-break: break-word;
`;
