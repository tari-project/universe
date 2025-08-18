import styled from 'styled-components';
import { SB_MINI_WIDTH } from '@app/theme/styles.ts';

export const MiniWrapper = styled.div`
    height: 100%;
    display: grid;
    padding: 20px 0;
    width: ${SB_MINI_WIDTH}px;
    justify-items: center;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
        'top'
        'center'
        'bottom';
    background: ${({ theme }) => theme.palette.background.default};
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    border-radius: 20px;
    & * {
        pointer-events: all;
    }
`;

export const GridTop = styled.div`
    grid-area: top;
`;
export const GridCenter = styled.div`
    grid-area: center;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    display: flex;
    gap: 10px;
`;
export const GridBottom = styled.div`
    grid-area: bottom;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    display: flex;
    gap: 10px;

    @media (max-height: 680px) {
        gap: 4px;
    }
`;

export const LogoWrapper = styled.div`
    width: 32px;
    svg {
        max-width: 100%;
    }
`;
