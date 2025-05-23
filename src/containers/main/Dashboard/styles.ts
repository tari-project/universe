import * as m from 'motion/react-m';
import styled from 'styled-components';

export const DashboardContentContainer = styled(m.div)<{ $tapplet?: boolean }>`
    height: 100%;
    flex-shrink: 1;
    width: 100%;
    will-change: width;
    position: relative;
    pointer-events: ${({ $tapplet }) => ($tapplet ? 'auto' : 'none')};
`;
