import { Typography } from '@app/components/elements/Typography.tsx';
import styled from 'styled-components';

export const SectionTitle = styled(Typography)`
    display: flex;
    color: ${({ theme }) => theme.palette.text.shadow};
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.66px;
`;
