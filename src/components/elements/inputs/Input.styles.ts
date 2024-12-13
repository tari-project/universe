import styled from 'styled-components';

export const InputWrapper = styled.div`
    display: flex;
    width: 100%;
`;
export const StyledInput = styled.input<{ $hasError?: boolean }>`
    width: 100%;
    display: flex;
    transition: all 0.1s ease-in;
    font-size: 14px;
    height: 40px;
    border: 1px solid ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    background-color: ${({ theme }) => theme.palette.background.default};
    border-radius: 10px;
    align-items: center;
    padding: 8px;
    color: ${({ theme }) => theme.palette.text.primary};
`;
export const StyledInputLabel = styled.label`
    display: flex;
`;
