import * as m from 'motion/react-m';
import styled from 'styled-components';

export const DashboardContentContainer = styled(m.div)`
    height: 100%;
    grid-area: content;
    flex-shrink: 1;
    width: 100%;
    will-change: width;
    position: relative;
`;

export const ProgressWrapper = styled.div`
    margin: 20px 0;
    display: flex;
    width: 100%;
`;
