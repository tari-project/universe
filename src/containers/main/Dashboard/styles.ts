import styled from 'styled-components';
import * as m from 'motion/react-m';

export const DashboardContentContainer = styled(m.div)<{ $ootleModeOn?: boolean }>`
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    flex-grow: 1;
    position: relative;
    pointer-events: ${({ $ootleModeOn }) => ($ootleModeOn ? 'auto' : 'none')};
`;

export const ProgressWrapper = styled.div`
    margin: 20px 0;
    display: flex;
    width: 100%;
`;
