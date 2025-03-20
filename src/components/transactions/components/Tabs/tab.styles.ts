import styled from 'styled-components';
import * as m from 'motion/react-m';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

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
    overflow: hidden;
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
export const HeaderLabel = styled(Typography).attrs({
    variant: 'p',
})`
    font-weight: 500;
    color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.5)};
`;
export const TabHeader = styled.div`
    display: flex;
    width: 100%;
    text-transform: capitalize;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;

    @media (max-height: 680px) {
        padding: 4px 0;
    }
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
export const StyledIconButton = styled(IconButton)`
    border-radius: 50%;
    background: ${({ theme }) => theme.palette.background.paper};
    height: 22px;
    width: 22px;
    svg {
        fill: ${({ theme }) => theme.palette.text.primary};
    }
`;
export const AddressWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;
