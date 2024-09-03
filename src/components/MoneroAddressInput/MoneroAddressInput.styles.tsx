import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const MoneroAddressInputTypography = styled(Typography)`
    margin-bottom: 20px;
    line-height: 135%;
    display: inline-block;
    color: ${({ theme }) => theme.palette.text.primary};,
`;
