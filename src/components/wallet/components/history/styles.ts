import styled from 'styled-components';
import * as m from 'motion/react-m';

export const HistoryListWrapper = styled(m.div)`
    display: flex;
    width: 100%;
    height: 90%;
    position: relative;
    mask-image: linear-gradient(to bottom, black 0px, black 10px, black calc(100% - 40px), transparent 100%);
    mask-position: bottom;
    mask-size: 50% 100%;
`;
