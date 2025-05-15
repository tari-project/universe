import styled from 'styled-components';
import { TextArea } from '@app/components/elements/inputs/TextArea.tsx';

export const EditWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 14px;
`;
export const WarningText = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 14px;
`;
export const StyledTextArea = styled(TextArea)<{ $hasError: boolean }>(({ $hasError, theme }) => ({
    backgroundColor: theme.palette.background.default,
    width: '100%',
    borderRadius: '10px',
    border: `1px solid ${$hasError ? theme.palette.error.main : theme.colorsAlpha.darkAlpha[10]}`,
    padding: '10px',
    fontSize: theme.typography.h6.fontSize,
    lineHeight: theme.typography.h6.lineHeight,
}));

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
`;
