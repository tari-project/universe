import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const ActionWrapper = styled.div`
    flex-direction: column;
    max-height: 60px;
    width: 60px;
    padding: 10px 0;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const ActionText = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
`;
