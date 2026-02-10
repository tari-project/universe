import styled from 'styled-components';

export const SelectedDirectoryWrapper = styled.div`
    display: flex;
    align-items: center;
    background-color: ${({ theme }) => theme.palette.background.default};
    padding: 0.65rem 0.75rem;
    gap: 8px;
    justify-content: space-between;
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
`;

export const DirectoryTextWrapper = styled.div`
    display: flex;
    color: ${({ theme }) => theme.palette.text.primary};
    opacity: 0.9;
    font-size: 12px;
    line-height: 1.15;
    line-break: loose;
    strong {
        font-weight: 600;
    }
`;

export const RemoveCTA = styled.button`
    display: flex;
    align-items: center;
    transition: color 200ms ease;
    color: ${({ theme }) => theme.palette.text.accent};
    &:hover {
        color: ${({ theme }) => theme.palette.text.primary};
    }
`;
