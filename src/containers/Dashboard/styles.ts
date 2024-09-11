import styled from 'styled-components';

import { Typography } from '@app/components/elements/Typography.tsx';
import { motion } from 'framer-motion';

export const DashboardContainer = styled(motion.div)`
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    flex-grow: 1;
    position: relative;
`;

export const ProgressWrapper = styled.div`
    margin: 30px 0 20px 0;
    display: flex;
    width: 100%;
`;
export const VisualModeContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.2);
    padding: 10px;
    pointer-events: auto;
    border-radius: 24px;
    gap: 10px;
`;
export const SetupDescription = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.primary};
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
