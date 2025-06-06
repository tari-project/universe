import styled from 'styled-components';
import * as m from 'motion/react-m';

export const HistoryListWrapper = styled(m.div)`
    display: flex;
    width: 100%;
    height: 220px;
    flex-grow: 1;
    overflow-y: auto;
    align-items: flex-end;
    mask-image: linear-gradient(to bottom, transparent 0px, black 6px, black calc(100% - 30px), transparent 100%);
    position: relative;
`;
