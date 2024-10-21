import styled from 'styled-components';

import { Typography } from '@app/components/elements/Typography.tsx';
import { m } from 'framer-motion';

export const DashboardContentContainer = styled(m.div)`
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    flex-grow: 1;
    position: relative;
`;

export const ProgressWrapper = styled.div`
    margin: 20px 0;
    display: flex;
    width: 100%;
`;

export const SetupDescription = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 15px;
    text-align: center;
    font-weight: 400;
`;

export const SetupPercentage = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 700;
    font-size: 15px;
    text-align: center;
`;
