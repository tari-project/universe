import styled from 'styled-components';
import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

export const DashboardContainer = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    //pointer-events: none;
    justify-content: center;
    height: 100%;
    flex-grow: 1;
    position: relative;
    z-index: 1;
`;

export const ProgressBox = styled.div`
    background-color: #fff;
    padding: 3px;
    border-radius: 10px;
    width: 400px;
    box-sizing: content-box;
`;
export const StyledLinearProgress = styled(LinearProgress)`
    background-color: #fff;
`;
export const VisualModeContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.2);
    padding: 10px;
    pointer-events: all;
    border-radius: 24px;
    gap: 10px;
`;
export const SetupDescription = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.primary};
    font-family: 'PoppinsRegular', sans-serif;
    font-size: 15px;
    text-align: center;
`;

export const SetupPercentage = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.primary};
    font-family: 'PoppinsBold', sans-serif;
    font-size: 15px;
    text-align: center;
`;
