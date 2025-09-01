import styled from 'styled-components';

export const Wrapper = styled.div`
    flex-direction: column;
    padding: 10px;
    display: flex;
    gap: 28px;
    width: clamp(300px, 44vw, 580px);
`;

export const TextWrapper = styled.div`
    gap: 10px;
    flex-direction: column;
    display: flex;

    p {
        color: ${({ theme }) => theme.palette.text.accent};
    }
`;

export const ErrorText = styled.code`
    white-space: pre-line;
    background-color: ${({ theme }) => theme.palette.background.main};
    color: ${({ theme }) => theme.colors.orange[600]};
    padding: 10px 6px;
    border-radius: 8px;
    line-height: 1.15;
    font-size: 12px;
    font-weight: 400;
`;
