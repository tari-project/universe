import styled from 'styled-components';
import * as m from 'motion/react-m';

export const HistoryListWrapper = styled(m.div)`
    display: flex;
    width: 100%;
    height: 220px;
    overflow-y: auto;
    border: 1px solid deeppink;
    align-items: flex-end;
    mask-image: linear-gradient(to bottom, transparent 0px, black 6px, black calc(100% - 30px), transparent 100%);
`;
