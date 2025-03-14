import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const SidebarGrid = styled.div`
    gap: 8px;
    display: grid;
    height: 100%;
    place-items: center stretch;
    align-content: space-between;
    grid-template-columns: 1fr;
    grid-template-rows: auto [row2-end row4-start] fit-content(60%);
    grid-template-areas:
        'top top top'
        '. . .'
        'bottom bottom bottom ';
`;

export const GridAreaTop = styled.div`
    grid-area: top;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const GridAreaBottom = styled.div`
    display: flex;
    grid-area: bottom;
    flex-direction: column;
    justify-content: center;
    position: relative;
    gap: 4px;
`;

export const HistoryLabel = styled(Typography).attrs({ variant: 'span' })`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 11px;
`;
export const HistoryWrapper = styled.div`
    overflow: hidden;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 4px 6px 0;
`;
export const RewardWrapper = styled.div`
    display: flex;
    flex-direction: column;
    max-height: min(400px, 35vh);
    border-radius: 10px;
    padding: 4px 0 0 0;
`;
