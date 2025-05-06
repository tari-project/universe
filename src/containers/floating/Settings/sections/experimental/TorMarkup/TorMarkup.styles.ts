import { Input } from '@app/components/elements/inputs/Input';
import { Typography } from '@app/components/elements/Typography';
import styled, { css } from 'styled-components';

export const StyledInput = styled(Input)<{ hasError?: boolean }>(({ theme, hasError }) => ({
    borderColor: hasError ? theme.palette.error.main : theme.colorsAlpha.darkAlpha[10],
}));

export const ErrorTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.error.main,
    // Prevent jumping when the error message appears
    minHeight: '14px',
}));

export const TorSettingsContainer = styled.div<{ $isMac: boolean }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    position: relative;
    border-top: 1px solid ${({ theme }) => theme.palette.divider};
    padding-top: 20px;
    margin-top: 10px;
    opacity: ${({ $isMac }) => ($isMac ? 0.4 : 1)};
    pointer-events: ${({ $isMac }) => ($isMac ? 'none' : 'auto')};
    &:before {
        content: 'Tor settings';
        position: absolute;
        background-color: ${({ theme }) => theme.palette.background.paper};
        top: -9px;

        color: ${({ theme }) => theme.palette.primary.light};
        font-size: 12px;
        font-weight: 600;
        line-height: 18px;
        letter-spacing: -0.1px;
        padding-right: 12px;
    }

    ${({ $isMac }) =>
        $isMac &&
        css`
            &:after {
                content: 'Not avaiable on macOS';
                position: absolute;
                background-color: ${({ theme }) => theme.palette.background.paper};
                top: -9px;
                color: ${({ theme }) => theme.palette.text.secondary};
                font-size: 12px;
                font-weight: 600;
                line-height: 18px;
                letter-spacing: -0.1px;
                padding-right: 12px;
            }
        `}
`;
