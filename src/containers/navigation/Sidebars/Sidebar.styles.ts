import styled from 'styled-components';
import * as m from 'motion/react-m';
import { SB_WIDTH } from '@app/theme/styles.ts';

const variants = {
    open: { opacity: 1, left: 0, transition: { duration: 0.2, ease: 'linear' } },
    closed: { opacity: 0, left: -50, transition: { duration: 0.05, ease: 'linear' } },
};

export const SidebarWrapper = styled(m.div).attrs({
    variants,
    initial: 'closed',
    animate: 'open',
    exit: 'closed',
})`
    pointer-events: all;
    background: ${({ theme }) => theme.palette.background.default};
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    flex-direction: column;
    border-radius: 20px;
    height: 100%;
    flex-shrink: 0;
    padding: 20px;
    position: relative;
    width: ${SB_WIDTH}px;

    & * {
        pointer-events: all;
    }
`;

export const WrapperGrid = styled.div`
    gap: 8px;
    display: grid;
    height: 100%;
    place-items: center stretch;
    align-content: space-between;
    grid-template-columns: 1fr;
    grid-template-rows: auto [row2-end row4-start] fit-content(60%);
    grid-template-areas:
        'top top top'
        '. . .'
        'bottom bottom bottom ';
`;

export const GridAreaTop = styled.div`
    grid-area: top;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const GridAreaBottom = styled.div`
    display: flex;
    grid-area: bottom;
    flex-direction: column;
    justify-content: center;
    position: relative;
    gap: 4px;
`;
