import styled from 'styled-components';
import * as m from 'motion/react-m';

export const HistoryListWrapper = styled(m.div)`
    display: flex;
    width: 100%;
    height: 240px;
    flex-grow: 1;
    overflow: hidden;
    overflow-y: auto;
    align-items: flex-end;
    justify-content: flex-end;
    position: relative;
    padding: 0 0 10px;
    mask-image: linear-gradient(to bottom, transparent -10px, black 10px, black calc(100% - 40px), transparent 100%);
    mask-position: bottom;
    mask-size: 50% 100%;

    @media (max-height: 815px) {
        height: 200px;
    }
    @media (max-height: 690px) {
        height: 180px;
    }
`;
