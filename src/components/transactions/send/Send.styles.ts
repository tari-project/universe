import styled, { css } from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const Wrapper = styled.div<{ $isLoading?: boolean; $hasError?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    flex-flow: column;
    width: 100%;
    height: 100%;

    ${({ $isLoading }) =>
        $isLoading &&
        css`
            opacity: 0.8;
        `}

    ${({ $hasError, theme }) =>
        $hasError &&
        css`
            background-color: ${theme.mode === 'dark' ? '#3A2A2A' : '#FFF3F3'};
        `}
`;

export const StyledForm = styled.form`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
    width: 100%;
    gap: 10px;
    flex-grow: 1;
`;

export const FormFieldsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
`;

export const BottomWrapper = styled.div`
    display: flex;
    gap: 8px;
    flex-direction: column;
    justify-content: flex-end;
`;

export const MiniButton = styled(Button)`
    padding: 0 8px;
    font-size: 10px;
`;
