import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div<{ $isCurrent?: boolean }>`
    display: flex;
    justify-content: space-between;
    border-radius: 10px;
    border: 1px solid ${({ theme, $isCurrent }) => ($isCurrent ? theme.colors.green[400] : theme.palette.divider)};
    background-color: ${({ theme, $isCurrent }) =>
        $isCurrent ? convertHexToRGBA(theme.colors.green[400], 0.1) : theme.palette.background.paper};
    padding: 15px;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    align-self: stretch;
`;

export const Heading = styled(Typography).attrs({ variant: 'h5' })`
    line-height: 1.2;
    letter-spacing: -1px;
`;
