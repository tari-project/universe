import styled, { css } from 'styled-components';
import { Button } from '../elements/buttons/Button.tsx';
import { Typography } from '../elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: max(35vw, 500px);
    gap: 22px;
    align-items: center;
`;

export const CTAWrapper = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
`;

export const BodyCopy = styled(Typography).attrs({
    variant: 'p',
})`
    font-size: 15px;
    text-wrap: balance;
    text-align: center;
`;

export const SelectionCTA = styled(Button).attrs({
    size: 'small',
})<{ $default?: boolean }>`
    padding: 4px 18px;
    box-shadow: 2px 4px 14px 0 rgba(0, 0, 0, 0.15);
    color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.7)};
    ${({ $default, theme }) =>
        $default &&
        css`
            color: ${theme.palette.text.primary};
        `}
`;
