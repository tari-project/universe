import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 12px;
    padding: 5px 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
    width: 100%;
`;

export const ClipboardIcon = styled.img`
    width: 41px;
    height: 41px;
    color: #3b82f6;
    flex-shrink: 0;
    align-self: center;
`;

export const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-start;
`;

export const Title = styled.h3`
    font-size: 14px;
    font-weight: 500;
    color: #111827;
`;

export const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
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
