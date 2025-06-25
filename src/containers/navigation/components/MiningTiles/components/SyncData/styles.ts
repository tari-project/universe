import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div``;

export const Label = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 10px;
    font-weight: 400;
`;
