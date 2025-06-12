import styled, { css } from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div<{ $isCurrent?: boolean }>`
    display: flex;
    border-radius: 10px;
    width: 100%;
    flex-direction: column;
    align-items: center;
    border: 1px solid
        ${({ theme, $isCurrent: isCurrent }) => (isCurrent ? theme.colors.green[400] : theme.palette.divider)};
    background-color: ${({ theme, $isCurrent: isCurrent }) =>
        isCurrent ? convertHexToRGBA(theme.colors.green[400], 0.1) : theme.palette.background.paper};
    padding: 15px;
    min-height: 70px;
`;

export const Heading = styled(Typography).attrs({ variant: 'h5' })`
    line-height: 1.2;
    letter-spacing: -1px;
`;

export const ContentHeaderWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
`;

export const ContentBodyWrapper = styled.div<{ $isActive?: boolean }>`
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    flex-direction: column;
    width: 100%;
    gap: 8px;
    padding: ${({ $isActive }) => ($isActive ? `14px 0 4px ` : 0)};
    overflow: hidden;
    height: ${({ $isActive: $isActive }) => ($isActive ? 'auto' : '0')};
    opacity: ${({ $isActive: $isActive }) => ($isActive ? '1' : '0')};
    transition:
        height 0.2s linear,
        opacity 0.2s linear;
`;

export const XCContent = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
`;

export const CaptionWrapper = styled.div`
    border-radius: 30px;
    gap: 5px;
    padding: 9px;
    background-color: #188750;
`;

export const CaptionText = styled(Typography).attrs({ variant: 'p' })`
    color: white;
`;

export const SelectOptionWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const SeasonReward = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
`;

export const LeftContent = styled.div`
    display: flex;
    gap: 10px;
`;

export const SeasonRewardIcon = styled.img`
    width: 32px;
    height: 32px;
    display: flex;
`;

export const SeasonRewardText = styled(Typography).attrs({ variant: 'p' })`
    line-height: 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    b {
        font-weight: 700;
    }
    span {
        color: ${({ theme }) => theme.palette.text.secondary};
    }
`;

export const Countdown = styled.div`
    border-radius: 20px;
    gap: 10px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background-color: ${({ theme }) => theme.palette.background.main};
    height: 30px;
`;

export const CountdownText = styled(Typography).attrs({ variant: 'p' })`
    font-weight: 700;
    line-height: 1;
`;

export const ConfirmButton = styled.button`
    height: 50px;
    width: 100%;
    border-radius: 111px;
    background-color: #5841d8;
    color: white;
    font-weight: bold;
    cursor: pointer;
    text-align: center;
`;
