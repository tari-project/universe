import styled, { css } from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const HeaderLabel = styled(Typography).attrs({
    variant: 'p',
})`
    font-weight: 500;
    color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.5)};
    text-transform: none;
`;

export const TabHeader = styled.div<{ $noBorder?: boolean }>`
    display: flex;
    width: 100%;
    text-transform: capitalize;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 15px 0;
    border-bottom: ${({ theme }) => `1px solid ${theme.colorsAlpha.greyscaleAlpha[10]}`};

    ${({ $noBorder }) =>
        $noBorder &&
        css`
            padding: 0;
            border: none;
        `}
`;
export const BottomNavWrapper = styled.div`
    display: flex;
    flex-flow: row;
    align-items: center;
    width: 100%;
    gap: 10px;

    padding-top: 10px;
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

    &:disabled {
        opacity: 0.2;
        pointer-events: none;
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
