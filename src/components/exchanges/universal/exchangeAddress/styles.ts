import { Input } from '@app/components/elements/inputs/Input';
import styled from 'styled-components';

export const StyledInput = styled(Input)`
    border-radius: 20px;
    justify-content: space-between;
    padding: 10px;
    padding-left: 30px;
    margin: 10px;
`;

export const StyledForm = styled.form`
    width: 100%;
`;

export const IconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
`;
