import styled from 'styled-components';
import * as m from 'motion/react-m';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';

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
    gap: 10px;
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
export const NavLabel = styled(Typography)``;
export const TabNavigation = styled.div`
    display: flex;
    width: 100%;
    text-transform: capitalize;
    justify-content: space-between;
    padding: 18px 0;
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;
export const BottomNavWrapper = styled.div`
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: space-evenly;
    width: 100%;
`;
export const NavButton = styled.button.attrs({
    role: 'tab',
})<{ $isActive?: boolean }>`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.palette.text.primary};
    opacity: ${({ $isActive }) => ($isActive ? 1 : 0.7)};
    text-transform: capitalize;
    &:hover {
        opacity: 0.85;
    }
`;
