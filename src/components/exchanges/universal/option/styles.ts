import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div<{ $isCurrent?: boolean }>`
    display: flex;
    border-radius: 10px;
    width: 100%;
    flex-direction: column;
    border: 1px solid ${({ theme, $isCurrent }) => ($isCurrent ? theme.colors.green[400] : theme.palette.divider)};
    background-color: ${({ theme, $isCurrent }) =>
        $isCurrent ? convertHexToRGBA(theme.colors.green[400], 0.1) : theme.palette.background.paper};
    padding: 15px;
    gap: 14px;
    overflow: hidden;
`;

export const Heading = styled(Typography).attrs({ variant: 'h5' })`
    line-height: 1.2;
    letter-spacing: -1px;
`;

export const ContentWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
`;

export const XCContent = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
`;
