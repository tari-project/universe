import { Typography } from '@app/components/elements/Typography.tsx';
import styled from 'styled-components';

export const NumberInputTypography = styled(Typography)<{ component: string }>`
    margin-bottom: 10px;
    line-height: 135%;
    display: inline-block;
    color: ${({ theme }) => theme.palette.text.primary};
`;
