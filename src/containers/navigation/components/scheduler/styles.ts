import styled from 'styled-components';

export const StyledCTA = styled.button<{ $hasSchedule?: boolean }>`
    display: flex;
    height: 30px;
    gap: 8px;
    justify-content: ${({ $hasSchedule }) => ($hasSchedule ? 'space-between' : 'center')};
    align-items: center;
    align-self: stretch;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    color: ${({ theme }) => theme.palette.text.accent};
    background: ${({ theme }) => theme.palette.background.paper};
    padding: 0 7px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.1;
    white-space: nowrap;
    letter-spacing: -0.4px;
    svg {
        display: flex;
    }
`;

export const Content = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
`;

export const CalendarWrapper = styled.div`
    display: flex;
    width: 15px;
`;

export const TimeWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    color: ${({ theme }) => theme.palette.text.primary};
`;
