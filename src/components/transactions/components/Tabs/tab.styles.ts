import styled, { css } from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

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
