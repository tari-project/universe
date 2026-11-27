import styled from 'styled-components';

export const Wrapper = styled.div`
    flex-direction: column;
    padding: 10px;
    display: flex;
    gap: 20px;
    width: clamp(320px, 48vw, 620px);
`;

export const TextWrapper = styled.div`
    gap: 10px;
    flex-direction: column;
    display: flex;

    p {
        color: ${({ theme }) => theme.palette.text.accent};
    }
`;

export const CandidateList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 220px;
    overflow-y: auto;
`;

export const CandidateRow = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    background-color: ${({ theme }) => theme.palette.background.main};
`;

export const AddressCode = styled.code`
    word-break: break-all;
    font-size: 12px;
    line-height: 1.3;
    color: ${({ theme }) => theme.palette.text.primary};
`;

export const SectionBox = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    background-color: ${({ theme }) => theme.palette.background.main};
`;

export const TextInput = styled.input`
    width: 100%;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    background: transparent;
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 13px;
`;

export const SeedTextArea = styled.textarea`
    width: 100%;
    min-height: 64px;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    background: transparent;
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 13px;
    resize: vertical;
`;

export const ErrorBanner = styled.div`
    color: ${({ theme }) => theme.colors.orange[600]};
    font-size: 12px;
    line-height: 1.3;
`;
