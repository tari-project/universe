import * as m from 'motion/react-m';
import styled from 'styled-components';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { SB_MINI_WIDTH } from '@app/theme/styles.ts';
import { convertHexToRGBA } from '@app/utils';

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
    align-items: center;
    display: flex;
`;
export const GridBottom = styled.div`
    grid-area: bottom;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    display: flex;
`;

export const NavIconWrapper = styled.div`
    display: flex;
    flex-direction: column;
    transition: 0.2s ease;
    z-index: 1;
`;

export const HoverIconWrapper = styled(m.div)`
    position: absolute;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    display: flex;
    z-index: 2;

    &:hover + {
        & ${NavIconWrapper} {
            opacity: 0;
        }
    }
`;

export const LogoWrapper = styled.div`
    width: 32px;
    svg {
        max-width: 100%;
    }
`;
export const NavigationWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

export const StyledIconButton = styled(IconButton).attrs({
    variant: 'secondary',
})`
    position: relative;
    box-shadow: ${({ theme }) => `${convertHexToRGBA(theme.palette.contrast, 0.03)} 0 0 2px 1px`};
`;
