import styled from 'styled-components';

export const InputWrapper = styled.div`
    display: flex;
    width: 100%;
`;
export const StyledInput = styled.input`
    width: 100%;
    display: flex;
    transition: all 0.1s ease-in;
    &:focus {
        border-bottom: 1px solid ${({ theme }) => theme.palette.primary.main};
    }
`;
export const StyledInputLabel = styled.label`
    display: flex;
`;
