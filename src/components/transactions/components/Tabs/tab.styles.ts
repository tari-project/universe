import styled, { css } from 'styled-components';
import * as m from 'motion/react-m';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const TabsWrapper = styled.div`
    width: 100%;
    display: flex;
`;
export const Wrapper = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    gap: 15px;
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
export const TabHeader = styled.div<{ $bordered?: boolean }>`
    display: flex;
    width: 100%;
    text-transform: capitalize;
    justify-content: space-between;
    align-items: center;
    padding: 0;

    ${({ $bordered, theme }) =>
        $bordered &&
        css`
            padding: 10px 0 18px 0;
            border-bottom: 1px solid ${theme.colorsAlpha.greyscaleAlpha[10]};
        `}
`;
export const BottomNavWrapper = styled.div`
    display: flex;
    flex-flow: row;
    align-items: center;
    width: 100%;
    gap: 10px;
`;

export const NavButtonContent = styled.div`
    text-transform: capitalize;
    gap: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
`;
export const NavButton = styled(Button).attrs({
    variant: 'outlined',
    size: 'medium',
})<{ $isActive?: boolean }>`
    line-height: 1.1;
    width: 100%;
    color: ${({ theme }) => theme.palette.text.primary};
    opacity: 0.6;
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
