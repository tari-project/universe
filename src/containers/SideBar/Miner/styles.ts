import styled from 'styled-components';
import { Button } from '@app/components/elements/Button.tsx';

export const MinerContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
`;

export const TileContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
`;

export const TileItem = styled.div`
    padding: 10px 15px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);
    max-width: 152px;
`;

export const ScheduleButton = styled(Button)`
    background-color: ${({ theme }) => theme.palette.background.default};
    color: ${({ theme }) => theme.palette.text.secondary};
    '&:hover': {
        background-color: ${({ theme }) => theme.palette.divider};
    }
`;

export const StatWrapper = styled('div')`
    display: flex;
    gap: 2px;
    align-items: baseline;
`;
