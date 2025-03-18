import styled from 'styled-components';
import * as m from 'motion/react-m';
import { SB_WIDTH } from '@app/theme/styles.ts';

export const TabsWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-grow: 1;
`;
export const Wrapper = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    position: relative;
`;

export const TabContentWrapper = styled.div`
    display: flex;
    flex-flow: column;
    gap: 8px;
`;
export const GUTTER = 20;
export const SB_CONTENT_WIDTH = SB_WIDTH - GUTTER * 2;
export const Track = styled(m.div)`
    display: flex;
    flex-direction: row;
    gap: 20px;
    flex-shrink: 0;
`;

export const ItemWrapper = styled(m.div)`
    position: relative;
    display: flex;
    flex-direction: column;
    max-height: 100%;
`;
