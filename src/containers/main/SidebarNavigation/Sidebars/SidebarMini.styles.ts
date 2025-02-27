import * as m from 'motion/react-m';
import styled from 'styled-components';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

export const MinimizedWrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    align-items: center;
    justify-content: space-between;
    padding: 30px 0;
`;

export const MiningIconWrapper = styled.div`
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
        & ${MiningIconWrapper} {
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

export const StyledIconButton = styled(IconButton)`
    position: relative;
`;
