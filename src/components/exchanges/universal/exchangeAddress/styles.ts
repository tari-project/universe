import { Input } from '@app/components/elements/inputs/Input';
import styled from 'styled-components';

export const StyledInputWrapper = styled.div`
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
`;

export const StyledInput = styled(Input)`
    border-radius: 20px;
    justify-content: space-between;
    padding: 10px 40px 10px 20px;
    width: 100%;
    position: relative;
`;

export const ClearIcon = styled.button`
    position: relative;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background-color: ${({ theme }) => theme.palette.background.accent};
    border-radius: 50%;

    &:hover {
        opacity: 1;
    }
`;
export const IconWrapper = styled.div`
    position: absolute;
    display: flex;
    right: 5px;
`;

export const StyledForm = styled.form`
    width: 100%;
`;
