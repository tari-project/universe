import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const MoneroAddressInputTypography = styled(Typography)`
    margin-bottom: 10px;
    line-height: 135%;
    display: inline-block;
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: ${({ theme }) => theme.typography.h6.fontSize};
    font-family: ${({ theme }) => theme.typography.h6.fontFamily};
    font-weight: ${({ theme }) => theme.typography.h6.fontWeight};
`;
