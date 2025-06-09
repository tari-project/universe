import { Input } from '@app/components/elements/inputs/Input';
import styled from 'styled-components';

export const StyledInput = styled(Input)`
    border-radius: 20px;
    justify-content: space-between;
    padding: 10px;
`;

export const StyledForm = styled.form`
    width: 100%;
    // Reserve space for error message
    // min-height: 60px;
`;
