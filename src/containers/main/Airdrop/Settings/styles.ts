import { Typography } from '@app/components/elements/Typography';
import styled from 'styled-components';

export const InputWrapper = styled.div`
    max-width: 500px;
    width: 100%;
    gap: 10px;
`;

export const ErrorText = styled(Typography)`
    color: red;
    margin-top: 0;
    font-size: 12px;
`;
