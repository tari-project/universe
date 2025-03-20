import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{ $isLoading?: boolean }>`
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
`;
export const StyledForm = styled.form`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
    width: 100%;
    flex-grow: 1;
`;

export const FormFieldsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 4px;
    align-items: center;
`;

export const BottomWrapper = styled.div`
    display: flex;
    gap: 8px;
    flex-direction: column;
    justify-content: flex-end;
`;

export const DividerIcon = styled.div`
    width: 34px;
    height: 34px;
    background: linear-gradient(0deg, #040723 4%, #071e6b 120%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    color: #fff;
`;

export const ErrorMessageWrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;

    color: ${({ theme }) => theme.palette.error.main};
`;
