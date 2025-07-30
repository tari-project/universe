import styled from 'styled-components';
import { TextArea } from '@app/components/elements/inputs/TextArea.tsx';

export const EditWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

export const StyledTextArea = styled(TextArea)<{ $hasError: boolean }>`
    border-radius: 10px;
    padding: 10px;
    width: 100%;
    background-color: ${({ theme }) => theme.palette.background.default};
    border: 1px solid
        ${({ theme, $hasError }) => ($hasError ? theme.palette.error.main : theme.colorsAlpha.darkAlpha[10])};
    font-size: ${({ theme }) => theme.typography.h6.fontSize};
    line-height: ${({ theme }) => theme.typography.h6.lineHeight};
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
`;
