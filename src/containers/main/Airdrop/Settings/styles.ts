import { Typography } from '@app/components/elements/Typography';
import styled from 'styled-components';

export const UsernameContainer = styled.div`
    display: flex;
    gap: 10px;
    align-items: flex-end;
    justify-content: space-between;
    overflow: visible;
`;

export const InputWrapper = styled.div`
    max-width: 500px;
    width: 100%;
`;

export const ErrorText = styled(Typography)`
    color: red;
    margin-top: 0px;
    font-size: 12px;
`;
